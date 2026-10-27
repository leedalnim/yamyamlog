// 제품 이름으로 사진 찾기 — 서버 함수(supabase/functions/photo-search)를 거친다.
// 함수는 다음(카카오) 이미지 검색을 부른다.
//
// 이 기능은 덤이다. 함수가 아직 없거나, 열쇠가 없거나, 인터넷이 끊겨도 앱은
// 예전처럼 직접 찍기로 동작해야 한다. 그래서 예외를 던지지 않고 null 을 준다.

import { FunctionsHttpError } from '@supabase/supabase-js'
import { ensureSignedIn, getSupabase, isCloudConfigured } from './supabase'
import { compressImage } from './image'

const FN = 'photo-search'

export interface PhotoHit {
  /** 카카오 썸네일 주소 (정사각 320px) — 화면에 바로 쓰고, 저장할 때 이걸 넘긴다 */
  thumb: string
  /** 사진이 있던 곳 (예: 네이버 블로그, 11번가) */
  site: string
}

/** 'off' = 함수가 없거나 열쇠가 없다(설정 필요). 앱을 다시 열 때까지 묻지 않는다. */
let state: 'unknown' | 'ok' | 'off' = isCloudConfigured ? 'unknown' : 'off'
export function photoSearchState() {
  return state
}
/** 마지막 실패 이유 (화면 안내용) */
let lastError = ''
export function photoSearchError() {
  return lastError
}

const cache = new Map<string, PhotoHit[]>()

async function invoke<T>(body: object): Promise<T | null> {
  const sb = getSupabase()
  if (!sb || state === 'off') return null
  try {
    await ensureSignedIn()
    const { data, error } = await sb.functions.invoke(FN, { body })
    if (error) {
      lastError = 'network'
      if (error instanceof FunctionsHttpError) {
        const res = error.context as Response | undefined
        const st = res?.status
        // 404: 함수가 아직 없음 · 503: 열쇠가 없음 → 설정 전까지 조용히 숨긴다
        if (st === 404 || st === 503) state = 'off'
        lastError = st === 502 ? 'kakao' : `http${st ?? ''}`
      }
      return null
    }
    state = 'ok'
    lastError = ''
    return data as T
  } catch {
    lastError = 'network'
    return null
  }
}

/** 이름으로 사진을 찾는다. 못 쓰면 null, 없으면 [] */
export async function searchPhotos(q: string): Promise<PhotoHit[] | null> {
  const key = q.trim().replace(/\s+/g, ' ')
  if (key.length < 2) return []
  const hit = cache.get(key)
  if (hit) return hit
  const res = await invoke<{ items?: PhotoHit[] }>({ q: key })
  if (!res) return null
  const items = res.items ?? []
  cache.set(key, items)
  return items
}

/** 고른 사진을 받아 앱에 넣을 크기로 줄인다. 못 받으면 null */
export async function fetchPhoto(thumb: string): Promise<Blob | null> {
  const data = await invoke<Blob>({ img: thumb })
  if (!(data instanceof Blob) || data.size === 0) return null
  // 서버는 그냥 '파일'로 보내므로 사진이라고 표시해 둔다
  return compressImage(new Blob([data], { type: 'image/jpeg' }))
}
