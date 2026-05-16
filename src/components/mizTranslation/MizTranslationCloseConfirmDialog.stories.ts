import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import MizTranslationCloseConfirmDialog from './MizTranslationCloseConfirmDialog.vue';

const meta = {
  title: 'MizTranslation/MizTranslationCloseConfirmDialog',
  component: MizTranslationCloseConfirmDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    onConfirm: fn(),
  },
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
  play: async ({ canvasElement, args }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onConfirm = args.onConfirm as unknown as ReturnType<typeof fn>;

    onConfirm.mockClear();

    await user.click(dialogScope.getByTestId('miz-close-confirm-cancel'));

    await expect(onConfirm).not.toHaveBeenCalled();
  },
};

export const ConfirmInteraction: Story = {
  play: async ({ canvasElement, args }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onConfirm = args.onConfirm as unknown as ReturnType<typeof fn>;

    onConfirm.mockClear();

    await user.click(dialogScope.getByTestId('miz-close-confirm-submit'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  },
};
