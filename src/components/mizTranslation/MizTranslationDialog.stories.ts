import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { defineComponent } from 'vue';
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

type SampleFilter = typeof sampleFilter;
type SampleFilterKey = keyof SampleFilter;
type ImportDictionaryAction = (format: MizTranslationDownloadFormat, file: File) => void;
type DownloadAction = (format: MizTranslationDownloadFormat) => void;

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
  render: (args) => {
    const [currentArgs, updateArgs] = useArgs<typeof args>();

    return defineComponent({
      components: { MizTranslationDialog },
      setup: () => {
        const importDictionaryAction: ImportDictionaryAction =
          (args['onImport-dictionary'] as ImportDictionaryAction | undefined) ?? (() => undefined);
        const downloadAction: DownloadAction = (args.onDownload as DownloadAction | undefined) ?? (() => undefined);

        /**
         * @summary ダイアログ表示状態を Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleModelValueUpdate = (value: boolean): void => {
          updateArgs({ modelValue: value });
        };

        /**
         * @summary 指定したフィルター項目を Storybook args へ反映する関数を生成する。
         * @param key 更新対象の filter キーを指定する。
         * @returns Storybook args 更新ハンドラーを返す。
         */
        const createFilterUpdater = (key: SampleFilterKey) => {
          return (value: boolean): void => {
            updateArgs({
              filter: {
                ...currentArgs.filter,
                [key]: value,
              },
            });
          };
        };

        /**
         * @summary 有効状態表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleShowEnabledUpdate = createFilterUpdater('showEnabled');

        /**
         * @summary 無効状態表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleShowDisabledUpdate = createFilterUpdater('showDisabled');

        /**
         * @summary 未翻訳のみ表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleShowOnlyUntranslatedUpdate = createFilterUpdater('showOnlyUntranslated');

        /**
         * @summary 翻訳対象外非表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleHideNonTranslatableUpdate = createFilterUpdater('hideNonTranslatable');

        /**
         * @summary 空欄非表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleHideEmptySourceTextUpdate = createFilterUpdater('hideEmptySourceText');

        /**
         * @summary 辞書取り込みイベントを action へ中継する。
         * @param format 取り込み形式を指定する。
         * @param file 取り込み対象ファイルを指定する。
         */
        const handleImportDictionary = (format: MizTranslationDownloadFormat, file: File): void => {
          importDictionaryAction(format, file);
        };

        /**
         * @summary ダウンロードイベントを action へ中継する。
         * @param format ダウンロード形式を指定する。
         */
        const handleDownload = (format: MizTranslationDownloadFormat): void => {
          downloadAction(format);
        };

        return {
          currentArgs,
          handleDownload,
          handleHideEmptySourceTextUpdate,
          handleHideNonTranslatableUpdate,
          handleImportDictionary,
          handleModelValueUpdate,
          handleShowDisabledUpdate,
          handleShowEnabledUpdate,
          handleShowOnlyUntranslatedUpdate,
        };
      },
      template: `
        <MizTranslationDialog
          :model-value="currentArgs.modelValue"
          :loaded-file-name="currentArgs.loadedFileName"
          :is-loading="currentArgs.isLoading"
          :entries="currentArgs.entries"
          :error-message="currentArgs.errorMessage"
          :filter="currentArgs.filter"
          :visible-entry-count="currentArgs.visibleEntryCount"
          :total-entry-count="currentArgs.totalEntryCount"
          @update:model-value="handleModelValueUpdate"
          @update:show-enabled="handleShowEnabledUpdate"
          @update:show-disabled="handleShowDisabledUpdate"
          @update:show-only-untranslated="handleShowOnlyUntranslatedUpdate"
          @update:hide-non-translatable="handleHideNonTranslatableUpdate"
          @update:hide-empty-source-text="handleHideEmptySourceTextUpdate"
          @import-dictionary="handleImportDictionary"
          @download="handleDownload"
        />
      `,
    });
  },
} satisfies Meta<typeof MizTranslationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);

    await expect(dialogScope.getByTestId('miz-dialog-file-name')).toHaveTextContent('briefing.miz');
    await expect(dialogScope.getByTestId('miz-dialog-information')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-dialog-import-button')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-dialog-import-menu-button')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-dialog-download-button')).toBeInTheDocument();
    await expect(dialogScope.getByTestId('miz-dialog-download-menu-button')).toBeInTheDocument();
    await expect(await dialogScope.findByLabelText('有効状態を表示')).toBeChecked();
    await expect(await dialogScope.findByLabelText('対象外を非表示')).toBeChecked();
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);

    await expect(dialogScope.getByTestId('miz-dialog-loading')).toBeInTheDocument();
    await expect(dialogScope.queryByTestId('miz-dialog-information')).toBeNull();
    await expect(dialogScope.queryByTestId('miz-table-entry-count')).toBeNull();
    await expect(dialogScope.getByLabelText('MIZ 翻訳ダイアログを閉じる')).toBeDisabled();
    await expect(dialogScope.getByTestId('miz-dialog-import-button')).toBeDisabled();
    await expect(dialogScope.getByTestId('miz-dialog-import-menu-button')).toBeDisabled();
    await expect(dialogScope.getByTestId('miz-dialog-download-button')).toBeDisabled();
    await expect(dialogScope.getByTestId('miz-dialog-download-menu-button')).toBeDisabled();
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

export const FilteredOutEntries: Story = {
  args: {
    entries: [],
    visibleEntryCount: 0,
    totalEntryCount: 2,
  },
};

export const ToggleFilters: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const dialogScope = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    await user.click(await dialogScope.findByLabelText('未翻訳のみ表示'));
    await waitFor(() => {
      expect(dialogScope.getByLabelText('未翻訳のみ表示')).toBeChecked();
    });

    await user.click(dialogScope.getByLabelText('対象外を非表示'));
    await waitFor(() => {
      expect(dialogScope.getByLabelText('対象外を非表示')).not.toBeChecked();
    });
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
};
