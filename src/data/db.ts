import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Cat, Group, Photo, Snack, Settings } from './types'

interface YumlogDB extends DBSchema {
  groups: { key: string; value: Group }
  cats: { key: string; value: Cat; indexes: { byGroup: string } }
  snacks: { key: string; value: Snack; indexes: { byCreatedAt: number } }
  photos: { key: string; value: Photo }
  meta: { key: string; value: unknown }
}

const DB_NAME = 'yumlog'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<YumlogDB>> | null = null

export function getDB(): Promise<IDBPDatabase<YumlogDB>> {
  if (!dbPromise) {
    dbPromise = openDB<YumlogDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('cats')) {
          const cats = db.createObjectStore('cats', { keyPath: 'id' })
          cats.createIndex('byGroup', 'groupId')
        }
        if (!db.objectStoreNames.contains('snacks')) {
          const snacks = db.createObjectStore('snacks', { keyPath: 'id' })
          snacks.createIndex('byCreatedAt', 'createdAt')
        }
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta')
        }
      },
    })
  }
  return dbPromise
}

export async function readSettings(): Promise<Settings | undefined> {
  const db = await getDB()
  return (await db.get('meta', 'settings')) as Settings | undefined
}

export async function writeSettings(s: Settings): Promise<void> {
  const db = await getDB()
  await db.put('meta', s, 'settings')
}

export async function isSeeded(): Promise<boolean> {
  const db = await getDB()
  return Boolean(await db.get('meta', 'seeded'))
}

export async function markSeeded(): Promise<void> {
  const db = await getDB()
  await db.put('meta', true, 'seeded')
}
