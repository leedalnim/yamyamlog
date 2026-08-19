/**
 * 배포 후 이미지가 깨지는 사고를 막는 빌드 검사.
 *
 * 사고 구조
 *   서비스워커는 이전 버전 index.html/JS를 계속 내준다(보고 있는 화면이
 *   갈아엎히지 않도록 일부러 그렇게 해뒀다). 그런데 그 JS가 참조하는
 *   파일이 프리캐시에 없으면 네트워크로 가는데, 새 배포가 올라간 서버에는
 *   그 해시의 파일이 이미 없다 → 404 → 이미지 물음표.
 *
 * 따라서 규칙은 하나다.
 *   "빌드 산출물이 참조하는 파일은 전부 프리캐시에 들어 있어야 한다."
 *
 * 이 검사가 깨지면 배포를 막는다. 설정을 건드리다 이미지가 프리캐시에서
 * 빠지는 순간, 사용자가 아니라 CI가 먼저 발견하게 하는 것이 목적이다.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const BASE = '/yamyamlog/'

function fail(msg, details = []) {
  console.error(`\n✗ 프리캐시 검사 실패\n  ${msg}`)
  for (const d of details) console.error(`    - ${d}`)
  console.error(
    '\n  vite.config.ts의 workbox.globPatterns에 해당 확장자가 빠졌는지 확인하세요.\n',
  )
  process.exit(1)
}

if (!existsSync(join(DIST, 'sw.js'))) {
  fail('dist/sw.js가 없습니다. npm run build를 먼저 실행하세요.')
}

// 1) 서비스워커가 프리캐시하는 파일 목록
const sw = readFileSync(join(DIST, 'sw.js'), 'utf8')
const precached = new Set(
  [...sw.matchAll(/\{url:"([^"]+)"/g)].map((m) => m[1].replace(/^\//, '')),
)
if (precached.size === 0) fail('sw.js에서 프리캐시 목록을 찾지 못했습니다.')

// 2) 빌드 산출물(JS/CSS)이 실제로 참조하는 파일 목록
const assetDir = join(DIST, 'assets')
const sources = existsSync(assetDir)
  ? readdirSync(assetDir)
      .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
      .map((f) => join(assetDir, f))
  : []
sources.push(join(DIST, 'index.html'))

const referenced = new Set()
for (const file of sources) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(new RegExp(`${BASE}([A-Za-z0-9._/-]+\\.[A-Za-z0-9]+)`, 'g'))) {
    referenced.add(m[1])
  }
}

// 서비스워커 자신과 워크박스 런타임은 프리캐시 대상이 아니다(항상 네트워크에서 받는다).
const EXEMPT = /^(sw\.js|workbox-[A-Za-z0-9]+\.js|registerSW\.js)$/

// 3) 참조하는데 프리캐시에 없는 파일 = 다음 배포 때 404가 날 파일
const missing = [...referenced].filter(
  (r) => !precached.has(r) && !EXEMPT.test(r) && existsSync(join(DIST, r)),
)

if (missing.length > 0) {
  fail(
    `빌드 산출물이 참조하지만 프리캐시에 없는 파일이 ${missing.length}개 있습니다.\n  ` +
      '이 파일들은 다음 배포 때 404가 되어 화면에서 사라집니다.',
    missing,
  )
}

console.log(
  `✓ 프리캐시 검사 통과 — 참조 ${referenced.size}개 중 누락 0개 (프리캐시 ${precached.size}개)`,
)
