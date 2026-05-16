import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const configDir = process.env.STORYBOOK_CONFIG_DIR ?? '.storybook';

export default defineConfig({
  test: {
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: './vite.config.ts',
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.integration.tests.ts'],
          setupFiles: ['tests/integration/setup/msw.ts'],
        },
      },
      {
        extends: './vite.config.ts',
        plugins: [storybookTest({ configDir })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
