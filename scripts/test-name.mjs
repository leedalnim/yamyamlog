/**
 * 같은 제품 이름 맞추기 테스트.
 * 띄어쓰기·기호·대소문자가 달라도 같은 제품으로, 다른 제품은 다르게.
 */
import { nameKey, sameProduct } from '../dist-test/name.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const ok = got === want
  if (ok) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', got, '\n     기대:', want) }
}

console.log('같은 제품으로 본다')
eq('띄어쓰기 없음', sameProduct('조공오키로 레드', '조공 오키로 레드'), true)
eq('띄어쓰기 위치가 다름', sameProduct('조공 오키로레드', '조공오키로 레드'), true)
eq('띄어쓰기 여러 칸', sameProduct('조공   오키로  레드', '조공 오키로 레드'), true)
eq('앞뒤 공백', sameProduct('  조공 오키로 레드 ', '조공 오키로 레드'), true)
eq('기호 섞임', sameProduct('조공-오키로 레드!', '조공 오키로 레드'), true)
eq('영문 대소문자', sameProduct('시그니처 바이 A/a p/a', '시그니처바이 a/A P/A'), true)

console.log('다른 제품으로 본다')
eq('뒷글자가 다름', sameProduct('조공 오키로 레드', '조공 오키로 옐로우'), false)
eq('앞부분만 같음', sameProduct('조공 오키로', '조공 오키로 레드'), false)
eq('숫자가 다름', sameProduct('츄르 20개입', '츄르 40개입'), false)
eq('한 글자는 비교 안 함', sameProduct('a', 'A'), false)
eq('빈 이름은 비교 안 함', sameProduct('', ''), false)
eq('기호만 있으면 비교 안 함', sameProduct('!!', '!!'), false)

console.log('열쇠 모양')
eq('글자·숫자만 남긴다', nameKey('조공 오키로-레드 8g!'), '조공오키로레드8g')

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
