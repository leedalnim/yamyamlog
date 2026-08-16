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
          registerType: 'prompt',
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
            cleanupOutdatedCaches: true,
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
