// 사진을 적당한 크기로 압축해서 저장 용량을 아낍니다.
// (원본 사진은 몇 MB라 그대로 두면 무료 저장 용량이 금방 참)

const MAX_DIM = 1280
const QUALITY = 0.82

export async function compressImage(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  const scale = Math.min(1, MAX_DIM / Math.max(width, height))
  width = Math.round(width * scale)
  height = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      'image/jpeg',
      QUALITY,
    )
  })
}
