// 화면을 떠났다 돌아와도 남는 상태 — 앱을 켜 둔 동안만.
//
// 탭을 옮기면 홈 화면이 통째로 지워졌다 다시 만들어져 useState 값(필터 등)이
// 처음으로 돌아갔다. 값을 이 파일 안의 Map 에 같이 적어 두고, 다시 만들 때
// 거기서 꺼낸다. 앱을 완전히 끄면 사라진다(다음에 켜면 처음부터) — 껐다 켜도
// 남아 있으면 "왜 기록이 몇 개뿐이지?" 하고 헷갈리기 쉽다.

import { useCallback, useState } from 'react'

const store = new Map<string, unknown>()

export function useSticky<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => (store.has(key) ? (store.get(key) as T) : initial))
  const set = useCallback(
    (v: T) => {
      store.set(key, v)
      setValue(v)
    },
    [key],
  )
  return [value, set]
}
