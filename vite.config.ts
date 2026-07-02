import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this project site under /pose/, so the production build needs that base
// path for its asset URLs. Local dev (and any root-hosted deploy) stays at '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pose/' : '/',
  plugins: [react()],
  server: {
    host: true,
  },
}))
