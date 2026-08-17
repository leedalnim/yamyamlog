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
import type { Cat, ReactionLevel, Snack } from '../data/types'
import { deleteSnack, listSnacks, updateSnack } from '../data/repo'
import { CatDoodle, IconBell, IconChevronLeft, IconChevronRight, IconDots, IconPencil, IconSliders, IconTrash, ReactionIcon } from '../components/icons'
import bannerCatUrl from '../assets/cat-bowl.png'
import logoUrl from '../assets/logo.svg'

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function FeedScreen({ onAdd, onChanged }: { onAdd: () => void; onChanged: () => void }) {
  const { cats } = useCatsAndGroups()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [filter, setFilter] = useState<string>('all') // 'all' | 종류(kind) | '기타'
  const [viewing, setViewing] = useState<Snack | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [catId, setCatId] = useState<string>('') // '' = 전체 냥이
  const [level, setLevel] = useState<'' | ReactionLevel>('') // '' = 반응 무관
  const [sort, setSort] = useState<'recent' | 'name'>('recent')

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

  const activeCount = (catId ? 1 : 0) + (level ? 1 : 0) + (sort !== 'recent' ? 1 : 0)

  const filtered = useMemo(() => {
    let list = snacks
    if (filter === '기타') list = list.filter((s) => !s.kind)
    else if (filter !== 'all') list = list.filter((s) => s.kind === filter)

    if (catId) list = list.filter((s) => !!s.reactions[catId])
    if (level) {
      list = list.filter((s) =>
        catId
          ? s.reactions[catId] === level
          : Object.values(s.reactions).some((lv) => lv === level),
      )
    }

    const sorted = [...list]
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    else sorted.sort((a, b) => b.createdAt - a.createdAt)
    return sorted
  }, [snacks, filter, catId, level, sort])

  // ---- 상세 페이지 ----
  if (viewing) {
    return (
      <SnackDetail
        snack={viewing}
        cats={cats}
        onBack={() => setViewing(null)}
        onSaved={async (updated) => {
          setViewing(updated)
          await reload()
          onChanged()
        }}
        onDeleted={async () => {
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
          <h1 className="logo"><img src={logoUrl} alt="얌얌로그" className="logo-img" /></h1>
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
        <button
          className={'chip-tab filter-chip' + (activeCount > 0 ? ' on' : '')}
          onClick={() => setFilterOpen(true)}
          aria-label="필터"
        >
          <IconSliders size={16} />
          {activeCount > 0 && <span className="filter-dot">{activeCount}</span>}
        </button>
      </div>

      {/* 오늘의 기록 유도 배너 — 일러스트 + 실제 텍스트 */}
      <button className="promo-banner promo2" onClick={onAdd}>
        <div className="promo-text">
          <div className="promo-title">오늘은<br />뭘 먹어볼까요?</div>
          <span className="promo-sub-pill">
            새로운 간식을 기록해보세요
            <span className="promo-arrow-dot"><IconChevronRight size={12} /></span>
          </span>
        </div>
        <img src={bannerCatUrl} alt="" className="promo-cat" />
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

      {filterOpen && (
        <div className="sheet-backdrop" onClick={() => setFilterOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">필터</h2>

            <div className="filter-sec">
              <div className="filter-label">냥이</div>
              <div className="chip-row">
                <button className={'sel-chip' + (catId === '' ? ' on' : '')} data-accent="kind" onClick={() => setCatId('')}>전체</button>
                {cats.map((c) => (
                  <button
                    key={c.id}
                    className={'sel-chip' + (catId === c.id ? ' on' : '')}
                    data-accent="kind"
                    onClick={() => setCatId(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-sec">
              <div className="filter-label">반응</div>
              <div className="chip-row">
                <button className={'sel-chip' + (level === '' ? ' on' : '')} data-accent="kind" onClick={() => setLevel('')}>전체</button>
                {(['good', 'ok', 'bad'] as ReactionLevel[]).map((lv) => (
                  <button
                    key={lv}
                    className={'sel-chip lv-chip' + (level === lv ? ' on' : '')}
                    data-accent="kind"
                    onClick={() => setLevel(lv)}
                  >
                    <ReactionIcon level={lv} size={18} />
                    {lv === 'good' ? '잘먹음' : lv === 'ok' ? '보통' : '안먹음'}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-sec">
              <div className="filter-label">정렬</div>
              <div className="chip-row">
                <button className={'sel-chip' + (sort === 'recent' ? ' on' : '')} data-accent="kind" onClick={() => setSort('recent')}>최신순</button>
                <button className={'sel-chip' + (sort === 'name' ? ' on' : '')} data-accent="kind" onClick={() => setSort('name')}>이름순</button>
              </div>
            </div>

            <div className="sheet-actions">
              <button
                className="btn"
                style={{ flex: 1 }}
                onClick={() => { setCatId(''); setLevel(''); setSort('recent'); setFilter('all') }}
              >
                초기화
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setFilterOpen(false)}>
                {filtered.length}개 보기
              </button>
            </div>
          </div>
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
  onBack,
  onSaved,
  onDeleted,
}: {
  snack: Snack
  cats: Cat[]
  onBack: () => void
  onSaved: (updated: Snack) => void
  onDeleted: () => void
}) {
  const url = usePhotoURL(snack.photoId)
  const [editing, setEditing] = useState(false)
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
      const updated: Snack = {
        ...snack,
        name: name.trim() || snack.name,
        kind: kind.trim() || undefined,
        base: base.trim() || undefined,
        memo: memo.trim() || undefined,
        reactions,
        updatedAt: Date.now(),
      }
      await updateSnack(updated)
      onSaved(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm('이 기록을 삭제할까요?')) return
    await deleteSnack(snack.id)
    onDeleted()
  }

  // ---- 수정 페이지 (별도 화면) ----
  if (editing) {
    return (
      <div className="screen">
        <div className="topbar page-top">
          <button className="back-inline" onClick={() => setEditing(false)} aria-label="뒤로">
            <IconChevronLeft size={22} />
          </button>
          <h1 style={{ fontSize: 19 }}>기록 수정</h1>
        </div>

        <div className="field">
          <label>제품 이름</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>반응</label>
          <ReactionEditor cats={cats} value={reactions} onChange={setReactions} />
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

        <button className="btn btn-primary btn-block" style={{ marginTop: 4 }} disabled={saving} onClick={save}>
          {saving ? '저장중…' : '저장하기'}
        </button>
        <button className="btn btn-icon btn-block" onClick={remove} style={{ color: 'var(--bad)', marginTop: 10 }}>
          <IconTrash size={18} />이 기록 삭제
        </button>
      </div>
    )
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
          <ReactionFaces cats={cats} reactions={snack.reactions} variant="large" />
        </div>

        <div className="detail-edit">
          <button className="btn btn-outline btn-block detail-edit-btn" onClick={() => setEditing(true)}>
            <IconPencil size={17} />
            수정하기
          </button>
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
