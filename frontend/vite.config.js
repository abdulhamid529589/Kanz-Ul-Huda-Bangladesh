import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    hmr: {
      host: 'localhost',
      port: 3000,
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react', 'react-icons'],
          charts: ['recharts'],
          socket: ['socket.io-client'],
          ui: ['framer-motion', 'react-hot-toast'],
        },
      },
    },
  },
})
