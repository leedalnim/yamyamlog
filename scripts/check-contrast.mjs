/**
 * 글자가 배경에 묻히는 곳을 찾아낸다.
 *
 * 다크 모드에서 TOP3 제품명이 검게 나온 적이 있다. <div> 를 <button> 으로
 * 바꾸면서 버튼 기본 글자색(검정)을 지우지 않은 탓인데, 화면을 눈으로
 * 훑어서는 이런 걸 놓치기 쉽다. 그래서 실제로 그려놓고 재본다.
 *
 * 밝기 대비가 기준보다 낮으면 실패한다. 기준은 '읽기 좋은가'가 아니라
 * '망가졌는가'에 맞춰 낮게 잡았다 — 디자인 취향에 간섭하지 않기 위해서다.
 *
 *   node scripts/check-contrast.mjs
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'

// 이 저장소에서는 playwright-core + 미리 깔린 크로미움을 쓰고,
// CI 에서는 playwright 가 자기 브라우저를 직접 챙긴다. 둘 다 되게 한다.
let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  ;({ chromium } = await import('playwright-core'))
}

const LOCAL_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const CHROME = process.env.CHROME_PATH || (existsSync(LOCAL_CHROME) ? LOCAL_CHROME : null)
const PORT = 8771
const FILE = 'dist-single/index.html'

/** 이 값보다 낮으면 '묻혔다'고 본다 (WCAG 큰 글자 기준이 3.0) */
const MIN_RATIO = 2.5

if (!existsSync(FILE)) {
  console.error(`✗ ${FILE} 이 없습니다. 먼저 SINGLE=1 npm run build 를 돌려주세요.`)
  process.exit(1)
}

const html = readFileSync(FILE)
const server = createServer((_q, r) => {
  r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  r.end(html)
}).listen(PORT)

/** 화면 안에서 실행돼 묻힌 글자를 모아 온다 */
const COLLECT = () => {
  const lum = (c) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }
  }
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }
  /** 투명한 배경은 위로 거슬러 올라가 실제로 깔린 색을 찾는다 */
  const bgOf = (el) => {
    let n = el
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor)
      if (c && c.a > 0.5) return c.rgb
      n = n.parentElement
    }
    return [255, 255, 255]
  }

  const out = []
  for (const el of document.querySelectorAll('*')) {
    // 자기 자신이 직접 가진 글자만 본다 (부모가 자식 글자를 중복해 세지 않게)
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim())
      .join(' ')
    if (!own) continue

    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.15) continue
    const r = el.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) continue

    const fg = parse(cs.color)
    if (!fg || fg.a < 0.35) continue
    const v = ratio(fg.rgb, bgOf(el))
    if (v < 2.5) {
      out.push({
        text: own.slice(0, 24),
        cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 40),
        color: cs.color,
        bg: 'rgb(' + bgOf(el).join(', ') + ')',
        ratio: Math.round(v * 100) / 100,
      })
    }
  }
  return out
}

/** 화면마다 여기까지 눌러서 들어간다 */
const ROUTES = [
  { name: '홈', steps: [] },
  { name: '통계', steps: ['.nav-tab:has-text("통계")'] },
  { name: '냥이들', steps: ['.nav-tab:has-text("냥이들")'] },
  { name: '설정', steps: ['.nav-tab:has-text("설정")'] },
  { name: '기록 추가', steps: ['.nav-fab'] },
  { name: '상세', steps: ['.snack-card'] },
  { name: '기록 수정', steps: ['.snack-card', '.detail-edit-btn'] },
]

let bad = 0
const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {})

for (const mode of ['light', 'dark']) {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: mode })
    await page.goto(`http://localhost:${PORT}/`)
    await page.waitForSelector('.snack-card', { timeout: 15000 })
    await page.evaluate((m) => document.documentElement.setAttribute('data-mode', m), mode)
    for (const s of route.steps) {
      await page.click(s)
      await page.waitForTimeout(350)
    }
    await page.waitForTimeout(250)
    const found = await page.evaluate(COLLECT)
    if (found.length) {
      bad += found.length
      console.log(`\n✗ ${mode} · ${route.name}`)
      for (const f of found) {
        console.log(`    "${f.text}" [${f.cls}]`)
        console.log(`      글자 ${f.color} / 배경 ${f.bg} — 대비 ${f.ratio}`)
      }
    }
    await page.close()
  }
}

await browser.close()
server.close()

if (bad) {
  console.log(`\n✗ 배경에 묻힌 글자 ${bad}곳 (기준 대비 ${MIN_RATIO})`)
  process.exit(1)
}
console.log(`✓ 대비 검사 통과 — 라이트·다크 ${ROUTES.length}화면씩 훑어 묻힌 글자 없음`)
