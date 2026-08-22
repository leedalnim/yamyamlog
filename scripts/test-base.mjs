/**
 * 원료(베이스) 여러 개 다루기 테스트.
 *
 * 저장은 문자열 하나로 두고 쉼표로 이어 붙인다. 이미 저장된 기록('닭가슴살')이
 * 그대로 읽혀야 하고, 칩을 눌러 더하고 빼는 동안 값이 어긋나면 안 된다.
 */
import { joinBase, splitBase, toggleBase } from '../dist-test/base.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', JSON.stringify(got), '\n     기대:', JSON.stringify(want)) }
}

console.log('나누기')
eq('예전 기록 하나짜리도 그대로', splitBase('닭가슴살'), ['닭가슴살'])
eq('쉼표로 나뉜다', splitBase('칠면조, 연어'), ['칠면조', '연어'])
eq('공백만 있는 조각은 버린다', splitBase('칠면조, , 연어,'), ['칠면조', '연어'])
eq('같은 원료는 한 번만', splitBase('연어, 연어'), ['연어'])
eq('+ 는 구분자가 아니다', splitBase('참치+게살'), ['참치+게살'])
eq('빈 값은 빈 목록', splitBase(''), [])
eq('없는 값도 빈 목록', splitBase(undefined), [])

console.log('합치기')
eq('쉼표와 공백으로 이어 붙인다', joinBase(['칠면조', '연어']), '칠면조, 연어')
eq('빈 조각은 빠진다', joinBase(['칠면조', '', '연어']), '칠면조, 연어')
eq('아무것도 없으면 빈 문자열', joinBase([]), '')

console.log('칩 눌러 더하고 빼기')
eq('없던 것을 더한다', toggleBase('칠면조', '연어'), '칠면조, 연어')
eq('있던 것을 뺀다', toggleBase('칠면조, 연어', '칠면조'), '연어')
eq('하나뿐이던 걸 빼면 빈 값', toggleBase('연어', '연어'), '')
eq('빈 값에서 시작', toggleBase('', '칠면조'), '칠면조')
eq('없는 값에서 시작', toggleBase(undefined, '칠면조'), '칠면조')
eq('두 번 누르면 처음으로', toggleBase(toggleBase('칠면조', '연어'), '연어'), '칠면조')

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
