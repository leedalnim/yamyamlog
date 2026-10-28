// 종류(형태) 분류 — 2026-10 정리
//
// 예전 종류 8개(츄르·캔·파우치(습식)·건식·트릿·양갱·동결건조·주식)를
// 6개로 줄였다:
//   건식  — 건사료 (알갱이 사료)
//   습식  — 끼니로 먹이는 주식캔·주식파우치
//   간식  — 간식캔·간식파우치·스프·토퍼 등 촉촉한 간식
//   트릿  — 동결건조·져키처럼 씹는 과자류
//   츄르  — 짜 먹는 츄르 (양갱도 여기)
//   기타
//
// 예전 값은 toNewKind 로 옮긴다. 캔·파우치는 이름을 보고 주식이면 습식,
// 아니면 간식. 사용자가 직접 적은 종류(예: 수프)는 건드리지 않는다.

export const KINDS = ['건식', '습식', '간식', '트릿', '츄르', '기타'] as const

/** 끼니로 먹이는 습식(주식) 브랜드 — 간식캔을 거의 안 내는 곳 */
const MEAL_BRANDS = /아카나|오리젠|웰니스|인스팅트|지위픽|로얄\s*캐닌|팬시\s*피스트|위스카스|보레알|로투스|K9|쉬바|내추럴\s*발란스|힐스|퓨리나|프로\s*플랜|하우스앤가토스|필로\s*캣|더리얼\s*밀/i
/** 이름에 이런 말이 있으면 주식 */
const MEAL_WORDS = /주식|청크|파테|그레이비|피스트|스테럴|인스팅티브|키튼|어덜트|시니어|완전\s*식/
/** 주식인데 건사료인 것 */
const DRY_WORDS = /건식|건사료|사료|크런치|에어\s*드라이|kibble/i

/** 캔·파우치·주식이 끼니(습식 주식)인지 */
export function isMeal(name: string): boolean {
  return MEAL_BRANDS.test(name) || MEAL_WORDS.test(name)
}

/** 예전 종류 → 새 종류. 이미 새 종류거나 직접 적은 종류면 그대로 */
export function toNewKind(kind: string | undefined, name = ''): string | undefined {
  if (!kind) return kind
  switch (kind) {
    case '츄르':
    case '양갱':
      return '츄르'
    case '트릿':
    case '동결건조':
      return '트릿'
    case '건식':
      return '건식'
    case '주식':
      return DRY_WORDS.test(name) ? '건식' : '습식'
    case '캔':
    case '파우치(습식)':
    case '파우치':
      return isMeal(name) ? '습식' : '간식'
    default:
      return kind
  }
}
