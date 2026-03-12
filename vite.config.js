import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuracion de Vite para habilitar React y su recarga en caliente (HMR).
export default defineConfig({
  plugins: [react()],
})
