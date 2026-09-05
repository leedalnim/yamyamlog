// 기록 날짜 표기.
//
// 해가 바뀌면 '9.05' 만으로는 올해 건지 작년 건지 알 수 없다. 그렇다고
// 모든 줄에 연도를 붙이면 대부분을 차지하는 올해 기록까지 길어진다.
// 올해가 아닐 때만 연도를 붙인다 — 짧게 두면서 헷갈릴 일은 없앤다.

/** 목록용 — 올해면 '9.05', 아니면 '2025.9.05' */
export function shortDate(ts: number, now: Date = new Date()): string {
  const d = new Date(ts)
  const md = `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}.${md}`
}

/** 상세용 — 올해면 '8월 22일', 아니면 '2025년 8월 22일' */
export function longDate(ts: number, now: Date = new Date()): string {
  const d = new Date(ts)
  const md = `${d.getMonth() + 1}월 ${d.getDate()}일`
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}년 ${md}`
}
