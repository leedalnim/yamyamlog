// 원료(베이스)는 여러 개일 수 있다 — 츄르 하나에 칠면조와 연어가 같이 들어간다.
//
// 저장은 예전처럼 문자열 하나로 두고, 쉼표로 구분한다. 그래야 이미 저장된
// 기록('닭가슴살')이 그대로 읽히고, 서버 열(column)도 손댈 필요가 없다.
// '참치+게살' 처럼 직접 적은 값은 하나로 본다 — 쉼표만 구분자다.

const SEP = ','

/** 저장된 문자열을 원료 목록으로 (빈 값·중복·공백 정리) */
export function splitBase(v?: string | null): string[] {
  if (!v) return []
  const out: string[] = []
  for (const part of v.split(SEP)) {
    const t = part.trim()
    if (t && !out.includes(t)) out.push(t)
  }
  return out
}

/** 원료 목록을 저장할 문자열로 */
export function joinBase(list: readonly string[]): string {
  return splitBase(list.join(SEP)).join(SEP + ' ')
}

/** 목록에 있으면 빼고, 없으면 더한 새 목록 */
export function toggleBase(v: string | undefined, item: string): string {
  const list = splitBase(v)
  const i = list.indexOf(item)
  if (i >= 0) list.splice(i, 1)
  else list.push(item)
  return joinBase(list)
}
