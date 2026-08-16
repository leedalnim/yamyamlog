import { useEffect, useState } from 'react'
import { listCats, listGroups, getPhotoURL } from '../data/repo'
import type { Cat, Group, ReactionLevel } from '../data/types'
import { BASE_PRESETS, KIND_PRESETS, REACTION_META } from '../data/types'
import { FaceNeutral, ReactionIcon } from './icons'

/** 고양이 얼굴 아이콘 (가이드 에셋) */
export function CatPaw({ size = 18 }: { cat?: Cat; size?: number }) {
  return (
    <span className="cat-paw">
      <FaceNeutral size={size} />
    </span>
  )
}

/** 고양이 + 그룹 로드 (한 번) */
export function useCatsAndGroups() {
  const [cats, setCats] = useState<Cat[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  useEffect(() => {
    ;(async () => {
      setGroups(await listGroups())
      setCats(await listCats())
    })()
  }, [])
  return { cats, groups }
}

/** 저장된 사진의 표시용 URL 로드 (해제까지) */
export function usePhotoURL(photoId?: string) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let active = true
    let created: string | undefined
    ;(async () => {
      const u = await getPhotoURL(photoId)
      if (active) {
        setUrl(u)
        created = u
      } else if (u) {
        URL.revokeObjectURL(u)
      }
    })()
    return () => {
      active = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [photoId])
  return url
}

/** 고양이 4마리 반응 얼굴 그리드 — 이름 위 + 얼굴 아래, 기록 없는 애는 흐리게 */
export function ReactionFaces({
  cats,
  reactions,
  variant = 'chip',
}: {
  cats: Cat[]
  reactions: Record<string, ReactionLevel>
  /** chip: 피드 카드용 작은 칩 · large: 상세용 큰 얼굴 */
  variant?: 'chip' | 'large'
}) {
  return (
    <div className={'face-grid face-grid--' + variant}>
      {cats.map((cat) => {
        const lv = reactions[cat.id]
        return (
          <div key={cat.id} className={'face-cell' + (lv ? '' : ' blank')}>
            {lv ? (
              <ReactionIcon level={lv} size={variant === 'large' ? 46 : 40} />
            ) : (
              <FaceNeutral size={variant === 'large' ? 46 : 40} dim />
            )}
            <span className="face-name">{cat.name}</span>
          </div>
        )
      })}
    </div>
  )
}

/** 태그 파스텔 컬러 (목업 컬러코딩) — [배경, 글자] */
const KIND_TAG_COLORS: Record<string, [string, string]> = {
  // 피그마 디자인 토큰 (tag/*-bg, tag/*-text)
  '츄르': ['#FDE7D3', '#D9782E'],
  '캔': ['#EFEDE9', '#4A4440'],
  '양갱': ['#FDE4EA', '#4A4440'],
  '파우치(습식)': ['#D9E9FA', '#3D7BB5'],
  '건식': ['#EFEDE9', '#4A4440'],
  '트릿': ['#FDE7D3', '#D9782E'],
  '동결건조': ['#D9F0D5', '#4C8A4A'],
}
const BASE_TAG_COLORS: Record<string, [string, string]> = {
  // 피그마 디자인 토큰 (해산물/육류/기능성/유산균)
  '해산물': ['#D9E9FA', '#3D7BB5'],
  '참치': ['#D9E9FA', '#3D7BB5'],
  '연어': ['#D9E9FA', '#3D7BB5'],
  '게살': ['#D9E9FA', '#3D7BB5'],
  '새우': ['#D9E9FA', '#3D7BB5'],
  '가리비': ['#D9E9FA', '#3D7BB5'],
  '북어': ['#D9E9FA', '#3D7BB5'],
  '닭가슴살': ['#FDE3E8', '#C06077'],
  '소고기': ['#FDE3E8', '#C06077'],
  '육류': ['#FDE3E8', '#C06077'],
  '기능성': ['#EAE4FA', '#7A5089'],
  '유산균': ['#D9F0D5', '#4C8A4A'],
  '산양유': ['#EAE4FA', '#7A5089'],
}

export function KindTag({ v }: { v: string }) {
  const [bg, fg] = KIND_TAG_COLORS[v] ?? ['#E4E2DE', '#4A4440']
  return <span className="kind-tag" style={{ background: bg, color: fg }}>{v}</span>
}

export function BaseTag({ v }: { v: string }) {
  const [bg, fg] = BASE_TAG_COLORS[v] ?? ['#E4E2DE', '#4A4440']
  return <span className="base-tag" style={{ background: bg, color: fg }}>{v}</span>
}

/** 반응 pill 하나 */
export function ReactionPill({ cat, level }: { cat: Cat; level: ReactionLevel }) {
  const m = REACTION_META[level]
  return (
    <span className="react-pill" data-level={level}>
      <ReactionIcon level={level} size={16} />
      {cat.name} {m.short}
    </span>
  )
}

/** 프리셋 칩 + 직접입력 선택기 (베이스/종류 공용) */
export function ChipSelect({
  value,
  onChange,
  presets,
  placeholder,
  accent,
}: {
  value: string
  onChange: (v: string) => void
  presets: readonly string[]
  placeholder: string
  accent: 'base' | 'kind'
}) {
  const isPreset = presets.includes(value)
  const [custom, setCustom] = useState(value && !isPreset ? value : '')
  return (
    <div className="chip-select">
      <div className="chip-row">
        {presets.map((b) => (
          <button
            key={b}
            type="button"
            data-accent={accent}
            className={'sel-chip' + (value === b ? ' on' : '')}
            onClick={() => {
              onChange(value === b ? '' : b)
              setCustom('')
            }}
          >
            {b}
          </button>
        ))}
      </div>
      <input
        className="input sel-custom"
        placeholder={placeholder}
        value={custom}
        onChange={(e) => {
          setCustom(e.target.value)
          onChange(e.target.value)
        }}
      />
    </div>
  )
}

/** 종류(형태) 선택 */
export function KindChooser(p: { value: string; onChange: (v: string) => void }) {
  return <ChipSelect {...p} presets={KIND_PRESETS} placeholder="직접 입력 (예: 수프, 스틱)" accent="kind" />
}

/** 베이스(주재료) 선택 */
export function BaseChooser(p: { value: string; onChange: (v: string) => void }) {
  return <ChipSelect {...p} presets={BASE_PRESETS} placeholder="직접 입력 (예: 오리, 참치+게살)" accent="base" />
}

/** 그룹별로 고양이를 나눠서 반응을 선택하는 편집기 */
export function ReactionEditor({
  cats,
  value,
  onChange,
}: {
  cats: Cat[]
  groups?: Group[]
  value: Record<string, ReactionLevel>
  onChange: (next: Record<string, ReactionLevel>) => void
}) {
  const setOne = (catId: string, level: ReactionLevel | undefined) => {
    const next = { ...value }
    if (level) next[catId] = level
    else delete next[catId]
    onChange(next)
  }
  return (
    <div className="react-editor">
      {cats.map((cat) => (
        <ReactionChooser
          key={cat.id}
          cat={cat}
          value={value[cat.id]}
          onChange={(lv) => setOne(cat.id, lv)}
        />
      ))}
    </div>
  )
}

/** 3단계 선택 버튼 (한 고양이용) */
export function ReactionChooser({
  cat,
  value,
  onChange,
}: {
  cat: Cat
  value: ReactionLevel | undefined
  onChange: (level: ReactionLevel | undefined) => void
}) {
  const levels: ReactionLevel[] = ['good', 'ok', 'bad']
  return (
    <div className="chooser">
      <div className="chooser-name">{cat.name}</div>
      <div className="chooser-btns">
        {levels.map((lv) => {
          const m = REACTION_META[lv]
          const active = value === lv
          return (
            <button
              key={lv}
              type="button"
              className={'lv-btn' + (active ? ' active' : '')}
              data-level={lv}
              aria-pressed={active}
              onClick={() => onChange(active ? undefined : lv)}
            >
              <ReactionIcon level={lv} size={30} />
              {m.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}
