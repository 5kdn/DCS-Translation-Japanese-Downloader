import addonChromatic from '@chromatic-com/storybook';
import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import addonVitest from '@storybook/addon-vitest';
import { setup } from '@storybook/vue3';
import { definePreview } from '@storybook/vue3-vite';
import { registerPlugins } from '../src/plugins';
import { storybookMswAddon } from './msw';
import '@mdi/font/css/materialdesignicons.css';
// Plugins
import { withVuetifyTheme } from './withVuetifyTheme.decorator';

setup((app) => {
  // Registers your app's plugins into Storybook
  registerPlugins(app);
});

export const GlobalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    toolbar: {
      icon: 'paintbrush',
      items: [
        { value: 'light', title: 'Light', left: '🌞' },
        { value: 'dark', title: 'Dark', left: '🌛' },
      ],
      dynamicTitle: true,
    },
  },
};

const preview = definePreview({
  addons: [addonChromatic(), addonDocs(), addonA11y(), addonVitest(), storybookMswAddon],
  decorators: [withVuetifyTheme],
  parameters: {
    controls: {
      matchers: {
        color: /$^/,
        date: /Date$/i,
      },
    },
  },
});

export default preview;
