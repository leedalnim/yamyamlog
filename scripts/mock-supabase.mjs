/**
 * 개발용 가짜 Supabase 서버.
 *
 * 실제 supabase.co에 접속할 수 없는 환경에서 동기화 흐름을 끝까지
 * 돌려보기 위한 것이다. 앱이 실제로 호출하는 만큼만 흉내낸다:
 *   POST /auth/v1/signup            익명 로그인
 *   POST /rest/v1/rpc/create_household
 *   POST /rest/v1/rpc/join_household
 *   GET  /rest/v1/{table}?household_id=eq.X
 *   POST /rest/v1/{table}           upsert
 *
 * 검증 범위: 앱 쪽 코드(클라이언트·병합·화면). 실제 서버의 RLS 정책과
 * SQL 함수는 여기서 검증되지 않는다 — 그건 실제 프로젝트에서 확인해야 한다.
 */
import { createServer } from 'node:http'

const PORT = Number(process.argv[2] ?? 8791)

const db = {
  households: [], // { id, code }
  members: [], // { household_id, user_id }
  cats: [],
  snacks: [],
}
let userSeq = 0

const uuid = () => 'u' + String(++userSeq).padStart(4, '0') + '-0000-0000-0000-000000000000'

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Expose-Headers', '*')
}

function json(res, code, body) {
  cors(res)
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function userOf(req) {
  const auth = req.headers['authorization'] ?? ''
  const token = auth.replace(/^Bearer\s+/i, '')
  return token.startsWith('tok-') ? token.slice(4) : null
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 200, {})

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const body = await new Promise((resolve) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => {
      try { resolve(b ? JSON.parse(b) : {}) } catch { resolve({}) }
    })
  })

  // ── 익명 로그인 ────────────────────────────────────────────
  if (url.pathname === '/auth/v1/signup' || url.pathname === '/auth/v1/token') {
    const id = uuid()
    return json(res, 200, {
      access_token: 'tok-' + id,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'ref-' + id,
      user: { id, aud: 'authenticated', role: 'authenticated', is_anonymous: true },
    })
  }

  // ── RPC ───────────────────────────────────────────────────
  if (url.pathname === '/rest/v1/rpc/create_household') {
    const uid = userOf(req)
    if (!uid) return json(res, 401, { message: '로그인이 필요합니다' })
    let code
    do { code = String(Math.floor(Math.random() * 10000)).padStart(4, '0') }
    while (db.households.some((h) => h.code === code))
    const id = 'h-' + code
    db.households.push({ id, code })
    db.members.push({ household_id: id, user_id: uid })
    return json(res, 200, [{ id, code }])
  }

  if (url.pathname === '/rest/v1/rpc/join_household') {
    const uid = userOf(req)
    if (!uid) return json(res, 401, { message: '로그인이 필요합니다' })
    const wanted = String(body.p_code ?? '').replace(/\D/g, '')
    const h = db.households.find((x) => x.code === wanted)
    if (!h) return json(res, 400, { message: '그런 코드가 없어요' })
    if (!db.members.some((m) => m.household_id === h.id && m.user_id === uid)) {
      db.members.push({ household_id: h.id, user_id: uid })
    }
    return json(res, 200, h.id)
  }

  // ── 테이블 ────────────────────────────────────────────────
  const m = url.pathname.match(/^\/rest\/v1\/(cats|snacks)$/)
  if (m) {
    const table = m[1]
    const uid = userOf(req)
    if (!uid) return json(res, 401, { message: '로그인이 필요합니다' })

    if (req.method === 'GET') {
      const eq = url.searchParams.get('household_id') ?? ''
      const hid = eq.replace(/^eq\./, '')
      // RLS 흉내: 구성원이 아니면 아무것도 안 보인다
      if (!db.members.some((x) => x.household_id === hid && x.user_id === uid)) {
        return json(res, 200, [])
      }
      return json(res, 200, db[table].filter((r) => r.household_id === hid))
    }

    if (req.method === 'POST') {
      const rows = Array.isArray(body) ? body : [body]
      for (const row of rows) {
        if (!db.members.some((x) => x.household_id === row.household_id && x.user_id === uid)) {
          return json(res, 403, { message: 'RLS: 권한 없음' })
        }
        const i = db[table].findIndex((r) => r.id === row.id)
        if (i >= 0) db[table][i] = row
        else db[table].push(row)
      }
      return json(res, 201, rows)
    }
  }

  json(res, 404, { message: 'not found: ' + url.pathname })
})

server.listen(PORT, () => console.log('가짜 Supabase 서버 :' + PORT))
