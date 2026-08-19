/**
 * 클라우드 동기화.
 *
 * 원칙: **이 기기가 본체다.** 화면은 언제나 IndexedDB만 읽고 쓴다.
 * 여기서 하는 일은 "가끔 서버와 서로 맞춰보기"뿐이라, 서버가 느리든
 * 잠들어 있든 아예 설정이 안 됐든 앱은 평소대로 돌아간다.
 */
import { getDB } from './db'
import { mergeLists } from './merge'
import type { Cat, Snack } from './types'
import { ensureSignedIn, getSupabase, isCloudConfigured } from '../lib/supabase'

const HOUSEHOLD_KEY = 'householdId'
const CODE_KEY = 'householdCode'
const LAST_SYNC_KEY = 'lastSyncedAt'

export interface HouseholdInfo {
  id: string
  code: string
}

export async function readHousehold(): Promise<HouseholdInfo | null> {
  const db = await getDB()
  const id = (await db.get('meta', HOUSEHOLD_KEY)) as string | undefined
  const code = (await db.get('meta', CODE_KEY)) as string | undefined
  return id ? { id, code: code ?? '' } : null
}

async function writeHousehold(info: HouseholdInfo): Promise<void> {
  const db = await getDB()
  await db.put('meta', info.id, HOUSEHOLD_KEY)
  await db.put('meta', info.code, CODE_KEY)
}

export async function readLastSyncedAt(): Promise<number | null> {
  const db = await getDB()
  return ((await db.get('meta', LAST_SYNC_KEY)) as number | undefined) ?? null
}

export async function leaveHousehold(): Promise<void> {
  const db = await getDB()
  await db.delete('meta', HOUSEHOLD_KEY)
  await db.delete('meta', CODE_KEY)
  await db.delete('meta', LAST_SYNC_KEY)
}

// ── 가구 만들기 / 참여하기 ──────────────────────────────────────
export async function createHousehold(): Promise<HouseholdInfo> {
  const sb = getSupabase()
  if (!sb) throw new Error('클라우드가 설정되지 않았어요.')
  try {
    await ensureSignedIn()
  } catch (e) {
    throw new Error(friendly((e as Error).message))
  }
  const { data, error } = await sb.rpc('create_household')
  if (error) throw new Error(friendly(error.message))
  const row = Array.isArray(data) ? data[0] : data
  if (!row?.id) throw new Error('우리집을 만들지 못했어요.')
  const info = { id: row.id as string, code: row.code as string }
  await writeHousehold(info)
  return info
}

export async function joinHousehold(code: string): Promise<HouseholdInfo> {
  const sb = getSupabase()
  if (!sb) throw new Error('클라우드가 설정되지 않았어요.')
  try {
    await ensureSignedIn()
  } catch (e) {
    throw new Error(friendly((e as Error).message))
  }
  const { data, error } = await sb.rpc('join_household', { p_code: code.trim() })
  if (error) throw new Error(friendly(error.message))
  if (!data) throw new Error('그런 코드가 없어요.')
  const info = { id: data as string, code: code.trim().toUpperCase() }
  await writeHousehold(info)
  return info
}

// ── 행 <-> 로컬 레코드 변환 ────────────────────────────────────
function snackToRow(s: Snack, householdId: string) {
  return {
    id: s.id,
    household_id: householdId,
    name: s.name,
    kind: s.kind ?? null,
    base: s.base ?? null,
    memo: s.memo ?? null,
    reactions: s.reactions ?? {},
    created_at: new Date(s.createdAt).toISOString(),
    updated_at: new Date(s.updatedAt).toISOString(),
    deleted_at: s.deletedAt ? new Date(s.deletedAt).toISOString() : null,
  }
}

function rowToSnack(r: Record<string, any>): Snack {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind ?? undefined,
    base: r.base ?? undefined,
    memo: r.memo ?? undefined,
    reactions: r.reactions ?? {},
    createdAt: Date.parse(r.created_at),
    updatedAt: Date.parse(r.updated_at),
    deletedAt: r.deleted_at ? Date.parse(r.deleted_at) : undefined,
  }
}

function catToRow(c: Cat, householdId: string) {
  return {
    id: c.id,
    household_id: householdId,
    name: c.name,
    order: c.order,
    color: c.color ?? null,
    weight_kg: c.weightKg ?? null,
    age_years: c.ageYears ?? null,
    updated_at: new Date(c.updatedAt ?? 0).toISOString(),
    deleted_at: c.deletedAt ? new Date(c.deletedAt).toISOString() : null,
  }
}

function rowToCat(r: Record<string, any>): Cat {
  return {
    id: r.id,
    name: r.name,
    groupId: 'g-a',
    color: r.color ?? '#E1873F',
    order: r.order ?? 0,
    weightKg: r.weight_kg ?? undefined,
    ageYears: r.age_years ?? undefined,
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : 0,
    deletedAt: r.deleted_at ? Date.parse(r.deleted_at) : undefined,
  }
}

// ── 동기화 ────────────────────────────────────────────────────
export interface SyncResult {
  pulled: number
  pushed: number
  at: number
}

export type SyncSkip =
  | 'not-configured' // 아직 클라우드 설정 전
  | 'no-household' // 우리집을 안 만들었거나 참여 안 함
  | 'offline' // 지금 연결이 안 됨 (다음에 다시 시도)

export async function syncNow(): Promise<SyncResult | SyncSkip> {
  if (!isCloudConfigured) return 'not-configured'
  const household = await readHousehold()
  if (!household) return 'no-household'
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline'

  const sb = getSupabase()!
  const db = await getDB()

  try {
    await ensureSignedIn()

    const [localSnacks, localCats] = await Promise.all([
      db.getAll('snacks') as Promise<Snack[]>,
      db.getAll('cats') as Promise<Cat[]>,
    ])

    const [remoteSnacksRes, remoteCatsRes] = await Promise.all([
      sb.from('snacks').select('*').eq('household_id', household.id),
      sb.from('cats').select('*').eq('household_id', household.id),
    ])
    if (remoteSnacksRes.error) throw remoteSnacksRes.error
    if (remoteCatsRes.error) throw remoteCatsRes.error

    const snackPlan = mergeLists(localSnacks, (remoteSnacksRes.data ?? []).map(rowToSnack))
    const catPlan = mergeLists(localCats, (remoteCatsRes.data ?? []).map(rowToCat))

    // 원격 → 로컬
    for (const s of snackPlan.toLocal) await db.put('snacks', s)
    for (const c of catPlan.toLocal) await db.put('cats', c)

    // 로컬 → 원격
    if (snackPlan.toRemote.length > 0) {
      const { error } = await sb
        .from('snacks')
        .upsert(snackPlan.toRemote.map((s) => snackToRow(s, household.id)))
      if (error) throw error
    }
    if (catPlan.toRemote.length > 0) {
      const { error } = await sb
        .from('cats')
        .upsert(catPlan.toRemote.map((c) => catToRow(c, household.id)))
      if (error) throw error
    }

    const at = Date.now()
    await db.put('meta', at, LAST_SYNC_KEY)
    return {
      pulled: snackPlan.toLocal.length + catPlan.toLocal.length,
      pushed: snackPlan.toRemote.length + catPlan.toRemote.length,
      at,
    }
  } catch (err) {
    // 서버가 잠들었거나 네트워크가 끊긴 경우 — 앱 동작에는 영향이 없다
    console.warn('[얌얌로그] 동기화를 건너뜁니다.', err)
    return 'offline'
  }
}

/** 서버가 돌려준 영문 메시지를 사람이 읽을 말로 바꾼다 */
function friendly(msg: string): string {
  if (/Failed to fetch|NetworkError|Load failed|ERR_/i.test(msg)) {
    return '지금 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.'
  }
  if (/Anonymous sign-ins are disabled/i.test(msg)) {
    return 'Supabase 설정에서 익명 로그인(Anonymous sign-ins)을 켜주세요.'
  }
  if (/시도가 너무 많아요/.test(msg)) return '시도가 너무 많아요. 잠시 후 다시 해주세요.'
  if (/그런 코드가 없어요/.test(msg)) return '그런 코드가 없어요. 다시 확인해주세요.'
  if (/로그인이 필요합니다/.test(msg)) return '연결 준비에 실패했어요. 새로고침 후 다시 시도해주세요.'
  return msg
}
