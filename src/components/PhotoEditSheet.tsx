// 사진 다듬기 창 — 전체 보이기/꽉 채우기, 여백, 배경색, 흰 바탕 지우기, 돌리기.
// '이 사진으로'를 눌러도 기록은 '저장'을 눌러야 바뀐다.

import { useEffect, useRef, useState } from 'react'
import { BG_COLORS, DEFAULT_EDIT, canvasToJpeg, renderEdit, type EditOpts } from '../lib/photoEdit'
import { useBackGuard } from '../lib/useBackGuard'
import { cutout } from '../lib/cutout'
import { IconCheck } from './icons'

export function PhotoEditSheet({
  src,
  onDone,
  onClose,
}: {
  /** 다듬을 사진 주소 (blob: 주소) */
  src: string
  onDone: (blob: Blob) => void
  onClose: () => void
}) {
  useBackGuard(true, onClose)
  const [img, setImg] = useState<HTMLImageElement>()
  const [o, setO] = useState<EditOpts>(DEFAULT_EDIT)
  const [busy, setBusy] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  // 누끼: idle → pick(제품 누르기) → working → 결과(cut)
  const [cutMode, setCutMode] = useState<'idle' | 'pick' | 'working'>('idle')
  const [cut, setCut] = useState<HTMLCanvasElement | null>(null)
  const [cutErr, setCutErr] = useState('')
  // 지금 그릴 원본 — 누끼를 땄으면 누끼 결과
  const srcOf = (): [CanvasImageSource, number, number] | null =>
    cut ? [cut, cut.width, cut.height] : img ? [img, img.naturalWidth, img.naturalHeight] : null
  const set = (p: Partial<EditOpts>) => setO((v) => ({ ...v, ...p }))

  useEffect(() => {
    const i = new Image()
    i.onload = () => setImg(i)
    i.src = src
  }, [src])

  // 미리보기는 작게 그려 빠르게
  // 제품 누르기 중에는 원본을 여백·돌리기 없이 보여 준다 (누른 자리를 사진 위치로 바로 옮기려고)
  const picking = cutMode !== 'idle'
  useEffect(() => {
    const s = srcOf()
    if (!s || !box.current) return
    const view: EditOpts = picking && img
      ? { fit: 'contain', pad: 0, bg: '#00000000', clearWhite: false, rotate: 0 }
      : { ...o, clearWhite: o.clearWhite && !cut }
    const c = picking && img
      ? renderEdit(img, img.naturalWidth, img.naturalHeight, view, 480)
      : renderEdit(s[0], s[1], s[2], view, 480)
    c.className = 'pe-canvas'
    box.current.replaceChildren(c)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, o, cut, picking])

  async function tapPreview(e: React.MouseEvent<HTMLDivElement>) {
    if (cutMode !== 'pick' || !img) return
    const r = e.currentTarget.getBoundingClientRect()
    // 정사각 미리보기 안에서 사진이 차지한 자리
    const k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight)
    const dw = img.naturalWidth * k, dh = img.naturalHeight * k
    const x = (e.clientX - r.left - (r.width - dw) / 2) / dw
    const y = (e.clientY - r.top - (r.height - dh) / 2) / dh
    if (x < 0 || x > 1 || y < 0 || y > 1) return
    setCutMode('working')
    setCutErr('')
    const c = await cutout(img, x, y)
    setCutMode('idle')
    if (!c) return setCutErr('누끼를 따지 못했어요. 인터넷 연결을 확인하고 다시 해 주세요.')
    setCut(c)
  }

  async function done() {
    const s = srcOf()
    if (!s) return
    setBusy(true)
    const blob = await canvasToJpeg(renderEdit(s[0], s[1], s[2], { ...o, clearWhite: o.clearWhite && !cut }))
    setBusy(false)
    if (blob) onDone(blob)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">사진 다듬기</h2>

        <div className={'pe-preview-wrap' + (picking ? ' picking' : '')} onClick={tapPreview}>
          <div className="pe-preview" ref={box} />
          {cutMode === 'pick' && <div className="pe-hint">남길 제품을 눌러 주세요</div>}
          {cutMode === 'working' && <div className="pe-hint">누끼 따는 중… <small>처음엔 조금 걸려요</small></div>}
        </div>

        <div className="pe-cutrow">
          {cut ? (
            <>
              <span className="pe-cut-ok"><IconCheck size={14} />누끼를 땄어요</span>
              <button onClick={() => { setCut(null); setCutMode('pick') }}>다시 따기</button>
              <button onClick={() => setCut(null)}>누끼 취소</button>
            </>
          ) : cutMode === 'pick' ? (
            <button className="wide" onClick={() => setCutMode('idle')}>누끼 그만두기</button>
          ) : (
            <button className="wide primary" disabled={!img || cutMode === 'working'} onClick={() => setCutMode('pick')}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" /></svg>
              누끼 따기 <small>제품만 남기고 배경 지우기</small>
            </button>
          )}
        </div>
        {cutErr && <div className="nv-err">{cutErr}</div>}

        <div className="pe-row">
          <div className="pe-seg" role="group" aria-label="맞춤">
            <button className={o.fit === 'contain' ? 'on' : ''} onClick={() => set({ fit: 'contain' })}>전체 보이기</button>
            <button className={o.fit === 'cover' ? 'on' : ''} onClick={() => set({ fit: 'cover' })}>꽉 채우기</button>
          </div>
          <button className="pe-rot" onClick={() => set({ rotate: (((o.rotate + 90) % 360) as EditOpts['rotate']) })} aria-label="오른쪽으로 돌리기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>
            돌리기
          </button>
        </div>

        <label className="pe-label">
          <span>여백</span>
          <b>{Math.round(o.pad * 100)}%</b>
        </label>
        <input className="pe-range" type="range" min={0} max={30} value={Math.round(o.pad * 100)} onChange={(e) => set({ pad: Number(e.target.value) / 100 })} />

        <div className="pe-label"><span>배경색</span></div>
        <div className="pe-colors">
          {BG_COLORS.map((b) => (
            <button key={b.c} className={'pe-color' + (o.bg === b.c ? ' on' : '')} style={{ background: b.c }} onClick={() => set({ bg: b.c })} aria-label={b.name} aria-pressed={o.bg === b.c}>
              {o.bg === b.c && <IconCheck size={14} />}
            </button>
          ))}
        </div>

        {!cut && <button className={'pe-toggle' + (o.clearWhite ? ' on' : '')} onClick={() => set({ clearWhite: !o.clearWhite })} aria-pressed={o.clearWhite}>
          <span className="pe-toggle-txt">
            <b>흰 바탕 지우기</b>
            <small>쇼핑몰 사진처럼 바탕이 흰 사진에 좋아요</small>
          </span>
          <span className="pe-switch"><i /></span>
        </button>}

        <button className="nv-go" disabled={!img || busy} onClick={done}>{busy ? '만드는 중…' : '이 사진으로'}</button>
        <button type="button" className="pk-cancel" onClick={onClose}>그만두기</button>
        <div className="pk-src" style={{ textAlign: 'center' }}>저장을 눌러야 바뀌어요 · 원래 사진으로 되돌릴 수 있어요</div>
      </div>
    </div>
  )
}
