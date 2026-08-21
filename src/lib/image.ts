// 사진을 적당한 크기로 줄여서 저장 용량을 아낍니다.
// (원본 사진은 몇 MB라 그대로 두면 무료 저장 용량이 금방 참)
//
// 이 함수는 **절대 실패를 던지지 않습니다.** 줄이지 못하면 원본을 그대로
// 돌려줍니다. 아이폰 사진은 기본이 HEIC 라 브라우저가 못 읽는 경우가 있는데,
// 그때 예외가 튀면 사진이 그냥 안 붙고 아무 안내도 없이 끝나 버립니다.
// 화질보다 '사진이 붙는 것'이 우선입니다.

const MAX_DIM = 1280
const QUALITY = 0.82

/** createImageBitmap 이 못 읽는 형식은 <img> 로 한 번 더 시도한다 */
async function loadImage(file: File | Blob): Promise<ImageBitmap | HTMLImageElement | null> {
  try {
    return await createImageBitmap(file)
  } catch {
    // 계속 진행 — 아래에서 <img> 로 시도
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } catch {
    return null
  } finally {
    // decode 가 끝난 뒤에는 캔버스에 그릴 때까지 URL 이 살아 있을 필요가 없다
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
}

export async function compressImage(file: File | Blob): Promise<Blob> {
  try {
    const src = await loadImage(file)
    if (!src) return file

    const w0 = 'width' in src ? src.width : 0
    const h0 = 'height' in src ? src.height : 0
    if (!w0 || !h0) return file

    const scale = Math.min(1, MAX_DIM / Math.max(w0, h0))
    const width = Math.round(w0 * scale)
    const height = Math.round(h0 * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(src as CanvasImageSource, 0, 0, width, height)
    if ('close' in src) src.close()

    const out = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    })
    if (!out) return file
    // 줄인 게 오히려 더 크면(이미 작은 사진) 원본을 쓴다
    return out.size < file.size ? out : file
  } catch {
    return file
  }
}
