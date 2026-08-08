import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 프로젝트 사이트 기준 base 경로.
// 다른 곳(Netlify/Vercel 등)에 올릴 땐 '/' 로 바꾸면 됩니다.
export default defineConfig({
  base: '/yumlog/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '얌로그 - 고양이 기호성 체크',
        short_name: '얌로그',
        description: '우리집 고양이들이 어떤 간식을 잘 먹는지 기록하는 앱',
        theme_color: '#FF8C6B',
        background_color: '#FBF4E9',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tesseract 등 큰 리소스는 런타임 캐시로 처리
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
})
