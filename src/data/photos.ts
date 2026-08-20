/**
 * 사진 동기화.
 *
 * 기록(간식 이름·반응)은 표 형태라 DB 테이블에 넣지만, 사진은 파일이라
 * Supabase Storage 에 따로 올린다. 경로는 `<우리집 id>/<사진 id>.jpg`.
 *
 * 사진 id 는 기록 안에 들어 있으므로, 두 기기가 같은 기록을 갖게 되면
 * 경로도 저절로 같아진다. 그래서 "어디에 올렸는지"를 따로 기억할 필요가 없다.
 *
 * 원칙은 기록 동기화와 같다 — **실패해도 앱은 그대로 돌아간다.**
 * 사진이 아직 안 내려왔으면 그 자리에 츄르 그림이 보일 뿐이다.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppDB } from './db'
import type { Snack } from './types'

const BUCKET = 'photos'

/** 한 번에 올리고 받을 최대 장수 — 느린 회선에서 동기화가 하염없이 길어지지 않게 */
const MAX_PER_SYNC = 20

export function photoPath(householdId: string, photoId: string): string {
  return `${householdId}/${photoId}.jpg`
}

/** `<집 id>/<사진 id>.jpg` 에서 사진 id만 꺼낸다 */
export function photoIdFromPath(path?: string | null): string | undefined {
  if (!path) return undefined
  const file = path.split('/').pop()
  if (!file) return undefined
  return file.replace(/\.[^.]+$/, '') || undefined
}

export interface PhotoSyncResult {
  uploaded: number
  downloaded: number
  removed: number
}

/**
 * 로컬에만 있는 사진은 올리고, 서버에만 있는 사진은 받아온다.
 *
 * 서버에 뭐가 있는지는 목록 요청 한 번으로 알아내고, 그 뒤로는
 * 실제로 주고받아야 하는 것만 건드린다.
 */
export async function syncPhotos(
  sb: SupabaseClient,
  db: AppDB,
  householdId: string,
  snacks: Snack[],
): Promise<PhotoSyncResult> {
  const wanted = new Set(
    snacks.filter((s) => !s.deletedAt && s.photoId).map((s) => s.photoId as string),
  )
  // 지운 기록에 딸려 있던 사진 — 서버에서도 치운다.
  // "안 쓰는 것 전부"가 아니라 "지웠다고 표시된 것만" 지우므로, 아직 못 받아본
  // 사진을 실수로 날릴 일은 없다.
  const orphans = new Set(
    snacks
      .filter((s) => s.deletedAt && s.photoId)
      .map((s) => s.photoId as string)
      .filter((id) => !wanted.has(id)),
  )
  if (wanted.size === 0 && orphans.size === 0) return { uploaded: 0, downloaded: 0, removed: 0 }

  // 서버에 이미 있는 사진 id 모으기
  const remote = new Set<string>()
  let offset = 0
  for (;;) {
    const { data, error } = await sb.storage
      .from(BUCKET)
      .list(householdId, { limit: 100, offset })
    if (error) throw error
    for (const f of data ?? []) {
      const id = photoIdFromPath(f.name)
      if (id) remote.add(id)
    }
    if (!data || data.length < 100) break
    offset += data.length
  }

  // 로컬에 실물이 있는 사진 id
  const localRecords = (await db.getAll('photos')) as { id: string; blob: Blob }[]
  const localBlobs = new Map(localRecords.map((r) => [r.id, r.blob]))

  let uploaded = 0
  let downloaded = 0

  // 로컬에만 있는 것 → 올리기
  for (const id of wanted) {
    if (uploaded >= MAX_PER_SYNC) break
    if (remote.has(id)) continue
    const blob = localBlobs.get(id)
    if (!blob) continue
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(photoPath(householdId, id), blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      })
    if (error) {
      // 한 장 실패했다고 나머지까지 포기하지 않는다
      console.warn('[얌얌로그] 사진 올리기 실패', id, error.message)
      continue
    }
    uploaded++
  }

  // 서버에만 있는 것 → 받기
  for (const id of wanted) {
    if (downloaded >= MAX_PER_SYNC) break
    if (localBlobs.has(id)) continue
    if (!remote.has(id)) continue
    const { data, error } = await sb.storage.from(BUCKET).download(photoPath(householdId, id))
    if (error || !data) {
      console.warn('[얌얌로그] 사진 받기 실패', id, error?.message)
      continue
    }
    await db.put('photos', { id, blob: data })
    downloaded++
  }

  // 지운 기록의 사진 치우기
  const toRemove = [...orphans].filter((id) => remote.has(id))
  let removed = 0
  if (toRemove.length > 0) {
    const { error } = await sb.storage
      .from(BUCKET)
      .remove(toRemove.map((id) => photoPath(householdId, id)))
    if (error) console.warn('[얌얌로그] 사진 치우기 실패', error.message)
    else removed = toRemove.length
  }

  return { uploaded, downloaded, removed }
}
