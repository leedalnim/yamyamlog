/**
 * 기록 날짜 표기 테스트.
 *
 * 해가 바뀌면 '9.05' 만으로는 올해 건지 작년 건지 알 수 없다.
 * 올해가 아닐 때만 연도를 붙인다.
 */
import { longDate, shortDate } from '../dist-test/date.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const ok = got === want
  if (ok) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', got, '\n     기대:', want) }
}
const T = (y, m, d) => new Date(y, m - 1, d).getTime()
const NOW = new Date(2026, 8, 5) // 2026-09-05

console.log('목록용')
eq('올해면 월.일만', shortDate(T(2026, 9, 5), NOW), '9.05')
eq('일자는 두 자리로', shortDate(T(2026, 9, 5), NOW), '9.05')
eq('작년이면 연도까지', shortDate(T(2025, 9, 5), NOW), '2025.9.05')
eq('올해 1월 1일도 연도 없음', shortDate(T(2026, 1, 1), NOW), '1.01')
eq('작년 12월 31일은 연도 있음', shortDate(T(2025, 12, 31), NOW), '2025.12.31')

console.log('상세용')
eq('올해', longDate(T(2026, 8, 22), NOW), '8월 22일')
eq('작년', longDate(T(2025, 8, 22), NOW), '2025년 8월 22일')

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
