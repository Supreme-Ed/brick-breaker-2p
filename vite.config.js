import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
      },
    },
    // Explicitly configure Terser to remove console logs in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.* calls
        drop_debugger: true, // Remove debugger statements
      },
    },
  },
});