// 나이는 손으로 적어 두면 반드시 틀린다 — 해가 바뀌어도 그대로 남기 때문이다.
// 생년월일을 받아 두고 볼 때마다 계산한다.
//
// 정확한 날짜를 모르는 아이가 많다(구조·입양). 그래서 '대충 이맘때'로 적어도
// 되게 두고, 화면에서도 그렇게 안내한다. 한 달 어긋나는 것보다 해마다
// 틀린 나이가 남는 게 나쁘다.

export interface Age {
  years: number
  months: number
  /** 목록용 짧은 표기 — '5살' / '7개월' */
  short: string
  /** 상세용 — '5살 3개월' / '7개월' */
  long: string
}

/** 'YYYY-MM-DD' 를 그 날 0시로. Date.parse 는 시간대에 따라 하루씩 밀린다 */
function parseDay(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const [y, mo, d] = [+m[1], +m[2], +m[3]]
  const dt = new Date(y, mo - 1, d)
  // 2월 30일 같은 값은 다른 날로 굴러가므로 되돌려 확인한다
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return dt
}

export function ageFrom(birthday?: string | null, now: Date = new Date()): Age | null {
  if (!birthday) return null
  const b = parseDay(birthday)
  if (!b) return null
  if (b.getTime() > now.getTime()) return null // 아직 안 태어남

  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth())
  if (now.getDate() < b.getDate()) months -= 1 // 이번 달 생일이 아직 안 지났다
  if (months < 0) months = 0

  const years = Math.floor(months / 12)
  const rest = months % 12
  const short = years >= 1 ? `${years}살` : `${months}개월`
  const long = years >= 1 ? (rest ? `${years}살 ${rest}개월` : `${years}살`) : `${months}개월`
  return { years, months, short, long }
}

/**
 * 화면에 보여줄 나이.
 * 생년월일이 있으면 그걸로 계산하고, 없으면 예전처럼 적어 둔 나이를 쓴다.
 * (생년월일을 넣기 전에 만든 아이들이 있다)
 */
export function displayAge(
  cat: { birthday?: string; ageYears?: number },
  now: Date = new Date(),
): string | null {
  const a = ageFrom(cat.birthday, now)
  if (a) return a.short
  if (cat.ageYears != null) return `${cat.ageYears}살`
  return null
}

/**
 * 'N살' 만 아는 경우 생년월일 칸에 채워 줄 어림값.
 * 이번 달 1일로 잡는다 — 그래야 계산한 나이가 적어 둔 나이와 같게 나온다.
 * (1월 1일로 잡으면 5살이 '5살 7개월' 로 늘어나 있어 이상해 보인다)
 */
export function guessBirthday(ageYears: number, now: Date = new Date()): string {
  const y = now.getFullYear() - Math.floor(ageYears)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}
