import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { defineComponent, ref } from 'vue';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import MizTranslationTable from './MizTranslationTable.vue';

const sampleEntries: MizDictionaryEntry[] = [
  {
    key: 'DictKey_1001',
    sourceText:
      'MISSION:\n\nEnemy forces have established a line of defense running east to west between Kobuleti and Alambari.',
    translatedText: '',
    enabled: true,
    isDictionaryKey: true,
    isTranslatable: true,
  },
  {
    key: 'DictKey_1002',
    sourceText: 'OBJECTIVE:\n\nPrimary objective is to secure the abandoned airstrip.',
    translatedText: 'OBJECTIVE:\n\n主目標は放棄された飛行場を確保すること。',
    enabled: false,
    isDictionaryKey: true,
    isTranslatable: true,
  },
  {
    key: 'DictKey_WptName_1003',
    sourceText: 'Waypoint Alpha',
    translatedText: '',
    enabled: false,
    isDictionaryKey: true,
    isTranslatable: false,
  },
];

/**
 * @summary Storybook 引数の dictionary エントリー一覧を plain object として複製する。
 * @param entries 複製対象のエントリー一覧を指定する。
 * @returns 複製したエントリー一覧を返す。
 */
const cloneEntries = (entries: ReadonlyArray<MizDictionaryEntry>): MizDictionaryEntry[] => {
  return entries.map((entry: MizDictionaryEntry): MizDictionaryEntry => {
    return {
      ...entry,
    };
  });
};

const meta = {
  title: 'MizTranslation/MizTranslationTable',
  component: MizTranslationTable,
  tags: ['autodocs'],
  argTypes: {
    'onToggle-enabled': { action: 'toggle-enabled' },
    'onUpdate-translation': { action: 'update-translation' },
    onError: { action: 'error' },
  },
  args: {
    entries: sampleEntries,
    'onToggle-enabled': fn(),
    'onUpdate-translation': fn(),
    onError: fn(),
  },
  render: (args) =>
    defineComponent({
      components: { MizTranslationTable },
      setup: () => {
        const entries = ref(cloneEntries(args.entries));

        /**
         * @summary 対象行の有効状態を更新する。
         * @param key 更新対象 key を指定する。
         * @param value 更新後の有効状態を指定する。
         */
        const handleToggleEnabled = (key: string, value: boolean): void => {
          entries.value = entries.value.map((entry: MizDictionaryEntry): MizDictionaryEntry => {
            if (entry.key !== key) return entry;
            return {
              ...entry,
              enabled: value,
            };
          });

          args['onToggle-enabled']?.(key, value);
        };

        /**
         * @summary 対象行の翻訳文を更新する。
         * @param key 更新対象 key を指定する。
         * @param value 更新後の翻訳文を指定する。
         */
        const handleUpdateTranslation = (key: string, value: string): void => {
          entries.value = entries.value.map((entry: MizDictionaryEntry): MizDictionaryEntry => {
            if (entry.key !== key) return entry;
            return {
              ...entry,
              translatedText: value,
            };
          });

          args['onUpdate-translation']?.(key, value);
        };

        /**
         * @summary エラーイベントを Storybook action へ中継する。
         * @param message エラーメッセージを指定する。
         */
        const handleError = (message: string): void => {
          args.onError?.(message);
        };

        return {
          args,
          entries,
          handleToggleEnabled,
          handleUpdateTranslation,
          handleError,
        };
      },
      template: `
        <div>
          <MizTranslationTable
            :entries="entries"
            @toggle-enabled="handleToggleEnabled"
            @update-translation="handleUpdateTranslation"
            @error="handleError"
          />
        </div>
      `,
    }),
} satisfies Meta<typeof MizTranslationTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('有効')).toBeInTheDocument();
    await expect(canvas.getByText('key')).toBeInTheDocument();
    await expect(canvas.getByText('原文')).toBeInTheDocument();
    await expect(canvas.getByText('翻訳')).toBeInTheDocument();
    await expect(canvas.getAllByDisplayValue(/MISSION:/).length).toBeGreaterThan(0);
  },
};

export const ToggleEnabled: Story = {
  play: async ({ canvasElement, args }): Promise<void> => {
    const onToggleEnabled = args['onToggle-enabled'] as unknown as ReturnType<typeof fn>;
    onToggleEnabled.mockClear();
    const canvas = within(canvasElement);
    const checkboxes = canvas.getAllByRole('checkbox');

    await userEvent.click(checkboxes[0] as HTMLElement);

    await waitFor(() => {
      expect(onToggleEnabled).toHaveBeenCalledWith('DictKey_1001', false);
    });
  },
};

export const EditTranslation: Story = {
  play: async ({ canvasElement, args }): Promise<void> => {
    const onUpdateTranslation = args['onUpdate-translation'] as unknown as ReturnType<typeof fn>;
    onUpdateTranslation.mockClear();
    const canvas = within(canvasElement);
    const textareas = canvas.getAllByRole('textbox');
    const editableTextarea = textareas[textareas.length - 1] as HTMLTextAreaElement;

    await userEvent.clear(editableTextarea);
    await userEvent.type(editableTextarea, '日本語訳');

    await waitFor(() => {
      expect(onUpdateTranslation).toHaveBeenCalled();
    });
    await expect(editableTextarea.value).toContain('日本語訳');
  },
};

export const CopyButtonOnHover: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    const sourceCell = canvas.getByTestId('miz-entry-source-DictKey_1001');

    await userEvent.hover(sourceCell);

    await waitFor(() => {
      expect(canvas.getByTestId('miz-entry-copy-DictKey_1001')).toBeInTheDocument();
    });
  },
};

export const CopyError: Story = {
  play: async ({ canvasElement, args }): Promise<void> => {
    const onError = args.onError as unknown as ReturnType<typeof fn>;
    onError.mockClear();
    const originalClipboard = globalThis.navigator.clipboard;

    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: fn().mockRejectedValue(new Error('clipboard unavailable')),
      },
    });

    const canvas = within(canvasElement);
    const sourceCell = canvas.getByTestId('miz-entry-source-DictKey_1001');

    await userEvent.hover(sourceCell);
    await userEvent.click(canvas.getByTestId('miz-entry-copy-DictKey_1001'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('クリップボードへコピーできませんでした。');
    });

    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('表示できる翻訳項目がありません。')).toBeInTheDocument();
  },
};
