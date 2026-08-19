/** 초성 검색 규칙 테스트 */
import { matches, toChoseong, isChoseongQuery } from '../dist-test/hangul.js'
let pass=0, fail=0
const t = (name, got, want=true) => {
  if (got === want) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '→', got, '기대:', want) }
}
console.log('초성 추출')
t("'조공 그린 호키' → 'ㅈㄱ ㄱㄹ ㅎㅋ'", toChoseong('조공 그린 호키'), 'ㅈㄱ ㄱㄹ ㅎㅋ')
t("영문·숫자는 그대로", toChoseong('A/a p/a 30g'), 'A/a p/a 30g')

console.log('\n초성 검색어 판별')
t("'ㅈㄱ'는 초성 검색", isChoseongQuery('ㅈㄱ'))
t("'조공'은 초성 검색 아님", isChoseongQuery('조공'), false)
t("빈 문자열 아님", isChoseongQuery(''), false)

console.log('\n검색 매칭')
t("'ㅈㄱ' → 조공 그린 호키", matches('조공 그린 호키','ㅈㄱ'))
t("'ㅈㄱㄱㄹㅎㅋ' → 조공 그린 호키 (공백 무시)", matches('조공 그린 호키','ㅈㄱㄱㄹㅎㅋ'))
// 중간을 건너뛴 초성은 일부러 매칭하지 않는다.
// (카카오톡 등 흔한 초성 검색과 같은 규칙 — 건너뛰기를 허용하면
//  'ㅈㅋ' 같은 짧은 입력에 엉뚱한 항목이 우수수 잡힌다)
t("'ㅈㄱㅎㅋ'처럼 중간 건너뛴 건 매칭 안 함", matches('조공 그린 호키','ㅈㄱㅎㅋ'), false)
t("'ㅎㅋ' → 조공 그린 호키", matches('조공 그린 호키','ㅎㅋ'))
t("'ㅂㄹㅇ' → 보레알 치킨", matches('보레알 치킨','ㅂㄹㅇ'))
t("'ㅈㄱ' → 보레알 치킨 아님", matches('보레알 치킨','ㅈㄱ'), false)
t("일반 검색은 그대로 — '조공'", matches('조공 옐로우','조공'))
t("대소문자 무시 — 'a/A'", matches('시그니처 바이 A/a p/a','a/a'))
t("빈 검색어는 전부 통과", matches('아무거나',''))
t("'ㄷㄱㅅㅅ' → 닭가슴살", matches('닭가슴살','ㄷㄱㅅㅅ'))
console.log(`\n${fail===0?'✓':'✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail===0?0:1)
