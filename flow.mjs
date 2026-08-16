import { chromium } from 'playwright-core'
const SP='/tmp/claude-0/-home-user-yumlog/67ea11e6-1e66-5bbb-a319-8681bf2d4679/scratchpad'
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'})
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2})
const errs=[]; p.on('pageerror',e=>errs.push(String(e)))
await p.goto('file://'+SP+'/preview.html'); await p.waitForTimeout(4500)
await p.click('.snack-btn'); await p.waitForTimeout(400)
await p.screenshot({path:SP+'/f1-detail.png'})
await p.click('.detail-edit-btn'); await p.waitForTimeout(400)
await p.screenshot({path:SP+'/f2-edit.png'})
// 이름 변경 후 저장 → 상세로 복귀하는지
await p.fill('.field .input', '조공 네덜란드 산양유 양갱 (수정됨)')
await p.click('.btn-primary.btn-block'); await p.waitForTimeout(900)
const title = await p.$eval('.detail-name', e=>e.textContent).catch(()=>null)
console.log('저장 후 화면의 제목:', title)
await p.screenshot({path:SP+'/f3-back.png'})
// 뒤로 → 홈 목록에도 반영됐는지
await p.click('.detail-back'); await p.waitForTimeout(600)
const names = await p.$$eval('.snack-name', e=>e.map(x=>x.textContent))
console.log('홈 목록:', JSON.stringify(names))
console.log('errors:', errs)
await b.close()
