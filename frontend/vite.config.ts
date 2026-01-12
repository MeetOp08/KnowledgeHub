import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173, // frontend runs here
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // ✅ backend port
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000', // ✅ backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
