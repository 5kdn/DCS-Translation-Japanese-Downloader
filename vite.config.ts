import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { obfuscator } from 'rollup-obfuscator';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const currentDir = dirname(fileURLToPath(import.meta.url));

  return {
    plugins: [
      vue(),
      ...(command === 'build'
        ? [
            obfuscator({
              sourceMap: false,
              stringArray: false,
              controlFlowFlattening: true,
              deadCodeInjection: true,
              identifierNamesGenerator: 'hexadecimal',
              stringArrayEncoding: ['base64'],
              stringArrayThreshold: 1,
              include: ['**/*.js', '**/*.ts'],
              exclude: ['node_modules/**', 'docs/**'],
            }),
          ]
        : []),
    ],
    base: './',
    resolve: {
      alias: {
        '@': resolve(currentDir, 'src'),
      },
    },
    build: {
      sourcemap: false,
      minify: 'terser',
      outDir: resolve(currentDir, 'docs'),
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('vuetify')) return 'chunk-vuetify';
            if (id.includes('vue')) return 'chunk-vue';
            if (id.includes('axios')) return 'chunk-axios';

            return 'chunk-vendor';
          },
        },
      },
    },
  };
});
