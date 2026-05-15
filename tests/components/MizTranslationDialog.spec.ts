// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import type { MizDictionaryEntry, MizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryModels';

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

const sampleFilter: MizDictionaryFilter = {
  showEnabled: true,
  showDisabled: true,
  showOnlyUntranslated: false,
  hideNonTranslatable: true,
  hideEmptySourceText: true,
};

vi.mock('@/components/MizTranslationTable.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'MizTranslationTableStub',
      props: {
        entries: {
          type: Array,
          required: true,
        },
      },
      emits: ['toggle-enabled', 'update-translation', 'error'],
      setup(props, { emit }) {
        return () =>
          h('div', { 'data-testid': 'miz-table-stub' }, [
            h('output', { 'data-testid': 'miz-table-entry-count' }, String(props.entries.length)),
            h(
              'output',
              { 'data-testid': 'miz-table-entry-state' },
              JSON.stringify(
                (props.entries as Array<{ key: string; enabled: boolean; sourceText: string }>).map((entry) => {
                  return {
                    key: entry.key,
                    enabled: entry.enabled,
                    sourceText: entry.sourceText,
                  };
                }),
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                onClick: () => emit('toggle-enabled', 'DictKey_1', false),
              },
              'toggle enabled',
            ),
            h(
              'button',
              {
                type: 'button',
                onClick: () => emit('update-translation', 'DictKey_1', '翻訳'),
              },
              'update translation',
            ),
            h(
              'button',
              {
                type: 'button',
                onClick: () => emit('error', 'copy error'),
              },
              'table error',
            ),
          ]);
      },
    }),
  };
});

vi.mock('/src/components/MizTranslationTable.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'MizTranslationTableStub',
      props: {
        entries: {
          type: Array,
          required: true,
        },
      },
      emits: ['toggle-enabled', 'update-translation', 'error'],
      setup(props, { emit }) {
        return () =>
          h('div', { 'data-testid': 'miz-table-stub' }, [
            h('output', { 'data-testid': 'miz-table-entry-count' }, String(props.entries.length)),
            h(
              'output',
              { 'data-testid': 'miz-table-entry-state' },
              JSON.stringify(
                (props.entries as Array<{ key: string; enabled: boolean; sourceText: string }>).map((entry) => {
                  return {
                    key: entry.key,
                    enabled: entry.enabled,
                    sourceText: entry.sourceText,
                  };
                }),
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                onClick: () => emit('toggle-enabled', 'DictKey_1', false),
              },
              'toggle enabled',
            ),
            h(
              'button',
              {
                type: 'button',
                onClick: () => emit('update-translation', 'DictKey_1', '翻訳'),
              },
              'update translation',
            ),
            h(
              'button',
              {
                type: 'button',
                onClick: () => emit('error', 'copy error'),
              },
              'table error',
            ),
          ]);
      },
    }),
  };
});

vi.mock('@/components/MizTranslationFilterPanel.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'MizTranslationFilterPanelStub',
      props: {
        visibleEntryCount: {
          type: Number,
          required: true,
        },
        totalEntryCount: {
          type: Number,
          required: true,
        },
      },
      emits: [
        'update:show-enabled',
        'update:show-disabled',
        'update:show-only-untranslated',
        'update:hide-non-translatable',
        'update:hide-empty-source-text',
      ],
      setup(props, { emit }) {
        return () =>
          h('div', { 'data-testid': 'miz-filter-stub' }, [
            h('output', { 'data-testid': 'miz-filter-count-stub' }, `${props.visibleEntryCount}/${props.totalEntryCount}`),
            h('button', { type: 'button', onClick: () => emit('update:show-enabled', false) }, 'update show enabled'),
            h('button', { type: 'button', onClick: () => emit('update:show-disabled', false) }, 'update show disabled'),
            h(
              'button',
              { type: 'button', onClick: () => emit('update:show-only-untranslated', true) },
              'update show untranslated',
            ),
            h(
              'button',
              { type: 'button', onClick: () => emit('update:hide-non-translatable', false) },
              'update hide non translatable',
            ),
            h(
              'button',
              { type: 'button', onClick: () => emit('update:hide-empty-source-text', false) },
              'update hide empty source',
            ),
          ]);
      },
    }),
  };
});

vi.mock('/src/components/MizTranslationFilterPanel.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'MizTranslationFilterPanelStub',
      props: {
        visibleEntryCount: {
          type: Number,
          required: true,
        },
        totalEntryCount: {
          type: Number,
          required: true,
        },
      },
      emits: [
        'update:show-enabled',
        'update:show-disabled',
        'update:show-only-untranslated',
        'update:hide-non-translatable',
        'update:hide-empty-source-text',
      ],
      setup(props, { emit }) {
        return () =>
          h('div', { 'data-testid': 'miz-filter-stub' }, [
            h('output', { 'data-testid': 'miz-filter-count-stub' }, `${props.visibleEntryCount}/${props.totalEntryCount}`),
            h('button', { type: 'button', onClick: () => emit('update:show-enabled', false) }, 'update show enabled'),
            h('button', { type: 'button', onClick: () => emit('update:show-disabled', false) }, 'update show disabled'),
            h(
              'button',
              { type: 'button', onClick: () => emit('update:show-only-untranslated', true) },
              'update show untranslated',
            ),
            h(
              'button',
              { type: 'button', onClick: () => emit('update:hide-non-translatable', false) },
              'update hide non translatable',
            ),
            h(
              'button',
              { type: 'button', onClick: () => emit('update:hide-empty-source-text', false) },
              'update hide empty source',
            ),
          ]);
      },
    }),
  };
});

import MizTranslationDialog from '@/components/MizTranslationDialog.vue';

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

const mountComponent = async (props?: {
  modelValue?: boolean;
  loadedFileName?: string;
  isLoading?: boolean;
  entries?: MizDictionaryEntry[];
  errorMessage?: string | null;
  filter?: MizDictionaryFilter;
  visibleEntryCount?: number;
  totalEntryCount?: number;
}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onUpdateModelValue = vi.fn();
  const onToggleEnabled = vi.fn();
  const onUpdateTranslation = vi.fn();
  const onImportDictionary = vi.fn();
  const onDownloadDictionary = vi.fn();
  const onError = vi.fn();
  const onShowEnabled = vi.fn();
  const onShowDisabled = vi.fn();
  const onShowOnlyUntranslated = vi.fn();
  const onHideNonTranslatable = vi.fn();
  const onHideEmptySourceText = vi.fn();

  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(MizTranslationDialog, {
            modelValue: props?.modelValue ?? true,
            loadedFileName: props?.loadedFileName ?? 'mission.miz',
            isLoading: props?.isLoading ?? false,
            entries: props?.entries ?? sampleEntries,
            errorMessage: props?.errorMessage ?? null,
            filter: props?.filter ?? sampleFilter,
            visibleEntryCount: props?.visibleEntryCount ?? 1,
            totalEntryCount: props?.totalEntryCount ?? 1,
            'onUpdate:modelValue': onUpdateModelValue,
            'onUpdate:show-enabled': onShowEnabled,
            'onUpdate:show-disabled': onShowDisabled,
            'onUpdate:show-only-untranslated': onShowOnlyUntranslated,
            'onUpdate:hide-non-translatable': onHideNonTranslatable,
            'onUpdate:hide-empty-source-text': onHideEmptySourceText,
            onToggleEnabled,
            onUpdateTranslation,
            onImportDictionary,
            onDownloadDictionary,
            onError,
          });
      },
    }),
  );

  app.component(
    'v-dialog',
    defineComponent({
      name: 'VDialogStub',
      props: {
        modelValue: {
          type: Boolean,
          required: true,
        },
      },
      setup(props, { slots, attrs }) {
        return () => (props.modelValue ? h('div', attrs, slots.default?.()) : null);
      },
    }),
  );
  app.component('v-card', createWrapperComponent('VCardStub'));
  app.component('v-toolbar', createWrapperComponent('VToolbarStub'));
  app.component('v-toolbar-title', createWrapperComponent('VToolbarTitleStub'));
  app.component('v-spacer', createWrapperComponent('VSpacerStub'));
  app.component('v-card-text', createWrapperComponent('VCardTextStub'));
  app.component('v-container', createWrapperComponent('VContainerStub'));
  app.component(
    'v-btn',
    defineComponent({
      name: 'VBtnStub',
      props: {
        disabled: {
          type: Boolean,
          required: false,
          default: false,
        },
      },
      emits: ['click'],
      setup(props, { emit, slots, attrs }) {
        return () =>
          h(
            'button',
            {
              ...attrs,
              disabled: props.disabled,
              onClick: (event: MouseEvent) => emit('click', event),
            },
            slots.default?.(),
          );
      },
    }),
  );
  app.component(
    'v-alert',
    defineComponent({
      name: 'VAlertStub',
      props: {
        text: {
          type: String,
          required: false,
          default: '',
        },
      },
      setup(props, { slots, attrs }) {
        return () => h('div', attrs, props.text || slots.default?.());
      },
    }),
  );
  app.mount(container);
  await flushComponent();

  return {
    app,
    container,
    onUpdateModelValue,
    onShowEnabled,
    onShowDisabled,
    onShowOnlyUntranslated,
    onHideNonTranslatable,
    onHideEmptySourceText,
    onToggleEnabled,
    onUpdateTranslation,
    onImportDictionary,
    onDownloadDictionary,
    onError,
  };
};

describe('MizTranslationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('表示時に読込ファイル名とテーブルを表示する', async () => {
    const { app, container } = await mountComponent({ modelValue: true, loadedFileName: 'briefing.miz', isLoading: false });

    expect(container.textContent).toContain('MIZ 翻訳');
    expect(container.querySelector('[data-testid="miz-dialog-file-name"]')?.textContent).toBe('briefing.miz');
    expect(container.querySelector('[data-testid="miz-dialog-information"]')?.textContent).toContain(
      '原文と key は読み取り専用',
    );
    expect(container.textContent).toContain('有効にチェックが入っている項目だけが翻訳した dictionary ファイルに追加されます。');
    expect(container.textContent).toContain('dictionary ファイルを直接編集するときのような \\ エスケープは不要です。');
    expect(container.textContent).toContain('Lua コードが翻訳対象となっている可能性があります。');
    expect(container.querySelector('[data-testid="miz-table-entry-count"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="miz-dialog-import-button"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-dialog-download-button"]')).not.toBeNull();

    app.unmount();
  });

  it('読込中は loading 表示を優先する', async () => {
    const { app, container } = await mountComponent({ modelValue: true, isLoading: true });

    expect(container.querySelector('[data-testid="miz-dialog-loading"]')?.textContent).toContain('読み込み中');
    expect(container.querySelector('[data-testid="miz-table-stub"]')).toBeNull();
    expect(
      (container.querySelector('button[aria-label="MIZ 翻訳ダイアログを閉じる"]') as HTMLButtonElement | null)?.disabled,
    ).toBe(true);
    expect((container.querySelector('[data-testid="miz-dialog-import-button"]') as HTMLButtonElement | null)?.disabled).toBe(
      true,
    );
    expect((container.querySelector('[data-testid="miz-dialog-download-button"]') as HTMLButtonElement | null)?.disabled).toBe(
      true,
    );

    app.unmount();
  });

  it('errorMessage があるときはエラー表示を描画する', async () => {
    const { app, container } = await mountComponent({
      modelValue: true,
      errorMessage: 'dictionary の読み込みに失敗しました。',
    });

    expect(container.querySelector('[data-testid="miz-dialog-error"]')?.textContent).toContain(
      'dictionary の読み込みに失敗しました。',
    );
    expect(container.querySelector('[data-testid="miz-dialog-information"]')).not.toBeNull();

    app.unmount();
  });

  it('テーブルイベントを親へ中継する', async () => {
    const {
      app,
      container,
      onShowEnabled,
      onShowDisabled,
      onShowOnlyUntranslated,
      onHideNonTranslatable,
      onHideEmptySourceText,
      onToggleEnabled,
      onUpdateTranslation,
      onError,
    } = await mountComponent();

    const buttons = [...container.querySelectorAll('button')];
    buttons
      .find((button) => button.textContent === 'update show enabled')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons
      .find((button) => button.textContent === 'update show disabled')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons
      .find((button) => button.textContent === 'update show untranslated')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons
      .find((button) => button.textContent === 'update hide non translatable')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons
      .find((button) => button.textContent === 'update hide empty source')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons
      .find((button) => button.textContent === 'toggle enabled')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons
      .find((button) => button.textContent === 'update translation')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons.find((button) => button.textContent === 'table error')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onShowEnabled).toHaveBeenCalledWith(false);
    expect(onShowDisabled).toHaveBeenCalledWith(false);
    expect(onShowOnlyUntranslated).toHaveBeenCalledWith(true);
    expect(onHideNonTranslatable).toHaveBeenCalledWith(false);
    expect(onHideEmptySourceText).toHaveBeenCalledWith(false);
    expect(onToggleEnabled).toHaveBeenCalledWith('DictKey_1', false);
    expect(onUpdateTranslation).toHaveBeenCalledWith('DictKey_1', '翻訳');
    expect(onError).toHaveBeenCalledWith('copy error');

    app.unmount();
  });

  it('dictionary import と download イベントを親へ中継する', async () => {
    const { app, container, onImportDictionary, onDownloadDictionary } = await mountComponent();
    const dictionaryInput = container.querySelector('[data-testid="miz-dialog-dictionary-input"]') as HTMLInputElement | null;
    const importButton = container.querySelector('[data-testid="miz-dialog-import-button"]');
    const downloadButton = container.querySelector('[data-testid="miz-dialog-download-button"]');

    importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const file = new File(['dictionary = {}'], 'dictionary', { type: 'text/plain' });
    if (dictionaryInput !== null) {
      Object.defineProperty(dictionaryInput, 'files', {
        configurable: true,
        value: [file],
      });
      dictionaryInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onImportDictionary).toHaveBeenCalledTimes(1);
    expect(onImportDictionary.mock.calls[0]?.[0]).toBeInstanceOf(File);
    expect(onImportDictionary.mock.calls[0]?.[0]?.name).toBe('dictionary');
    expect(onDownloadDictionary).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('entries が空のとき download ボタンを無効化する', async () => {
    const { app, container, onDownloadDictionary } = await mountComponent({
      entries: [],
      visibleEntryCount: 0,
      totalEntryCount: 0,
    });
    const downloadButton = container.querySelector('[data-testid="miz-dialog-download-button"]') as HTMLButtonElement | null;

    expect(downloadButton?.disabled).toBe(true);

    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onDownloadDictionary).not.toHaveBeenCalled();

    app.unmount();
  });

  it('filtered entries が空でも totalEntryCount が残っていれば download ボタンを有効化する', async () => {
    const { app, container, onDownloadDictionary } = await mountComponent({
      entries: [],
      visibleEntryCount: 0,
      totalEntryCount: 2,
    });
    const downloadButton = container.querySelector('[data-testid="miz-dialog-download-button"]') as HTMLButtonElement | null;

    expect(downloadButton?.disabled).toBe(false);

    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onDownloadDictionary).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('空原文と空白原文の行を未チェック状態で受け取れる', async () => {
    const { app, container } = await mountComponent({
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
      ],
      visibleEntryCount: 2,
      totalEntryCount: 2,
    });

    expect(container.querySelector('[data-testid="miz-table-entry-count"]')?.textContent).toBe('2');
    expect(container.querySelector('[data-testid="miz-table-entry-state"]')?.textContent).toBe(
      JSON.stringify([
        {
          key: 'DictKey_6',
          enabled: false,
          sourceText: '',
        },
        {
          key: 'DictKey_7',
          enabled: false,
          sourceText: '   ',
        },
      ]),
    );

    app.unmount();
  });

  it('閉じる操作で update:modelValue(false) を通知する', async () => {
    const { app, container, onUpdateModelValue } = await mountComponent({ modelValue: true });
    const closeButton = container.querySelector('button[aria-label="MIZ 翻訳ダイアログを閉じる"]');

    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onUpdateModelValue).toHaveBeenCalledWith(false);

    app.unmount();
  });
});
