import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKEND = 'http://localhost:9123'

export default defineConfig({
  resolve: {
    alias: {
      // Standalone-Default (:9123-Backend). Im vitalos-Firebase-Build biegt
      // die Shell '@db' auf shell/db/relax.js → firestore/sessions.js um.
      '@db': resolve(__dirname, 'src/lib/db/index.js'),
    },
  },
  plugins: [
    react(),
    // PWA nach dem habits-Muster: workbox precached mit Content-Hashes,
    // ersetzt public/sw.js (relax-v2, manuell versioniert → archive/).
    VitePWA({
      base: '/',
      scope: '/',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Relax — VitalOS',
        short_name: 'Relax',
        description: 'Entspannung, Sessions, Journal, PNI-Wissen',
        theme_color: '#1e1e2e',
        background_color: '#1e1e2e',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/session/, /^\/journal/, /^\/stats/, /^\/techniques/, /^\/export/, /^\/theme/, /^\/health/],
      },
    }),
  ],
  server: {
    port: 5904,
    proxy: {
      '/api': BACKEND,
      '/session':   BACKEND,
      '/journal':   BACKEND,
      '/stats':     BACKEND,
      '/techniques': BACKEND,
      '/export':    BACKEND,
      '/theme':     BACKEND,
      '/health':    BACKEND,
    }
  },
  build: {
    outDir: 'dist',
  }
})
