import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/forground_music': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/background_music.mp3': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
