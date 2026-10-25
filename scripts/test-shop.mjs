/**
 * 네이버 쇼핑 결과 → 기록 칸 테스트.
 * 상품명 꾸밈말 덜기, 종류·원료 짐작, 고양이 것 먼저.
 */
import { cleanTitle, guessKind, guessBase, toDraft, rankForCats, brandMemo } from '../dist-test/shop.js'

let pass = 0, fail = 0
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want)
  if (g === w) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, '\n     받음:', g, '\n     기대:', w) }
}

console.log('상품명 정리')
eq('강조 태그', cleanTitle('<b>조공</b> 산양유 양갱'), '조공 산양유 양갱')
eq('대괄호 머리말', cleanTitle('[무료배송] 조공 오키로 레드'), '조공 오키로 레드')
eq('겹낫표 머리말', cleanTitle('【특가】 이나바 츄르'), '이나바 츄르')
eq('1+1 · 무료배송', cleanTitle('챠오 츄르 1+1 무료배송 참치'), '챠오 츄르 참치')
eq('HTML 문자', cleanTitle('A&amp;B 트릿 &lt;연어&gt;'), 'A&B 트릿 <연어>')
eq('숫자 문자', cleanTitle('조공&#39;s 양갱'), "조공's 양갱")
eq('공백 정리', cleanTitle('  조공   양갱  '), '조공 양갱')
eq('용량·개수는 남긴다', cleanTitle('조공 양갱 8g x 10개'), '조공 양갱 8g x 10개')

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

console.log('브랜드 메모')
eq('브랜드', brandMemo({ brand: '조공', maker: '' }), '브랜드: 조공')
eq('브랜드 없으면 제조사', brandMemo({ brand: '', maker: '이나바' }), '브랜드: 이나바')
eq('둘 다 없으면 비움', brandMemo({ brand: '', maker: '' }), undefined)

console.log('결과 하나 → 기록 칸')
const it = {
  title: '[무료배송] <b>조공</b> 네덜란드 <b>산양</b>유 양갱 8g',
  image: 'https://shopping-phinf.pstatic.net/a.jpg',
  brand: '조공', maker: '', category: ['생활/건강', '반려동물', '고양이 간식', '캔/파우치'],
  lprice: '1200', link: '',
}
eq('전체', toDraft(it), {
  name: '조공 네덜란드 산양유 양갱 8g', kind: '양갱', base: ['산양유'],
  memo: '브랜드: 조공', image: 'https://shopping-phinf.pstatic.net/a.jpg',
})
eq('이름에 없으면 분류로 종류', toDraft({ ...it, title: '조공 오키로 레드' }).kind, '파우치(습식)')

console.log('고양이 것 먼저')
const mk = (title, category) => ({ title, image: '', brand: '', maker: '', category, lprice: '', link: '' })
const ranked = rankForCats([
  mk('사람용 산양유', ['식품', '우유']),
  mk('강아지 산양유', ['생활/건강', '반려동물', '강아지 간식']),
  mk('반려 산양유', ['생활/건강', '반려동물']),
  mk('고양이 산양유', ['생활/건강', '반려동물', '고양이 간식']),
])
eq('순서 · 강아지 전용 빠짐', ranked.map((x) => x.title), ['고양이 산양유', '반려 산양유', '사람용 산양유'])

console.log(`\n${fail === 0 ? '✓' : '✗'} 통과 ${pass} / 실패 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
