import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, waitFor, within } from 'storybook/test';
import { h, resolveComponent } from 'vue';
import Footer from './Footer.vue';

const meta = {
  title: 'Footer/Footer',
  component: Footer,
  tags: ['autodocs'],
  decorators: [
    () => ({
      render() {
        const VApp = resolveComponent('v-app');
        return h(VApp, null, { default: () => h(Footer) });
      },
    }),
  ],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DialogOpen: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'third-party licenses' }));
    await body.findByRole('heading', { name: 'third-party licenses' });

    const closeButton = await body.findByRole('button', { name: 'close' });
    await waitFor(() => {
      const view = canvasElement.ownerDocument.defaultView;
      const pointerEvents = view?.getComputedStyle(closeButton).pointerEvents;
      if (pointerEvents === 'none') throw new Error('close button is not clickable yet');
    });
    await userEvent.click(closeButton);
  },
};
