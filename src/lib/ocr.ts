// 사진에서 글자 읽기 (OCR) — tesseract.js
// 무료이고 폰(브라우저) 안에서 처리됩니다. 별도 서버/비용 없음.
// 한국어 인식 데이터(traineddata)는 처음 한 번만 내려받아 캐시됩니다.

import type { Worker } from 'tesseract.js'

let workerPromise: Promise<Worker> | null = null

async function getWorker(onProgress?: (p: number) => void): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(['kor', 'eng'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) onProgress(m.progress)
        },
      })
      return worker
    })()
  }
  return workerPromise
}

/** 이미지에서 제품명 후보 텍스트를 뽑아냅니다. */
export async function readText(
  image: Blob | File,
  onProgress?: (p: number) => void,
): Promise<string> {
  const worker = await getWorker(onProgress)
  const { data } = await worker.recognize(image)
  return cleanup(data.text)
}

/** OCR 결과에서 제목으로 쓸만한 한 줄을 정리합니다. */
function cleanup(raw: string): string {
  const lines = raw
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    // 너무 짧거나 숫자/기호만 있는 줄 제거
    .filter((l) => l.length >= 2 && /[가-힣A-Za-z]/.test(l))

  if (lines.length === 0) return ''

  // 한글이 포함된, 가장 그럴듯한(적당히 긴) 줄 우선
  const korean = lines.filter((l) => /[가-힣]/.test(l))
  const pool = korean.length ? korean : lines
  pool.sort((a, b) => scoreLine(b) - scoreLine(a))
  return pool[0].slice(0, 40)
}

function scoreLine(l: string): number {
  const koreanCount = (l.match(/[가-힣]/g) || []).length
  // 4~20자 사이가 제품명일 확률이 높음
  const lenPenalty = Math.abs(l.length - 10)
  return koreanCount * 2 - lenPenalty * 0.3
}
