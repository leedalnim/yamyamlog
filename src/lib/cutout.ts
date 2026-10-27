// 누끼 따기 — 사진에서 누른 물건만 남기고 배경을 투명하게 한다.
//
// 구글이 공개한 MediaPipe '대화형 분할(Interactive Segmenter)' 모델을 폰 안에서
// 돌린다. 서버·열쇠·비용 없음. 처음 쓸 때만 프로그램(약 9MB)과 모델(약 6MB)을
// 받고, 그 뒤로는 브라우저가 기억한다. 앱을 처음 열 때는 받지 않는다(누끼를
// 누를 때만).

const VER = '0.10.14'
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`
const MODEL = 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite'

type Seg = import('@mediapipe/tasks-vision').InteractiveSegmenter
let loading: Promise<Seg> | null = null

function getSegmenter(): Promise<Seg> {
  if (!loading) {
    loading = (async () => {
      const { FilesetResolver, InteractiveSegmenter } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM)
      return InteractiveSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      })
    })()
    // 실패하면 다음에 다시 시도할 수 있게
    loading.catch(() => {
      loading = null
    })
  }
  return loading
}

/**
 * img 에서 (x, y)(0~1, 사진 안 비율) 위치의 물건만 남긴 캔버스.
 * 못 하면 null (인터넷 끊김 등).
 */
export async function cutout(img: HTMLImageElement, x: number, y: number): Promise<HTMLCanvasElement | null> {
  try {
    const seg = await getSegmenter()
    const w = img.naturalWidth, h = img.naturalHeight
    let alpha: Float32Array | null = null
    let mw = 0, mh = 0
    seg.segment(img, { keypoint: { x, y } }, (r) => {
      const m = r.confidenceMasks?.[0]
      if (!m) return
      mw = m.width
      mh = m.height
      alpha = m.getAsFloat32Array().slice()
      r.close()
    })
    if (!alpha || !mw) return null
    const a = alpha as Float32Array
    // 눌렀던 곳이 '물건'으로 잡혔는지 — 반대로 나오면 뒤집는다
    const at = a[Math.min(mh - 1, Math.floor(y * mh)) * mw + Math.min(mw - 1, Math.floor(x * mw))]
    const flip = at < 0.5

    // 마스크 크기로 사진을 그리고 투명도를 입힌다
    const c = document.createElement('canvas')
    c.width = mw
    c.height = mh
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h, 0, 0, mw, mh)
    const d = ctx.getImageData(0, 0, mw, mh)
    for (let i = 0; i < a.length; i++) {
      let v = flip ? 1 - a[i] : a[i]
      // 가장자리만 부드럽게, 나머지는 또렷하게
      v = Math.max(0, Math.min(1, (v - 0.35) / 0.3))
      d.data[i * 4 + 3] = Math.round(d.data[i * 4 + 3] * v)
    }
    ctx.putImageData(d, 0, 0)
    return trimToContent(c, d.data, mw, mh)
  } catch {
    return null
  }
}

/** 투명한 둘레를 잘라 제품이 화면을 채우게 한다 */
function trimToContent(c: HTMLCanvasElement, px: Uint8ClampedArray, w: number, h: number) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < 0) return c
  const out = document.createElement('canvas')
  out.width = x1 - x0 + 1
  out.height = y1 - y0 + 1
  out.getContext('2d')!.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height)
  return out
}
