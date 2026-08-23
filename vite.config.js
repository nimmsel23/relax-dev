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
    {
      name: 'relax-strip-dev-entry-from-build-html',
      apply: 'build',
      // order: 'post' ist Pflicht — ohne das läuft der Hook VOR Vite's
      // eigenem internen Entry-Scan (vite:build-html) und der Script-Tag
      // ist beim Bundlen schon weg. Ergebnis: Rollup findet main.jsx nie
      // als Entry, das Bundle enthält nur noch den PWA-Registration-Stub
      // (711 Bytes statt der echten App). Erst mit 'post' greift die
      // Entfernung nur noch auf das fertig geschriebene HTML.
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return html.replace(
            /\s*<script type="module"[^>]*src="[^"]*\/main\.[jt]sx?"[^>]*><\/script>\s*/u,
            '\n'
          )
        },
      },
    },
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
    port: 5903,
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
