/**
 * 이름으로 종류·원료 짐작하기 + 시중 제품 목록 찾기 테스트.
 */
import { guessKind, guessBase } from '../dist-test/guess.js'
import { searchCatalog } from '../dist-test/catalog.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', g, '\n     기대:', w) }
}

console.log('종류 짐작')
eq('동결건조가 트릿보다 앞', guessKind('조공 동결건조 트릿 참치'), '동결건조')
eq('양갱', guessKind('네덜란드 산양유 양갱'), '양갱')
eq('츄르', guessKind('이나바 챠오 츄르 참치'), '츄르')
eq('짜먹는', guessKind('짜먹는 간식 연어'), '츄르')
eq('파우치', guessKind('하우스앤가토스 파우치 치킨'), '파우치(습식)')
eq('캔', guessKind('로투스 정어리 캔 85g'), '캔')
eq('캔디는 캔 아님', guessKind('고양이 캔디'), undefined)
eq('트릿', guessKind('보레알 트릿'), '트릿')
eq('사료 → 건식', guessKind('로얄캐닌 인도어 사료'), '건식')
eq('모르면 비움', guessKind('조공 오키로 레드'), undefined)

console.log('원료 짐작')
eq('하나', guessBase('조공 산양유 양갱'), ['산양유'])
eq('여럿', guessBase('참치 & 연어 츄르'), ['참치', '연어'])
eq('치킨 → 닭가슴살', guessBase('보레알 치킨'), ['닭가슴살'])
eq('황태 → 북어', guessBase('황태 트릿'), ['북어'])
eq('오리지널은 오리 아님', guessBase('오리지널 츄르'), [])
eq('오리', guessBase('오리 안심 져키'), ['오리'])
eq('영문', guessBase('Tuna & Salmon'), ['참치', '연어'])
eq('없으면 빈 목록', guessBase('조공 오키로 레드'), [])

console.log('시중 제품 찾기')
const C = [
  { name: '조공 오키로스틱 퍼플', brand: '조공', kind: '츄르', base: ['닭가슴살'] },
  { name: '조공 오키로스틱 레드', brand: '조공', kind: '츄르', base: ['소고기'] },
  { name: '이나바 챠오츄르 참치', brand: '이나바', kind: '츄르', base: ['참치'] },
  { name: '테비 토퍼 조공맛', brand: '테비', kind: '트릿', base: [] },
]
const names = (r) => r.map((x) => x.name)
eq('낱말 순서 상관없이', names(searchCatalog(C, '퍼플 조공')), ['조공 오키로스틱 퍼플'])
eq('띄어쓰기 무시', names(searchCatalog(C, '오키로 스틱')), ['조공 오키로스틱 퍼플', '조공 오키로스틱 레드'])
eq('브랜드 빼고 쳐도', names(searchCatalog(C, '챠오츄르')), ['이나바 챠오츄르 참치'])
eq('이름이 친 글자로 시작하는 게 앞', names(searchCatalog(C, '조공')), ['조공 오키로스틱 퍼플', '조공 오키로스틱 레드', '테비 토퍼 조공맛'])
eq('한 글자는 찾지 않음', names(searchCatalog(C, '조')), [])
eq('내 기록에 있는 건 뺀다', names(searchCatalog(C, '오키로', 5, new Set(['조공오키로스틱레드']))), ['조공 오키로스틱 퍼플'])
eq('개수 제한', searchCatalog(C, '조공', 2).length, 2)

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
