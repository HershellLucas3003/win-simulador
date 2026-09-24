import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'src/web',
  plugins: [react()],
  build: {
    outDir: '../../dist/web',
    emptyOutDir: true,
  },
  server: {
    port: 5180,
    proxy: {
      '/api': 'http://localhost:4580',
      '/ws': { target: 'ws://localhost:4580', ws: true },
    },
  },
})
