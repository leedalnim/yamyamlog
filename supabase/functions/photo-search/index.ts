// 제품 이름으로 사진을 찾아 주는 서버 함수 (Supabase Edge Function).
//
// 네이버 이미지 검색(NAVER API HUB)을 쓴다. 네이버 열쇠는 앱에 넣으면 누구나 볼 수
// 있으므로 Supabase 비밀 값 NAVER_HUB_ID / NAVER_HUB_SECRET 에만 두고, 앱은 이
// 함수에 "이 이름으로 찾아 줘"만 보낸다.
//
// 하는 일 두 가지:
//   { q: "조공 오키로스틱 퍼플", page: 1 } → 사진 목록 24장씩 (page 2, 3… 로 다음 24장)
//   { img: "<원본 주소>", sig: "<서명>", thumb: "<썸네일 주소>" } → 그 사진 파일 (앱에 저장할 것)
//     브라우저는 다른 사이트 사진을 파일로 받아 저장할 수 없어서 여기서 대신 받는다.
//     아무 주소나 대신 여는 통로가 되지 않게, 원본 주소는 이 함수가 검색 결과로
//     내준 것(서명이 맞는 것)만 받는다. 원본을 못 받으면 네이버 썸네일
//     (*.pstatic.net)로 대신한다.
//
// 우리 앱으로 로그인한 기기(익명 로그인 포함)만 쓸 수 있다.

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

const API = 'https://naverapihub.apigw.ntruss.com/search/v1/image'
const PER = 24
const MAX_IMAGE = 5 * 1024 * 1024

// ---- 원본 주소 서명 (이 함수가 내준 주소만 다시 받기 위해) ----
async function hmac(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c]!)
}

function isPstatic(u: string) {
  try {
    const h = new URL(u)
    return h.protocol === 'https:' && (h.hostname === 'pstatic.net' || h.hostname.endsWith('.pstatic.net'))
  } catch {
    return false
  }
}

/** 사진 파일 받기. 사진이 아니거나 너무 크면 null */
async function grab(url: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://search.naver.com/' } })
    if (!r.ok) return null
    if (!(r.headers.get('content-type') ?? '').startsWith('image/')) return null
    const buf = await r.arrayBuffer()
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE) return null
    return buf
  } catch {
    return null
  }
}

const decode = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const id = Deno.env.get('NAVER_HUB_ID')?.trim()
  const secret = Deno.env.get('NAVER_HUB_SECRET')?.trim()
  if (!id || !secret) return json({ error: 'not_configured' }, 503)

  // 로그인한 기기인지
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
  const { data: who, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !who.user) return json({ error: 'unauthorized' }, 401)

  const body = await req.json().catch(() => ({}))

  // ---- 검색 ----
  if (typeof body.q === 'string') {
    const q = body.q.trim().slice(0, 80)
    if (q.length < 2) return json({ items: [], end: true })
    // 네이버는 1000번째 결과까지 준다
    const page = Math.min(41, Math.max(1, Math.floor(Number(body.page) || 1)))
    const start = (page - 1) * PER + 1
    const url = `${API}?query=${encodeURIComponent(q)}&display=${PER}&start=${start}&sort=sim&filter=all`
    const r = await fetch(url, { headers: { 'X-NCP-APIGW-API-KEY-ID': id, 'X-NCP-APIGW-API-KEY': secret } })
    if (!r.ok) {
      // 네이버가 왜 거절했는지 앱 화면에서 알 수 있게 짧게 넘긴다 (열쇠는 담지 않는다)
      const why = await r.text().catch(() => '')
      return json({ error: 'naver', status: r.status, detail: why.slice(0, 200) }, 502)
    }
    const data = await r.json()
    const seen = new Set<string>()
    const items = []
    for (const d of data.items ?? []) {
      const thumb = String(d.thumbnail ?? '').replace(/^http:/, 'https:')
      const img = String(d.link ?? '')
      if (!isPstatic(thumb) || seen.has(thumb)) continue
      seen.add(thumb)
      items.push({
        thumb,
        img,
        sig: img ? await hmac(secret, img) : '',
        site: decode(String(d.title ?? '')).slice(0, 40),
        w: Number(d.sizewidth) || undefined,
        h: Number(d.sizeheight) || undefined,
      })
    }
    const total = Number(data.total) || 0
    const end = (data.items ?? []).length < PER || start + PER > Math.min(total, 1000)
    return json({ items, end })
  }

  // ---- 사진 파일 ----
  if (typeof body.thumb === 'string' || typeof body.img === 'string') {
    let buf: ArrayBuffer | null = null
    // 원본 — 이 함수가 내준 주소만
    if (typeof body.img === 'string' && /^https?:\/\//.test(body.img) && typeof body.sig === 'string') {
      if (body.sig === (await hmac(secret, body.img))) buf = await grab(body.img)
    }
    // 원본을 못 받으면 네이버 썸네일
    if (!buf && typeof body.thumb === 'string' && isPstatic(body.thumb)) buf = await grab(body.thumb)
    if (!buf) return json({ error: 'image' }, 502)
    // octet-stream 이어야 앱(supabase-js)이 파일(Blob)로 받는다
    return new Response(buf, { headers: { ...CORS, 'Content-Type': 'application/octet-stream' } })
  }

  return json({ error: 'bad_request' }, 400)
})
