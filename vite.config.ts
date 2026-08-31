import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

// A stamp the running app can show, so "which build is this device on?" has an
// answer without guessing from behaviour.
const commit = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'dev' }
})()
const buildId = `${new Date().toISOString().slice(0, 10)} ${commit}`

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(buildId) },
  plugins: [
    react(),
    VitePWA({
      // Announced rather than applied behind your back: reloading mid-sermon
      // without asking is worse than waiting for a tap.
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MyVersionBible',
        short_name: 'MVBible',
        description: 'Offline-first Bible study: downloadable versions, structured notes, printable study books.',
        theme_color: '#3d2f23',
        background_color: '#faf6ef',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html'
      }
    })
  ]
})
