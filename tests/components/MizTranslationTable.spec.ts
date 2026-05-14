// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import MizTranslationTable from '@/components/MizTranslationTable.vue';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';

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
 * @summary すべての子要素をそのまま描画する簡易ラッパーを生成する。
 * @param name コンポーネント名を指定する。
 * @returns ラッパーコンポーネントを返す。
 */
const createWrapperComponent = (name: string) =>
  defineComponent({
    name,
    setup(_, { slots, attrs }) {
      return () => h('div', attrs, slots.default?.());
    },
  });

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
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onToggleEnabled = vi.fn();
  const onUpdateTranslation = vi.fn();
  const onError = vi.fn();

  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(MizTranslationTable, {
            entries,
            onToggleEnabled,
            onUpdateTranslation,
            onError,
          });
      },
    }),
  );

  app.component(
    'v-data-table',
    defineComponent({
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
      },
      setup(props, { slots }) {
        return () =>
          h('div', { 'data-testid': 'miz-table-root' }, [
            h(
              'div',
              { 'data-testid': 'miz-table-headers' },
              (props.headers as Array<{ title: string }>).map((header) => header.title).join('|'),
            ),
            h(
              'div',
              { 'data-testid': 'miz-table-header-metadata' },
              JSON.stringify(
                (
                  props.headers as Array<{
                    key: string;
                    sortable: boolean;
                    width?: string;
                    cellProps?: { class: string };
                    headerProps?: { class: string };
                  }>
                ).map((header) => {
                  return {
                    key: header.key,
                    sortable: header.sortable,
                    width: header.width ?? null,
                    cellClass: header.cellProps?.class ?? null,
                    headerClass: header.headerProps?.class ?? null,
                  };
                }),
              ),
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
  );
  app.component(
    'v-checkbox',
    defineComponent({
      name: 'VCheckboxStub',
      props: {
        modelValue: {
          type: Boolean,
          required: true,
        },
      },
      emits: ['update:modelValue'],
      setup(props, { emit, attrs }) {
        return () =>
          h('input', {
            ...attrs,
            type: 'checkbox',
            checked: props.modelValue,
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).checked),
          });
      },
    }),
  );
  app.component(
    'v-btn',
    defineComponent({
      name: 'VBtnStub',
      emits: ['click'],
      setup(_, { emit, attrs, slots }) {
        return () =>
          h(
            'button',
            {
              ...attrs,
              onClick: (event: MouseEvent) => emit('click', event),
            },
            slots.default?.(),
          );
      },
    }),
  );
  app.component(
    'v-textarea',
    defineComponent({
      name: 'VTextareaStub',
      props: {
        modelValue: {
          type: String,
          required: true,
        },
        readonly: {
          type: Boolean,
          required: false,
          default: false,
        },
        rows: {
          type: [Number, String],
          required: false,
          default: 3,
        },
      },
      emits: ['update:modelValue'],
      setup(props, { emit, attrs }) {
        return () =>
          h('div', { ...attrs, class: ['translation-field', attrs.class] }, [
            h('textarea', {
              value: props.modelValue,
              readOnly: props.readonly,
              rows: props.rows,
              onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
            }),
          ]);
      },
    }),
  );
  app.component('v-alert', createWrapperComponent('VAlertStub'));
  app.mount(container);
  await flushComponent();

  return { app, container, onToggleEnabled, onUpdateTranslation, onError };
};

describe('MizTranslationTable', () => {
  /**
   * @summary ヘッダー定義のメタデータを取得する。
   * @param container 描画済みコンテナを指定する。
   * @returns ヘッダー定義一覧を返す。
   */
  const parseHeaderMetadata = (
    container: HTMLElement,
  ): Array<{
    key: string;
    sortable: boolean;
    width: string | null;
    cellClass: string | null;
    headerClass: string | null;
  }> => {
    const raw = container.querySelector('[data-testid="miz-table-header-metadata"]')?.textContent ?? '[]';
    return JSON.parse(raw) as Array<{
      key: string;
      sortable: boolean;
      width: string | null;
      cellClass: string | null;
      headerClass: string | null;
    }>;
  };

  /**
   * @summary 描画されたテーブル行 key の順序を取得する。
   * @param container 描画済みコンテナを指定する。
   * @returns 表示順の key 一覧を返す。
   */
  const parseRenderedRowKeys = (container: HTMLElement): string[] => {
    return [...container.querySelectorAll('[data-testid^="miz-table-row-"]')].map((row) => {
      return row.getAttribute('data-testid')?.replace('miz-table-row-', '') ?? '';
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('有効、key、原文、翻訳の列を描画する', async () => {
    const { app, container } = await mountComponent();
    const sourceTextarea = container.querySelector<HTMLTextAreaElement>('[data-testid="miz-entry-source-text"] textarea');

    expect(container.querySelector('[data-testid="miz-table-headers"]')?.textContent).toContain('有効|key|原文|翻訳');
    expect(container.querySelector('[data-testid="miz-entry-key"]')?.textContent).toContain('DictKey_1');
    expect(container.querySelector('[data-testid="miz-entry-key"]')?.className).toContain('key-cell-text');
    expect(sourceTextarea?.value).toBe('Alpha');
    expect(container.querySelector('[data-testid="miz-entry-translation-DictKey_1"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-entry-translation-DictKey_1"]')?.className).toContain(
      'translation-field',
    );
    expect(container.querySelector('[data-testid="miz-entry-source-text"]')?.className).toContain('translation-field');

    app.unmount();
  });

  it('有効と key 列の固定幅を除去し、原文と翻訳へ同一列クラスを付与する', async () => {
    const { app, container } = await mountComponent();
    const headers = parseHeaderMetadata(container);
    const enabledHeader = headers.find((header) => header.key === 'enabledSortValue');
    const keyHeader = headers.find((header) => header.key === 'keySortValue');
    const sourceHeader = headers.find((header) => header.key === 'sourceTextSortValue');
    const translatedHeader = headers.find((header) => header.key === 'translatedTextSortValue');

    expect(enabledHeader?.width).toBeNull();
    expect(enabledHeader?.cellClass).toBe('miz-translation-table__enabled-column');
    expect(enabledHeader?.headerClass).toBe('miz-translation-table__enabled-column');
    expect(keyHeader?.width).toBeNull();
    expect(keyHeader?.cellClass).toBe('miz-translation-table__key-column');
    expect(keyHeader?.headerClass).toBe('miz-translation-table__key-column');
    expect(sourceHeader?.cellClass).toBe('miz-translation-table__balanced-column');
    expect(sourceHeader?.headerClass).toBe('miz-translation-table__balanced-column');
    expect(sourceHeader?.sortable).toBe(true);
    expect(translatedHeader?.cellClass).toBe('miz-translation-table__balanced-column');
    expect(translatedHeader?.headerClass).toBe('miz-translation-table__balanced-column');
    expect(translatedHeader?.sortable).toBe(true);
    expect(keyHeader?.cellClass).toBe('miz-translation-table__key-column');
    expect(keyHeader?.headerClass).toBe('miz-translation-table__key-column');

    app.unmount();
  });

  it('固定先頭グループを優先しつつ通常 key は昇順で描画する', async () => {
    const { app, container } = await mountComponent([
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

    expect(parseRenderedRowKeys(container)).toEqual(['DictKey_sortie_2', 'DictKey_10', 'DictKey_20']);

    app.unmount();
  });

  it('チェック変更で toggle-enabled を通知する', async () => {
    const { app, container, onToggleEnabled } = await mountComponent();
    const checkbox = container.querySelector('[data-testid="miz-entry-enabled-DictKey_1"]') as HTMLInputElement;

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await flushComponent();

    expect(onToggleEnabled).toHaveBeenCalledWith('DictKey_1', false);

    app.unmount();
  });

  it('翻訳入力変更で update-translation を通知する', async () => {
    const { app, container, onUpdateTranslation } = await mountComponent();
    const textarea = container.querySelector('[data-testid="miz-entry-translation-DictKey_1"] textarea') as HTMLTextAreaElement;

    textarea.value = '翻訳';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await flushComponent();

    expect(onUpdateTranslation).toHaveBeenCalledWith('DictKey_1', '翻訳');

    app.unmount();
  });

  it('原文ホバー時のみコピーボタンを表示する', async () => {
    const { app, container } = await mountComponent();
    const sourceCell = container.querySelector('[data-testid="miz-entry-source-DictKey_1"]');
    const copyButton = container.querySelector('[data-testid="miz-entry-copy-DictKey_1"]');

    expect(copyButton).not.toBeNull();
    expect(copyButton?.className).not.toContain('copy-button--visible');

    sourceCell?.dispatchEvent(new Event('mouseenter', { bubbles: true }));
    await flushComponent();

    expect(container.querySelector('[data-testid="miz-entry-copy-DictKey_1"]')?.className).toContain('copy-button--visible');

    sourceCell?.dispatchEvent(new Event('mouseleave', { bubbles: true }));
    await flushComponent();

    expect(container.querySelector('[data-testid="miz-entry-copy-DictKey_1"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-entry-copy-DictKey_1"]')?.className).not.toContain(
      'copy-button--visible',
    );

    app.unmount();
  });

  it('原文テキストは列幅いっぱいを使い、コピーボタンは重ね表示前提のクラスを持つ', async () => {
    const { app, container } = await mountComponent();
    const sourceCell = container.querySelector('[data-testid="miz-entry-source-DictKey_1"]');
    const sourceText = container.querySelector('[data-testid="miz-entry-source-text"]');
    const copyButton = container.querySelector('[data-testid="miz-entry-copy-DictKey_1"]');

    expect(sourceCell?.className).toContain('source-cell');
    expect(sourceText?.className).toContain('translation-field--source');
    expect(copyButton?.className).toContain('copy-button');

    app.unmount();
  });

  it('原文側 v-textarea は readonly で描画する', async () => {
    const { app, container } = await mountComponent();
    const sourceTextarea = container.querySelector<HTMLTextAreaElement>('[data-testid="miz-entry-source-text"] textarea');

    expect(sourceTextarea?.readOnly).toBe(true);

    app.unmount();
  });

  it('原文 1 行なら翻訳 textarea の初期 rows を 1 にする', async () => {
    const { app, container } = await mountComponent([
      {
        ...sampleEntries[0],
        sourceText: 'Alpha',
      },
    ]);
    const sourceTextarea = container.querySelector<HTMLTextAreaElement>('[data-testid="miz-entry-source-text"] textarea');
    const translatedTextarea = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="miz-entry-translation-DictKey_1"] textarea',
    );

    expect(sourceTextarea?.getAttribute('rows')).toBe('1');
    expect(translatedTextarea?.getAttribute('rows')).toBe('1');

    app.unmount();
  });

  it('原文複数行なら翻訳 textarea の初期 rows を改行数に合わせる', async () => {
    const { app, container } = await mountComponent([
      {
        ...sampleEntries[0],
        sourceText: 'Alpha\nBravo\nCharlie',
      },
    ]);
    const sourceTextarea = container.querySelector<HTMLTextAreaElement>('[data-testid="miz-entry-source-text"] textarea');
    const translatedTextarea = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="miz-entry-translation-DictKey_1"] textarea',
    );

    expect(sourceTextarea?.getAttribute('rows')).toBe('3');
    expect(translatedTextarea?.getAttribute('rows')).toBe('3');

    app.unmount();
  });

  it('空原文でも翻訳 textarea の初期 rows を 1 未満にしない', async () => {
    const { app, container } = await mountComponent([
      {
        ...sampleEntries[0],
        sourceText: '',
      },
    ]);
    const sourceTextarea = container.querySelector<HTMLTextAreaElement>('[data-testid="miz-entry-source-text"] textarea');
    const translatedTextarea = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="miz-entry-translation-DictKey_1"] textarea',
    );

    expect(sourceTextarea?.getAttribute('rows')).toBe('1');
    expect(translatedTextarea?.getAttribute('rows')).toBe('1');

    app.unmount();
  });

  it('コピー成功時は error を通知しない', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });

    const { app, container, onError } = await mountComponent();
    const sourceCell = container.querySelector('[data-testid="miz-entry-source-DictKey_1"]');

    sourceCell?.dispatchEvent(new Event('mouseenter', { bubbles: true }));
    await flushComponent();
    container
      .querySelector('[data-testid="miz-entry-copy-DictKey_1"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(writeText).toHaveBeenCalledWith('Alpha');
    expect(onError).not.toHaveBeenCalled();

    app.unmount();
  });

  it('Clipboard API が利用できない場合は error を通知する', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    const { app, container, onError } = await mountComponent();
    const sourceCell = container.querySelector('[data-testid="miz-entry-source-DictKey_1"]');

    sourceCell?.dispatchEvent(new Event('mouseenter', { bubbles: true }));
    await flushComponent();
    container
      .querySelector('[data-testid="miz-entry-copy-DictKey_1"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onError).toHaveBeenCalledWith('クリップボードへコピーできませんでした。');

    app.unmount();
  });
});
