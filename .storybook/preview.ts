import { setup } from '@storybook/vue3';
import type { Preview } from '@storybook/vue3-vite';
import { registerPlugins } from '../src/plugins';
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

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export const decorator = [withVuetifyTheme];
export default preview;
