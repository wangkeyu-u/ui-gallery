import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cp } from 'node:fs/promises';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-gallery-previews',
      apply: 'build',
      async closeBundle() {
        await cp('previews', 'dist/previews', { recursive: true });
      },
    },
  ],
  base: './',
  optimizeDeps: {
    entries: ['index.html'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
