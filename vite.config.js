import { vosChangelog } from './scripts/vos-changelog/vos-changelog-vite.mjs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKEND = process.env.VITE_COACH_API_URL || 'http://127.0.0.1:9150'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      // Standalone-Default: API wird von Coach :9150 bereitgestellt. Im vitalos-Firebase-Build biegt
      // die Shell '@db' auf shell/db/relax.js → firestore/sessions.js um.
      '@db': resolve(__dirname, 'src/lib/db/index.js'),
    },
  },
  plugins: [vosChangelog({ appId: 'relax', appName: 'Entspannungstrainer', accent: '#fb923c' }),
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
      base: './',
      scope: './',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Entspannungstrainer — Präventiver Vitaltrainer',
        short_name: 'Entspannung',
        description: 'Lern- und Praxisbegleiter für das Entspannungstrainer-Modul der Präventiven Vitaltrainer-Ausbildung.',
        lang: 'de',
        theme_color: '#1e1e2e',
        background_color: '#1e1e2e',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: './index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/session/, /^\/journal/, /^\/stats/, /^\/techniques/, /^\/export/, /^\/theme/, /^\/health/],
      },
    }),
  ],
  server: {
    port: 5903,
    strictPort: true,
    proxy: {
      '/api': { target: BACKEND, rewrite: (path) => '/api/relax' + path },
      '/session':   { target: BACKEND, rewrite: (path) => '/relax-api' + path },
      '/journal':   { target: BACKEND, rewrite: (path) => '/relax-api' + path },
      '/stats':     { target: BACKEND, rewrite: (path) => '/relax-api' + path },
      '/techniques': { target: BACKEND, rewrite: (path) => '/relax-api' + path },
      '/export':    { target: BACKEND, rewrite: (path) => '/relax-api' + path },
      '/theme':     { target: BACKEND, rewrite: (path) => '/relax-api' + path },
      '/health':    { target: BACKEND, rewrite: (path) => '/relax-api' + path },
    }
  },
  build: {
    outDir: 'dist',
  }
})
