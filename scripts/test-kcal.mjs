/**
 * 하루 권장 칼로리 테스트.
 *
 * 예전에 RER(쉴 때 열량)을 그대로 권장량으로 보여줘서 20% 적게 나왔다.
 * 같은 실수가 다시 들어오면 여기서 걸린다.
 */
import { ACTIVITY, dailyKcal, restingKcal } from '../dist-test/kcal.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', JSON.stringify(got), '\n     기대:', JSON.stringify(want)) }
}

console.log('쉴 때 열량 (RER)')
eq('3kg 은 약 160kcal', Math.round(restingKcal(3)), 160)
eq('7kg 은 약 301kcal', Math.round(restingKcal(7)), 301)

console.log('하루 권장 칼로리 (MER)')
// 중성화한 실내묘는 RER 의 1.2배 — 이게 화면이 쓰는 기준이다
eq('탱자·유자 3kg', dailyKcal(3), 191)
eq('나물이 6.5kg', dailyKcal(6.5), 342)
eq('콩이 7kg', dailyKcal(7), 361)
eq('RER 을 그대로 쓰지 않는다', dailyKcal(3) > Math.round(restingKcal(3)), true)
eq('기본값은 중성화한 실내묘', dailyKcal(4), dailyKcal(4, 'neuteredIndoor'))

console.log('활동 계수')
eq('중성화 안 하면 더 많이', dailyKcal(4, 'intact') > dailyKcal(4), true)
eq('체중 감량 중이면 더 적게', dailyKcal(4, 'weightLoss') < dailyKcal(4), true)
eq('중성화 실내묘 계수는 1.2', ACTIVITY.neuteredIndoor, 1.2)

console.log('이상한 값')
eq('0kg 이면 0', dailyKcal(0), 0)
eq('음수면 0', dailyKcal(-3), 0)
eq('숫자가 아니면 0', dailyKcal(NaN), 0)

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
