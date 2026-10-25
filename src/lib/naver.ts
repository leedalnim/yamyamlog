// 네이버 쇼핑 검색 — 서버 함수(supabase/functions/naver-shop)를 거친다.
//
// 이 기능은 덤이다. 서버 함수가 아직 없거나, 열쇠가 안 들어 있거나,
// 인터넷이 끊겨도 앱은 예전처럼 직접 입력으로 동작해야 한다.
// 그래서 여기 함수들은 예외를 던지지 않고 null(못 씀)을 돌려준다.

import { FunctionsHttpError } from '@supabase/supabase-js'
import { ensureSignedIn, getSupabase, isCloudConfigured } from './supabase'
import { compressImage } from './image'
import { rankForCats, type ShopItem } from './shop'

const FN = 'naver-shop'

/** 'off' = 서버 함수가 없거나 열쇠가 없다(설정 필요). 다시 열 때까지 묻지 않는다. */
let state: 'unknown' | 'ok' | 'off' = isCloudConfigured ? 'unknown' : 'off'
export function shopState() {
  return state
}

const cache = new Map<string, ShopItem[]>()

async function invoke<T>(body: object): Promise<T | null> {
  const sb = getSupabase()
  if (!sb || state === 'off') return null
  try {
    await ensureSignedIn()
    const { data, error } = await sb.functions.invoke(FN, { body })
    if (error) {
      if (error instanceof FunctionsHttpError) {
        const st = (error.context as Response | undefined)?.status
        // 404: 함수가 아직 없음 · 503: 열쇠가 없음 → 설정 전까지 조용히 숨긴다
        if (st === 404 || st === 503) state = 'off'
      }
      return null
    }
    state = 'ok'
    return data as T
  } catch {
    return null
  }
}

/** 네이버 쇼핑에서 찾는다. 못 쓰면 null, 결과가 없으면 [] */
export async function searchShop(q: string): Promise<ShopItem[] | null> {
  const key = q.trim().replace(/\s+/g, ' ')
  if (key.length < 2) return []
  const hit = cache.get(key)
  if (hit) return hit
  const res = await invoke<{ items?: ShopItem[] }>({ q: key })
  if (!res) return null
  const items = rankForCats(res.items ?? [])
  cache.set(key, items)
  return items
}

/** 쇼핑 사진을 받아 앱에 넣을 크기로 줄인다. 못 받으면 null */
export async function fetchShopImage(url: string): Promise<Blob | null> {
  const data = await invoke<Blob>({ img: url })
  if (!(data instanceof Blob) || data.size === 0) return null
  // 서버는 그냥 '파일'로 보내므로 사진이라고 표시해 둔다 (네이버 쇼핑 사진은 jpg·png)
  return compressImage(new Blob([data], { type: 'image/jpeg' }))
}
