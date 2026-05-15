import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { defineComponent, ref } from 'vue';
import MizTranslationCloseConfirmDialog from './MizTranslationCloseConfirmDialog.vue';

const meta = {
  title: 'MizTranslation/MizTranslationCloseConfirmDialog',
  component: MizTranslationCloseConfirmDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    onConfirm: fn(),
  },
  render: (args) =>
    defineComponent({
      components: { MizTranslationCloseConfirmDialog },
      setup: () => {
        const isOpen = ref(args.modelValue);
        const confirmCount = ref(0);

        /**
         * @summary クローズ破棄確定イベントを Storybook action と表示状態へ反映する。
         */
        const handleConfirm = (): void => {
          confirmCount.value += 1;
          isOpen.value = false;
          args.onConfirm?.();
        };

        return {
          args,
          isOpen,
          confirmCount,
          handleConfirm,
        };
      },
      template: `
        <div>
          <MizTranslationCloseConfirmDialog
            :model-value="isOpen"
            @update:modelValue="isOpen = $event"
            @confirm="handleConfirm"
          />
          <output data-testid="miz-close-confirm-open-state">{{ isOpen ? 'open' : 'closed' }}</output>
          <output data-testid="miz-close-confirm-count">{{ confirmCount }}</output>
        </div>
      `,
    }),
} satisfies Meta<typeof MizTranslationCloseConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);

    await expect(dialogScope.getByTestId('miz-close-confirm-dialog')).toBeInTheDocument();
    await expect(dialogScope.getByText('未保存の変更があります')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-close-confirm-message')).toHaveTextContent(
      '未保存の変更があります。保存していない変更は失われます。閉じますか？',
    );
    await expect(dialogScope.getByTestId('miz-close-confirm-cancel')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-close-confirm-submit')).toBeInTheDocument();
  },
};

export const CancelInteraction: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await user.click(dialogScope.getByTestId('miz-close-confirm-cancel'));

    await waitFor(() => {
      expect(canvas.getByTestId('miz-close-confirm-open-state')).toHaveTextContent('closed');
      expect(canvas.getByTestId('miz-close-confirm-count')).toHaveTextContent('0');
    });
  },
};

export const ConfirmInteraction: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await user.click(dialogScope.getByTestId('miz-close-confirm-submit'));

    await waitFor(() => {
      expect(canvas.getByTestId('miz-close-confirm-open-state')).toHaveTextContent('closed');
      expect(canvas.getByTestId('miz-close-confirm-count')).toHaveTextContent('1');
    });
  },
};
