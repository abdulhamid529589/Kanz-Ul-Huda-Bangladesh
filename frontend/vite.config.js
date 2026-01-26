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
    chunkSizeWarningLimit: 1500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor libraries first
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'recharts'
            }
            if (id.includes('socket.io-client')) {
              return 'socket'
            }
            if (id.includes('framer-motion')) {
              return 'framer'
            }
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons'
            }
            if (id.includes('react-hot-toast')) {
              return 'toast'
            }
            if (id.includes('react')) {
              return 'react-vendor'
            }
          }
          // Split pages into chunks
          if (id.includes('pages/AdminDashboardPage') || id.includes('components/AdminDashboard')) {
            return 'admin-main'
          }
          if (
            id.includes('pages/AdminUserManagementPage') ||
            id.includes('pages/AdminMemberManagementPage') ||
            id.includes('pages/AdminSettingsPage') ||
            id.includes('pages/AdminAnalyticsPage')
          ) {
            return 'admin-pages'
          }
          if (id.includes('pages/Dashboard')) {
            return 'user-dashboard'
          }
          if (id.includes('pages/')) {
            return 'other-pages'
          }
        },
      },
    },
  },
})
