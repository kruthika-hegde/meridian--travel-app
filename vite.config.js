import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Strip console.* and debugger statements from production builds only.
    // Keep them during local dev, where they're useful for debugging.
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    sourcemap: false,
  },
  server: {
    // Local workaround: `vercel dev`'s reverse proxy breaks Vite's own HTML
    // transform on this machine. Running `npm run dev` (plain Vite) plus
    // `vercel dev --listen 3001` (API functions only) side by side, with this
    // proxy stitching the two together, avoids that broken code path
    // entirely while keeping /api/* fully working locally.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
