// 제품 이름으로 사진 찾기 — 서버 함수(supabase/functions/photo-search)를 거친다.
// 함수는 네이버 이미지 검색(NAVER API HUB)을 부른다.
//
// 이 기능은 덤이다. 함수가 아직 없거나, 열쇠가 없거나, 인터넷이 끊겨도 앱은
// 예전처럼 직접 찍기로 동작해야 한다. 그래서 예외를 던지지 않고 null 을 준다.

import { FunctionsHttpError } from '@supabase/supabase-js'
import { ensureSignedIn, getSupabase, isCloudConfigured } from './supabase'
import { compressImage } from './image'

const FN = 'photo-search'

export interface PhotoHit {
  /** 네이버 썸네일 주소 — 화면에 바로 쓴다 */
  thumb: string
  /** 원본 사진 주소와 서버 서명 — 저장할 때 서버가 원본을 받아 온다 */
  img?: string
  sig?: string
  /** 사진이 있던 글 제목 */
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

export interface PhotoPage {
  items: PhotoHit[]
  /** 더 없음 */
  end: boolean
}

const cache = new Map<string, PhotoPage>()

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
        lastError = st === 502 ? 'naver' : `http${st ?? ''}`
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

/** 이름으로 사진을 찾는다(24장씩, page 1부터). 못 쓰면 null */
export async function searchPhotos(q: string, page = 1): Promise<PhotoPage | null> {
  const key = q.trim().replace(/\s+/g, ' ')
  if (key.length < 2) return { items: [], end: true }
  const ck = key + '\n' + page
  const hit = cache.get(ck)
  if (hit) return hit
  const res = await invoke<{ items?: PhotoHit[]; end?: boolean }>({ q: key, page })
  if (!res) return null
  // 예전 서버 함수는 end 를 안 준다 — 그땐 한 쪽뿐이라고 본다
  const out = { items: res.items ?? [], end: res.end ?? true }
  cache.set(ck, out)
  return out
}

/** 고른 사진을 받아 앱에 넣을 크기로 줄인다. 못 받으면 null */
export async function fetchPhoto(hit: PhotoHit): Promise<Blob | null> {
  // 서명이 없으면 예전 서버 함수(다음 검색)의 결과 — 그때 방식으로 보낸다
  const data = await invoke<Blob>(hit.sig ? { thumb: hit.thumb, img: hit.img, sig: hit.sig } : { img: hit.thumb })
  if (!(data instanceof Blob) || data.size === 0) return null
  // 서버는 그냥 '파일'로 보내므로 사진이라고 표시해 둔다
  return compressImage(new Blob([data], { type: 'image/jpeg' }))
}
