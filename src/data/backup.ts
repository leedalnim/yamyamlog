/**
 * 백업 / 복원.
 *
 * 기록은 이 기기의 IndexedDB에만 있다. 브라우저 저장소를 지우면(사파리
 * 웹사이트 데이터 삭제, 기기 초기화 등) 그대로 사라지므로, 파일 하나로
 * 통째로 빼두고 되돌릴 수 있게 한다.
 *
 * 사진은 Blob이라 JSON에 그대로 못 담는다. base64로 바꿔 같은 파일에
 * 넣으므로, 백업 파일 하나만 있으면 사진까지 전부 복원된다.
 */
import { getDB } from './db'
import { SEED_VERSION } from './seed'
import type { Cat, Group, Snack } from './types'

export const BACKUP_FORMAT = 'yamyamlog-backup'
export const BACKUP_VERSION = 1

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: number
  appBuild?: string
  groups: Group[]
  cats: Cat[]
  snacks: Snack[]
  photos: { id: string; type: string; data: string }[]
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer())
  let bin = ''
  // 인자 개수 제한(스택 오버플로)을 피하려고 나눠서 처리
  const CHUNK = 0x8000
  for (let i = 0; i < buf.length; i += CHUNK) {
    bin += String.fromCharCode(...buf.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}

function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type })
}

/** 지금 기기의 모든 기록을 백업 객체로 만든다 */
export async function createBackup(): Promise<BackupFile> {
  const db = await getDB()
  const [groups, cats, snacks, photoRecs] = await Promise.all([
    db.getAll('groups'),
    db.getAll('cats'),
    db.getAll('snacks'),
    db.getAll('photos'),
  ])

  const photos: BackupFile['photos'] = []
  for (const rec of photoRecs as { id: string; blob: Blob }[]) {
    if (!rec?.blob) continue
    photos.push({
      id: rec.id,
      type: rec.blob.type || 'image/jpeg',
      data: await blobToBase64(rec.blob),
    })
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    appBuild: typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : undefined,
    groups: groups as Group[],
    cats: cats as Cat[],
    snacks: snacks as Snack[],
    photos,
  }
}

export interface BackupSummary {
  snacks: number
  cats: number
  photos: number
  exportedAt: number
}

/** 파일 내용이 우리 백업 파일이 맞는지 확인하고 요약을 돌려준다 */
export function parseBackup(text: string): { data: BackupFile; summary: BackupSummary } {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('백업 파일을 읽을 수 없어요. 파일이 손상됐거나 다른 형식이에요.')
  }
  const d = json as Partial<BackupFile>
  if (d?.format !== BACKUP_FORMAT) {
    throw new Error('얌얌로그 백업 파일이 아니에요.')
  }
  if (typeof d.version !== 'number' || d.version > BACKUP_VERSION) {
    throw new Error('더 최신 버전에서 만든 백업이에요. 앱을 업데이트한 뒤 다시 시도해주세요.')
  }
  if (!Array.isArray(d.snacks) || !Array.isArray(d.cats)) {
    throw new Error('백업 파일 내용이 올바르지 않아요.')
  }
  return {
    data: d as BackupFile,
    summary: {
      snacks: d.snacks.length,
      cats: d.cats.length,
      photos: d.photos?.length ?? 0,
      exportedAt: d.exportedAt ?? 0,
    },
  }
}

/**
 * 백업으로 되돌린다. 지금 기기의 기록은 전부 지우고 백업 내용으로 바꾼다.
 * (합치기가 아니라 교체다 — 같은 기록이 두 벌 생기는 혼란을 막기 위해)
 */
export async function restoreBackup(data: BackupFile): Promise<void> {
  const db = await getDB()

  // 기존 기록 제거
  for (const store of ['groups', 'cats', 'snacks', 'photos'] as const) {
    const all = await db.getAll(store)
    for (const rec of all as { id?: string }[]) {
      if (rec?.id) await db.delete(store, rec.id)
    }
  }

  for (const g of data.groups ?? []) await db.put('groups', g)
  for (const c of data.cats ?? []) await db.put('cats', c)
  for (const s of data.snacks ?? []) await db.put('snacks', s)
  for (const p of data.photos ?? []) {
    await db.put('photos', { id: p.id, blob: base64ToBlob(p.data, p.type) })
  }

  // 복원 직후 시드가 덮어쓰지 않도록 시드 버전을 현재로 맞춘다
  await db.put('meta', SEED_VERSION, 'seedVersion')
}

/**
 * 백업 파일 이름.
 *
 * 날짜를 붙이지 않고 항상 같은 이름을 쓴다. 파일 앱에서 같은 이름으로
 * 저장하면 '대치' 여부를 물어보므로, 백업 파일이 계속 쌓이지 않고
 * 한 개가 최신으로 유지된다.
 *
 * 만든 시각은 파일 안(exportedAt)에 들어 있고 되돌리기 확인 화면에서
 * 보여주므로, 파일명에 날짜가 없어도 언제 것인지 알 수 있다.
 *
 * 파일명은 ASCII로 — 한글 파일명이 기기·앱에 따라 깨지거나 잘리는 경우가 있다.
 */
export function backupFileName(): string {
  return 'yamyamlog-backup.json'
}
