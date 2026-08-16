import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './components.css'

// 새 버전이 배포되면 서비스워커가 즉시 교체되면서 이전 해시의 이미지·CSS가
// 캐시에서 사라진다. 그대로 두면 화면이 깨진 채로 남으므로, 교체가 감지되는
// 즉시 한 번만 새로고침해 새 파일로 다시 그린다.
if ('serviceWorker' in navigator) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
