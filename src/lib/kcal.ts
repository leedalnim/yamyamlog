/**
 * 하루 권장 칼로리 계산.
 *
 * 두 단계로 나뉜다.
 *   RER (쉴 때 필요한 열량) = 70 × 몸무게^0.75
 *   MER (하루 필요 열량)     = RER × 활동 계수
 *
 * 예전에는 RER 을 그대로 "권장 칼로리"로 보여줬는데, 그건 하루 종일
 * 누워만 있을 때 쓰는 열량이라 실제 급여량보다 20% 적게 나왔다.
 * 화면 문구가 "중성화한 실내묘 기준"이므로 그에 맞는 계수를 곱한다.
 */

/** 활동 상태별 계수 (성묘 기준) */
export const ACTIVITY = {
  /** 중성화한 실내묘 — 지금 화면이 쓰는 기준 */
  neuteredIndoor: 1.2,
  /** 중성화 안 한 성묘 */
  intact: 1.4,
  /** 체중을 줄여야 할 때 */
  weightLoss: 0.8,
} as const

export type Activity = keyof typeof ACTIVITY

/** 쉴 때 필요한 열량 (RER) */
export function restingKcal(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75)
}

/** 하루 권장 칼로리 (MER). 몸무게가 이상하면 0 을 돌려준다. */
export function dailyKcal(weightKg: number, activity: Activity = 'neuteredIndoor'): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return 0
  return Math.round(restingKcal(weightKg) * ACTIVITY[activity])
}
