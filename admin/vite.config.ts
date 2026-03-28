import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:3002',
      '/public': 'http://localhost:3002',
    },
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
