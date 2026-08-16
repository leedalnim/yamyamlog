import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

declare const process: { env: Record<string, string | undefined> }

// SINGLE=1 로 빌드하면 모든 JS/CSS/이미지를 한 개의 self-contained HTML로 인라인합니다.
// (아티팩트/오프라인 미리보기용). 기본 빌드는 PWA + GitHub Pages 배포용.
const single = process.env.SINGLE === '1'

export default defineConfig({
  base: single ? './' : '/yamyamlog/',
  plugins: single
    ? [react(), viteSingleFile()]
    : [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
          manifest: {
            name: '얌얌로그 - 고양이 기호성 체크',
            short_name: '얌얌로그',
            description: '우리집 고양이들이 어떤 간식을 잘 먹는지 기록하는 앱',
            lang: 'ko',
            theme_color: '#E1873F',
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
            maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
            // 이전 버전 캐시가 화면을 붙잡지 않도록 즉시 교체
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true,
            navigateFallback: 'index.html',
          },
        }),
      ],
  build: single
    ? { outDir: 'dist-single', cssCodeSplit: false, assetsInlineLimit: 100_000_000 }
    : {},
})
