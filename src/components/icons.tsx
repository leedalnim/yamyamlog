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

// 목업 'olo' 스타일 — 둥근 막대 3개
export const IconChart = ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <rect x="4" y="10" width="4" height="10" rx="2" />
    <rect x="10" y="4" width="4" height="16" rx="2" />
    <rect x="16" y="13" width="4" height="7" rx="2" />
  </svg>
)

// 목업 아이콘 세트의 고양이 얼굴 라인 아이콘 (냥이들 탭)
export const IconCatFace = (p: P) =>
  svg(
    <>
      <path d="M4.5 13.2c0-1.9.6-3.6 1.7-4.9l-.5-3.6c-.1-.8.8-1.3 1.4-.8l2.6 2a9 9 0 0 1 4.6 0l2.6-2c.6-.5 1.5 0 1.4.8l-.5 3.6a7.6 7.6 0 0 1 1.7 4.9c0 3.9-3.4 6.3-7.5 6.3s-7.5-2.4-7.5-6.3Z" />
      <path d="M9.3 12.5v1M14.7 12.5v1" />
    </>,
    p,
  )

export const IconSettings = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
    </>,
    p,
  )

export const IconBell = (p: P) =>
  svg(
    <>
      <path d="M6 16v-5.5a6 6 0 0 1 12 0V16l1.5 2.2H4.5Z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
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

export const IconHeart = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 20.5c-.35 0-.7-.12-.98-.35C7.2 17.05 3 13.6 3 9.6 3 6.6 5.3 4.5 8 4.5c1.6 0 3.1.8 4 2.05C12.9 5.3 14.4 4.5 16 4.5c2.7 0 5 2.1 5 5.1 0 4-4.2 7.45-8.02 10.55-.28.23-.63.35-.98.35Z" />
  </svg>
)

export const IconPencil = (p: P) =>
  svg(
    <>
      <path d="M4 20l.9-3.6L15.6 5.7a1.6 1.6 0 0 1 2.26 0l.44.44a1.6 1.6 0 0 1 0 2.26L7.6 19.1 4 20Z" />
      <path d="M14.2 7.1l2.7 2.7" />
    </>,
    p,
  )

export const IconChevronLeft = (p: P) =>
  svg(<path d="M14.5 6 8.5 12l6 6" />, { ...p, strokeWidth: p.strokeWidth ?? 2 })

export const IconChevronRight = (p: P) =>
  svg(<path d="M9.5 6l6 6-6 6" />, { ...p, strokeWidth: p.strokeWidth ?? 2 })

export const IconSliders = (p: P) =>
  svg(
    <>
      <path d="M5 7h8M17 7h2M5 17h2M11 17h8" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </>,
    p,
  )

export const IconDots = ({ size = 20, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <circle cx="12" cy="5.5" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="12" cy="18.5" r="1.7" />
  </svg>
)

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

/** 3D 클레이 느낌 냥이 — 쿠션 위 식빵자세, 그라데이션으로 말랑 입체감 (통계 히어로용) */
export function Cat3D({ size = 150 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 150 120" aria-hidden="true">
      <defs>
        <radialGradient id="c3-body" cx="38%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#FFB668" />
          <stop offset="45%" stopColor="#F79441" />
          <stop offset="100%" stopColor="#E0762B" />
        </radialGradient>
        <radialGradient id="c3-cushion" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FAEDD8" />
          <stop offset="100%" stopColor="#EFD9B8" />
        </radialGradient>
        <linearGradient id="c3-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F79441" />
          <stop offset="100%" stopColor="#E0762B" />
        </linearGradient>
      </defs>

      {/* 쿠션 */}
      <ellipse cx="75" cy="103" rx="62" ry="14" fill="url(#c3-cushion)" />
      <ellipse cx="75" cy="99" rx="56" ry="11" fill="#FCF2E1" opacity=".55" />

      {/* 꼬리 */}
      <path d="M118 92c11-1 16-8 13-15-2-5-8-6-10-2 3 1 4 4 1 6-4 3-9 4-12 4Z" fill="#E87C2E" />

      {/* 몸통(식빵) */}
      <path
        d="M28 78c0-24 21-40 47-40s47 16 47 40c0 15-14 24-47 24S28 93 28 78Z"
        fill="url(#c3-body)"
      />
      {/* 귀 */}
      <path d="M42 45 39 26c-.3-2 1.8-3.3 3.5-2.1L57 34Z" fill="url(#c3-ear)" />
      <path d="M108 45l3-19c.3-2-1.8-3.3-3.5-2.1L93 34Z" fill="url(#c3-ear)" />
      <path d="M44.5 41.5 43 30l9 6.5Z" fill="#F7B189" opacity=".8" />
      <path d="M105.5 41.5 107 30l-9 6.5Z" fill="#F7B189" opacity=".8" />

      {/* 얼굴 */}
      <g stroke="#5A3A1E" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M56 62q4-4.5 8 0M86 62q4-4.5 8 0" />
        <path d="M70 70q5 4 10 0" />
      </g>
      {/* 수염 */}
      <g stroke="#5A3A1E" strokeWidth="1.8" strokeLinecap="round" opacity=".85">
        <path d="M44 64H32M44 69l-11 3M106 64h12M106 69l11 3" />
      </g>
      {/* 볼터치 */}
      <ellipse cx="54" cy="70" rx="5" ry="3" fill="#FCC9A0" opacity=".9" />
      <ellipse cx="96" cy="70" rx="5" ry="3" fill="#FCC9A0" opacity=".9" />

      {/* 하트 */}
      <path d="M126 44c2.5-3 7-1.5 7 2 0 2.8-3.6 5.3-7 7-3.4-1.7-7-4.2-7-7 0-3.5 4.5-5 7-2Z" fill="#F26D6D" />
      <path d="M135 30c1.6-2 4.6-1 4.6 1.3 0 1.9-2.4 3.5-4.6 4.6-2.2-1.1-4.6-2.7-4.6-4.6 0-2.3 3-3.3 4.6-1.3Z" fill="#F58C8C" />
    </svg>
  )
}

/** 홈 배너용 장면 — 왼쪽 반짝이, 큰 냥이 + 왼쪽 앞 밥그릇 (가이드 배치) */
export function BannerCat({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 130 94" aria-hidden="true">
      <g fill="#F2B33D">
        <path d="M14 22l1.7 4.8 4.8 1.7-4.8 1.7L14 35l-1.7-4.8L7.5 28.5l4.8-1.7Z" />
        <path d="M30 8l1.2 3.4 3.4 1.2-3.4 1.2L30 17.2l-1.2-3.4-3.4-1.2 3.4-1.2Z" />
        <path d="M120 30l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1Z" />
      </g>
      <g transform="translate(46 2) scale(3.1)">
        <path d={BLOB_HEAD} fill="#F3E3CC" />
        <g fill="none" stroke="#57493B" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.4 11.4q1.4-1.6 2.8 0M13.8 11.4q1.4-1.6 2.8 0" />
        </g>
        <path d="M9.3 13.9h5.4c-.3 2.5-1.3 3.9-2.7 3.9s-2.4-1.4-2.7-3.9Z" fill="#57493B" />
        <path d="M10.7 16.6q1.3 1.15 2.6 0c-.3.8-.75 1.2-1.3 1.2s-1-.4-1.3-1.2Z" fill="#F2999E" />
      </g>
      <g>
        <ellipse cx="30" cy="76" rx="19" ry="6" fill="#F6E9D4" />
        <path d="M12 76h36c0 8-8 13-18 13s-18-5-18-13Z" fill="#E1873F" />
        <ellipse cx="30" cy="76" rx="14" ry="4" fill="#FBEFD9" />
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
