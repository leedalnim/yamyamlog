import { useEffect, useRef } from 'react'

/**
 * 화면 안에서 '뒤로'를 브라우저 뒤로가기와 이어준다.
 *
 * 이 앱은 주소가 바뀌지 않는 한 장짜리 앱이라, 상세·수정·시트를 열어도
 * 브라우저에는 아무 기록이 남지 않았다. 그래서 아이폰에서 뒤로 쓸어넘기면
 * 한 단계 뒤로 가는 대신 앱 자체를 떠나버렸다.
 *
 * 열릴 때 가짜 기록을 하나 밀어 넣고, 뒤로가기가 눌리면 그걸 받아
 * `onBack()` 을 부른다.
 *
 * 열린 화면이 겹칠 수 있어서(상세 위에 수정) 열린 순서를 쌓아 두고
 * **맨 위 것 하나만** 반응하게 한다. 모두가 반응하면 뒤로 한 번에
 * 여러 단계가 닫혀 버린다.
 */

interface Entry {
  mark: string
  fire: () => void
}

const stack: Entry[] = []
let listening = false
/** 우리가 스스로 history.back() 을 부른 경우, 뒤따라 오는 popstate 를 건너뛴다 */
let skip = 0

function onPop() {
  if (skip > 0) {
    skip--
    return
  }
  stack.pop()?.fire()
}

function ensureListening() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('popstate', onPop)
}

/**
 * @param active 이 화면이 지금 열려 있는가
 * @param onBack 뒤로가기를 눌렀을 때 닫는 함수
 */
export function useBackGuard(active: boolean, onBack: () => void): void {
  // onBack 이 매 렌더 새로 만들어져도 기록을 다시 밀어 넣지 않도록
  const cb = useRef(onBack)
  cb.current = onBack

  useEffect(() => {
    if (!active || typeof window === 'undefined') return

    const mark = 'yam-' + Math.random().toString(36).slice(2)
    stack.push({ mark, fire: () => cb.current() })
    try {
      window.history.pushState({ yam: mark }, '')
    } catch {
      // 히스토리를 못 쓰는 환경이면 조용히 포기한다 — 화면 안 버튼은 그대로 동작한다
      stack.pop()
      return
    }
    ensureListening()

    return () => {
      const i = stack.findIndex((e) => e.mark === mark)
      if (i < 0) return // 뒤로가기로 닫힌 경우 — 이미 정리됐다

      stack.splice(i, 1)
      // 화면 안 버튼으로 닫힌 경우엔 우리가 넣은 기록이 그대로 남아 있다.
      // 걷어내지 않으면 뒤로가기를 한 번 더 눌러야 실제로 뒤로 간다.
      if ((window.history.state as { yam?: string } | null)?.yam === mark) {
        skip++
        window.history.back()
      }
    }
  }, [active])
}
