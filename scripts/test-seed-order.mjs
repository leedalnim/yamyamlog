/**
 * 노션에서 옮겨 온 기록의 날짜 바로잡기 테스트.
 */
import { placeBeforeOwn } from '../dist-test/seedOrder.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', g, '\n     기대:', w) }
}
const M = 60 * 1000
const ids = ['a', 'b', 'c']
const apply = (recs, ch) => recs.map((r) => ch.find((c) => c.id === r.id) ?? r)

console.log('직접 넣은 기록보다 앞으로')
// 노션 기록(a,b,c)이 다시 넣어지며 최신 날짜를 받아 직접 넣은 기록(x,y) 위에 있다
const recs = [
  { id: 'a', createdAt: 9000 * M },
  { id: 'b', createdAt: 9001 * M },
  { id: 'c', createdAt: 9002 * M },
  { id: 'x', createdAt: 1000 * M },
  { id: 'y', createdAt: 5000 * M },
]
const ch = placeBeforeOwn(recs, ids)
eq('노션 순서대로 1분 간격, 가장 오래된 직접 기록 바로 앞',
  ch.map((r) => [r.id, r.createdAt / M]), [['a', 997], ['b', 998], ['c', 999]])
const fixed = apply(recs, ch)
const order = [...fixed].sort((p, q) => q.createdAt - p.createdAt).map((r) => r.id)
eq('최신순으로 보면 직접 넣은 기록이 위', order, ['y', 'x', 'c', 'b', 'a'])
eq('다시 돌려도 바뀌는 것 없음', placeBeforeOwn(fixed, ids), [])
eq('직접 넣은 기록은 안 건드림', fixed.filter((r) => !ids.includes(r.id)).map((r) => r.createdAt / M), [1000, 5000])

console.log('빠진 기록')
eq('직접 넣은 기록이 없으면 아무것도 안 함', placeBeforeOwn([{ id: 'a', createdAt: 5 }], ids), [])
eq('지운 노션 기록은 건너뛴다',
  placeBeforeOwn([{ id: 'a', createdAt: 1, deletedAt: 2 }, { id: 'b', createdAt: 1 }, { id: 'x', createdAt: 100 * M }], ids)
    .map((r) => [r.id, r.createdAt / M]),
  [['b', 98]])

console.log('두 폰에서 따로 돌려도 같은 결과')
eq('입력 순서가 달라도 같다',
  placeBeforeOwn([...recs].reverse(), ids).map((r) => [r.id, r.createdAt]),
  ch.map((r) => [r.id, r.createdAt]))

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
