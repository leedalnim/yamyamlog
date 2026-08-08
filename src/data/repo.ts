// 데이터 접근 계층 (Repository)
// 화면에서는 이 함수들만 씁니다. 나중에 Supabase로 바꿀 때
// 이 파일 구현만 교체하면 화면 코드는 그대로 둘 수 있습니다.

import { getDB, isSeeded, markSeeded } from './db'
import { SEED_CATS, SEED_GROUPS } from './seed'
import type { Cat, Group, ReactionLevel, Snack } from './types'

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ---------- 초기 시드 ----------
export async function ensureSeeded(): Promise<void> {
  if (await isSeeded()) return
  const db = await getDB()
  const tx = db.transaction(['groups', 'cats'], 'readwrite')
  for (const g of SEED_GROUPS) await tx.objectStore('groups').put(g)
  for (const c of SEED_CATS) await tx.objectStore('cats').put(c)
  await tx.done
  await markSeeded()
}

// ---------- 그룹 / 고양이 ----------
export async function listGroups(): Promise<Group[]> {
  const db = await getDB()
  const all = await db.getAll('groups')
  return all.sort((a, b) => a.order - b.order)
}

export async function listCats(): Promise<Cat[]> {
  const db = await getDB()
  const all = await db.getAll('cats')
  return all.sort((a, b) => a.order - b.order)
}

// ---------- 사진 ----------
export async function savePhoto(blob: Blob): Promise<string> {
  const db = await getDB()
  const id = uid()
  await db.put('photos', { id, blob })
  return id
}

export async function getPhotoURL(photoId?: string): Promise<string | undefined> {
  if (!photoId) return undefined
  const db = await getDB()
  const rec = await db.get('photos', photoId)
  if (!rec) return undefined
  return URL.createObjectURL(rec.blob)
}

// ---------- 간식 ----------
export interface SnackInput {
  name: string
  memo?: string
  photoId?: string
  reactions: Record<string, ReactionLevel>
}

export async function addSnack(input: SnackInput): Promise<Snack> {
  const db = await getDB()
  const now = Date.now()
  const snack: Snack = {
    id: uid(),
    name: input.name.trim() || '이름 없는 간식',
    memo: input.memo?.trim() || undefined,
    photoId: input.photoId,
    reactions: input.reactions,
    createdAt: now,
    updatedAt: now,
  }
  await db.put('snacks', snack)
  return snack
}

export async function updateSnack(snack: Snack): Promise<void> {
  const db = await getDB()
  await db.put('snacks', { ...snack, updatedAt: Date.now() })
}

export async function deleteSnack(id: string): Promise<void> {
  const db = await getDB()
  const snack = await db.get('snacks', id)
  await db.delete('snacks', id)
  if (snack?.photoId) await db.delete('photos', snack.photoId)
}

export async function listSnacks(): Promise<Snack[]> {
  const db = await getDB()
  const all = await db.getAll('snacks')
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getSnack(id: string): Promise<Snack | undefined> {
  const db = await getDB()
  return db.get('snacks', id)
}
