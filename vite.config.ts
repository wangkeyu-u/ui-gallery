import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // Legacy research HTML files stay in the archive, but are not app entry points.
  optimizeDeps: {
    entries: ['index.html'],
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    open: false,
  },
});
