/**
 * 생년월일로 나이 계산 테스트.
 *
 * 손으로 적은 나이는 해가 바뀌면 틀린다. 생년월일에서 계산하는 쪽이
 * 옳은데, 경계(생일 당일 / 하루 전 / 윤년 2월 29일)에서 틀리기 쉽다.
 */
import { ageFrom, displayAge, guessBirthday } from '../dist-test/age.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', JSON.stringify(got), '\n     기대:', JSON.stringify(want)) }
}
const D = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }

console.log('나이 계산')
eq('만 5년', ageFrom('2020-08-25', D('2025-08-25'))?.short, '5살')
eq('생일 하루 전은 아직 4살', ageFrom('2020-08-25', D('2025-08-24'))?.short, '4살')
eq('생일 다음 날', ageFrom('2020-08-25', D('2025-08-26'))?.short, '5살')
eq('한 살 안 된 아기는 개월로', ageFrom('2025-01-25', D('2025-08-25'))?.short, '7개월')
eq('태어난 날은 0개월', ageFrom('2025-08-25', D('2025-08-25'))?.short, '0개월')
eq('개월이 남으면 같이 보여준다', ageFrom('2020-05-25', D('2025-08-25'))?.long, '5살 3개월')
eq('딱 떨어지면 살만', ageFrom('2020-08-25', D('2025-08-25'))?.long, '5살')

console.log('경계')
eq('윤년 2월 29일생, 평년 2월 28일엔 아직', ageFrom('2020-02-29', D('2025-02-28'))?.short, '4살')
eq('윤년 2월 29일생, 3월 1일엔 다섯 살', ageFrom('2020-02-29', D('2025-03-01'))?.short, '5살')
eq('말일생 (1월 31일 → 2월)', ageFrom('2024-01-31', D('2025-02-01'))?.long, '1살')

console.log('잘못된 값')
eq('빈 값', ageFrom(''), null)
eq('없는 값', ageFrom(undefined), null)
eq('형식이 아니면', ageFrom('2020년 8월'), null)
eq('있지도 않은 날짜', ageFrom('2021-02-30'), null)
eq('미래는 나이가 없다', ageFrom('2030-01-01', D('2025-08-25')), null)

console.log('화면 표기')
eq('생년월일이 있으면 그걸 쓴다',
  displayAge({ birthday: '2020-08-25', ageYears: 99 }, D('2025-08-25')), '5살')
eq('없으면 예전에 적어 둔 나이',
  displayAge({ ageYears: 7 }, D('2025-08-25')), '7살')
eq('둘 다 없으면 안 보여준다', displayAge({}, D('2025-08-25')), null)
eq('생년월일이 엉터리면 적어 둔 나이로',
  displayAge({ birthday: '몰라', ageYears: 3 }, D('2025-08-25')), '3살')

console.log('어림 생년월일')
eq('5살이면 5년 전 같은 달 1일', guessBirthday(5, D('2025-08-25')), '2020-08-01')
eq('어림값을 다시 계산하면 적어 둔 나이 그대로',
  ageFrom(guessBirthday(5, D('2025-08-25')), D('2025-08-25'))?.short, '5살')

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
