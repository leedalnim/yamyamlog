import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

declare const process: { env: Record<string, string | undefined> }

// SINGLE=1 로 빌드하면 모든 JS/CSS/이미지를 한 개의 self-contained HTML로 인라인합니다.
// (아티팩트/오프라인 미리보기용). 기본 빌드는 PWA + GitHub Pages 배포용.
const single = process.env.SINGLE === '1'

const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ')

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  base: single ? './' : '/yamyamlog/',
  plugins: single
    ? [react(), viteSingleFile()]
    : [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['apple-touch-icon.png'],
          manifest: {
            name: '얌얌로그 - 고양이 기호성 체크',
            short_name: '얌얌로그',
            description: '우리집 고양이들이 어떤 간식을 잘 먹는지 기록하는 앱',
            lang: 'ko',
            theme_color: '#FA7F38',
            background_color: '#FFFFFF',
            display: 'standalone',
            orientation: 'portrait',
            icons: [
              { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            // 이미지·폰트까지 전부 프리캐시한다.
            // JS/CSS만 캐시하면, 서비스워커가 붙잡고 있는 이전 버전 JS가
            // 참조하는 이미지 해시가 서버에서 이미 교체돼 404 → 이미지가 깨진다.
            // 화면을 이루는 파일을 한 세트로 묶어야 버전이 절대 어긋나지 않는다.
            globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2,webmanifest}'],
            maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
            cleanupOutdatedCaches: true,
            // 새 서비스워커가 즉시 인계받는다.
            // 예전에 이 설정이 화면을 깨뜨렸던 건 이미지가 프리캐시에 없어서
            // 교체 순간 참조가 어긋났기 때문이다. 위 globPatterns로 화면을 이루는
            // 파일을 한 세트로 묶은 지금은 교체가 통째로 일어나 어긋날 수 없고,
            // 낡은 버전을 붙잡은 기기가 새로고침 한 번으로 스스로 복구된다.
            skipWaiting: true,
            clientsClaim: true,
            navigateFallback: 'index.html',
          },
        }),
      ],
  build: single
    ? {
        outDir: 'dist-single',
        cssCodeSplit: false,
        assetsInlineLimit: 100_000_000,
        // 단일 파일 빌드에는 서비스워커가 없다 (런타임에서 try/catch로 무시)
        rollupOptions: { external: ['virtual:pwa-register'] },
      }
    : {},
})
