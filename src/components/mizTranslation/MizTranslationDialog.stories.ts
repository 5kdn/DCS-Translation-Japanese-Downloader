import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { defineComponent, ref } from 'vue';
import type { MizTranslationDownloadFormat } from '@/features/mizTranslation/mizTranslationDownloadModels';
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
  argTypes: {
    'onImport-dictionary': { action: 'import-dictionary' },
    onDownload: { action: 'download' },
  },
  args: {
    modelValue: true,
    loadedFileName: 'briefing.miz',
    isLoading: false,
    entries: sampleEntries,
    errorMessage: null,
    filter: sampleFilter,
    visibleEntryCount: sampleEntries.length,
    totalEntryCount: sampleEntries.length,
    'onImport-dictionary': fn(),
    onDownload: fn(),
  },
  render: (args) =>
    defineComponent({
      components: { MizTranslationDialog },
      setup: () => {
        const isOpen = ref(args.modelValue);
        const importedFileName = ref('not imported');
        const downloadCount = ref(0);

        /**
         * @summary dictionary import イベントを Storybook action と表示状態へ反映する。
         * @param format 読み込み形式を指定する。
         * @param file 読み込まれた dictionary ファイルを指定する。
         */
        const handleImportDictionary = (format: MizTranslationDownloadFormat, file: File): void => {
          importedFileName.value = file.name;
          args['onImport-dictionary']?.(format, file);
        };

        /**
         * @summary dictionary download イベントを Storybook action と表示状態へ反映する。
         * @param format ダウンロード形式を指定する。
         */
        const handleDownloadDictionary = (format: MizTranslationDownloadFormat): void => {
          downloadCount.value += 1;
          args.onDownload?.(format);
        };

        return {
          args,
          isOpen,
          importedFileName,
          downloadCount,
          handleImportDictionary,
          handleDownloadDictionary,
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
            @import-dictionary="handleImportDictionary"
            @download="handleDownloadDictionary"
          />
          <output data-testid="miz-dialog-open-state">{{ isOpen ? 'open' : 'closed' }}</output>
          <output data-testid="miz-dialog-imported-file">{{ importedFileName }}</output>
          <output data-testid="miz-dialog-download-count">{{ downloadCount }}</output>
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
    await expect(dialogScope.getByTestId('miz-dialog-import-button')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-dialog-import-button')).toHaveTextContent('Import');
    await expect(dialogScope.getByTestId('miz-dialog-import-menu-button')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-dialog-download-button')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-dialog-download-menu-button')).toBeInTheDocument();
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

export const ImportExportActions: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const importInput = dialogScope.getByTestId('miz-dialog-dictionary-input') as HTMLInputElement;
    const downloadMenuButton = dialogScope.getByTestId('miz-dialog-download-menu-button');
    const file = new File(['msgid ""'], 'sample.po', { type: 'text/plain' });

    Object.defineProperty(importInput, 'files', {
      configurable: true,
      value: [file],
    });

    await user.click(dialogScope.getByTestId('miz-dialog-import-menu-button'));
    await expect(dialogScope.getByTestId('miz-dialog-import-option-dictionary')).toHaveTextContent('dictionary形式（既定）');
    await expect(dialogScope.getByTestId('miz-dialog-import-option-po')).toHaveTextContent('PO形式');
    await expect(dialogScope.getByTestId('miz-dialog-import-option-csv')).toHaveTextContent('CSV形式');
    await user.click(dialogScope.getByTestId('miz-dialog-import-option-po'));
    importInput.dispatchEvent(new Event('change', { bubbles: true }));
    await user.click(downloadMenuButton);
    await expect(dialogScope.getByTestId('miz-dialog-download-option-dictionary')).toHaveTextContent('dictionary形式（既定）');
    await expect(dialogScope.getByTestId('miz-dialog-download-option-po')).toHaveTextContent('PO形式');
    await expect(dialogScope.getByTestId('miz-dialog-download-option-csv')).toHaveTextContent('CSV形式');
    await user.click(dialogScope.getByTestId('miz-dialog-download-option-po'));

    await waitFor(() => {
      expect(canvas.getByTestId('miz-dialog-imported-file')).toHaveTextContent('sample.po');
      expect(canvas.getByTestId('miz-dialog-download-count')).toHaveTextContent('1');
    });
  },
};

export const FilteredOutEntries: Story = {
  args: {
    entries: [],
    visibleEntryCount: 0,
    totalEntryCount: 2,
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);

    await expect(dialogScope.getByTestId('miz-dialog-download-button')).toBeEnabled();
    await expect(dialogScope.getByTestId('miz-dialog-download-menu-button')).toBeEnabled();
    await expect(dialogScope.getByText('表示できる翻訳項目がありません。')).toBeInTheDocument();
  },
};

export const BlankSourceEntries: Story = {
  args: {
    entries: [
      {
        key: 'DictKey_6',
        sourceText: '',
        translatedText: '',
        enabled: false,
        isDictionaryKey: true,
        isTranslatable: true,
      },
      {
        key: 'DictKey_7',
        sourceText: '   ',
        translatedText: '',
        enabled: false,
        isDictionaryKey: true,
        isTranslatable: true,
      },
      {
        key: 'DictKey_8',
        sourceText: 'Alpha',
        translatedText: '',
        enabled: true,
        isDictionaryKey: true,
        isTranslatable: true,
      },
    ],
    visibleEntryCount: 3,
    totalEntryCount: 3,
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    const enabledInput6 = dialogScope.getByTestId('miz-entry-enabled-DictKey_6').querySelector('input');
    const enabledInput7 = dialogScope.getByTestId('miz-entry-enabled-DictKey_7').querySelector('input');
    const enabledInput8 = dialogScope.getByTestId('miz-entry-enabled-DictKey_8').querySelector('input');

    await expect(dialogScope.getByTestId('miz-dialog-download-button')).toBeEnabled();
    await expect(dialogScope.getByTestId('miz-dialog-download-menu-button')).toBeEnabled();
    await expect(dialogScope.getByText('DictKey_6')).toBeInTheDocument();
    await expect(dialogScope.getByText('DictKey_7')).toBeInTheDocument();
    await expect(dialogScope.getByText('DictKey_8')).toBeInTheDocument();
    await expect(enabledInput6).not.toBeChecked();
    await expect(enabledInput7).not.toBeChecked();
    await expect(enabledInput8).toBeChecked();
  },
};
