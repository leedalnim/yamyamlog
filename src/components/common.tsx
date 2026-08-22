import { useEffect, useState } from 'react'
import { listCats, listGroups, getPhotoURL } from '../data/repo'
import type { Cat, Group, ReactionLevel } from '../data/types'
import { BASE_PRESETS, KIND_PRESETS, REACTION_META } from '../data/types'
import { FaceNeutral, ReactionIcon } from './icons'
import { joinBase, splitBase, toggleBase } from '../lib/base'

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
  /**
   * chip: 피드 카드용 작은 칩 · large: 상세용 큰 얼굴
   * stack: 목록 줄 오른쪽에 세로로 — 얼굴 밑에 이름 칩
   * pill: 이름 밑에 가로로 — 얼굴과 이름이 한 알약 안에
   */
  variant?: 'chip' | 'large' | 'stack' | 'pill'
}) {
  // 알약 형태는 자리가 좁으니 반응이 있는 냥이만 보여준다
  const shown = variant === 'pill' ? cats.filter((c) => reactions[c.id]) : cats
  const faceSize = variant === 'large' ? 46 : variant === 'stack' ? 28 : variant === 'pill' ? 18 : 40

  return (
    <div className={'face-grid face-grid--' + variant}>
      {shown.map((cat) => {
        const lv = reactions[cat.id]
        return (
          <div key={cat.id} className={'face-cell' + (lv ? '' : ' blank')} data-level={lv}>
            {lv ? (
              /* 색으로 채운 알약 위에서는 크림색 얼굴이 묻힌다 — 흰 얼굴로 */
              <ReactionIcon level={lv} size={faceSize} white={variant === 'pill'} />
            ) : (
              <FaceNeutral size={faceSize} dim />
            )}
            <span className="face-name">{cat.name}</span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * 태그 컬러 — 축(axis) 단위 2색 체계.
 * 값마다 색을 다르게 주지 않고 "종류냐 / 재료냐"만 색으로 구분합니다.
 * 색으로 의미를 갖는 건 반응(주황)뿐이므로, 태그는 조용한 두 톤으로만 둡니다.
 *
 * 색은 CSS 토큰(--kind-bg 등)으로 둔다. 예전에는 여기서 style 로 직접
 * 박았는데, 인라인 스타일은 CSS 로 못 덮어서 다크 모드에서 밝은 알약이
 * 그대로 남아 있었다.
 */
export function KindTag({ v }: { v: string }) {
  return <span className="kind-tag">{v}</span>
}

export function BaseTag({ v }: { v: string }) {
  return <span className="base-tag">{v}</span>
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

/**
 * 프리셋 칩 + 직접입력 선택기 (베이스/종류 공용)
 *
 * multi 를 켜면 여러 개를 고를 수 있다. 값은 여전히 문자열 하나이고
 * 쉼표로 이어 붙는다 (src/lib/base.ts). 직접 입력한 값은 목록의 마지막
 * 칸으로 두어, 칩을 눌러도 지워지지 않게 한다.
 */
export function ChipSelect({
  value,
  onChange,
  presets,
  placeholder,
  accent,
  multi = false,
}: {
  value: string
  onChange: (v: string) => void
  presets: readonly string[]
  placeholder: string
  accent: 'base' | 'kind'
  multi?: boolean
}) {
  const picked = multi ? splitBase(value) : value ? [value] : []
  const customPicked = picked.filter((p) => !presets.includes(p))
  const [custom, setCustom] = useState(customPicked.join(', '))

  const isOn = (b: string) => picked.includes(b)

  function toggle(b: string) {
    if (!multi) {
      onChange(value === b ? '' : b)
      setCustom('')
      return
    }
    onChange(toggleBase(value, b))
  }

  function editCustom(text: string) {
    setCustom(text)
    if (!multi) {
      onChange(text)
      return
    }
    // 칩으로 고른 것은 두고, 직접 적은 부분만 갈아 끼운다
    const kept = splitBase(value).filter((p) => presets.includes(p))
    onChange(joinBase([...kept, ...splitBase(text)]))
  }

  return (
    <div className="chip-select">
      <div className="chip-row">
        {presets.map((b) => (
          <button
            key={b}
            type="button"
            data-accent={accent}
            aria-pressed={isOn(b)}
            className={'sel-chip' + (isOn(b) ? ' on' : '')}
            onClick={() => toggle(b)}
          >
            {b}
          </button>
        ))}
      </div>
      <input
        className="input sel-custom"
        placeholder={placeholder}
        value={custom}
        onChange={(e) => editCustom(e.target.value)}
      />
    </div>
  )
}

/** 종류(형태) 선택 */
export function KindChooser(p: { value: string; onChange: (v: string) => void }) {
  return <ChipSelect {...p} presets={KIND_PRESETS} placeholder="직접 입력 (예: 수프, 스틱)" accent="kind" />
}

/** 원료(주재료) 선택 — 여러 개 고를 수 있다 */
export function BaseChooser(p: { value: string; onChange: (v: string) => void }) {
  return (
    <ChipSelect
      {...p}
      presets={BASE_PRESETS}
      placeholder="직접 입력 (여러 개는 쉼표로: 오리, 참치)"
      accent="base"
      multi
    />
  )
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
