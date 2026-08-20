/**
 * 사진 경로 규칙 테스트.
 *
 * 두 기기가 같은 사진을 가리키려면 경로 계산이 양쪽에서 똑같아야 한다.
 * 여기가 어긋나면 사진이 조용히 안 넘어가므로(에러도 안 남) 못 알아챈다.
 */
import { photoIdFromPath, photoPath } from '../dist-test/photos.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', JSON.stringify(got), '\n     기대:', JSON.stringify(want)) }
}

console.log('사진 경로')
eq('집 id + 사진 id 로 경로를 만든다', photoPath('h-1', 'p-abc'), 'h-1/p-abc.jpg')
eq('경로에서 사진 id 를 되찾는다', photoIdFromPath('h-1/p-abc.jpg'), 'p-abc')
eq('왕복해도 그대로', photoIdFromPath(photoPath('h-xyz', 'p-churu-1')), 'p-churu-1')
eq('점이 들어간 id 도 확장자만 뗀다', photoIdFromPath('h-1/p.a.b.jpg'), 'p.a.b')
eq('폴더가 없으면 파일 이름만 본다', photoIdFromPath('p-abc.jpg'), 'p-abc')
eq('없으면 undefined', photoIdFromPath(null), undefined)
eq('빈 문자열도 undefined', photoIdFromPath(''), undefined)

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
