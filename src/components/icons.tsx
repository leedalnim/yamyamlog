// 얌로그 라인 아이콘 세트 (이모지 대신 사용)
// 24x24 뷰박스, stroke=currentColor 기반의 선 아이콘.

import type { ReactNode } from 'react'
import type { ReactionLevel } from '../data/types'

type P = { size?: number; className?: string; strokeWidth?: number }

function svg(children: ReactNode, { size = 24, className, strokeWidth = 1.8 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconHome = (p: P) =>
  svg(
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>,
    p,
  )

export const IconPlus = (p: P) =>
  svg(
    <>
      <path d="M12 5v14M5 12h14" />
    </>,
    { ...p, strokeWidth: p.strokeWidth ?? 2 },
  )

export const IconChart = (p: P) =>
  svg(
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />
    </>,
    p,
  )

export const IconSettings = (p: P) =>
  svg(
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2.4" />
      <circle cx="8" cy="17" r="2.4" />
    </>,
    p,
  )

// 꽉 찬(fill) 발바닥 — 메인 패드 + 발가락 4개
export const IconPaw = ({ size = 24, className }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 13c2.9 0 5.4 1.9 5.4 4.3 0 1.9-1.5 3-3.4 3-1 0-1.5-.35-2-.35s-1 .35-2 .35c-1.9 0-3.4-1.1-3.4-3C6.6 14.9 9.1 13 12 13Z" />
    <ellipse cx="5.7" cy="10.7" rx="2.05" ry="2.55" transform="rotate(-14 5.7 10.7)" />
    <ellipse cx="9.6" cy="7.7" rx="2.1" ry="2.75" transform="rotate(-6 9.6 7.7)" />
    <ellipse cx="14.4" cy="7.7" rx="2.1" ry="2.75" transform="rotate(6 14.4 7.7)" />
    <ellipse cx="18.3" cy="10.7" rx="2.05" ry="2.55" transform="rotate(14 18.3 10.7)" />
  </svg>
)

export const IconTrophy = (p: P) =>
  svg(
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 13v4M9 21h6M10 21v-1.5a2 2 0 0 1 4 0V21" />
    </>,
    p,
  )

export const IconTag = (p: P) =>
  svg(
    <>
      <path d="M3.5 12.5 11 5a2 2 0 0 1 1.4-.6H19a1 1 0 0 1 1 1v6.6a2 2 0 0 1-.6 1.4l-7.5 7.5a1.5 1.5 0 0 1-2.1 0l-6.3-6.3a1.5 1.5 0 0 1 0-2.1Z" />
      <circle cx="15.5" cy="8.5" r="1.3" />
    </>,
    p,
  )

export const IconCamera = (p: P) =>
  svg(
    <>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18Z" />
      <circle cx="12" cy="13" r="3.4" />
    </>,
    p,
  )

export const IconScan = (p: P) =>
  svg(
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M7.5 12h9" />
    </>,
    p,
  )

export const IconTrash = (p: P) =>
  svg(
    <>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M10 11v6M14 11v6" />
    </>,
    p,
  )

export const IconCheck = (p: P) =>
  svg(<path d="M5 12.5 10 17 19 7" />, { ...p, strokeWidth: p.strokeWidth ?? 2.2 })

export const IconChevronDown = (p: P) =>
  svg(<path d="M6 9.5 12 15.5 18 9.5" />, { ...p, strokeWidth: p.strokeWidth ?? 2 })

export const IconBowl = (p: P) =>
  svg(
    <>
      <path d="M3 11h18a9 9 0 0 1-9 9 9 9 0 0 1-9-9Z" />
      <path d="M7.5 11c0-3 1.8-5 4.5-5s4.5 2 4.5 5" />
      <path d="M12 3v2" />
    </>,
    p,
  )

// 반응 3단계 — 통통한 컬러 블롭 고양이 얼굴 (fill + 표정)
// 몸통색은 CSS 변수(--good/--ok/--bad), 표정은 진한 잉크색
// 동그랗고 납작한(옆으로 퍼진) 고양이 얼굴 + 작은 세모 귀
const BLOB_HEAD =
  'M2.5 13.5c0-2.8 1.1-5.2 2.9-6.9L4.9 3.6c-.12-.68.62-1.15 1.2-.78L8.6 4.7A10.9 10.9 0 0 1 12 4.15c1.2 0 2.34.19 3.4.55l2.5-1.88c.58-.37 1.32.1 1.2.78l-.5 3c1.8 1.7 2.9 4.1 2.9 6.9 0 4.7-4.2 7.8-9.5 7.8s-9.5-3.1-9.5-7.8Z'

/** 이목구비 색 (목업 기준 진한 웜브라운) */
const FACE_INK = '#57493B'

/** 표정 (기호성 구분 — 목업 캐릭터 그대로) */
const FACES: Record<string, ReactNode> = {
  // 잘먹음: ∪∪ 눈 + 활짝 벌린 입(혀)
  good: (
    <g>
      <g fill="none" stroke={FACE_INK} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.4 11.4q1.4-1.6 2.8 0M13.8 11.4q1.4-1.6 2.8 0" />
      </g>
      <path
        d="M9.3 13.9h5.4c-.3 2.5-1.3 3.9-2.7 3.9s-2.4-1.4-2.7-3.9Z"
        fill={FACE_INK}
      />
      <path d="M10.7 16.6q1.3 1.15 2.6 0c-.3.8-.75 1.2-1.3 1.2s-1-.4-1.3-1.2Z" fill="#F2999E" />
    </g>
  ),
  // 보통: 점 눈 + 짧은 무표정 입
  ok: (
    <g fill="none" stroke={FACE_INK} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.9 11.2v1.3M15.1 11.2v1.3" />
      <path d="M10.9 15.3h2.2" />
    </g>
  ),
  // 안먹음: >< 눈 + 시무룩 입
  bad: (
    <g fill="none" stroke={FACE_INK} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.6 10.8l2 1.05-2 1.05M16.4 10.8l-2 1.05 2 1.05" />
      <path d="M10 15.8q2-1.4 4 0" />
    </g>
  ),
  // 기본: 점 눈 + 살짝 미소 (고양이 프로필용)
  neutral: (
    <g fill="none" stroke={FACE_INK} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.9 11.2v1.3M15.1 11.2v1.3" />
      <path d="M10.4 14.9q1.6 1.3 3.2 0" />
    </g>
  ),
}

/** 블롭 고양이 얼굴 — 목업 캐릭터 스타일, 표정으로 기호성 구분 */
export function BlobFace({
  color,
  level = 'neutral',
  size = 24,
  className,
}: {
  color: string
  level?: ReactionLevel | 'neutral'
  size?: number
  className?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={BLOB_HEAD} fill={color} />
      {FACES[level]}
    </svg>
  )
}

/** 홈 배너용 장면 — 반짝이 + 밥그릇 앞의 신난 고양이 (목업 배너) */
export function BannerCat({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.78} viewBox="0 0 96 75" aria-hidden="true">
      {/* 반짝이 */}
      <g fill="#F2B33D">
        <path d="M12 8l1.5 4.2L18 13.7l-4.5 1.5L12 19.4l-1.5-4.2L6 13.7l4.5-1.5Z" />
        <path d="M83 4l1.1 3.1 3.3 1.1-3.3 1.1L83 12.4l-1.1-3.1-3.3-1.1 3.3-1.1Z" />
        <path d="M88 28l.9 2.5 2.7.9-2.7.9-.9 2.5-.9-2.5-2.7-.9 2.7-.9Z" />
      </g>
      {/* 고양이 (잘먹음 얼굴) */}
      <g transform="translate(22 2) scale(2.35)">
        <path d={BLOB_HEAD} fill="#F3E3CC" />
        <g fill="none" stroke="#57493B" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.4 11.4q1.4-1.6 2.8 0M13.8 11.4q1.4-1.6 2.8 0" />
        </g>
        <path d="M9.3 13.9h5.4c-.3 2.5-1.3 3.9-2.7 3.9s-2.4-1.4-2.7-3.9Z" fill="#57493B" />
        <path d="M10.7 16.6q1.3 1.15 2.6 0c-.3.8-.75 1.2-1.3 1.2s-1-.4-1.3-1.2Z" fill="#F2999E" />
      </g>
      {/* 밥그릇 */}
      <g>
        <ellipse cx="24" cy="63" rx="17" ry="5.5" fill="#F3E3CC" />
        <path d="M8 63h32c0 7-7 11.5-16 11.5S8 70 8 63Z" fill="#E1873F" />
        <path d="M10.5 66.5h27c-1.6 4.4-6.3 7-13.5 7s-11.9-2.6-13.5-7Z" fill="#C96F2E" opacity=".35" />
      </g>
    </svg>
  )
}

export const IconFaceGood = (p: P) => <BlobFace color="var(--good)" level="good" size={p.size} />
export const IconFaceOk = (p: P) => <BlobFace color="var(--ok)" level="ok" size={p.size} />
export const IconFaceBad = (p: P) => <BlobFace color="var(--bad)" level="bad" size={p.size} />

// 손그림 느낌의 라인 고양이 일러스트 (앉아있는 고양이)
export const CatDoodle = ({ size = 120, className }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    stroke="currentColor"
    strokeWidth={3.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* 몸통 */}
    <path d="M38 112c-8 0-13-6-13-16 0-9 4-18 11-24" />
    <path d="M90 112c8 0 13-6 13-16 0-9-4-18-11-24" />
    <path d="M38 112h52" />
    {/* 머리 + 귀 */}
    <path d="M40 52c-3-5-4-11-3-18 0-1 1-2 3-1l11 8" />
    <path d="M88 52c3-5 4-11 3-18 0-1-1-2-3-1l-11 8" />
    <path d="M51 41c3.5-2 8-3.2 13-3.2s9.5 1.2 13 3.2" />
    <path d="M40 52c0 15 11 25 24 25s24-10 24-25" />
    {/* 눈 */}
    <path d="M54 54v3.5" />
    <path d="M74 54v3.5" />
    {/* 코 + 입 */}
    <path d="M62.5 62l1.5 1.6 1.5-1.6" />
    <path d="M64 63.6v3" />
    {/* 수염 */}
    <path d="M50 60l-9-2M50 64l-9 2M78 60l9-2M78 64l9 2" />
    {/* 꼬리 */}
    <path d="M90 108c14 3 22-6 18-18-2-6-8-8-11-4" />
    {/* 앞발 */}
    <path d="M56 112v-8M72 112v-8" />
  </svg>
)

/** 고양이 얼굴 공통 크림색 — 표정만으로 반응을 구분 (목업 기준) */
export const CAT_CREAM = '#F3E3CC'
/** 기록 없는 상태의 흐린 얼굴색 */
export const CAT_CREAM_EMPTY = '#F2ECE2'

/** 반응 아이콘 — 크림색 얼굴 + 표정으로 구분. color로 재정의 가능 */
export const ReactionIcon = ({
  level,
  size,
  color,
}: {
  level: ReactionLevel
  size?: number
  color?: string
}) => <BlobFace color={color ?? CAT_CREAM} level={level} size={size} />
