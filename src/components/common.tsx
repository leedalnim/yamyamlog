import { useEffect, useState } from 'react'
import { listCats, listGroups, getPhotoURL } from '../data/repo'
import type { Cat, Group, ReactionLevel } from '../data/types'
import { REACTION_META } from '../data/types'

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

/** 반응 pill 하나 */
export function ReactionPill({ cat, level }: { cat: Cat; level: ReactionLevel }) {
  const m = REACTION_META[level]
  return (
    <span className="react-pill" data-level={level}>
      <span className="dot" />
      {cat.name} {m.short}
    </span>
  )
}

/** 그룹별로 고양이를 나눠서 반응을 선택하는 편집기 */
export function ReactionEditor({
  cats,
  groups,
  value,
  onChange,
}: {
  cats: Cat[]
  groups: Group[]
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
      {groups.map((g) => {
        const members = cats.filter((c) => c.groupId === g.id)
        if (members.length === 0) return null
        return (
          <div key={g.id} className="react-group">
            <div className="react-group-title">{g.name}</div>
            {members.map((cat) => (
              <ReactionChooser
                key={cat.id}
                cat={cat}
                value={value[cat.id]}
                onChange={(lv) => setOne(cat.id, lv)}
              />
            ))}
          </div>
        )
      })}
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
      <div className="chooser-name">
        <span className="cat-emoji">{cat.emoji}</span>
        {cat.name}
      </div>
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
              <span className="lv-emoji">{m.emoji}</span>
              {m.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}
