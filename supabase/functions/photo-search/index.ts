// 제품 이름으로 사진을 찾아 주는 서버 함수 (Supabase Edge Function).
//
// 다음(카카오) 이미지 검색을 쓴다. 카카오 열쇠(REST API 키)는 앱에 넣으면
// 누구나 볼 수 있으므로 Supabase 비밀 값 KAKAO_REST_KEY 에만 두고, 앱은
// 이 함수에 "이 이름으로 찾아 줘"만 보낸다.
//
// 하는 일 두 가지:
//   { q: "조공 오키로스틱 퍼플", page: 1 } → 사진 목록 24장씩 (page 2, 3… 로 다음 24장)
//   { img: "<목록에서 받은 thumb 주소>" } → 그 사진 파일 (앱에 저장할 것)
//     브라우저는 다른 사이트 사진을 파일로 받아 저장할 수 없어서 여기서 대신 받는다.
//     카카오 사진 서버(*.kakaocdn.net)만 받아 준다 — 아무 주소나 대신 여는 통로가
//     되지 않게.
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

// 카카오 검색 썸네일 주소: https://search1.kakaocdn.net/argon/130x130_85_c/<id>
// 크기 부분만 바꾸면 같은 사진을 다른 크기로 준다.
const ARGON = /^(https:\/\/search\d+\.kakaocdn\.net\/argon\/)[^/]+\/([A-Za-z0-9_-]+)$/
function sized(thumb: string, size: string): string | null {
  const m = thumb.replace(/^http:/, 'https:').match(ARGON)
  return m ? `${m[1]}${size}/${m[2]}` : null
}

const MAX_IMAGE = 5 * 1024 * 1024

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const key = Deno.env.get('KAKAO_REST_KEY')?.trim()
  if (!key) return json({ error: 'not_configured' }, 503)

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
    // 카카오는 50쪽까지 준다
    const page = Math.min(50, Math.max(1, Math.floor(Number(body.page) || 1)))
    const url = `https://dapi.kakao.com/v2/search/image?sort=accuracy&size=24&page=${page}&query=` + encodeURIComponent(q)
    const r = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } })
    if (!r.ok) {
      // 카카오가 왜 거절했는지 앱 화면에서 알 수 있게 짧게 넘긴다 (열쇠는 담지 않는다)
      const why = await r.text().catch(() => '')
      return json({ error: 'kakao', status: r.status, detail: why.slice(0, 200) }, 502)
    }
    const data = await r.json()
    const seen = new Set<string>()
    const items = []
    for (const d of data.documents ?? []) {
      const thumb = sized(String(d.thumbnail_url ?? ''), '320x320_85_c')
      if (!thumb || seen.has(thumb)) continue
      seen.add(thumb)
      items.push({ thumb, site: String(d.display_sitename ?? ''), w: d.width, h: d.height })
    }
    return json({ items, end: !!data.meta?.is_end || page >= 50 })
  }

  // ---- 사진 파일 ----
  if (typeof body.img === 'string') {
    // 저장용은 조금 크게 (긴 변 600px)
    const big = sized(body.img, '600x0_80_wr')
    if (!big) return json({ error: 'host' }, 400)
    let r = await fetch(big)
    if (!r.ok) r = await fetch(sized(body.img, '320x320_85_c')!)
    if (!r.ok) return json({ error: 'image', status: r.status }, 502)
    const buf = await r.arrayBuffer()
    if (buf.byteLength > MAX_IMAGE) return json({ error: 'too_big' }, 413)
    // octet-stream 이어야 앱(supabase-js)이 파일(Blob)로 받는다
    return new Response(buf, { headers: { ...CORS, 'Content-Type': 'application/octet-stream' } })
  }

  return json({ error: 'bad_request' }, 400)
})
