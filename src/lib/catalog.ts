// 시중 제품 목록에서 찾기.
//
// 목록 자체는 src/data/catalog-data.ts (웹에서 조사해 정리한 것).
// 친 낱말이 모두 들어 있으면 맞는 것으로 본다 — '조공 오키로' 는
// '조공 오키로스틱 퍼플' 과 맞는다. 띄어쓰기·기호는 무시한다.

import { nameKey } from './name'

export interface CatalogItem {
  name: string
  brand: string
  kind: string
  base: string[]
}

/** 친 글자를 낱말로 나눈다 (두 글자 미만이면 찾지 않는다) */
function words(q: string): string[] {
  return q.split(/\s+/).map(nameKey).filter(Boolean)
}

/**
 * 친 글자에 맞는 제품. 이름이 친 글자로 시작하는 것을 앞으로.
 * 이미 내 기록에 있는 이름(skipKeys)은 뺀다 — 내 기록 칸에 이미 보인다.
 */
export function searchCatalog(
  items: readonly CatalogItem[],
  q: string,
  limit = 5,
  skipKeys: ReadonlySet<string> = new Set(),
): CatalogItem[] {
  const ws = words(q)
  if (nameKey(q).length < 2) return []
  const key = nameKey(q)
  const hits: { it: CatalogItem; score: number }[] = []
  for (const it of items) {
    const k = nameKey(it.name)
    if (skipKeys.has(k)) continue
    // 브랜드를 빼고 쳐도 찾게 — '오키로' 만 쳐도 조공 제품이 나온다
    const hay = k + nameKey(it.brand)
    if (!ws.every((w) => hay.includes(w))) continue
    hits.push({ it, score: k.startsWith(key) ? 0 : 1 })
  }
  hits.sort((a, b) => a.score - b.score || a.it.name.length - b.it.name.length)
  return hits.slice(0, limit).map((h) => h.it)
}
