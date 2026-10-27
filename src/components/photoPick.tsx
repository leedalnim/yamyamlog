// 이름으로 찾기 — 시중 제품 목록과 사진 검색 화면 조각들.
//   Highlight      — 친 글자를 결과 안에서 주황으로
//   CatalogRow     — '시중 제품' 한 줄
//   PhotoGrid      — 이름으로 찾은 사진을 칸으로 보여 주고 하나 고르기 (새 기록 안)
//   PhotoFindSheet — 같은 걸 아래에서 올라오는 창으로 (기록 수정)

import { useEffect, useState } from 'react'
import { fetchPhoto, photoSearchError, photoSearchState, searchPhotos, type PhotoHit } from '../lib/photoSearch'
import type { CatalogItem } from '../lib/catalog'
import { nameKey } from '../lib/name'
import { useBackGuard } from '../lib/useBackGuard'
import { IconCamera, IconCheck, IconPaw } from './icons'

/** 친 글자를 결과 이름 안에서 주황으로 */
export function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return <>{text}</>
  const re = new RegExp('(' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi')
  const parts = text.split(re)
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>))}
    </>
  )
}

export function CatalogRow({ item, query, onPick }: { item: CatalogItem; query: string; onPick: () => void }) {
  return (
    // 누르는 순간 입력칸이 포커스를 잃어 목록이 닫히지 않게 mousedown 을 막는다
    <button type="button" className="nv-row" onMouseDown={(e) => e.preventDefault()} onClick={onPick}>
      <span className="nv-noimg nv-paw"><IconPaw size={20} /></span>
      <span className="nv-txt">
        <span className="nv-t"><Highlight text={item.name} query={query} /></span>
        <span className="nv-s">{[item.brand, item.kind, item.base.join(', ')].filter(Boolean).join(' · ')}</span>
      </span>
    </button>
  )
}

/**
 * 이름이 바뀌면 잠깐 기다렸다 찾는다. items: null = 못 씀.
 * more() 는 다음 24장을 더 불러와 뒤에 붙인다. end = 더 없음.
 */
function usePhotoSearch(query: string, enabled: boolean, wait = 600) {
  const [items, setItems] = useState<PhotoHit[] | null>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [end, setEnd] = useState(true)
  const [moreBusy, setMoreBusy] = useState(false)
  const q = query.trim()
  useEffect(() => {
    setPage(1)
    setEnd(true)
    if (photoSearchState() === 'off') {
      setItems(null)
      setLoading(false)
      return
    }
    if (!enabled || nameKey(q).length < 2) {
      setItems([])
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    const t = setTimeout(async () => {
      const r = await searchPhotos(q)
      if (!alive) return
      setItems(r ? r.items : null)
      setEnd(r ? r.end : true)
      setLoading(false)
    }, wait)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q, enabled, wait])

  async function more(): Promise<boolean> {
    if (end || moreBusy || !items) return false
    setMoreBusy(true)
    const r = await searchPhotos(q, page + 1)
    setMoreBusy(false)
    if (!r) return false
    const seen = new Set(items.map((h) => h.thumb))
    const add = r.items.filter((h) => !seen.has(h.thumb))
    setPage(page + 1)
    // 새 사진이 하나도 없으면 더 없는 것으로 본다
    setEnd(r.end || add.length === 0)
    if (add.length) setItems([...items, ...add])
    return add.length > 0
  }
  return { items, loading, more, end, moreBusy }
}

function failText() {
  if (photoSearchState() === 'off') return '사진 찾기가 아직 설정되지 않았어요'
  if (photoSearchError() === 'naver') return '사진 검색이 거절됐어요. 네이버 열쇠 설정을 확인해 주세요'
  return '지금은 사진을 찾을 수 없어요. 인터넷 연결을 확인해 주세요'
}

/** 사진 칸들. 누르면 그 사진을 받아 onPick */
function Grid({
  hits,
  selected,
  busy,
  onTap,
  cols,
}: {
  hits: PhotoHit[]
  selected?: string
  busy?: string
  onTap: (h: PhotoHit) => void
  cols: 3 | 4
}) {
  return (
    <div className={'pk-grid pk-cols' + cols}>
      {hits.map((h) => (
        <button
          type="button"
          key={h.thumb}
          className={'pk-cell' + (selected === h.thumb ? ' on' : '') + (busy === h.thumb ? ' busy' : '')}
          onClick={() => onTap(h)}
          aria-pressed={selected === h.thumb}
          aria-label={h.site ? `${h.site} 사진` : '사진'}
        >
          <img src={h.thumb} alt="" loading="lazy" />
          {selected === h.thumb && <span className="pk-ck"><IconCheck size={13} /></span>}
        </button>
      ))}
    </div>
  )
}

/**
 * 새 기록 안 — 이름으로 찾은 사진. 못 찾을 때(설정 전·오프라인)도 '직접 찍기'는
 * 늘 남겨 둔다.
 */
export function PhotoGrid({
  query,
  selected,
  onPick,
  onCamera,
  onClear,
}: {
  query: string
  selected?: string
  onPick: (blob: Blob, thumb: string) => void
  onCamera: () => void
  onClear: () => void
}) {
  const { items, loading, more, end, moreBusy } = usePhotoSearch(query, true)
  const [shown, setShown] = useState(8)
  const [busy, setBusy] = useState<string>()
  const [err, setErr] = useState('')
  useEffect(() => setShown(8), [query])

  async function tap(h: PhotoHit) {
    if (busy) return
    // 고른 사진을 다시 누르면 고르기 취소
    if (selected === h.thumb) return onClear()
    setBusy(h.thumb)
    setErr('')
    const blob = await fetchPhoto(h)
    setBusy(undefined)
    if (!blob) return setErr('사진을 가져오지 못했어요. 다른 사진을 골라 주세요.')
    onPick(blob, h.thumb)
  }

  const hits = items ?? []
  const canMore = hits.length > shown || !end
  async function showMore() {
    if (hits.length <= shown && !(await more())) return
    setShown((n) => n + 8)
  }
  return (
    <div className="pk-wrap">
      <div className="pk-head">
        <b>이 이름으로 찾은 사진</b>
        <span>{loading ? '찾는 중…' : selected ? '다시 누르면 취소돼요' : hits.length ? '하나를 눌러 고르세요' : ''}</span>
      </div>
      {items === null ? (
        <div className="pk-empty">{failText()}</div>
      ) : !loading && hits.length === 0 ? (
        <div className="pk-empty">찾은 사진이 없어요. 이름을 조금 줄여 보세요</div>
      ) : (
        <Grid hits={hits.slice(0, shown)} selected={selected} busy={busy} onTap={tap} cols={4} />
      )}
      {err && <div className="nv-err">{err}</div>}
      {!loading && hits.length > 0 && !canMore && (
        <div className="pk-end">사진을 다 봤어요. 이름을 줄이거나 바꾸면 다른 사진이 나와요</div>
      )}
      <div className="pk-more">
        {canMore && (
          <button type="button" disabled={moreBusy} onClick={showMore}>{moreBusy ? '불러오는 중…' : '사진 더 보기'}</button>
        )}
        {selected && (
          <button type="button" onClick={onClear}>고르기 취소</button>
        )}
        <button type="button" onClick={onCamera}><IconCamera size={16} />직접 찍기</button>
      </div>
      <div className="pk-src">사진 출처: 네이버 이미지 검색</div>
    </div>
  )
}

/** 기록 수정 — 아래에서 올라오는 창으로 이름 사진 찾기 */
export function PhotoFindSheet({
  initialQuery,
  onPick,
  onClose,
}: {
  initialQuery: string
  onPick: (blob: Blob) => void
  onClose: () => void
}) {
  useBackGuard(true, onClose)
  const [query, setQuery] = useState(initialQuery)
  const { items, loading, more, end, moreBusy } = usePhotoSearch(query, true, 400)
  const [sel, setSel] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [shown, setShown] = useState(12)
  useEffect(() => setShown(12), [query])
  const all = items ?? []
  const hits = all.slice(0, shown)
  const canMore = all.length > shown || !end
  async function showMore() {
    if (all.length <= shown && !(await more())) return
    setShown((n) => n + 12)
  }

  async function use() {
    if (!sel) return
    setBusy(true)
    setErr('')
    const hit = (items ?? []).find((h) => h.thumb === sel)
    if (!hit) return
    const blob = await fetchPhoto(hit)
    setBusy(false)
    if (!blob) return setErr('사진을 가져오지 못했어요. 다른 사진을 골라 주세요.')
    onPick(blob)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">사진 고르기</h2>
        <input
          className="input pk-q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSel(undefined)
          }}
          placeholder="제품 이름으로 찾기"
        />
        {items === null ? (
          <div className="pk-empty">{failText()}</div>
        ) : loading && hits.length === 0 ? (
          <div className="pk-empty">찾는 중…</div>
        ) : hits.length === 0 ? (
          <div className="pk-empty">{nameKey(query).length < 2 ? '두 글자 이상 적어 주세요' : '찾은 사진이 없어요. 이름을 조금 줄여 보세요'}</div>
        ) : (
          <Grid hits={hits} selected={sel} onTap={(h) => setSel(sel === h.thumb ? undefined : h.thumb)} cols={3} />
        )}
        {hits.length > 0 && (canMore ? (
          <div className="pk-more">
            <button type="button" disabled={moreBusy} onClick={showMore}>{moreBusy ? '불러오는 중…' : '사진 더 보기'}</button>
          </div>
        ) : (
          <div className="pk-end">사진을 다 봤어요. 위에서 이름을 줄이거나 바꿔 보세요</div>
        ))}
        {err && <div className="nv-err">{err}</div>}
        <button className="nv-go" disabled={!sel || busy} onClick={use}>
          {busy ? '사진 가져오는 중…' : '이 사진 쓰기'}
        </button>
        <button type="button" className="pk-cancel" onClick={onClose}>그만두기</button>
        <div className="pk-src" style={{ textAlign: 'center' }}>사진 출처: 네이버 이미지 검색 · 저장을 눌러야 바뀌어요</div>
      </div>
    </div>
  )
}
