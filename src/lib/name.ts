// 같은 제품인지 이름으로 맞춰볼 때 쓰는 열쇠.
//
// 사람마다 띄어쓰기를 다르게 친다 — '조공오키로 레드' / '조공 오키로레드'.
// 글자와 숫자만 남기고 나머지(띄어쓰기·기호)는 버린 뒤 비교한다.
// 영문은 대소문자를 가리지 않는다.
//
// 비슷한 이름(한 글자 다름, 앞부분만 같음)은 같은 제품으로 보지 않는다.
// '조공 오키로 레드' 와 '조공 오키로 옐로우' 는 다른 제품이다.

export function nameKey(name: string): string {
  return name.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

/** 같은 제품으로 볼 만큼 이름이 같은가 (두 글자 미만은 비교하지 않는다) */
export function sameProduct(a: string, b: string): boolean {
  const ka = nameKey(a)
  return ka.length >= 2 && ka === nameKey(b)
}
