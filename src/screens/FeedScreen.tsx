import { useEffect, useMemo, useState } from 'react'
import {
  BaseChooser,
  BaseTag,
  KindChooser,
  KindTag,
  ReactionEditor,
  ReactionFaces,
  useCatsAndGroups,
  usePhotoURL,
} from '../components/common'
import type { Cat, Group, ReactionLevel, Snack } from '../data/types'
import { deleteSnack, listSnacks, updateSnack } from '../data/repo'
import { CatDoodle, IconBell, IconChevronDown, IconChevronLeft, IconDots, IconPaw, IconSliders, IconTrash, ReactionIcon } from '../components/icons'
import bannerUrl from '../assets/banner.png'

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function FeedScreen({ onAdd, onChanged }: { onAdd: () => void; onChanged: () => void }) {
  const { cats, groups } = useCatsAndGroups()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [filter, setFilter] = useState<string>('all') // 'all' | 종류(kind) | '기타'
  const [viewing, setViewing] = useState<Snack | null>(null)

  async function reload() {
    setSnacks(await listSnacks())
  }
  useEffect(() => {
    void reload()
  }, [])

  // 기록에 실제로 있는 종류들로 필터 칩 구성
  const kinds = useMemo(() => {
    const seen = new Map<string, number>()
    let etc = 0
    for (const s of snacks) {
      if (s.kind) seen.set(s.kind, (seen.get(s.kind) ?? 0) + 1)
      else etc++
    }
    const list = [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
    if (etc > 0) list.push('기타')
    return list
  }, [snacks])

  const filtered = useMemo(() => {
    if (filter === 'all') return snacks
    if (filter === '기타') return snacks.filter((s) => !s.kind)
    return snacks.filter((s) => s.kind === filter)
  }, [snacks, filter])

  // ---- 상세 페이지 ----
  if (viewing) {
    return (
      <SnackDetail
        snack={viewing}
        cats={cats}
        groups={groups}
        onBack={() => setViewing(null)}
        onDone={async () => {
          setViewing(null)
          await reload()
          onChanged()
        }}
      />
    )
  }

  // ---- 피드 ----
  return (
    <div className="screen">
      <div className="topbar">
        <div>
          <h1 className="logo">얌로그 <span className="logo-paw"><IconPaw size={17} /></span></h1>
          <div className="sub">우리 냥이들의 간식 기록</div>
        </div>
        <button className="bell-btn" aria-label="알림"><IconBell size={22} /></button>
      </div>

      <div className="tabs">
        <button className={'chip-tab' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>
          전체
        </button>
        {kinds.map((k) => (
          <button
            key={k}
            className={'chip-tab' + (filter === k ? ' active' : '')}
            onClick={() => setFilter(k)}
          >
            {k}
          </button>
        ))}
        <button className="chip-tab filter-chip" onClick={() => setFilter('all')} aria-label="필터 초기화">
          <IconSliders size={16} />
        </button>
      </div>

      {/* 오늘의 기록 유도 배너 (목업 스타일) */}
      <button className="promo-banner promo-img-wrap" onClick={onAdd}>
        <img src={bannerUrl} alt="오늘은 뭘 먹어볼까요? 새로운 간식을 기록해보세요" className="promo-img" />
      </button>

      <h2 className="stat-title" style={{ marginTop: 4 }}>최근 기록</h2>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="doodle"><CatDoodle size={116} /></div>
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
            <SnackCard key={s.id} snack={s} cats={cats} onOpen={() => setViewing(s)} />
          ))}
        </div>
      )}
    </div>
  )
}

function SnackCard({ snack, cats, onOpen }: { snack: Snack; cats: Cat[]; onOpen: () => void }) {
  const url = usePhotoURL(snack.photoId)
  return (
    <div className="card snack-card">
      <button className="snack-btn" onClick={onOpen}>
        {/* 윗줄: 썸네일 + 이름/태그 + 화살표 */}
        <div className="snack-top">
          {url && (
            <div className="snack-thumb">
              <img src={url} alt={snack.name} loading="lazy" />
            </div>
          )}
          <div className="snack-body">
            <div className="snack-name-row">
              <span className="snack-name">{snack.name}</span>
            </div>
            <div className="snack-date">{formatDate(snack.createdAt)}</div>
            <div className="snack-tags-row">
              {snack.kind && <KindTag v={snack.kind} />}
              {snack.base && <BaseTag v={snack.base} />}
            </div>
          </div>
          <span className="snack-dots"><IconDots size={19} /></span>
        </div>
        {/* 아랫줄: 4마리 반응 얼굴 (카드 전체 폭) */}
        <ReactionFaces cats={cats} reactions={snack.reactions} />
      </button>
    </div>
  )
}

/** 상세 페이지 — 카드를 누르면 이동. 정보는 보기 전용, 수정 폼은 아코디언으로 접힘 */
function SnackDetail({
  snack,
  cats,
  groups,
  onBack,
  onDone,
}: {
  snack: Snack
  cats: Cat[]
  groups: Group[]
  onBack: () => void
  onDone: () => void
}) {
  const url = usePhotoURL(snack.photoId)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState(snack.name)
  const [kind, setKind] = useState(snack.kind ?? '')
  const [base, setBase] = useState(snack.base ?? '')
  const [memo, setMemo] = useState(snack.memo ?? '')
  const [reactions, setReactions] = useState<Record<string, ReactionLevel>>(snack.reactions)
  const [saving, setSaving] = useState(false)

  const entries = Object.entries(snack.reactions) as [string, ReactionLevel][]

  async function save() {
    setSaving(true)
    try {
      await updateSnack({
        ...snack,
        name: name.trim() || snack.name,
        kind: kind.trim() || undefined,
        base: base.trim() || undefined,
        memo: memo.trim() || undefined,
        reactions,
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm('이 기록을 삭제할까요?')) return
    await deleteSnack(snack.id)
    onDone()
  }

  return (
    <div className="detail-page">
      {/* ---- 사진 풀블리드 히어로 ---- */}
      <div className="detail-hero">
        {url ? (
          <img src={url} alt={snack.name} />
        ) : (
          <div className="detail-hero-fallback">
            <ReactionPillFallback entries={entries} />
          </div>
        )}
        <button className="detail-back" onClick={onBack} aria-label="뒤로"><IconChevronLeft size={20} /></button>
      </div>

      {/* ---- 아래에서 올라오는 흰 시트 ---- */}
      <div className="detail-sheet">
        <div className="sheet-handle" />
        <h2 className="detail-name">{snack.name}</h2>
        <div className="detail-tags">
          {snack.kind && <KindTag v={snack.kind} />}
          {snack.base && <BaseTag v={snack.base} />}
          <span className="snack-date">{formatDate(snack.createdAt)} 기록</span>
        </div>
        {snack.memo && <p className="detail-memo muted">{snack.memo}</p>}
        <div style={{ marginTop: 14 }}>
          <div className="field-label muted">고양이별 반응</div>
          <ReactionFaces cats={cats} reactions={snack.reactions} />
        </div>

        {/* ---- 수정 (아코디언) ---- */}
      <div className="card edit-acc">
        <button className="edit-acc-head" onClick={() => setEditOpen((v) => !v)} aria-expanded={editOpen}>
          수정하기
          <span className={'snack-chev' + (editOpen ? ' open' : '')}><IconChevronDown size={18} /></span>
        </button>
        {editOpen && (
          <div className="edit-acc-body">
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
            <button className="btn btn-primary btn-block" disabled={saving} onClick={save}>
              {saving ? '저장중…' : '저장하기'}
            </button>
            <button className="btn btn-icon btn-block" onClick={remove} style={{ color: 'var(--bad)', marginTop: 10 }}>
              <IconTrash size={18} />이 기록 삭제
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

/** 사진이 없는 기록의 히어로 대체 — 대표 반응 블롭 얼굴 */
function ReactionPillFallback({ entries }: { entries: [string, ReactionLevel][] }) {
  const levels = entries.map(([, lv]) => lv)
  const level: ReactionLevel = levels.includes('good') ? 'good' : levels.includes('ok') ? 'ok' : levels.length ? 'bad' : 'ok'
  return <ReactionIcon level={level} size={96} />
}
