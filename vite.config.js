import { defineConfig } from 'vite';

export default defineConfig({
  base: '/bara/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
