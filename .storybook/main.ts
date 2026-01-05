import type { StorybookConfig } from '@storybook/vue3-vite';
import { loadEnv, mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.ts'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  viteFinal: async (config) => {
    const env = loadEnv('development', process.cwd(), 'VITE_');
    return mergeConfig(config, {
      define: {
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8787'),
        'import.meta.env.VITE_TARGET_OWNER': JSON.stringify(env.VITE_TARGET_OWNER ?? 'dummy-owner'),
        'import.meta.env.VITE_TARGET_REPO': JSON.stringify(env.VITE_TARGET_REPO ?? 'dummy-repo'),
        'import.meta.env.VITE_TARGET_REF': JSON.stringify(env.VITE_TARGET_REF ?? 'master'),
      },
    });
  },
};
export default config;
