/**
 * 병합 규칙 테스트 — 네트워크 없이 순수 로직만 검증한다.
 * 동기화에서 가장 위험한 건 "지운 게 되살아남", "고친 게 덮어써짐"이라
 * 그 두 가지를 중심으로 확인한다.
 */
import { mergeLists, pickWinner } from '../dist-test/merge.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', JSON.stringify(got), '\n     기대:', JSON.stringify(want)) }
}

console.log('승자 고르기')
eq('나중에 고친 쪽이 이긴다', pickWinner({id:'a',updatedAt:2},{id:'a',updatedAt:1})?.updatedAt, 2)
eq('원격이 더 최신이면 원격', pickWinner({id:'a',updatedAt:1},{id:'a',updatedAt:5})?.updatedAt, 5)
eq('한쪽에만 있으면 그것', pickWinner(undefined,{id:'a',updatedAt:1})?.id, 'a')
eq('같은 시각이면 삭제가 이긴다', !!pickWinner({id:'a',updatedAt:3,deletedAt:3},{id:'a',updatedAt:3})?.deletedAt, true)

console.log('\n목록 맞추기')
{
  const r = mergeLists([{id:'1',updatedAt:1}], [])
  eq('로컬에만 있으면 올린다', [r.toRemote.length, r.toLocal.length], [1,0])
}
{
  const r = mergeLists([], [{id:'1',updatedAt:1}])
  eq('원격에만 있으면 받는다', [r.toLocal.length, r.toRemote.length], [1,0])
}
{
  const r = mergeLists([{id:'1',updatedAt:5}], [{id:'1',updatedAt:5}])
  eq('같으면 아무것도 안 한다', [r.toLocal.length, r.toRemote.length], [0,0])
}
{
  // 핵심: 한쪽에서 지운 기록이 되살아나면 안 된다
  const r = mergeLists([{id:'1',updatedAt:9,deletedAt:9}], [{id:'1',updatedAt:3}])
  eq('지운 기록은 되살아나지 않는다', [r.toRemote.length, !!r.toRemote[0]?.deletedAt], [1,true])
}
{
  // 반대 방향: 원격에서 지웠으면 로컬도 지워져야 한다
  const r = mergeLists([{id:'1',updatedAt:3}], [{id:'1',updatedAt:9,deletedAt:9}])
  eq('원격 삭제가 로컬에 내려온다', [r.toLocal.length, !!r.toLocal[0]?.deletedAt], [1,true])
}
{
  // 지운 뒤 다시 고쳤으면 부활이 맞다
  const r = mergeLists([{id:'1',updatedAt:12}], [{id:'1',updatedAt:9,deletedAt:9}])
  eq('지운 뒤 더 나중에 고쳤으면 살아난다', [r.toRemote.length, !!r.toRemote[0]?.deletedAt], [1,false])
}
{
  const r = mergeLists(
    [{id:'1',updatedAt:5},{id:'2',updatedAt:1}],
    [{id:'2',updatedAt:9},{id:'3',updatedAt:1}],
  )
  eq('섞여 있어도 양방향으로 정리된다',
    [r.toLocal.map(x=>x.id).sort(), r.toRemote.map(x=>x.id).sort()],
    [['2','3'], ['1']])
}

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
