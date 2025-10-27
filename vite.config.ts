import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(() => {
  const currentDir = dirname(fileURLToPath(import.meta.url));

  return {
    plugins: [vue()],
    base: '/DCS-Translation-Japanese-Downloader',
    resolve: {
      alias: {
        '@': resolve(currentDir, 'src'),
      },
    },
    build: {
      sourcemap: false,
      minify: 'terser',
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('vuetify')) return 'chunk-vuetify';
            if (id.includes('vue')) return 'chunk-vue';
            return 'chunk-vendor';
          },
        },
      },
    },
  };
});
