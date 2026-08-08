import { useEffect, useMemo, useState } from 'react'
import {
  BaseChooser,
  KindChooser,
  ReactionEditor,
  ReactionPill,
  useCatsAndGroups,
  usePhotoURL,
} from '../components/common'
import type { Cat, Group, ReactionLevel, Snack } from '../data/types'
import { deleteSnack, listSnacks, updateSnack } from '../data/repo'
import { IconBowl, IconPaw, IconTrash } from '../components/icons'

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function FeedScreen({ onAdd, onChanged }: { onAdd: () => void; onChanged: () => void }) {
  const { cats, groups } = useCatsAndGroups()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [filter, setFilter] = useState<string>('all') // 'all' | groupId
  const [editing, setEditing] = useState<Snack | null>(null)

  async function reload() {
    setSnacks(await listSnacks())
  }
  useEffect(() => {
    void reload()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return snacks
    const memberIds = new Set(cats.filter((c) => c.groupId === filter).map((c) => c.id))
    // 해당 그룹 고양이의 반응이 하나라도 있는 간식만
    return snacks.filter((s) => Object.keys(s.reactions).some((id) => memberIds.has(id)))
  }, [snacks, filter, cats])

  return (
    <div className="screen">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark"><IconPaw size={22} /></span>
          <div>
            <h1>얌로그</h1>
            <div className="sub">우리집 냥이들 간식 기호성 기록</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={'chip-tab' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>
          전체
        </button>
        {groups.map((g) => (
          <button
            key={g.id}
            className={'chip-tab' + (filter === g.id ? ' active' : '')}
            onClick={() => setFilter(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="big"><IconBowl size={46} /></div>
          아직 기록이 없어요.
          <br />
          아래 <b>추가</b>에서 첫 간식을 기록해보세요!
          <br />
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onAdd}>
            간식 기록하기
          </button>
        </div>
      ) : (
        <div className="feed-list">
          {filtered.map((s) => (
            <SnackCard key={s.id} snack={s} cats={cats} onClick={() => setEditing(s)} />
          ))}
        </div>
      )}

      {editing && (
        <SnackSheet
          snack={editing}
          cats={cats}
          groups={groups}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await reload()
            onChanged()
          }}
          onDeleted={async () => {
            setEditing(null)
            await reload()
            onChanged()
          }}
        />
      )}
    </div>
  )
}

function SnackCard({ snack, cats, onClick }: { snack: Snack; cats: Cat[]; onClick: () => void }) {
  const url = usePhotoURL(snack.photoId)
  const entries = Object.entries(snack.reactions) as [string, ReactionLevel][]
  return (
    <button className="card snack-card" onClick={onClick}>
      {url && (
        <div className="snack-photo">
          <img src={url} alt={snack.name} loading="lazy" />
        </div>
      )}
      <div className="snack-body">
        <div className="snack-name-row">
          <span className="snack-name">{snack.name}</span>
          {snack.kind && <span className="kind-tag">{snack.kind}</span>}
          {snack.base && <span className="base-tag">{snack.base}</span>}
        </div>
        <div className="snack-date">{formatDate(snack.createdAt)}</div>
        {snack.memo && <div className="snack-memo">{snack.memo}</div>}
        <div className="pills">
          {entries.length === 0 && <span className="muted" style={{ fontSize: 12.5 }}>반응 기록 없음</span>}
          {entries.map(([catId, lv]) => {
            const cat = cats.find((c) => c.id === catId)
            if (!cat) return null
            return <ReactionPill key={catId} cat={cat} level={lv} />
          })}
        </div>
      </div>
    </button>
  )
}

function SnackSheet({
  snack,
  cats,
  groups,
  onClose,
  onSaved,
  onDeleted,
}: {
  snack: Snack
  cats: Cat[]
  groups: Group[]
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}) {
  const url = usePhotoURL(snack.photoId)
  const [name, setName] = useState(snack.name)
  const [kind, setKind] = useState(snack.kind ?? '')
  const [base, setBase] = useState(snack.base ?? '')
  const [memo, setMemo] = useState(snack.memo ?? '')
  const [reactions, setReactions] = useState<Record<string, ReactionLevel>>(snack.reactions)

  async function save() {
    await updateSnack({
      ...snack,
      name: name.trim() || snack.name,
      kind: kind.trim() || undefined,
      base: base.trim() || undefined,
      memo: memo.trim() || undefined,
      reactions,
    })
    onSaved()
  }

  async function remove() {
    if (!confirm('이 기록을 삭제할까요?')) return
    await deleteSnack(snack.id)
    onDeleted()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {url && (
          <div className="sheet-photo">
            <img src={url} alt={name} />
          </div>
        )}
        <div className="field">
          <label>제품 이름</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>종류</label>
          <KindChooser value={kind} onChange={setKind} />
        </div>
        <div className="field">
          <label>베이스 · 주재료</label>
          <BaseChooser value={base} onChange={setBase} />
        </div>
        <div className="field">
          <label>메모</label>
          <textarea className="textarea" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
        <div className="field">
          <label>반응</label>
          <ReactionEditor cats={cats} groups={groups} value={reactions} onChange={setReactions} />
        </div>
        <div className="sheet-actions">
          <button className="btn btn-icon" onClick={remove} style={{ color: 'var(--bad)' }}>
            <IconTrash size={18} />삭제
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>저장</button>
        </div>
      </div>
    </div>
  )
}
