// 글자를 치는 동안 하단 탭을 숨긴다.
//
// 아이폰은 키보드가 올라오면 화면 바닥을 키보드 위로 끌어올리는데, 바닥에
// 붙어 있는(position: fixed; bottom: 0) 하단 탭도 같이 올라와 입력 칸을
// 가리고 자리만 차지했다. 입력 칸에 커서가 있는 동안 <html> 에 kb-open 을
// 붙이고, CSS 에서 그때만 탭을 숨긴다.

const TYPING = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]), textarea, select, [contenteditable="true"]'

export function setupKeyboardClass() {
  const root = document.documentElement
  const update = () => {
    const el = document.activeElement
    root.classList.toggle('kb-open', !!el && el.matches(TYPING))
  }
  document.addEventListener('focusin', update)
  // 다른 칸으로 옮겨 갈 때 잠깐 비는 순간에 탭이 깜빡이지 않게 한 박자 늦춘다
  document.addEventListener('focusout', () => setTimeout(update, 50))
}
