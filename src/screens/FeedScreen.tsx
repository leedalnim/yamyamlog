import { useEffect, useMemo, useRef, useState } from 'react'
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
import { deleteSnack, listSnacks, savePhoto, toggleFavorite, updateSnack } from '../data/repo'
import { compressImage } from '../lib/image'
import { CatDoodle, IconCamera, IconChevronLeft, IconChevronRight, IconPencil, IconSearch, IconSliders, IconStar, IconTrash, ReactionIcon } from '../components/icons'
import bannerCatUrl from '../assets/cat-bowl.png'
// 로고 안의 '흰색' 부분은 사실 배경이 비쳐 보이는 구멍이라, 다크 모드에서
// 흰 덩어리로 남지 않으려면 페이지 배경색을 따라가야 한다. 그러려면
// <img> 가 아니라 문서 안에 직접 그려야 CSS 변수가 닿는다.
import logoRaw from '../assets/logo.svg?raw'
import noPhotoUrl from '../assets/no-photo.svg'
import { matches } from '../lib/hangul'
import { useBackGuard } from '../lib/useBackGuard'

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
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  // 뒤로 제스처로 한 단계씩 닫히게 한다
  useBackGuard(!!viewing, () => setViewing(null))
  useBackGuard(filterOpen, () => setFilterOpen(false))
  useBackGuard(searchOpen, () => { setQuery(''); setSearchOpen(false) })

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
    if (filter === 'fav') list = list.filter((s) => s.favorite)
    else if (filter === '기타') list = list.filter((s) => !s.kind)
    else if (filter !== 'all') list = list.filter((s) => s.kind === filter)

    // 이름뿐 아니라 재료·메모까지 훑는다 — '닭가슴살'로 여러 제품이 잡히게.
    // 'ㅈㄱㅎㅋ' 처럼 초성만 치면 초성으로 비교한다.
    const q = query.trim()
    if (q) {
      list = list.filter((s) =>
        [s.name, s.kind, s.base, s.memo]
          .filter(Boolean)
          .some((v) => matches(v as string, q)),
      )
    }

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
  }, [snacks, filter, catId, level, sort, query])

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
        {searchOpen ? (
          <div className="search-bar">
            <IconSearch size={18} />
            <input
              className="search-input"
              autoFocus
              placeholder="이름 · 재료 · 메모 (초성도 가능)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              className="search-close"
              onClick={() => {
                setQuery('')
                setSearchOpen(false)
              }}
            >
              취소
            </button>
          </div>
        ) : (
          <>
            <h1 className="logo" aria-label="얌얌로그">
              <span className="logo-img" role="img" dangerouslySetInnerHTML={{ __html: logoRaw }} />
            </h1>
            <button className="bell-btn" aria-label="검색" onClick={() => setSearchOpen(true)}>
              <IconSearch size={22} />
            </button>
          </>
        )}
      </div>

      <div className="tabs">
        <button className={'chip-tab' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>
          전체
        </button>
        <button
          className={'chip-tab chip-fav' + (filter === 'fav' ? ' active' : '')}
          onClick={() => setFilter('fav')}
          aria-label="즐겨찾기만 보기"
        >
          <IconStar size={17} filled={filter === 'fav'} />
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
          <div className="promo-sub-row">
            <span className="promo-sub">새로 먹은 걸 기록해보세요</span>
            <span className="promo-arrow-dot"><IconChevronRight size={12} /></span>
          </div>
        </div>
        <img src={bannerCatUrl} alt="" className="promo-cat" />
      </button>

      <h2 className="stat-title" style={{ marginTop: 4 }}>최근 기록</h2>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="doodle"><CatDoodle size={116} /></div>
          {query.trim() ? (
            <>
              <b>{query.trim()}</b> 와(과) 맞는 기록이 없어요.
            </>
          ) : filter === 'fav' ? (
            <>아직 즐겨찾기한 게 없어요.<br />카드 오른쪽 위 별을 눌러보세요.</>
          ) : (
            <>아직 기록이 없어요.
          <br />
          <br />
          아래 <b>추가</b>에서 첫 기록을 남겨보세요!
          <br />
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onAdd}>
            기록하기
          </button>
            </>
          )}
        </div>
      ) : (
        <div className="feed-list">
          {filtered.map((s) => (
            <SnackCard
            key={s.id}
            snack={s}
            cats={cats}
            onOpen={() => setViewing(s)}
            onToggleFav={async () => {
              await toggleFavorite(s.id)
              await reload()
              onChanged()
            }}
          />
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

function SnackCard({
  snack,
  cats,
  onOpen,
  onToggleFav,
}: {
  snack: Snack
  cats: Cat[]
  onOpen: () => void
  onToggleFav: () => void
}) {
  const url = usePhotoURL(snack.photoId)
  return (
    <div className={'card snack-card' + (snack.discontinued ? ' is-discontinued' : '')}>
      <button
        className={'fav-btn' + (snack.favorite ? ' on' : '')}
        aria-label={snack.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
        onClick={onToggleFav}
      >
        <IconStar size={20} filled={!!snack.favorite} />
      </button>
      <button className="snack-btn" onClick={onOpen}>
        {/* 윗줄: 썸네일 + 이름/태그 + 화살표 */}
        <div className="snack-top">
          {/* 사진이 없어도 자리를 비우지 않는다 — 츄르 일러스트로 채워
              카드마다 왼쪽 정렬이 달라지는 것도 막는다 */}
          <div className={'snack-thumb' + (url ? '' : ' no-photo-thumb')}>
            {url ? (
              <img src={url} alt={snack.name} loading="lazy" />
            ) : (
              <img src={noPhotoUrl} alt="" className="no-photo" />
            )}
          </div>
          <div className="snack-body">
            {(snack.kind || snack.base || snack.discontinued) && (
              <div className="snack-tag-row">
                {snack.discontinued && <span className="tag-discontinued">단종</span>}
                {snack.kind && <KindTag v={snack.kind} />}
                {snack.base && <BaseTag v={snack.base} />}
              </div>
            )}
            <div className="snack-name-row">
              <span className="snack-name">{snack.name}</span>
            </div>
          </div>
        </div>
        {/* 아랫줄: 4마리 반응 얼굴 (카드 전체 폭) */}
        <ReactionFaces cats={cats} reactions={snack.reactions} />
      </button>
    </div>
  )
}

/** 상세 페이지 — 카드를 누르면 이동. 정보는 보기 전용, 수정 폼은 아코디언으로 접힘 */
export function SnackDetail({
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
  const [discontinued, setDiscontinued] = useState(!!snack.discontinued)
  const [saving, setSaving] = useState(false)
  useBackGuard(editing, () => setEditing(false))
  // 사진 교체 — 저장을 눌러야 실제로 반영된다
  const fileRef = useRef<HTMLInputElement>(null)
  const [newPhoto, setNewPhoto] = useState<Blob | null>(null)
  const [newPreview, setNewPreview] = useState<string>()
  const [removePhoto, setRemovePhoto] = useState(false)
  const shownPhoto = removePhoto ? undefined : (newPreview ?? url)

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 다시 고를 수 있게
    if (!file) return
    const blob = await compressImage(file)
    if (newPreview) URL.revokeObjectURL(newPreview)
    setNewPhoto(blob)
    setNewPreview(URL.createObjectURL(blob))
    setRemovePhoto(false)
  }

  async function save() {
    setSaving(true)
    try {
      let photoId = snack.photoId
      if (removePhoto) photoId = undefined
      else if (newPhoto) photoId = await savePhoto(newPhoto)

      const updated: Snack = {
        ...snack,
        photoId,
        name: name.trim() || snack.name,
        kind: kind.trim() || undefined,
        base: base.trim() || undefined,
        memo: memo.trim() || undefined,
        discontinued,
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

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />

        <div className="field">
          <label>사진</label>
          {shownPhoto ? (
            <div className="photo-box">
              <img src={shownPhoto} alt="제품 사진" />
              <div className="photo-actions">
                <button className="mini-btn mini-primary" onClick={() => fileRef.current?.click()}>
                  <IconCamera size={16} />사진 바꾸기
                </button>
                <button
                  className="mini-btn mini-danger"
                  onClick={() => {
                    setRemovePhoto(true)
                    setNewPhoto(null)
                    if (newPreview) URL.revokeObjectURL(newPreview)
                    setNewPreview(undefined)
                  }}
                >
                  <IconTrash size={16} />사진 빼기
                </button>
              </div>
            </div>
          ) : (
            <button className="photo-drop slim" onClick={() => fileRef.current?.click()}>
              <IconCamera size={20} />
              사진 추가하기
            </button>
          )}
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
          <label>상태</label>
          <div className="chip-row">
            <button
              type="button"
              className={'sel-chip' + (discontinued ? ' on' : '')}
              data-accent="kind"
              onClick={() => setDiscontinued((v) => !v)}
            >
              단종된 제품
            </button>
          </div>
        </div>
        <div className="field">
          <label>메모</label>
          <textarea className="textarea" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>

        <button className="btn btn-primary btn-block" style={{ marginTop: 4 }} disabled={saving} onClick={save}>
          {saving ? '저장중…' : '저장하기'}
        </button>
        <button className="btn btn-icon btn-block" onClick={remove} style={{ color: 'var(--muted)', marginTop: 10 }}>
          <IconTrash size={18} />이 기록 삭제
        </button>
      </div>
    )
  }

  return (
    <div className="detail-page">
      {/* ---- 사진 풀블리드 히어로 ---- */}
      <div className={'detail-hero' + (snack.discontinued ? ' is-discontinued' : '')}>
        {url ? (
          <img src={url} alt={snack.name} />
        ) : (
          <div className="detail-hero-fallback">
            <ReactionPillFallback />
          </div>
        )}
        <button className="detail-back" onClick={onBack} aria-label="뒤로"><IconChevronLeft size={20} /></button>
        <button
          className={'detail-fav' + (snack.favorite ? ' on' : '')}
          aria-label={snack.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
          aria-pressed={!!snack.favorite}
          onClick={async () => {
            await toggleFavorite(snack.id)
            onSaved({ ...snack, favorite: !snack.favorite })
          }}
        >
          <IconStar size={20} filled={!!snack.favorite} />
        </button>
      </div>

      {/* ---- 아래에서 올라오는 흰 시트 ---- */}
      <div className="detail-sheet">
        <div className="sheet-handle" />
        <h2 className="detail-name">{snack.name}</h2>
        <div className="detail-tags">
          {snack.kind && <KindTag v={snack.kind} />}
          {snack.base && <BaseTag v={snack.base} />}
          {snack.discontinued && <span className="tag-discontinued">단종</span>}
          <span className="snack-date">{formatDate(snack.createdAt)} 기록</span>
        </div>
        {/* 점선으로 위쪽 제품 정보와 갈라 놓는다 — 여기부터가 '누가 잘 먹었나' */}
        <div className="detail-reactions">
          <ReactionFaces cats={cats} reactions={snack.reactions} variant="large" />
        </div>

        {/*
          메모는 반응 아래에 둔다. 이 화면에서 제일 궁금한 건 '누가 잘 먹었나'라
          그게 먼저 오고, 그람수 같은 부연은 그 다음이다.
        */}
        {snack.memo && (
          <div className="detail-memo-box">
            <div className="detail-memo-label muted">메모</div>
            <p className="detail-memo">{snack.memo}</p>
          </div>
        )}

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

/**
 * 사진이 없는 기록의 히어로 대체 — 츄르 일러스트.
 * 반응 얼굴을 크게 띄우면 아래 반응 영역과 겹쳐 보이고,
 * '사진이 없다'는 사실도 전달되지 않는다.
 */
function ReactionPillFallback() {
  return <img src={noPhotoUrl} alt="" className="detail-no-photo" />
}
