import { useRef, useState } from 'react'
import { BaseChooser, KindChooser, ReactionEditor, useCatsAndGroups } from '../components/common'
import type { ReactionLevel } from '../data/types'
import { addSnack, savePhoto } from '../data/repo'
import { compressImage } from '../lib/image'
import { readText } from '../lib/ocr'
import { IconCamera, IconChevronDown, IconChevronLeft, IconScan } from '../components/icons'

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

  const [ocrState, setOcrState] = useState<'idle' | 'running'>('idle')
  const [ocrProgress, setOcrProgress] = useState(0)

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blob = await compressImage(file)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoBlob(blob)
    setPhotoPreview(URL.createObjectURL(blob))
    e.target.value = '' // 같은 파일 다시 선택 가능하게
  }

  async function runOCR() {
    if (!photoBlob) return
    setOcrState('running')
    setOcrProgress(0)
    try {
      const text = await readText(photoBlob, (p) => setOcrProgress(p))
      if (text) setName((prev) => prev || text)
    } catch (err) {
      console.error('OCR 실패', err)
      alert('글자를 읽지 못했어요. 직접 입력해 주세요.')
    } finally {
      setOcrState('idle')
    }
  }

  async function save() {
    setSaving(true)
    try {
      let photoId: string | undefined
      if (photoBlob) photoId = await savePhoto(photoBlob)
      await addSnack({ name, kind, base, memo, photoId, reactions })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const canSave = name.trim().length > 0 || Object.keys(reactions).length > 0 || !!photoBlob

  return (
    <div className="screen">
      <div className="topbar page-top">
        <button className="back-inline" onClick={onCancel} aria-label="뒤로">
          <IconChevronLeft size={22} />
        </button>
        <h1 style={{ fontSize: 19 }}>새 기록</h1>
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
                    <button className="mini-btn" onClick={() => fileRef.current?.click()}>다시 찍기</button>
                    <button className="mini-btn" onClick={runOCR} disabled={ocrState === 'running'}>
                      {ocrState === 'running' ? (
                        `읽는 중 ${Math.round(ocrProgress * 100)}%`
                      ) : (
                        <><IconScan size={16} />사진에서 제목 읽기</>
                      )}
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

      {/* 저장 — 맨 하단 */}
      <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} disabled={!canSave || saving} onClick={save}>
        {saving ? '저장중…' : '기록 저장하기'}
      </button>
    </div>
  )
}
