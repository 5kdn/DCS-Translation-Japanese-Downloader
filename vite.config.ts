import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { obfuscator } from 'rollup-obfuscator'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [
      vue(),
      ...(command === 'build'
        ? [
            obfuscator(
              {
                sourceMap: false,
                stringArray: false,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                identifierNamesGenerator: 'hexadecimal',
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 1,
              },
              {
                include: ['**/*.js', '**/*.ts'],
                exclude: ['node_modules/**'],
              }
            ),
          ]
        : []),
    ],
    base: './',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      sourcemap: false,
      minify: 'terser',
    },
  }
})
