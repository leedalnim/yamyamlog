// 노션에서 옮겨 온 첫 기록들의 날짜 바로잡기.
//
// 노션 기록에는 실제 날짜가 없어서 앱이 날짜를 임의로 붙였다. 그런데 앱을
// 고치면서 이 기록들을 다시 넣을 때마다 '다시 넣은 그날'로 날짜가 새로
// 붙어서, 그 전에 사용자가 직접 넣은 기록보다 최신으로 보였다
// (홈 '최근 기록' 위쪽에 노션 기록이 끼어 있었다).
//
// 노션 기록은 앱을 쓰기 전의 것이므로 직접 넣은 가장 오래된 기록보다 앞에 둔다.
// 순서는 노션 목록 순서(앞쪽이 오래된 것), 1분 간격. 직접 넣은 기록의 날짜로
// 계산하므로 어느 폰에서 돌려도 결과가 같다. 이미 맞으면 아무것도 바꾸지 않는다.

export interface Dated {
  id: string
  createdAt: number
  deletedAt?: number
}

const GAP = 60 * 1000

/**
 * ids(노션 순서, 앞쪽이 오래된 것) 기록을 직접 넣은 가장 오래된 기록 바로 앞으로 옮긴다.
 * 바뀐 기록만 돌려준다. 직접 넣은 기록이 하나도 없으면 아무것도 안 한다.
 */
export function placeBeforeOwn<T extends Dated>(records: T[], ids: readonly string[]): T[] {
  const seed = new Set(ids)
  const own = records.filter((r) => !seed.has(r.id))
  if (own.length === 0) return []
  const earliest = Math.min(...own.map((r) => r.createdAt))
  const byId = new Map(records.filter((r) => !r.deletedAt).map((r) => [r.id, r]))
  const changed: T[] = []
  ids.forEach((id, i) => {
    const r = byId.get(id)
    if (!r) return
    const at = earliest - (ids.length - i) * GAP
    if (r.createdAt !== at) changed.push({ ...r, createdAt: at })
  })
  return changed
}
