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
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules/react')) {
            return 'react'
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'react-router'
          }
          if (id.includes('node_modules/recharts')) {
            return 'recharts'
          }
          if (id.includes('node_modules/socket.io-client')) {
            return 'socket'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'framer'
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
            return 'icons'
          }
          // Pages chunks - each major page gets its own chunk
          if (
            id.includes('pages/AdminDashboardPage') ||
            id.includes('pages/AdminUserManagementPage') ||
            id.includes('pages/AdminMemberManagementPage') ||
            id.includes('pages/AdminSettingsPage') ||
            id.includes('pages/AdminAnalyticsPage')
          ) {
            return 'admin-pages'
          }
          if (
            id.includes('pages/Dashboard') ||
            id.includes('pages/MembersPage') ||
            id.includes('pages/SubmissionsPage')
          ) {
            return 'main-pages'
          }
          if (id.includes('pages/')) {
            return 'other-pages'
          }
        },
      },
    },
  },
})
