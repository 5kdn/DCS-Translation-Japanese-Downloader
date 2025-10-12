import type { Meta, StoryObj } from '@storybook/vue3-vite';
import App from './App.vue';

const meta = {
  title: 'App/App',
  component: App,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
