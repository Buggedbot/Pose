import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use relative asset paths in the production build so the app works no matter what
// sub-path (or case) it is served from on GitHub Pages, e.g. /Pose/ vs /pose/.
// import.meta.env.BASE_URL becomes './', which the default-model fetch resolves
// relative to the page. Local dev stays at '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  server: {
    host: true,
  },
}))
