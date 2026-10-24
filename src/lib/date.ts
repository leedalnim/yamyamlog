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

/** 늘 연도까지 — '2026.9.05'. 통계 기록처럼 해를 넘겨 쌓이는 목록용 */
export function fullDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 빌드 시각을 이 기기 시간으로 — '2026-10-24 13:36'(UTC) → '2026-10-24 22:36'(한국).
 * 빌드 ID 는 UTC 로 찍히는데 그대로 보여주면 한국에서 9시간 이르게 보여
 * '새 버전이 맞나?' 헷갈렸다. 모르는 형식이면 그대로 돌려준다.
 */
export function localBuildTime(id: string): string {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(id)) return id
  const d = new Date(id.replace(' ', 'T') + ':00Z')
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 상세용, 늘 연도까지 — '2026년 8월 22일' */
export function fullLongDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 상세용 — 올해면 '8월 22일', 아니면 '2025년 8월 22일' */
export function longDate(ts: number, now: Date = new Date()): string {
  const d = new Date(ts)
  const md = `${d.getMonth() + 1}월 ${d.getDate()}일`
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}년 ${md}`
}
