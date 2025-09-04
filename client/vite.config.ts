import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      // Proxies any request starting with /api to our backend server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // We don't need a rewrite rule here, as we have updated the backend
        // to handle the /api prefix.
      },
    },
  },
})

