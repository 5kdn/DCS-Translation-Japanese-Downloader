import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const currentDir = dirname(fileURLToPath(import.meta.url));

/** Vitestの設定を提供する。 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(currentDir, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: true,
  },
});
