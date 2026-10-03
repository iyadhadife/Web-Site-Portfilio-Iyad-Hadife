import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En local, les appels /api sont redirigés vers le backend Flask (comme le fait nginx en production)
const apiProxy = { '/api': 'http://localhost:5000' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
