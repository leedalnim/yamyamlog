/**
 * 노션에서 옮겨 온 기록의 날짜 순서 바로잡기 테스트.
 */
import { reorderDates } from '../dist-test/seedOrder.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', g, '\n     기대:', w) }
}
const ids = ['a', 'b', 'c']

console.log('날짜 다시 나누기')
// 예전 시드: 목록 맨 앞(a)이 가장 최근
const old = [
  { id: 'a', createdAt: 300 },
  { id: 'b', createdAt: 200 },
  { id: 'c', createdAt: 100 },
  { id: 'mine', createdAt: 999 },
]
const ch = reorderDates(old, ids)
eq('앞쪽일수록 오래된 날짜', ch.map((r) => [r.id, r.createdAt]), [['a', 100], ['c', 300]])
const fixed = old.map((r) => ch.find((c) => c.id === r.id) ?? r)
eq('다시 돌려도 바뀌는 것 없음', reorderDates(fixed, ids), [])
eq('사용자가 만든 기록은 안 건드림', fixed.find((r) => r.id === 'mine').createdAt, 999)
eq('날짜 값 묶음은 그대로', fixed.filter((r) => ids.includes(r.id)).map((r) => r.createdAt).sort(), [100, 200, 300])

console.log('빠진 기록')
eq('지운 기록은 빼고 나눈다',
  reorderDates([{ id: 'a', createdAt: 300 }, { id: 'b', createdAt: 200, deletedAt: 5 }, { id: 'c', createdAt: 100 }], ids)
    .map((r) => [r.id, r.createdAt]),
  [['a', 100], ['c', 300]])
eq('없는 기록은 건너뛴다', reorderDates([{ id: 'c', createdAt: 1 }], ids), [])

console.log('두 폰에서 따로 돌려도 같은 결과')
const phoneA = reorderDates(old, ids).map((r) => [r.id, r.createdAt])
const phoneB = reorderDates([...old].reverse(), ids).map((r) => [r.id, r.createdAt])
eq('입력 순서가 달라도 같다', phoneA, phoneB)

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
