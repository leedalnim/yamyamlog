// 노션에서 옮겨 온 첫 기록들의 날짜 순서 바로잡기.
//
// 처음 옮길 때 실제 날짜가 없어서 앱이 날짜를 임의로 붙였는데, 노션 목록의
// 맨 앞(가장 오래된) '조공 네덜란드 산양유 양갱'에 가장 최근 날짜가 붙었다.
// 그래서 홈 '최근 기록' 맨 위에 가장 오래된 산양유가 떴다.
//
// 이미 붙어 있는 날짜 값들은 그대로 쓰고, 순서만 노션 순서로 다시 나눠 준다
// (목록 앞쪽일수록 오래된 날짜). 날짜 값 묶음이 같으면 어느 폰에서 돌려도
// 결과가 같아서, 가족 폰끼리 맞출 때 어긋나지 않는다. 이미 맞는 순서면
// 아무것도 바꾸지 않는다.

export interface Dated {
  id: string
  createdAt: number
  deletedAt?: number
}

/**
 * ids 순서(앞쪽이 오래된 것)대로 createdAt 을 다시 나눈다.
 * 바뀐 기록만 돌려준다. 지운 기록·없는 기록은 건드리지 않는다.
 */
export function reorderDates<T extends Dated>(records: T[], ids: readonly string[]): T[] {
  const byId = new Map(records.filter((r) => !r.deletedAt).map((r) => [r.id, r]))
  const present = ids.map((id) => byId.get(id)).filter((r): r is T => !!r)
  const times = present.map((r) => r.createdAt).sort((a, b) => a - b)
  const changed: T[] = []
  present.forEach((r, i) => {
    if (r.createdAt !== times[i]) changed.push({ ...r, createdAt: times[i] })
  })
  return changed
}
