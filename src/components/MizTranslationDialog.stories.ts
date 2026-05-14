import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { defineComponent, ref } from 'vue';
import MizTranslationDialog from './MizTranslationDialog.vue';

const meta = {
  title: 'MizTranslation/MizTranslationDialog',
  component: MizTranslationDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    loadedFileName: 'briefing.miz',
    isLoading: false,
  },
  render: (args) =>
    defineComponent({
      components: { MizTranslationDialog },
      setup: () => {
        const isOpen = ref(args.modelValue);

        return {
          args,
          isOpen,
        };
      },
      template: `
        <div>
          <MizTranslationDialog
            :model-value="isOpen"
            :loaded-file-name="args.loadedFileName"
            :is-loading="args.isLoading"
            @update:modelValue="isOpen = $event"
          />
          <output data-testid="miz-dialog-open-state">{{ isOpen ? 'open' : 'closed' }}</output>
        </div>
      `,
    }),
} satisfies Meta<typeof MizTranslationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    await expect(dialogScope.getByText('MIZ 翻訳')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-dialog-file-name')).toHaveTextContent('briefing.miz');
    await expect(dialogScope.getByText('Not Implemented')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    await expect(dialogScope.getByTestId('miz-dialog-loading')).toHaveTextContent('dictionary を読み込み中です。');
  },
};

export const CloseInteraction: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    const canvas = within(canvasElement);
    const closeButton = dialogScope.getByRole('button', { name: 'MIZ 翻訳ダイアログを閉じる' });
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await user.click(closeButton);

    await waitFor(() => {
      expect(canvas.getByTestId('miz-dialog-open-state')).toHaveTextContent('closed');
    });
  },
};
