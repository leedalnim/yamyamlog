/**
 * 클라우드 동기화.
 *
 * 원칙: **이 기기가 본체다.** 화면은 언제나 IndexedDB만 읽고 쓴다.
 * 여기서 하는 일은 "가끔 서버와 서로 맞춰보기"뿐이라, 서버가 느리든
 * 잠들어 있든 아예 설정이 안 됐든 앱은 평소대로 돌아간다.
 */
import { getDB } from './db'
import { mergeLists } from './merge'
import { photoIdFromPath, photoPath, syncPhotos } from './photos'
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
    favorite: s.favorite ?? false,
    discontinued: s.discontinued ?? false,
    // 사진 파일 자체는 Storage 에 있고, 여기에는 그 위치만 적는다
    photo_path: s.photoId ? photoPath(householdId, s.photoId) : null,
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
    favorite: r.favorite ?? false,
    discontinued: r.discontinued ?? false,
    photoId: photoIdFromPath(r.photo_path),
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
    birthday: c.birthday ?? null,
    photo_path: c.photoId ? photoPath(householdId, c.photoId) : null,
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
    birthday: r.birthday ?? undefined,
    photoId: photoIdFromPath(r.photo_path),
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : 0,
    deletedAt: r.deleted_at ? Date.parse(r.deleted_at) : undefined,
  }
}

// ── 동기화 ────────────────────────────────────────────────────
export interface SyncResult {
  pulled: number
  pushed: number
  /** 주고받은 사진 장수 */
  photosUp: number
  photosDown: number
  at: number
}

export type SyncSkip =
  | 'not-configured' // 아직 클라우드 설정 전
  | 'no-household' // 우리집을 안 만들었거나 참여 안 함
  | 'offline' // 이 기기가 인터넷에 안 붙어 있음 (다음에 다시 시도)
  | 'failed' // 인터넷은 되는데 실패 — 이유는 lastSyncFailure() 로 본다

/**
 * 마지막 실패의 이유.
 * 예전에는 실패를 전부 '서버가 잠들었다'로 안내했는데, 실제로는 서버가
 * 깨어 있는데 이 폰을 우리집 구성원으로 못 알아봐서 막히는 경우가 있었다.
 * 이유가 다르면 할 일도 다르므로 구별해서 남긴다.
 *   unreachable — 서버에 아예 닿지 못함 (잠들었거나 네트워크)
 *   not-member  — 서버는 응답했는데 이 폰이 구성원이 아님 (코드로 다시 참여 필요)
 *   clock       — 방금 받은 로그인 표를 서버가 '미래'라며 거절 (몇 초 지나면 풀린다)
 *   other       — 그 밖에 서버가 돌려준 오류
 */
export interface SyncFailure {
  kind: 'unreachable' | 'not-member' | 'clock' | 'other'
  message: string
}
let lastFailure: SyncFailure | null = null
export function lastSyncFailure(): SyncFailure | null {
  return lastFailure
}

class NotMemberError extends Error {}

function classify(err: unknown): SyncFailure {
  const e = err as { message?: string; code?: string }
  const msg = e?.message ?? String(err)
  if (err instanceof NotMemberError) return { kind: 'not-member', message: msg }
  // Supabase 안에서 로그인 담당과 기록 담당의 시계가 어긋나면, 방금 발급한
  // 로그인 표를 기록 쪽이 '미래에 발급됐다'며 거절한다(PGRST303). 몇 초면 풀리지만,
  // 2026-10 실측에서는 기록 쪽 시계가 3분 넘게 뒤처져 있었다 — 그땐 기다려도 안 되고
  // 대시보드에서 프로젝트를 재시작해야 한다.
  if (e?.code === 'PGRST303' || /issued at future/i.test(msg)) {
    return {
      kind: 'clock',
      message:
        '서버 안의 시계가 어긋나 있어요. Supabase 대시보드에서 프로젝트를 재시작(Restart project)해 주세요.',
    }
  }
  if (e?.code === '42501' || /row-level security/i.test(msg)) {
    return { kind: 'not-member', message: '이 폰이 우리집 구성원으로 확인되지 않아요.' }
  }
  if (/Failed to fetch|NetworkError|Load failed|ERR_|fetch failed|timeout/i.test(msg)) {
    return { kind: 'unreachable', message: msg }
  }
  return { kind: 'other', message: friendly(msg) }
}

/**
 * 이 폰이 아직 우리집 구성원인지 확인하고, 빠져 있으면 저장된 코드로 다시 참여한다.
 *
 * 폰마다 회원가입 없이 자동(익명) 로그인을 쓰는데, 그 로그인 정보가 폰에서
 * 지워지면 앱이 새로 로그인한다. 서버는 그 새 사용자를 구성원으로 모르므로
 * 기록을 막는다(42501). 우리집 코드는 이 기기에 남아 있으니 그걸로 다시 붙인다.
 * 확인 자체가 실패하면(권한 설정 차이 등) 판단하지 않고 그냥 진행한다.
 */
async function ensureMember(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  household: HouseholdInfo,
): Promise<void> {
  const { data, error } = await sb
    .from('household_members')
    .select('household_id')
    .eq('household_id', household.id)
    .limit(1)
  if (error || (data && data.length > 0)) return
  if (!household.code) {
    throw new NotMemberError('이 폰이 우리집에서 빠졌어요. 설정에서 코드로 다시 참여해주세요.')
  }
  const { data: joined, error: joinErr } = await sb.rpc('join_household', { p_code: household.code })
  if (joinErr || !joined) {
    throw new NotMemberError(
      `우리집에 다시 참여하지 못했어요 (${friendly(joinErr?.message ?? '응답 없음')}). 설정에서 코드로 다시 참여해주세요.`,
    )
  }
  console.info('[얌얌로그] 이 폰을 우리집에 다시 참여시켰어요.')
}

// 앱을 열 때·다시 앞으로 올 때·설정에서 누를 때가 겹치면 동기화가 동시에 두 번
// 돌았다. 로그인 정보를 동시에 새로 고치다 꼬일 수 있어 하나로 합친다.
let inflight: Promise<SyncResult | SyncSkip> | null = null

export function syncNow(): Promise<SyncResult | SyncSkip> {
  if (!inflight) {
    inflight = runSync().finally(() => {
      inflight = null
    })
  }
  return inflight
}

/**
 * 시계 어긋남(clock)은 기다리면 풀리므로 몇 번 쉬었다가 다시 해 본다.
 * 다른 실패는 기다려도 그대로라 바로 돌려준다.
 */
const CLOCK_RETRY_MS = [2000, 4000, 8000]

async function runSync(): Promise<SyncResult | SyncSkip> {
  let r = await runSyncOnce()
  for (const wait of CLOCK_RETRY_MS) {
    if (r !== 'failed' || lastFailure?.kind !== 'clock') break
    await new Promise((ok) => setTimeout(ok, wait))
    r = await runSyncOnce()
  }
  return r
}

async function runSyncOnce(): Promise<SyncResult | SyncSkip> {
  if (!isCloudConfigured) return 'not-configured'
  const household = await readHousehold()
  if (!household) return 'no-household'
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline'

  const sb = getSupabase()!
  const db = await getDB()

  try {
    await ensureSignedIn()
    await ensureMember(sb, household)

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
      // 나중에 생긴 칸(생년월일 09-birthday.sql, 사진 10-cat-photo.sql)을 아직
      // 서버에 안 만들었을 수 있다. 그것 때문에 동기화 전체가 멈추면 안 되니,
      // 서버가 모른다는 칸만 빼고 다시 보낸다.
      const LATER: Record<string, string> = { birthday: '09-birthday.sql', photo_path: '10-cat-photo.sql' }
      let rows: Record<string, unknown>[] = catPlan.toRemote.map((c) => catToRow(c, household.id))
      for (let tries = 0; ; tries++) {
        const { error } = await sb.from('cats').upsert(rows)
        if (!error) break
        const missing = Object.keys(LATER).find((col) => new RegExp(col, 'i').test(error.message ?? ''))
        if (!missing || tries >= Object.keys(LATER).length) throw error
        console.warn(`[얌얌로그] 서버에 ${missing} 칸이 없어 그 값만 빼고 보냅니다. ${LATER[missing]} 을 실행하세요.`)
        rows = rows.map((r) => {
          const copy = { ...r }
          delete copy[missing]
          return copy
        })
      }
    }

    // 사진은 기록보다 무겁고 실패해도 덜 치명적이라 따로 감싼다.
    // 여기서 넘어져도 기록 동기화는 이미 끝난 상태로 남는다.
    let photos = { uploaded: 0, downloaded: 0, removed: 0 }
    try {
      const merged = new Map(localSnacks.map((s) => [s.id, s]))
      for (const s of snackPlan.toLocal) merged.set(s.id, s)
      // 냥이 사진도 같은 보관함·같은 경로 규칙으로 함께 맞춘다
      const mergedCats = new Map(localCats.map((c) => [c.id, c]))
      for (const c of catPlan.toLocal) mergedCats.set(c.id, c)
      photos = await syncPhotos(sb, db, household.id, [...merged.values(), ...mergedCats.values()])
    } catch (err) {
      console.warn('[얌얌로그] 사진 동기화를 건너뜁니다.', err)
    }

    const at = Date.now()
    await db.put('meta', at, LAST_SYNC_KEY)
    lastFailure = null
    return {
      pulled: snackPlan.toLocal.length + catPlan.toLocal.length,
      pushed: snackPlan.toRemote.length + catPlan.toRemote.length,
      photosUp: photos.uploaded,
      photosDown: photos.downloaded,
      at,
    }
  } catch (err) {
    // 앱 동작에는 영향이 없다. 다만 인터넷이 되는데도 실패하면 서버 쪽
    // 문제라 사람이 손을 써야 할 수 있으므로 'offline' 과 구별해 돌려준다.
    // (무료 서버는 한동안 안 쓰면 잠든다)
    console.warn('[얌얌로그] 동기화를 건너뜁니다.', err)
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline'
    lastFailure = classify(err)
    return 'failed'
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
