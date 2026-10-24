/**
 * 새 버전 적용 방식.
 *
 * 이전에는 새 서비스워커가 즉시 활성화되면서(skipWaiting) 이전 해시의
 * 이미지·CSS를 캐시에서 지웠고, 화면은 그대로 남아 있어 이미지가 전부 깨졌다.
 *
 * 이제는 새 서비스워커를 '대기' 상태로 두므로 보고 있는 화면의 파일은
 * 절대 사라지지 않는다. 사용자가 '새 버전 적용'을 누르는 순간에만 교체하고,
 * 교체와 동시에 새로고침해서 화면과 파일 버전이 항상 일치하게 한다.
 */

// 단일 파일(미리보기) 빌드에는 서비스워커가 없으므로 동적 import로 감싼다.
export async function setupPwaUpdate(onNeedRefresh: (apply: () => void) => void) {
  if (!('serviceWorker' in navigator)) return

  // 서비스워커 교체가 감지되면 항상 한 번만 새로고침 (마지막 안전장치)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })

  try {
    const openedAt = Date.now()
    const { registerSW } = await import('virtual:pwa-register')
    const updateSW = registerSW({
      immediate: true,
      // 브라우저는 페이지를 새로 열 때만 새 버전을 찾는다. 홈 화면 앱은
      // '껐다 켜도' 실제로는 뒤에 살아 있다가 돌아오는 경우가 많아, 며칠씩
      // 옛 버전에 머물렀다. 앱으로 돌아올 때마다(30분에 한 번까지) 직접 찾는다.
      onRegisteredSW(_url, reg) {
        if (!reg) return
        let last = Date.now()
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState !== 'visible') return
          if (Date.now() - last < 30 * 60 * 1000) return
          last = Date.now()
          void reg.update().catch(() => {})
        })
      },
      onNeedRefresh() {
        // 지금은 서비스워커가 스스로 인계받으므로 여기까지 오는 일이 드물지만,
        // 혹시 대기 상태로 남으면 즉시 교체한다. 위 controllerchange 리스너가
        // 교체 직후 한 번 새로고침해 화면과 파일 버전을 맞춘다.
        void updateSW(true)
        void openedAt
        void onNeedRefresh
      },
    })
  } catch {
    // 서비스워커가 없는 빌드 — 무시
  }
}
