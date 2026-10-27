// 사진 다듬기 — 여백·배경색·흰 바탕 지우기·돌리기를 캔버스로 그린다.
// 모두 폰 안에서 처리한다(서버·인공지능 모델 없음). 결과는 정사각 사진.

export interface EditOpts {
  /** contain = 전체 보이기, cover = 꽉 채우기 */
  fit: 'contain' | 'cover'
  /** 둘레 여백 (한 변 길이에 대한 비율, 0 ~ 0.3) */
  pad: number
  /** 배경색 */
  bg: string
  /** 가장자리에서 이어진 흰 바탕을 지운다 */
  clearWhite: boolean
  /** 시계 방향 돌리기 */
  rotate: 0 | 90 | 180 | 270
}

export const DEFAULT_EDIT: EditOpts = { fit: 'contain', pad: 0.08, bg: '#ffffff', clearWhite: false, rotate: 0 }

export const BG_COLORS = [
  { c: '#ffffff', name: '흰색' },
  { c: '#fdf6ec', name: '크림' },
  { c: '#fde3cf', name: '연한 주황' },
  { c: '#fbf0c9', name: '연한 노랑' },
  { c: '#dcebf7', name: '연한 하늘' },
  { c: '#ececec', name: '연한 회색' },
]

const SIZE = 960

/** 원본을 돌린 캔버스 */
function rotated(src: CanvasImageSource, w: number, h: number, deg: EditOpts['rotate']) {
  const side = deg === 90 || deg === 270
  const c = document.createElement('canvas')
  c.width = side ? h : w
  c.height = side ? w : h
  const ctx = c.getContext('2d')!
  ctx.translate(c.width / 2, c.height / 2)
  ctx.rotate((deg * Math.PI) / 180)
  ctx.drawImage(src, -w / 2, -h / 2, w, h)
  return c
}

/**
 * 가장자리에서 이어진 '거의 흰' 픽셀을 투명하게 한다.
 * 제품 안쪽의 흰 글씨·라벨은 가장자리와 이어져 있지 않으면 남는다.
 */
export function clearWhiteEdges(data: Uint8ClampedArray, w: number, h: number, tol = 28) {
  const isWhite = (i: number) => {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const lo = Math.min(r, g, b), hi = Math.max(r, g, b)
    return lo >= 255 - tol && hi - lo <= 18
  }
  const seen = new Uint8Array(w * h)
  const stack: number[] = []
  const push = (p: number) => {
    if (seen[p]) return
    seen[p] = 1
    if (isWhite(p * 4)) stack.push(p)
  }
  for (let x = 0; x < w; x++) {
    push(x)
    push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    push(y * w)
    push(y * w + w - 1)
  }
  while (stack.length) {
    const p = stack.pop()!
    data[p * 4 + 3] = 0
    const x = p % w
    if (x > 0) push(p - 1)
    if (x < w - 1) push(p + 1)
    if (p >= w) push(p - w)
    if (p < w * (h - 1)) push(p + w)
  }
}

/** 다듬은 결과를 정사각 캔버스로 */
export function renderEdit(src: CanvasImageSource, w: number, h: number, o: EditOpts, size = SIZE) {
  let img = rotated(src, w, h, o.rotate)
  if (o.clearWhite) {
    // 큰 사진은 줄여서 처리해야 빠르다
    const s = Math.min(1, 800 / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * s)
    c.height = Math.round(img.height * s)
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, c.width, c.height)
    const d = ctx.getImageData(0, 0, c.width, c.height)
    clearWhiteEdges(d.data, c.width, c.height)
    ctx.putImageData(d, 0, 0)
    img = c
  }
  const out = document.createElement('canvas')
  out.width = out.height = size
  const ctx = out.getContext('2d')!
  ctx.fillStyle = o.bg
  ctx.fillRect(0, 0, size, size)
  const inner = size * (1 - 2 * o.pad)
  const k = o.fit === 'contain'
    ? Math.min(inner / img.width, inner / img.height)
    : Math.max(inner / img.width, inner / img.height)
  const dw = img.width * k, dh = img.height * k
  ctx.save()
  // 꽉 채우기여도 여백 밖으로는 넘치지 않게
  const p = size * o.pad
  ctx.beginPath()
  ctx.rect(p, p, inner, inner)
  ctx.clip()
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
  ctx.restore()
  return out
}

export function canvasToJpeg(c: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86))
}
