// 네이버 쇼핑 결과 → 앱 기록 칸(이름·종류·원료·메모)으로 옮기기.
//
// 네트워크는 여기서 하지 않는다(src/lib/naver.ts). 글자만 다루므로 테스트한다.
//
// 쇼핑몰 상품명은 '[무료배송] <b>조공</b> 산양유 양갱 8g x 10개' 처럼 지저분하다.
// 꾸밈말을 덜어 내고, 이름에 적힌 낱말로 종류와 원료를 짐작한다.
// 짐작이 틀릴 수 있으므로 앱은 늘 채우기만 하고, 사용자가 고친 뒤 저장한다.

export interface ShopItem {
  title: string
  image: string
  brand: string
  maker: string
  category: string[]
  lprice: string
  link: string
}

export interface ShopDraft {
  name: string
  kind?: string
  base: string[]
  memo?: string
  image?: string
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** 상품명에서 꾸밈말을 덜어 낸다 */
export function cleanTitle(raw: string): string {
  let t = raw
    .replace(/<[^>]*>/g, '') // <b> 강조
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
        return Number.isFinite(n) ? String.fromCodePoint(n) : m
      }
      return ENTITIES[e.toLowerCase()] ?? m
    })
  // [무료배송] 【특가】 같은 머리말 덩어리
  t = t.replace(/\[[^\]]*\]|【[^】]*】/g, ' ')
  // 1+1, 무료배송, 당일발송 같은 판매 문구
  t = t.replace(/\d+\s*\+\s*\d+|무료\s*배송|당일\s*발송|당일\s*출고|정품|공식|특가|행사/g, ' ')
  return t.replace(/\s+/g, ' ').trim()
}

// 앞에 있는 규칙이 이긴다 — '동결건조 트릿'은 동결건조
const KIND_RULES: [string, RegExp][] = [
  ['동결건조', /동결\s*건조|프리즈\s*드라이|freeze\s*dr/i],
  ['양갱', /양갱/],
  ['츄르', /츄르|짜\s*먹는|퓨레|리퀴드/],
  ['파우치(습식)', /파우치|습식/],
  ['캔', /캔(?!디)|\bcan\b/i],
  ['트릿', /트릿|트리트|treat/i],
  ['주식', /주식/],
  ['건식', /건식|건사료|사료/],
]

/** 이름·분류에 적힌 낱말로 종류(형태)를 짐작한다. 모르면 undefined */
export function guessKind(text: string): string | undefined {
  for (const [k, re] of KIND_RULES) if (re.test(text)) return k
  return undefined
}

// 원료 — 앱의 원료 칩 이름으로 맞춘다. 칩에 없는 것(오리 등)도 그 이름으로 넣는다.
const BASE_RULES: [string, RegExp][] = [
  ['참치', /참치|튜나|tuna/i],
  ['닭가슴살', /닭|치킨|chicken/i],
  ['칠면조', /칠면조|터키|turkey/i],
  ['연어', /연어|salmon/i],
  ['게살', /게살|크랩|crab/i],
  ['새우', /새우|shrimp/i],
  ['가리비', /가리비|scallop/i],
  ['소고기', /소고기|쇠고기|비프|beef|한우/i],
  ['북어', /북어|황태/],
  ['명태', /명태/],
  ['정어리', /정어리|사딘|sardine/i],
  ['갈치', /갈치/],
  ['호키', /호키|hoki/i],
  ['산양유', /산양\s*유|산양\s*우유|goat\s*milk/i],
  ['오리', /오리(?!지)|duck/i],
  ['가다랑어', /가다랑어|가쓰오|가츠오|bonito/i],
  ['고등어', /고등어|mackerel/i],
  ['대구', /대구(?!시)|cod\b/i],
  ['양고기', /양고기|lamb/i],
]

/** 이름에 적힌 원료 (적힌 것만) */
export function guessBase(title: string): string[] {
  return BASE_RULES.filter(([, re]) => re.test(title)).map(([b]) => b)
}

/** 메모에 넣을 브랜드 한 줄 */
export function brandMemo(it: Pick<ShopItem, 'brand' | 'maker'>): string | undefined {
  const b = (it.brand || it.maker || '').trim()
  return b ? `브랜드: ${b}` : undefined
}

/** 쇼핑 결과 하나를 기록 칸으로 */
export function toDraft(it: ShopItem): ShopDraft {
  const name = cleanTitle(it.title)
  return {
    name,
    kind: guessKind(name) ?? guessKind(it.category.join(' ')),
    base: guessBase(name),
    memo: brandMemo(it),
    image: it.image || undefined,
  }
}

/**
 * 고양이 것을 앞으로. 강아지 전용(분류에 '강아지'만 있는 것)은 뺀다.
 * 사람 식품 등 반려동물이 아닌 것은 뒤로 미루기만 한다 — 분류가 비어 있는 상품도 있다.
 */
export function rankForCats(items: ShopItem[]): ShopItem[] {
  const score = (it: ShopItem) => {
    const c = it.category.join(' ') + ' ' + it.title
    if (/고양이|캣|cat/i.test(c)) return 0
    if (/반려|애완|펫/.test(c)) return 1
    return 2
  }
  return items
    .filter((it) => {
      const c = it.category.join(' ')
      return !(/강아지|애견|도그/.test(c) && !/고양이|캣/.test(c))
    })
    .map((it, i) => ({ it, i, s: score(it) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.it)
}
