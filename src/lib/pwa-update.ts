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
    const { registerSW } = await import('virtual:pwa-register')
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        onNeedRefresh(() => void updateSW(true))
      },
    })
  } catch {
    // 서비스워커가 없는 빌드 — 무시
  }
}
