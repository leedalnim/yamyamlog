// 사진에서 글자 읽기 (OCR) — tesseract.js
// 무료이고 폰(브라우저) 안에서 처리됩니다. 별도 서버/비용 없음.
// 한국어 인식 데이터(traineddata)는 처음 한 번만 내려받아 캐시됩니다.

import type { Worker } from 'tesseract.js'

/** 진행 상황 — 화면에 뭘 보여줄지 정하는 데 쓴다 */
export type OcrPhase =
  | { phase: 'preparing' } // 글자 인식 파일 내려받는 중 (처음 한 번, 몇 MB)
  | { phase: 'reading'; progress: number }

/** 인식에 필요한 파일을 아직 못 받은 상태 — 인터넷이 필요하다는 뜻 */
export class OcrOfflineError extends Error {
  constructor() {
    super('ocr-offline')
    this.name = 'OcrOfflineError'
  }
}

let workerPromise: Promise<Worker> | null = null

async function getWorker(onPhase?: (p: OcrPhase) => void): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      return createWorker(['kor', 'eng'], 1, {
        logger: (m) => {
          if (!onPhase) return
          // 'recognizing text' 전까지는 전부 준비 단계(내려받기·초기화)다.
          // 예전에는 이 구간에 아무 신호가 없어서, 몇 MB 를 받는 동안
          // 버튼이 '읽는 중 0%' 로 멈춰 있는 것처럼 보였다.
          if (m.status === 'recognizing text') onPhase({ phase: 'reading', progress: m.progress })
          else onPhase({ phase: 'preparing' })
        },
      })
    })().catch((err) => {
      // 실패한 약속을 남겨두면 다음에 눌러도 같은 실패가 되돌아온다
      workerPromise = null
      throw err
    })
  }
  return workerPromise
}

/**
 * 이미지에서 제품명 후보 텍스트를 뽑아냅니다.
 * 글자를 못 찾으면 빈 문자열을 돌려줍니다 (실패가 아니다).
 */
export async function readText(
  image: Blob | File,
  onPhase?: (p: OcrPhase) => void,
): Promise<string> {
  let worker: Worker
  try {
    worker = await getWorker(onPhase)
  } catch (err) {
    // 인식 파일은 처음 쓸 때 인터넷으로 받아온다. 못 받으면 여기서 걸린다.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new OcrOfflineError()
    if (/network|fetch|importScripts|Failed to load/i.test(String(err))) throw new OcrOfflineError()
    throw err
  }
  const { data } = await worker.recognize(image)
  return cleanup(data.text)
}

/** OCR 결과에서 제목으로 쓸만한 한 줄을 정리합니다. */
function cleanup(raw: string): string {
  const lines = raw
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    // 너무 짧거나 숫자/기호만 있는 줄 제거
    .filter((l) => l.length >= 2 && /[\uAC00-\uD7A3A-Za-z]/.test(l))

  if (lines.length === 0) return ''

  // 한글이 포함된, 가장 그럴듯한(적당히 긴) 줄 우선
  const korean = lines.filter((l) => /[\uAC00-\uD7A3]/.test(l))
  const pool = korean.length ? korean : lines
  pool.sort((a, b) => scoreLine(b) - scoreLine(a))
  return pool[0].slice(0, 40)
}

function scoreLine(l: string): number {
  const koreanCount = (l.match(/[\uAC00-\uD7A3]/g) || []).length
  // 4~20자 사이가 제품명일 확률이 높음
  const lenPenalty = Math.abs(l.length - 10)
  return koreanCount * 2 - lenPenalty * 0.3
}
