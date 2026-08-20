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
 *   POST /storage/v1/object/list/{bucket}     사진 목록
 *   POST /storage/v1/object/{bucket}/{path}   사진 올리기
 *   GET  /storage/v1/object/{bucket}/{path}   사진 받기
 *   DELETE /storage/v1/object/{bucket}        사진 치우기
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
  objects: new Map(), // '<bucket>/<path>' -> Buffer
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

/**
 * 브라우저의 supabase-js 는 사진을 multipart/form-data 로 감싸서 보낸다.
 * 그 껍데기를 벗겨 파일 알맹이만 꺼낸다 — 안 벗기면 경계 문자열이 사진에
 * 섞여 들어가 깨진 이미지가 저장된다.
 */
function filePart(raw, contentType = '') {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)
  if (!m) return raw
  const boundary = Buffer.from('--' + (m[1] ?? m[2]).trim())
  // 조각을 전부 훑어서 filename= 이 붙은 것(=진짜 파일)만 고른다.
  // 앞쪽에는 cacheControl 같은 평범한 값들이 먼저 온다.
  let at = raw.indexOf(boundary)
  while (at >= 0) {
    const headEnd = raw.indexOf('\r\n\r\n', at)
    if (headEnd < 0) break
    const head = raw.subarray(at, headEnd).toString('utf8')
    const bodyStart = headEnd + 4
    const next = raw.indexOf(boundary, bodyStart)
    const bodyEnd = next < 0 ? raw.length : next - 2 // 경계 앞의 \r\n 제외
    if (/filename=/i.test(head)) return raw.subarray(bodyStart, bodyEnd)
    if (next < 0) break
    at = next
  }
  return raw
}

function userOf(req) {
  const auth = req.headers['authorization'] ?? ''
  const token = auth.replace(/^Bearer\s+/i, '')
  return token.startsWith('tok-') ? token.slice(4) : null
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 200, {})

  const url = new URL(req.url, `http://localhost:${PORT}`)
  // 사진은 바이너리라 원본 그대로 받아두고, JSON 은 그 위에서 해석한다
  const raw = await new Promise((resolve) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
  })
  let body = {}
  try { body = raw.length ? JSON.parse(raw.toString('utf8')) : {} } catch { body = {} }

  // 테스트에서 서버 상태를 들여다보기 위한 창구 (실제 Supabase 에는 없음)
  if (url.pathname === '/debug/objects') return json(res, 200, [...db.objects.keys()])

  // ── 사진 보관함 ───────────────────────────────────────────
  if (url.pathname.startsWith('/storage/v1/object')) {
    const uid = userOf(req)
    if (!uid) return json(res, 401, { message: 'no auth' })

    // 목록:  POST /storage/v1/object/list/<bucket>   { prefix, limit, offset }
    const list = url.pathname.match(/^\/storage\/v1\/object\/list\/([^/]+)$/)
    if (list) {
      const prefix = (body.prefix ?? '').replace(/\/$/, '')
      const head = `${list[1]}/${prefix}/`
      const names = [...db.objects.keys()]
        .filter((k) => k.startsWith(head))
        .map((k) => k.slice(head.length))
      const offset = body.offset ?? 0
      const limit = body.limit ?? 100
      return json(res, 200, names.slice(offset, offset + limit).map((name) => ({ name })))
    }

    // 치우기:  DELETE /storage/v1/object/<bucket>   { prefixes: [...] }
    const del = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)$/)
    if (del && req.method === 'DELETE') {
      for (const p of body.prefixes ?? []) db.objects.delete(`${del[1]}/${p}`)
      return json(res, 200, [])
    }

    // 올리기 / 받기:  /storage/v1/object[/authenticated]/<bucket>/<path>
    const one = url.pathname.match(/^\/storage\/v1\/object(?:\/authenticated)?\/([^/]+)\/(.+)$/)
    if (one) {
      const key = `${one[1]}/${decodeURIComponent(one[2])}`
      if (req.method === 'POST' || req.method === 'PUT') {
        if (db.objects.has(key) && req.headers['x-upsert'] !== 'true') {
          return json(res, 409, { message: 'The resource already exists' })
        }
        db.objects.set(key, filePart(raw, req.headers['content-type']))
        return json(res, 200, { Key: key })
      }
      if (req.method === 'GET') {
        const buf = db.objects.get(key)
        if (!buf) return json(res, 404, { message: 'not found' })
        cors(res)
        res.writeHead(200, { 'Content-Type': 'image/jpeg' })
        return res.end(buf)
      }
    }
    return json(res, 404, { message: 'storage: ' + url.pathname })
  }

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
    // 실제 서버와 같은 형식으로 만든다 — TG7K-JS27 (영문·숫자 8자 + 하이픈)
    // 예전에는 숫자 4자리로 만들었는데, 그 바람에 영문이 섞인 진짜 코드에서만
    // 터지는 문제를 여기서 못 잡았다.
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const gen = () => {
      let o = ''
      for (let i = 0; i < 8; i++) {
        o += CHARS[Math.floor(Math.random() * CHARS.length)]
        if (i === 3) o += '-'
      }
      return o
    }
    let code
    do { code = gen() } while (db.households.some((h) => h.code === code))
    const id = 'h-' + code
    db.households.push({ id, code })
    db.members.push({ household_id: id, user_id: uid })
    return json(res, 200, [{ id, code }])
  }

  if (url.pathname === '/rest/v1/rpc/join_household') {
    const uid = userOf(req)
    if (!uid) return json(res, 401, { message: '로그인이 필요합니다' })
    // 지금 배포된 03-short-code.sql 과 똑같이 '숫자만 남겨' 비교한다.
    // (07-code-match.sql 을 돌리면 글자 전체로 비교하게 된다)
    const digits = (v) => String(v ?? '').replace(/\D/g, '')
    const wanted = digits(body.p_code)
    const h = db.households.find((x) => digits(x.code) === wanted && wanted !== '')
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
