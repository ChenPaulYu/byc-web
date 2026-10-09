import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  // The public and admin servers run together and need separate dependency caches.
  cacheDir: path.resolve(__dirname, '../node_modules/.vite-admin'),
  base: '/admin/',
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:3002',
      '/public': 'http://localhost:3002',
      '/samples': { target: 'http://localhost:3002', rewrite: (path: string) => `/public${path}` },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../dist/admin'),
    emptyOutDir: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../src'),
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis',
  },
});
