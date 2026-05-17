import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://localhost:9004'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5904,
    proxy: {
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
