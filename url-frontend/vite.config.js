import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist' // Ensure Vite outputs here (default, but explicit is safer)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
