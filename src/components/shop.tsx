// 네이버 쇼핑에서 찾아 기록 칸을 채우는 화면 조각들.
//   useShopSearch  — 글자를 치면 잠깐 기다렸다가 찾는다
//   ShopRow        — 결과 한 줄 (사진 + 이름 + 브랜드·종류·원료)
//   ShopPhotoSheet — 결과 사진들 중에서 하나 고르기
//   ShopFixSheet   — 이미 있는 기록을 쇼핑 정보로 고치기 (가져올 것만 체크)

import { useEffect, useMemo, useState } from 'react'
import { fetchShopImage, searchShop, shopState } from '../lib/naver'
import { toDraft, type ShopDraft, type ShopItem } from '../lib/shop'
import { joinBase, splitBase } from '../lib/base'
import { nameKey } from '../lib/name'
import { useBackGuard } from '../lib/useBackGuard'
import { IconCheck } from './icons'

export function NaverMark() {
  return <span className="nv-n" aria-hidden>N</span>
}

/** 친 글자를 결과 이름 안에서 주황으로 */
export function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter((w) => w.length >= 1)
  if (!words.length) return <>{text}</>
  const re = new RegExp('(' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi')
  const parts = text.split(re)
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>))}
    </>
  )
}

export function draftSummary(d: ShopDraft, it?: ShopItem): string {
  const brand = it ? (it.brand || it.maker) : ''
  return [brand, d.kind, d.base.join(', ')].filter(Boolean).join(' · ')
}

export function ShopRow({ item, query, onPick }: { item: ShopItem; query: string; onPick: () => void }) {
  const d = useMemo(() => toDraft(item), [item])
  return (
    // 누르는 순간 입력칸이 포커스를 잃어 목록이 닫히지 않게 mousedown 을 막는다
    <button type="button" className="nv-row" onMouseDown={(e) => e.preventDefault()} onClick={onPick}>
      {item.image ? (
        <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className="nv-noimg" />
      )}
      <span className="nv-txt">
        <span className="nv-t"><Highlight text={d.name} query={query} /></span>
        <span className="nv-s">{draftSummary(d, item) || ' '}</span>
      </span>
    </button>
  )
}

/** 치는 동안 0.4초 쉬면 찾는다. items: null = 못 씀(설정 전·오프라인) */
export function useShopSearch(query: string, enabled: boolean) {
  const [items, setItems] = useState<ShopItem[] | null>([])
  const [loading, setLoading] = useState(false)
  const q = query.trim()
  useEffect(() => {
    if (shopState() === 'off') {
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
      const r = await searchShop(q)
      if (!alive) return
      setItems(r)
      setLoading(false)
    }, 400)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q, enabled])
  return { items, loading }
}

// ---------------------------------------------------------------------------

export function ShopPhotoSheet({
  items,
  title,
  onPick,
  onClose,
}: {
  items: ShopItem[]
  title: string
  onPick: (blob: Blob, url: string) => void
  onClose: () => void
}) {
  useBackGuard(true, onClose)
  const withImg = items.filter((it) => it.image)
  const [sel, setSel] = useState(withImg[0]?.image)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function use() {
    if (!sel) return
    setBusy(true)
    setErr('')
    const blob = await fetchShopImage(sel)
    setBusy(false)
    if (!blob) return setErr('사진을 가져오지 못했어요. 잠시 후 다시 해 주세요.')
    onPick(blob, sel)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">사진 고르기</h2>
        <div className="nv-sub">‘{title}’ 네이버 쇼핑 결과</div>
        {withImg.length === 0 ? (
          <div className="nv-empty">사진이 있는 결과가 없어요</div>
        ) : (
          <div className="nv-grid">
            {withImg.slice(0, 12).map((it) => (
              <button
                type="button"
                key={it.image}
                className={'nv-cell' + (sel === it.image ? ' on' : '')}
                onClick={() => setSel(it.image)}
              >
                <img src={it.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
                {sel === it.image && <span className="nv-ck"><IconCheck size={14} /></span>}
                <span className="nv-cap">{toDraft(it).name}</span>
              </button>
            ))}
          </div>
        )}
        {err && <div className="nv-err">{err}</div>}
        <button className="nv-go" disabled={!sel || busy} onClick={use}>
          {busy ? '사진 가져오는 중…' : '이 사진 쓰기'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export interface FixCurrent {
  name: string
  kind: string
  base: string
  memo: string
  photoUrl?: string
}

export interface FixChanges {
  name?: string
  kind?: string
  base?: string
  memo?: string
  photo?: Blob
  photoPreview?: string
}

type Field = 'photo' | 'name' | 'kind' | 'base' | 'memo'

export function ShopFixSheet({
  current,
  onApply,
  onClose,
}: {
  current: FixCurrent
  onApply: (c: FixChanges) => void
  onClose: () => void
}) {
  useBackGuard(true, onClose)
  const [query, setQuery] = useState(current.name)
  const { items, loading } = useShopSearch(query, true)
  const [picked, setPicked] = useState<ShopItem | null>(null)

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet nv-fix" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">네이버 쇼핑 정보로 고치기</h2>
        {picked ? (
          <FixChecklist
            item={picked}
            current={current}
            onBack={() => setPicked(null)}
            onApply={onApply}
          />
        ) : (
          <>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제품 이름으로 찾기"
            />
            <div className="nv-results">
              {items === null ? (
                <div className="nv-empty">
                  {shopState() === 'off'
                    ? '네이버 검색이 아직 설정되지 않았어요'
                    : '지금은 찾을 수 없어요. 인터넷 연결을 확인해 주세요'}
                </div>
              ) : loading && items.length === 0 ? (
                <div className="nv-empty">찾는 중…</div>
              ) : items.length === 0 ? (
                <div className="nv-empty">{nameKey(query).length < 2 ? '두 글자 이상 적어 주세요' : '찾은 상품이 없어요'}</div>
              ) : (
                items.slice(0, 10).map((it, i) => (
                  <ShopRow key={i + it.link} item={it} query={query} onPick={() => setPicked(it)} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FixChecklist({
  item,
  current,
  onBack,
  onApply,
}: {
  item: ShopItem
  current: FixCurrent
  onBack: () => void
  onApply: (c: FixChanges) => void
}) {
  const d = useMemo(() => toDraft(item), [item])

  // 바뀔 값 — 원료는 합치고(지우지 않음), 메모는 뒤에 이어 붙인다
  const curBase = splitBase(current.base)
  const mergedBase = joinBase([...curBase, ...d.base])
  const memoNew =
    d.memo && !current.memo.includes(d.memo)
      ? current.memo.trim()
        ? `${current.memo.trim()} / ${d.memo}`
        : d.memo
      : undefined

  const rows: { f: Field; label: string; from: string; to: string; fill: boolean }[] = []
  if (d.image) rows.push({ f: 'photo', label: '사진', from: current.photoUrl ?? '', to: d.image, fill: !current.photoUrl })
  if (d.name && d.name !== current.name.trim())
    rows.push({ f: 'name', label: '이름', from: current.name, to: d.name, fill: false })
  if (d.kind && d.kind !== current.kind)
    rows.push({ f: 'kind', label: '종류', from: current.kind, to: d.kind, fill: !current.kind })
  if (mergedBase !== joinBase(curBase))
    rows.push({ f: 'base', label: '원료', from: joinBase(curBase), to: mergedBase, fill: true })
  if (memoNew) rows.push({ f: 'memo', label: '메모', from: current.memo, to: memoNew, fill: !current.memo.trim() })

  // 빈칸을 채우는 것만 처음부터 체크. 있는 값을 바꾸는 건 사용자가 고른다.
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rows.map((r) => [r.f, r.fill])),
  )
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const count = rows.filter((r) => on[r.f]).length

  async function apply() {
    setBusy(true)
    setErr('')
    const c: FixChanges = {}
    for (const r of rows) {
      if (!on[r.f]) continue
      if (r.f === 'photo') {
        const blob = await fetchShopImage(r.to)
        if (!blob) {
          setBusy(false)
          setErr('사진을 가져오지 못했어요. 사진 체크를 빼고 다시 하거나, 잠시 후 해 주세요.')
          return
        }
        c.photo = blob
        c.photoPreview = URL.createObjectURL(blob)
      } else c[r.f] = r.to
    }
    setBusy(false)
    onApply(c)
  }

  return (
    <>
      <button type="button" className="nv-pick" onClick={onBack}>
        {item.image ? <img src={item.image} alt="" referrerPolicy="no-referrer" /> : <span className="nv-noimg" />}
        <span className="nv-txt">
          <span className="nv-t">{d.name}</span>
          <span className="nv-s">{[item.brand || item.maker, item.category.slice(1, 3).join(' > ')].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="nv-change">바꾸기</span>
      </button>

      {rows.length === 0 ? (
        <div className="nv-empty">지금 기록과 다른 정보가 없어요</div>
      ) : (
        <>
          <div className="nv-sub" style={{ marginTop: 14 }}>가져올 정보 — 체크한 것만 바뀌어요</div>
          <div className="nv-list">
            {rows.map((r) => (
              <button
                type="button"
                key={r.f}
                className="nv-li"
                aria-pressed={!!on[r.f]}
                onClick={() => setOn((o) => ({ ...o, [r.f]: !o[r.f] }))}
              >
                <span className={'nv-cb' + (on[r.f] ? '' : ' off')}>{on[r.f] && <IconCheck size={14} />}</span>
                <span className="nv-k">{r.label}</span>
                <span className="nv-v">
                  {r.f === 'photo' ? (
                    <>
                      {r.from ? <img src={r.from} alt="" /> : <span className="nv-noimg sm" />}
                      <span className="nv-ar">→</span>
                      <img src={r.to} alt="" referrerPolicy="no-referrer" />
                    </>
                  ) : (
                    <>
                      <span className="nv-from">{r.from || '(없음)'}</span>
                      <span className="nv-ar">→</span>
                      <b>{r.to}</b>
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
      {err && <div className="nv-err">{err}</div>}
      <button className="nv-go" disabled={count === 0 || busy} onClick={apply}>
        {busy ? '가져오는 중…' : `체크한 ${count}가지 바꾸기`}
      </button>
      <div className="nv-foot">반응은 안 바뀌어요 · 수정 화면에서 ‘저장’을 눌러야 저장돼요</div>
    </>
  )
}
