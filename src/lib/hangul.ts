/**
 * 한글 검색 도우미.
 *
 * "ㅈㄱㅎㅋ"로 "조공 그린 호키"를 찾을 수 있게 한다.
 * 검색어가 초성만으로 이루어졌을 때만 초성 비교를 쓰고, 그 외에는
 * 평범한 부분 문자열 검색을 한다 — "조공"을 쳤는데 초성 규칙이
 * 끼어들어 엉뚱한 게 잡히는 일을 막기 위해서다.
 */

/** 유니코드 한글 음절의 초성 19자 (조합 순서 그대로) */
const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

const SYL_START = 0xac00 // '가'
const SYL_END = 0xd7a3 // '힣'

/** 문자열에서 한글은 초성으로, 나머지는 그대로 둔 형태를 만든다 */
export function toChoseong(text: string): string {
  let out = ''
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code >= SYL_START && code <= SYL_END) {
      out += CHOSEONG[Math.floor((code - SYL_START) / 588)]
    } else {
      out += ch
    }
  }
  return out
}

/** 검색어가 초성(+공백)만으로 이루어졌는가 */
export function isChoseongQuery(q: string): boolean {
  const t = q.replace(/\s/g, '')
  return t.length > 0 && [...t].every((ch) => CHOSEONG.includes(ch))
}

/**
 * 검색어가 대상 문자열에 맞는지.
 * 초성 검색어면 초성끼리, 아니면 소문자 부분 문자열로 비교한다.
 * 공백은 양쪽에서 무시해 "ㅈㄱㅎㅋ"가 "조공 그린 호키"에 맞도록 한다.
 */
export function matches(target: string, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  if (isChoseongQuery(q)) {
    return toChoseong(target).replace(/\s/g, '').includes(q.replace(/\s/g, ''))
  }
  return target.toLowerCase().includes(q.toLowerCase())
}
