import { useEffect, useMemo, useRef, useState } from 'react'
import { BaseChooser, KindChooser, ReactionEditor, useCatsAndGroups, usePhotoURL } from '../components/common'
import { Highlight, NaverMark, ShopPhotoSheet, ShopRow, useShopSearch } from '../components/shop'
import type { ReactionLevel, Snack } from '../data/types'
import { REACTION_META } from '../data/types'
import { addSnack, listSnacks, savePhoto, updateSnack } from '../data/repo'
import { compressImage } from '../lib/image'
import { joinBase, splitBase } from '../lib/base'
import { shortDate } from '../lib/date'
import { nameKey, sameProduct } from '../lib/name'
import { IconCamera, IconChevronDown, IconChevronLeft } from '../components/icons'
import { fetchShopImage, shopState } from '../lib/naver'
import { toDraft, type ShopItem } from '../lib/shop'

export function AddScreen({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { cats, groups } = useCatsAndGroups()
  const fileRef = useRef<HTMLInputElement>(null)

  const [photoBlob, setPhotoBlob] = useState<Blob>()
  const [photoPreview, setPhotoPreview] = useState<string>()
  const [name, setName] = useState('')
  const [kind, setKind] = useState('')
  const [base, setBase] = useState('')
  const [memo, setMemo] = useState('')
  const [reactions, setReactions] = useState<Record<string, ReactionLevel>>({})
  const [saving, setSaving] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  // ---- 같은 제품이 이미 있는지 ----
  // 기록이 쌓이면 이미 있는 제품을 또 적기 쉽다. 이름이 같으면(띄어쓰기·기호
  // 무시) 알려주고, 원하면 새로 만들지 않고 그 기록에 이어서 적게 한다.
  const [existing, setExisting] = useState<Snack[]>([])
  const [mergeInto, setMergeInto] = useState<Snack | null>(null)
  const [dismissedKey, setDismissedKey] = useState('')

  useEffect(() => {
    void listSnacks().then(setExisting)
  }, [])

  const dup = useMemo(
    () => (name.trim() ? existing.find((s) => sameProduct(name, s.name)) : undefined),
    [existing, name],
  )

  // 이어서 적는 중에 이름을 다른 제품으로 고치면 이어 적기를 푼다
  useEffect(() => {
    if (mergeInto && !sameProduct(name, mergeInto.name)) setMergeInto(null)
  }, [name, mergeInto])

  // ---- 이름을 치는 동안: 내 기록 + 네이버 쇼핑 ----
  const [suggestOpen, setSuggestOpen] = useState(false)
  const typed = nameKey(name)
  const suggesting = suggestOpen && typed.length >= 2 && !mergeInto
  // 친 낱말이 모두 들어 있으면 — '조공 산양' 은 '조공 네덜란드 산양유 양갱' 과 맞는다
  const myMatches = useMemo(() => {
    if (!suggesting) return []
    const words = name.split(/\s+/).map(nameKey).filter(Boolean)
    return existing.filter((s) => words.every((w) => nameKey(s.name).includes(w))).slice(0, 3)
  }, [existing, name, suggesting])
  const shop = useShopSearch(name, suggesting)
  const shopItems = shop.items ?? []
  const showSuggest =
    suggesting && (myMatches.length > 0 || shopItems.length > 0 || (shop.loading && shopState() === 'ok'))

  // 네이버 쇼핑에서 채웠을 때 — '되돌리기'용으로 채우기 전 값을 들고 있는다
  type Snap = { name: string; kind: string; base: string; memo: string; photoBlob?: Blob; photoPreview?: string }
  const [filled, setFilled] = useState<{ item: ShopItem; items: ShopItem[]; snap: Snap } | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoNote, setPhotoNote] = useState('')
  const [photoSheet, setPhotoSheet] = useState(false)
  const photoReq = useRef<string | null>(null)

  async function loadShopPhoto(url: string, fallback?: { blob?: Blob; preview?: string }) {
    photoReq.current = url
    setPhotoNote('')
    setPhotoLoading(true)
    setPhotoBlob(undefined)
    setPhotoPreview(url) // 받는 동안 쇼핑 사진을 바로 보여준다
    const blob = await fetchShopImage(url)
    if (photoReq.current !== url) return // 그사이 다른 걸 골랐다
    setPhotoLoading(false)
    if (blob) {
      setPhotoBlob(blob)
      setPhotoPreview(URL.createObjectURL(blob))
    } else {
      setPhotoBlob(fallback?.blob)
      setPhotoPreview(fallback?.preview)
      setPhotoNote('사진은 가져오지 못했어요. 직접 찍거나 다른 사진을 골라 주세요.')
    }
  }

  function pickShop(item: ShopItem) {
    const d = toDraft(item)
    const snap: Snap = { name, kind, base, memo, photoBlob, photoPreview }
    setFilled({ item, items: shopItems, snap })
    setName(d.name)
    if (d.kind) setKind(d.kind)
    if (d.base.length) setBase(joinBase([...splitBase(base), ...d.base]))
    if (d.memo && !memo.trim()) setMemo(d.memo)
    setSuggestOpen(false)
    setMoreOpen(true)
    if (d.image) void loadShopPhoto(d.image, { blob: photoBlob, preview: photoPreview })
  }

  function undoShop() {
    if (!filled) return
    const s = filled.snap
    photoReq.current = null
    setPhotoLoading(false)
    setPhotoNote('')
    setName(s.name)
    setKind(s.kind)
    setBase(s.base)
    setMemo(s.memo)
    setPhotoBlob(s.photoBlob)
    setPhotoPreview(s.photoPreview)
    setFilled(null)
  }

  function pickMine(s: Snack) {
    setName(s.name)
    startMerge(s)
    setSuggestOpen(false)
  }

  const showDupHint = !!dup && !mergeInto && dismissedKey !== nameKey(name) && !suggestOpen

  function startMerge(target: Snack) {
    setMergeInto(target)
    // 이미 적혀 있는 반응을 미리 채운다. 방금 고른 게 있으면 그쪽이 이긴다.
    setReactions((prev) => ({ ...target.reactions, ...prev }))
  }

  function dupSummary(s: Snack): string {
    const who = cats
      .filter((c) => s.reactions[c.id])
      .map((c) => `${c.name} ${REACTION_META[s.reactions[c.id] as ReactionLevel].short}`)
    return [shortDate(s.createdAt), who.length ? who.join(', ') : '반응 없음'].join(' · ')
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = await compressImage(file)
    photoReq.current = null
    setPhotoLoading(false)
    setPhotoNote('')
    setPhotoBlob(blob)
    setPhotoPreview(URL.createObjectURL(blob))
    e.target.value = '' // 같은 파일 다시 선택 가능하게
  }

  async function save() {
    setSaving(true)
    try {
      if (mergeInto) {
        // 기존 기록에 더한다. 이미 있는 값을 말없이 덮지 않는다:
        // 원료는 합치고, 메모는 다르면 이어 붙이고, 종류·사진은 비어 있을 때만 채운다.
        const photoId =
          mergeInto.photoId ?? (photoBlob ? await savePhoto(photoBlob) : undefined)
        const newMemo = memo.trim()
        const memoMerged =
          mergeInto.memo && newMemo && mergeInto.memo !== newMemo
            ? `${mergeInto.memo} / ${newMemo}`
            : mergeInto.memo || newMemo || undefined
        await updateSnack({
          ...mergeInto,
          reactions,
          kind: mergeInto.kind || kind.trim() || undefined,
          base: joinBase([...splitBase(mergeInto.base), ...splitBase(base)]) || undefined,
          memo: memoMerged,
          photoId,
        })
      } else {
        let photoId: string | undefined
        if (photoBlob) photoId = await savePhoto(photoBlob)
        await addSnack({ name, kind, base, memo, photoId, reactions })
      }
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const canSave = (name.trim().length > 0 || Object.keys(reactions).length > 0 || !!photoBlob) && !photoLoading

  return (
    <div className="screen">
      {/* 저장은 위에 붙여 둔다 — '자세히 입력하기'를 펼치면 아래까지 한참 내려가야 했다 */}
      <div className="topbar page-top sticky-top">
        <button className="back-inline" onClick={onCancel} aria-label="뒤로">
          <IconChevronLeft size={22} />
        </button>
        <h1 style={{ fontSize: 19 }}>{mergeInto ? '기록에 더하기' : '새 기록'}</h1>
        <button className="save-top" disabled={!canSave || saving} onClick={save}>
          {saving ? '저장중…' : photoLoading ? '사진 받는 중' : '저장'}
        </button>
      </div>

      {/* capture 를 붙이면 카메라만 열린다. 빼 두면 아이폰이
          '사진 보관함 / 사진 찍기'를 함께 물어본다. */}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />

      {/* 제목 — 가장 중요 */}
      <div className="field">
        <label>제품 이름</label>
        <input
          className="input"
          placeholder="예: 챠오 츄르 참치맛"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSuggestOpen(true)
          }}
          onFocus={() => setSuggestOpen(true)}
          // 목록을 누를 틈을 준다 (목록 버튼은 mousedown 을 막아 포커스를 지킨다)
          onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
        />

        {showSuggest && (
          <div className="nv-drop">
            {myMatches.length > 0 && (
              <>
                <div className="nv-h"><span>내 기록</span></div>
                {myMatches.map((s) => (
                  <MyRow key={s.id} snack={s} query={name} summary={dupSummary(s)} onPick={() => pickMine(s)} />
                ))}
              </>
            )}
            {myMatches.length > 0 && (shopItems.length > 0 || shop.loading) && <div className="nv-sep" />}
            {(shopItems.length > 0 || shop.loading) && (
              <>
                <div className="nv-h">
                  <span><NaverMark /> 네이버 쇼핑</span>
                  <span className="nv-h-r">{shop.loading && shopItems.length === 0 ? '찾는 중…' : '누르면 정보가 채워져요'}</span>
                </div>
                {shopItems.slice(0, 5).map((it, i) => (
                  <ShopRow key={i + it.link} item={it} query={name} onPick={() => pickShop(it)} />
                ))}
              </>
            )}
          </div>
        )}

        {filled && (
          <div className="nv-filled">
            <NaverMark />
            <span>네이버 쇼핑 정보로 채웠어요 · 고쳐도 돼요</span>
            <button onClick={undoShop}>되돌리기</button>
          </div>
        )}

        {showDupHint && dup && (
          <div className="dup-hint">
            <div className="dup-title">이미 있는 기록이에요</div>
            <div className="dup-body">
              <b>{dup.name}</b> <span className="muted">· {dupSummary(dup)}</span>
            </div>
            <div className="dup-actions">
              <button className="dup-primary" onClick={() => startMerge(dup)}>
                그 기록에 반응 더하기
              </button>
              <button className="dup-secondary" onClick={() => setDismissedKey(nameKey(name))}>
                새로 따로 만들기
              </button>
            </div>
          </div>
        )}

        {mergeInto && (
          <div className="merge-note">
            <span>
              <b>{mergeInto.name}</b> 기록에 이어서 적는 중이에요. 이미 적힌 반응이 채워져 있어요.
            </span>
            <button
              onClick={() => {
                setMergeInto(null)
                setDismissedKey(nameKey(name))
              }}
            >
              따로 만들기
            </button>
          </div>
        )}
      </div>

      {/* 반응 — 두 번째로 중요 */}
      <div className="field">
        <label>누가 잘 먹었나요?</label>
        <ReactionEditor cats={cats} groups={groups} value={reactions} onChange={setReactions} />
      </div>

      {/* 선택 정보 — 접어서 짧게 */}
      <div className="card edit-acc add-screen-acc" style={{ marginTop: 4 }}>
        <button className="edit-acc-head" onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}>
          {'자세히 입력하기 (사진 · 종류 · 원료 · 메모)'}
          <span className={'snack-chev' + (moreOpen ? ' open' : '')}><IconChevronDown size={18} /></span>
        </button>
        {moreOpen && (
          <div className="edit-acc-body">
            <div className="field">
              <label>사진</label>
              {photoPreview ? (
                <div className="photo-box nv-photo">
                  <img src={photoPreview} alt="제품 사진" referrerPolicy="no-referrer" />
                  {filled && !photoNote && (
                    <span className="nv-tag">{photoLoading ? '사진 받는 중…' : '네이버 쇼핑 사진'}</span>
                  )}
                  <div className="photo-actions">
                    {filled && filled.items.some((it) => it.image) ? (
                      <>
                        <button className="mini-btn" onClick={() => setPhotoSheet(true)}>다른 사진 고르기</button>
                        <button className="mini-btn" onClick={() => fileRef.current?.click()}>직접 찍기</button>
                      </>
                    ) : (
                      // 보관함에서도 고를 수 있어 '다시 찍기'는 맞지 않는다
                      <button className="mini-btn" onClick={() => fileRef.current?.click()}>사진 바꾸기</button>
                    )}
                  </div>
                </div>
              ) : (
                <button className="photo-drop slim" onClick={() => fileRef.current?.click()}>
                  <IconCamera size={20} />
                  사진 추가하기
                </button>
              )}
              {photoNote && <div className="nv-err">{photoNote}</div>}
            </div>
            <div className="field">
              <label>종류</label>
              <KindChooser value={kind} onChange={setKind} />
            </div>
            <div className="field">
              <label>원료</label>
              <BaseChooser value={base} onChange={setBase} />
            </div>
            <div className="field">
              <label>메모</label>
              <textarea
                className="textarea"
                placeholder="브랜드, 맛, 특이사항 등"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {photoSheet && filled && (
        <ShopPhotoSheet
          items={filled.items}
          title={filled.snap.name.trim() || name}
          onClose={() => setPhotoSheet(false)}
          onPick={(blob) => {
            photoReq.current = null
            setPhotoLoading(false)
            setPhotoNote('')
            setPhotoBlob(blob)
            setPhotoPreview(URL.createObjectURL(blob))
            setPhotoSheet(false)
          }}
        />
      )}
    </div>
  )
}

/** 이름을 치는 동안 뜨는 '내 기록' 한 줄 — 누르면 그 기록에 반응을 더한다 */
function MyRow({ snack, query, summary, onPick }: { snack: Snack; query: string; summary: string; onPick: () => void }) {
  const url = usePhotoURL(snack.photoId)
  return (
    <button type="button" className="nv-row" onMouseDown={(e) => e.preventDefault()} onClick={onPick}>
      {url ? <img src={url} alt="" /> : <span className="nv-noimg" />}
      <span className="nv-txt">
        <span className="nv-t"><Highlight text={snack.name} query={query} /></span>
        <span className="nv-s">{summary}</span>
      </span>
      <span className="nv-mine">반응 더하기</span>
    </button>
  )
}
