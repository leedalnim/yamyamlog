import { useEffect, useMemo, useRef, useState } from 'react'
import { BaseChooser, KindChooser, ReactionEditor, useCatsAndGroups } from '../components/common'
import type { ReactionLevel, Snack } from '../data/types'
import { REACTION_META } from '../data/types'
import { addSnack, listSnacks, savePhoto, updateSnack } from '../data/repo'
import { compressImage } from '../lib/image'
import { joinBase, splitBase } from '../lib/base'
import { shortDate } from '../lib/date'
import { nameKey, sameProduct } from '../lib/name'
import { IconCamera, IconChevronDown, IconChevronLeft } from '../components/icons'

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

  const showDupHint = !!dup && !mergeInto && dismissedKey !== nameKey(name)

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
    if (photoPreview) URL.revokeObjectURL(photoPreview)
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

  const canSave = name.trim().length > 0 || Object.keys(reactions).length > 0 || !!photoBlob

  return (
    <div className="screen">
      {/* 저장은 위에 붙여 둔다 — '자세히 입력하기'를 펼치면 아래까지 한참 내려가야 했다 */}
      <div className="topbar page-top sticky-top">
        <button className="back-inline" onClick={onCancel} aria-label="뒤로">
          <IconChevronLeft size={22} />
        </button>
        <h1 style={{ fontSize: 19 }}>{mergeInto ? '기록에 더하기' : '새 기록'}</h1>
        <button className="save-top" disabled={!canSave || saving} onClick={save}>
          {saving ? '저장중…' : '저장'}
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
          onChange={(e) => setName(e.target.value)}
        />

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
                <div className="photo-box">
                  <img src={photoPreview} alt="제품 사진" />
                  <div className="photo-actions">
                    {/* 보관함에서도 고를 수 있어 '다시 찍기'는 맞지 않는다 */}
                    <button className="mini-btn" onClick={() => fileRef.current?.click()}>사진 바꾸기</button>
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
    </div>
  )
}
