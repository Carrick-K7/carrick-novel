import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '人机AK的日常',
        short_name: 'AK日常',
        description: '人机AK的日常小说阅读',
        theme_color: '#39c5bb',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        // 缓存小说内容
        runtimeCaching: [
          {
            urlPattern: /\.(?:txt|json)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'novel-chapters',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
              }
            }
          },
          {
            urlPattern: /^https:\/\/novel\.carrick7\.com\/data\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'novel-api-data',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
              }
            }
          },
          {
            urlPattern: /^https:\/\/novel\.carrick7\.com\/novels\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'novel-content',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 3003,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
