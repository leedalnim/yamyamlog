import { openDB, type DBSchema } from 'idb'
import type { Settings } from './types'

interface YumlogDB extends DBSchema {
  groups: { key: string; value: unknown }
  cats: { key: string; value: unknown; indexes: { byGroup: string } }
  snacks: { key: string; value: unknown; indexes: { byCreatedAt: number } }
  photos: { key: string; value: unknown }
  meta: { key: string; value: unknown }
}

/** repo에서 실제로 쓰는 최소 DB 인터페이스 (IndexedDB / 메모리 공용) */
export interface AppDB {
  get(store: string, key: IDBValidKey): Promise<any>
  getAll(store: string): Promise<any[]>
  put(store: string, value: any, key?: IDBValidKey): Promise<any>
  delete(store: string, key: IDBValidKey): Promise<any>
  transaction(
    stores: string[],
    mode?: IDBTransactionMode,
  ): { objectStore(n: string): { put(v: any, k?: IDBValidKey): any }; done: Promise<any> }
}

const DB_NAME = 'yumlog'
const DB_VERSION = 1
const STORES = ['groups', 'cats', 'snacks', 'photos', 'meta']

/** IndexedDB를 못 쓰는 환경(사생활 모드/일부 iframe 등)용 인메모리 폴백 */
class MemoryDB implements AppDB {
  private stores: Record<string, Map<IDBValidKey, any>> = {}
  constructor() {
    for (const s of STORES) this.stores[s] = new Map()
  }
  private keyOf(value: any, key?: IDBValidKey): IDBValidKey {
    if (key !== undefined) return key
    return value?.id
  }
  async get(store: string, key: IDBValidKey) {
    return this.stores[store]?.get(key)
  }
  async getAll(store: string) {
    return [...(this.stores[store]?.values() ?? [])]
  }
  async put(store: string, value: any, key?: IDBValidKey) {
    this.stores[store]?.set(this.keyOf(value, key), value)
  }
  async delete(store: string, key: IDBValidKey) {
    this.stores[store]?.delete(key)
  }
  transaction(stores: string[]) {
    void stores
    const self = this
    return {
      objectStore(n: string) {
        return { put: (v: any, k?: IDBValidKey) => self.put(n, v, k) }
      },
      done: Promise.resolve(),
    }
  }
}

let dbPromise: Promise<AppDB> | null = null

async function openReal(): Promise<AppDB> {
  // indexedDB 접근 자체가 동기적으로 throw 될 수 있어(사생활 모드/샌드박스 iframe) 먼저 확인
  if (typeof indexedDB === 'undefined' || !indexedDB) throw new Error('no indexedDB')
  const db = await openDB<YumlogDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('groups')) db.createObjectStore('groups', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('cats')) {
        const cats = db.createObjectStore('cats', { keyPath: 'id' })
        cats.createIndex('byGroup', 'groupId')
      }
      if (!db.objectStoreNames.contains('snacks')) {
        const snacks = db.createObjectStore('snacks', { keyPath: 'id' })
        snacks.createIndex('byCreatedAt', 'createdAt')
      }
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
    },
  })
  return db as unknown as AppDB
}

export function getDB(): Promise<AppDB> {
  if (!dbPromise) {
    // 동기 throw + 비동기 reject 를 모두 잡아 메모리 저장으로 폴백
    dbPromise = Promise.resolve()
      .then(openReal)
      .catch((err) => {
        console.warn('[얌로그] IndexedDB 사용 불가 → 메모리 저장으로 전환합니다.', err)
        return new MemoryDB()
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
