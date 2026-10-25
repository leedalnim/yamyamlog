// 네이버 쇼핑 검색을 앱 대신 불러 주는 서버 함수 (Supabase Edge Function).
//
// 네이버 열쇠(Client ID / Secret)를 앱 코드에 넣으면 누구나 볼 수 있다.
// 그래서 열쇠는 Supabase 의 비밀 값(NAVER_CLIENT_ID / NAVER_CLIENT_SECRET)에만
// 두고, 앱은 이 함수에 "이 글자로 찾아 줘"만 보낸다.
//
// 하는 일 두 가지:
//   { q: "조공 산양" }   → 네이버 쇼핑 검색 결과 (최대 20개)
//   { img: "https://shopping-phinf.pstatic.net/..." } → 그 사진 파일
//     (브라우저는 다른 사이트 사진을 파일로 받아 저장할 수 없어서 여기서 대신 받는다)
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

// 네이버 쇼핑 사진 서버만 받아 준다 (아무 주소나 대신 받아 주는 통로가 되지 않게)
function isNaverImage(u: URL) {
  return u.protocol === 'https:' && (u.hostname === 'pstatic.net' || u.hostname.endsWith('.pstatic.net'))
}

const MAX_IMAGE = 8 * 1024 * 1024

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const id = Deno.env.get('NAVER_CLIENT_ID')
  const secret = Deno.env.get('NAVER_CLIENT_SECRET')
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
    if (q.length < 2) return json({ items: [] })
    const url = 'https://openapi.naver.com/v1/search/shop.json?display=20&sort=sim&query=' + encodeURIComponent(q)
    const r = await fetch(url, {
      headers: { 'X-Naver-Client-Id': id, 'X-Naver-Client-Secret': secret },
    })
    if (!r.ok) return json({ error: 'naver', status: r.status }, 502)
    const data = await r.json()
    // 앱이 쓰는 것만 추려서 보낸다
    const items = (data.items ?? []).map((it: Record<string, string>) => ({
      title: it.title ?? '',
      image: it.image ?? '',
      brand: it.brand ?? '',
      maker: it.maker ?? '',
      category: [it.category1, it.category2, it.category3, it.category4].filter(Boolean),
      lprice: it.lprice ?? '',
      link: it.link ?? '',
    }))
    return json({ items })
  }

  // ---- 사진 ----
  if (typeof body.img === 'string') {
    let u: URL
    try {
      u = new URL(body.img)
    } catch {
      return json({ error: 'bad_url' }, 400)
    }
    if (!isNaverImage(u)) return json({ error: 'host' }, 400)
    const r = await fetch(u)
    if (!r.ok) return json({ error: 'image', status: r.status }, 502)
    const buf = await r.arrayBuffer()
    if (buf.byteLength > MAX_IMAGE) return json({ error: 'too_big' }, 413)
    // octet-stream 이어야 앱(supabase-js)이 파일(Blob)로 받는다
    return new Response(buf, {
      headers: { ...CORS, 'Content-Type': 'application/octet-stream' },
    })
  }

  return json({ error: 'bad_request' }, 400)
})
