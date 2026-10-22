import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuracion de Vite para habilitar React y su recarga en caliente (HMR).
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, las peticiones a /api se envian a la API local (npm run api).
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})