import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/** Project site path on GitHub Pages: https://Harsh-Patel-05.github.io/DMS-SHEETAL/ */
const pagesBase = process.env.GITHUB_PAGES === '1' ? '/DMS-SHEETAL/' : '/'

export default defineConfig({
  base: pagesBase,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('victory-vendor') || id.includes('d3-')) {
            return 'recharts'
          }
          if (id.includes('date-fns')) return 'date-fns'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('\\react\\')) {
            return 'react-vendor'
          }
          if (id.includes('@tanstack')) return 'tanstack'
          if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'forms'
          }
          if (id.includes('lucide-react')) return 'icons'
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
