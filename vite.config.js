import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/sport-results/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    // Enable code splitting and tree shaking
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          if (id.includes('node_modules/@hello-pangea/dnd')) {
            return 'ui';
          }
          if (id.includes('node_modules/dompurify')) {
            return 'utils';
          }
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/constants': resolve(__dirname, './src/constants'),
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@hello-pangea/dnd'],
    exclude: ['@vitejs/plugin-react'],
  },
})