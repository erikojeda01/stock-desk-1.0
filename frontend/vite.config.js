import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['next/navigation.js', 'next/navigation']
    }
  }
});
