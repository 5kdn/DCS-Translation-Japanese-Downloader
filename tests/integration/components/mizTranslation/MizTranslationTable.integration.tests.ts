// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import MizTranslationTable from '@/components/mizTranslation/MizTranslationTable.vue';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import type { MizTranslationExportSort } from '@/features/mizTranslation/mizTranslationDownloadModels';
import { mountIntegrationComponent } from '../../support/vueTestUtils/mountComponent';
import { createAlertStub, createButtonStub, createTextareaStub } from '../../support/vueTestUtils/vuetifyStubs';

const sampleEntries: MizDictionaryEntry[] = [
  {
    key: 'DictKey_1',
    sourceText: 'Alpha',
    translatedText: '',
    enabled: true,
    isDictionaryKey: true,
    isTranslatable: true,
  },
];

/**
 * @summary 非同期描画の完了を待機する。
 */
const flushComponent = async (): Promise<void> => {
  for (const _index of [0, 1, 2, 3]) {
    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
};

const mountComponent = async (entries: MizDictionaryEntry[] = sampleEntries) => {
  const onToggleEnabled = vi.fn();
  const onUpdateTranslation = vi.fn();
  const onUpdateSort = vi.fn();
  const onError = vi.fn();

  const { cleanup, container, wrapper } = mountIntegrationComponent(MizTranslationTable, {
    props: {
      entries,
      onToggleEnabled,
      onUpdateTranslation,
      onUpdateSort,
      onError,
    },
    global: {
      components: {
        'v-data-table': defineComponent({
          name: 'VDataTableStub',
          props: {
            headers: {
              type: Array,
              required: true,
            },
            items: {
              type: Array,
              required: true,
            },
            sortBy: {
              type: Array,
              required: false,
              default: () => [],
            },
          },
          emits: ['update:sortBy'],
          setup(props, { slots, emit }) {
            return () =>
              h('div', { 'data-testid': 'miz-table-root' }, [
                h(
                  'div',
                  { 'data-testid': 'miz-table-headers' },
                  (props.headers as Array<{ title: string }>).map((header) => header.title).join('|'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    'data-testid': 'miz-table-sort-source-desc',
                    onClick: () =>
                      emit('update:sortBy', [
                        {
                          key: 'sourceTextSortValue',
                          order: 'desc',
                        },
                      ]),
                  },
                  undefined,
                ),
                ...(props.items as Array<{ entry: MizDictionaryEntry; keySortValue: string }>).map((item) =>
                  h('div', { 'data-testid': `miz-table-row-${item.entry.key}` }, [
                    h('div', slots['item.enabledSortValue']?.({ item: { raw: item } })),
                    h('div', slots['item.keySortValue']?.({ item: { raw: item } })),
                    h('div', slots['item.sourceTextSortValue']?.({ item: { raw: item } })),
                    h('div', slots['item.translatedTextSortValue']?.({ item: { raw: item } })),
                  ]),
                ),
                props.items.length === 0 ? slots['no-data']?.() : null,
              ]);
          },
        }),
        'v-checkbox': defineComponent({
          name: 'VCheckboxStub',
          props: {
            modelValue: {
              type: Boolean,
              required: true,
            },
          },
          emits: ['update:modelValue', 'update:model-value'],
          setup(props, { emit, attrs }) {
            return () =>
              h('input', {
                ...attrs,
                type: 'checkbox',
                checked: props.modelValue,
                onChange: (event: Event) => {
                  const checked = (event.target as HTMLInputElement).checked;
                  emit('update:modelValue', checked);
                  emit('update:model-value', checked);
                },
              });
          },
        }),
        'v-btn': createButtonStub(),
        'v-textarea': createTextareaStub(),
        'v-alert': createAlertStub(),
      },
    },
  });
  await flushComponent();

  return { cleanup, container, wrapper, onToggleEnabled, onUpdateTranslation, onUpdateSort, onError };
};

describe('MizTranslationTable', () => {
  /**
   * @summary 描画されたテーブル行 key の順序を取得する。
   * @param wrapper 描画済み wrapper を指定する。
   * @returns 表示順の key 一覧を返す。
   */
  const parseRenderedRowKeys = (wrapper: ReturnType<typeof mountIntegrationComponent>['wrapper']): string[] => {
    return wrapper.findAll('[data-testid^="miz-table-row-"]').map((row) => {
      const testId = row.attributes('data-testid');

      if (testId === undefined) {
        throw new Error('miz table row の data-testid が取得できませんでした。');
      }

      return testId.replace('miz-table-row-', '');
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('固定先頭グループを優先しつつ通常 key は昇順で描画する', async () => {
    const { cleanup, wrapper } = await mountComponent([
      {
        ...sampleEntries[0],
        key: 'DictKey_20',
        sourceText: 'Zulu',
      },
      {
        ...sampleEntries[0],
        key: 'DictKey_sortie_2',
        sourceText: 'Sortie',
      },
      {
        ...sampleEntries[0],
        key: 'DictKey_10',
        sourceText: 'Alpha',
      },
    ]);

    expect(parseRenderedRowKeys(wrapper)).toEqual(['DictKey_sortie_2', 'DictKey_10', 'DictKey_20']);

    cleanup();
  });

  it('チェック変更で toggle-enabled を通知する', async () => {
    const { cleanup, wrapper, onToggleEnabled } = await mountComponent();

    await wrapper.get('[data-testid="miz-entry-enabled-DictKey_1"]').setValue(false);
    await flushComponent();

    expect(onToggleEnabled).toHaveBeenCalledWith('DictKey_1', false);

    cleanup();
  });

  it('翻訳入力変更で update-translation を通知する', async () => {
    const { cleanup, wrapper, onUpdateTranslation } = await mountComponent();

    await wrapper.get('[data-testid="miz-entry-translation-DictKey_1"] textarea').setValue('翻訳');
    await flushComponent();

    expect(onUpdateTranslation).toHaveBeenCalledWith('DictKey_1', '翻訳');

    cleanup();
  });

  it('コピー成功時は error を通知しない', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });

    const { cleanup, wrapper, onError } = await mountComponent();
    const sourceCell = wrapper.get('[data-testid="miz-entry-source-DictKey_1"]');

    await sourceCell.trigger('mouseenter');
    await flushComponent();
    await wrapper.get('[data-testid="miz-entry-copy-DictKey_1"]').trigger('click');
    await flushComponent();

    expect(writeText).toHaveBeenCalledWith('Alpha');
    expect(onError).not.toHaveBeenCalled();

    cleanup();
  });

  it('Clipboard API が利用できない場合は error を通知する', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    const { cleanup, wrapper, onError } = await mountComponent();
    const sourceCell = wrapper.get('[data-testid="miz-entry-source-DictKey_1"]');

    await sourceCell.trigger('mouseenter');
    await flushComponent();
    await wrapper.get('[data-testid="miz-entry-copy-DictKey_1"]').trigger('click');
    await flushComponent();

    expect(onError).toHaveBeenCalledWith('クリップボードへコピーできませんでした。');

    cleanup();
  });

  it('ソート変更で export 用ソート状態を通知する', async () => {
    const entries = [
      {
        ...sampleEntries[0],
        key: 'DictKey_2',
        sourceText: 'Bravo',
      },
      {
        ...sampleEntries[0],
        key: 'DictKey_1',
        sourceText: 'Alpha',
      },
    ];
    const { cleanup, wrapper, onUpdateSort } = await mountComponent(entries);

    await wrapper.get('[data-testid="miz-table-sort-source-desc"]').trigger('click');
    await flushComponent();

    expect(onUpdateSort).toHaveBeenLastCalledWith({
      sortKey: 'sourceText',
      sortOrder: 'desc',
    } satisfies MizTranslationExportSort);

    cleanup();
  });
});
