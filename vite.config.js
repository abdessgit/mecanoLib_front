import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('framer-motion')) {
            return 'motion-vendor'
          }

          if (id.includes('lucide-react')) {
            return 'icons-vendor'
          }

          if (
            id.includes('react-router-dom') ||
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('\\react\\')
          ) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})
