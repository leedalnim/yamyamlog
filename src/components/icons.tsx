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

export const IconBowl = (p: P) =>
  svg(
    <>
      <path d="M3 11h18a9 9 0 0 1-9 9 9 9 0 0 1-9-9Z" />
      <path d="M7.5 11c0-3 1.8-5 4.5-5s4.5 2 4.5 5" />
      <path d="M12 3v2" />
    </>,
    p,
  )

// 반응 3단계 — 표정 라인 아이콘
export const IconFaceGood = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14.5s1.4 2 4 2 4-2 4-2" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </>,
    p,
  )

export const IconFaceOk = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 15h7" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </>,
    p,
  )

export const IconFaceBad = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 16s1.4-2 4-2 4 2 4 2" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </>,
    p,
  )

export const ReactionIcon = ({ level, size }: { level: ReactionLevel; size?: number }) => {
  if (level === 'good') return <IconFaceGood size={size} />
  if (level === 'ok') return <IconFaceOk size={size} />
  return <IconFaceBad size={size} />
}
