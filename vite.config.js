import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Strip console.* and debugger statements from production builds only —
    // keep them during local dev where they're useful for debugging.
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    sourcemap: false,
  },
})
