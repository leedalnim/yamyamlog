import { useRef, useState } from 'react'
import { BaseChooser, ReactionEditor, useCatsAndGroups } from '../components/common'
import type { ReactionLevel } from '../data/types'
import { addSnack, savePhoto } from '../data/repo'
import { compressImage } from '../lib/image'
import { readText } from '../lib/ocr'
import { IconCamera, IconScan } from '../components/icons'

export function AddScreen({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { cats, groups } = useCatsAndGroups()
  const fileRef = useRef<HTMLInputElement>(null)

  const [photoBlob, setPhotoBlob] = useState<Blob>()
  const [photoPreview, setPhotoPreview] = useState<string>()
  const [name, setName] = useState('')
  const [base, setBase] = useState('')
  const [memo, setMemo] = useState('')
  const [reactions, setReactions] = useState<Record<string, ReactionLevel>>({})
  const [saving, setSaving] = useState(false)

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
      await addSnack({ name, base, memo, photoId, reactions })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const canSave = name.trim().length > 0 || Object.keys(reactions).length > 0 || !!photoBlob

  return (
    <div className="screen">
      <div className="topbar">
        <button className="link-btn" onClick={onCancel}>취소</button>
        <h1 style={{ fontSize: 18 }}>간식 기록</h1>
        <button className="link-btn strong" disabled={!canSave || saving} onClick={save}>
          {saving ? '저장중…' : '저장'}
        </button>
      </div>

      {/* 사진 */}
      <div className="field">
        <label>사진</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={onPickPhoto}
        />
        {photoPreview ? (
          <div className="photo-box">
            <img src={photoPreview} alt="간식 사진" />
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
          <button className="photo-drop" onClick={() => fileRef.current?.click()}>
            <span className="big"><IconCamera size={34} /></span>
            사진 찍기 / 고르기
          </button>
        )}
      </div>

      {/* 제목 */}
      <div className="field">
        <label>제품 이름</label>
        <input
          className="input"
          placeholder="예: 챠오 츄르 참치맛"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* 베이스(주재료) */}
      <div className="field">
        <label>베이스 (주재료)</label>
        <BaseChooser value={base} onChange={setBase} />
      </div>

      {/* 메모 */}
      <div className="field">
        <label>메모 (선택)</label>
        <textarea
          className="textarea"
          placeholder="브랜드, 맛, 특이사항 등"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {/* 반응 */}
      <div className="field">
        <label>누가 잘 먹었나요?</label>
        <ReactionEditor cats={cats} groups={groups} value={reactions} onChange={setReactions} />
      </div>

      <button className="btn btn-primary btn-block" disabled={!canSave || saving} onClick={save}>
        {saving ? '저장중…' : '기록 저장하기'}
      </button>
    </div>
  )
}
