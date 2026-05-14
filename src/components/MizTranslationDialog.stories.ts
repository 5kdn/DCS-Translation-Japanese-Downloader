import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { defineComponent, ref } from 'vue';
import MizTranslationDialog from './MizTranslationDialog.vue';

const sampleEntries = [
  {
    key: 'DictKey_1',
    sourceText: 'Alpha\nBravo',
    translatedText: '',
    enabled: true,
    isDictionaryKey: true,
    isTranslatable: true,
  },
];

const sampleFilter = {
  showEnabled: true,
  showDisabled: true,
  showOnlyUntranslated: false,
  hideNonTranslatable: true,
  hideEmptySourceText: true,
};

const meta = {
  title: 'MizTranslation/MizTranslationDialog',
  component: MizTranslationDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    loadedFileName: 'briefing.miz',
    isLoading: false,
    entries: sampleEntries,
    errorMessage: null,
    filter: sampleFilter,
    visibleEntryCount: sampleEntries.length,
    totalEntryCount: sampleEntries.length,
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
            :entries="args.entries"
            :error-message="args.errorMessage"
            :filter="args.filter"
            :visible-entry-count="args.visibleEntryCount"
            :total-entry-count="args.totalEntryCount"
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
    await expect(dialogScope.getByTestId('miz-dialog-information')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-dialog-information')).toHaveTextContent(
      '有効にチェックが入っている項目だけが翻訳した dictionary ファイルに追加されます。',
    );
    await expect(dialogScope.getByTestId('miz-dialog-information')).toHaveTextContent(
      'dictionary ファイルを直接編集するときのような \\ エスケープは不要です。',
    );
    await expect(dialogScope.getByTestId('miz-dialog-information')).toHaveTextContent(
      'Lua コードが翻訳対象となっている可能性があります。',
    );
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

export const ErrorState: Story = {
  args: {
    errorMessage: 'dictionary の読み込みに失敗しました。',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    await expect(dialogScope.getByTestId('miz-dialog-error')).toHaveTextContent('dictionary の読み込みに失敗しました。');
    await expect(dialogScope.getByTestId('miz-dialog-information')).toBeInTheDocument();
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
