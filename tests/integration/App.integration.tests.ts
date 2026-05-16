// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import App from '@/App.vue';
import { parseMizDictionaryDocument } from '@/features/mizTranslation/mizDictionaryParser';
import { MIZ_TRANSLATION_GENERATOR_VERSION } from '@/features/mizTranslation/mizTranslationGeneratorVersion';

const {
  healthCheckMock,
  fetchTreeMock,
  fetchCreatePrMock,
  readMizDictionaryEntriesMock,
  parseImportedDictionaryValuesMock,
  parseMizTranslationImportEntriesMock,
  mizEntrySelectedFileState,
} = vi.hoisted(() => {
  return {
    healthCheckMock: vi.fn(),
    fetchTreeMock: vi.fn(),
    fetchCreatePrMock: vi.fn(),
    readMizDictionaryEntriesMock: vi.fn(),
    parseImportedDictionaryValuesMock: vi.fn(),
    parseMizTranslationImportEntriesMock: vi.fn(),
    mizEntrySelectedFileState: {
      fileName: 'mission.miz',
    },
  };
});

vi.mock('@/lib/client', () => {
  return {
    healthCheck: healthCheckMock,
    fetchTree: fetchTreeMock,
    fetchCreatePr: fetchCreatePrMock,
  };
});

vi.mock('@/features/mizTranslation/mizTranslationService', async () => {
  const actual = await vi.importActual<typeof import('@/features/mizTranslation/mizTranslationService')>(
    '@/features/mizTranslation/mizTranslationService',
  );

  return {
    ...actual,
    readMizDictionaryEntries: readMizDictionaryEntriesMock,
    parseImportedDictionaryValues: parseImportedDictionaryValuesMock,
    parseMizTranslationImportEntries: parseMizTranslationImportEntriesMock,
  };
});

vi.mock('@/components/IssueViewer.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      setup(_, { slots }) {
        return () => slots.default?.({ toggle: () => undefined, isLoading: false }) ?? null;
      },
    }),
  };
});

vi.mock('@/components/Footer.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'FooterStub',
      setup: () => () => h('div', 'FooterStub'),
    }),
  };
});

vi.mock('@/components/common/Button.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'ButtonStub',
      props: {
        label: {
          type: String,
          required: false,
        },
      },
      setup(props) {
        return () => h('button', props.label ?? 'ButtonStub');
      },
    }),
  };
});

vi.mock('@/components/UploadDialog.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'UploadDialogStub',
      setup: () => () => h('div', { 'data-testid': 'upload-dialog-stub' }, 'UploadDialogStub'),
    }),
  };
});

const mizTranslationEntrySectionStubModule = {
  __esModule: true,
  default: defineComponent({
    name: 'MizTranslationEntrySectionStub',
    props: {
      isLoading: {
        type: Boolean,
        required: true,
      },
      errorMessage: {
        type: String,
        required: false,
        default: null,
      },
    },
    emits: ['select-miz', 'clear-error'],
    setup(props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'miz-entry-section-stub' }, [
          h('output', { 'data-testid': 'miz-entry-loading' }, String(props.isLoading)),
          h('output', { 'data-testid': 'miz-entry-error' }, props.errorMessage ?? ''),
          h(
            'button',
            {
              type: 'button',
              'data-testid': 'miz-entry-select',
              onClick: () => {
                emit('select-miz', new File(['zip'], mizEntrySelectedFileState.fileName, { type: 'application/zip' }));
              },
            },
            undefined,
          ),
          h(
            'button',
            {
              type: 'button',
              'data-testid': 'miz-entry-clear-error',
              onClick: () => emit('clear-error'),
            },
            undefined,
          ),
        ]);
    },
  }),
};

vi.mock('@/components/mizTranslation/MizTranslationEntrySection.vue', () => {
  return mizTranslationEntrySectionStubModule;
});

vi.mock('@/components/mizTranslation/MizTranslationEntrySection.vue', () => {
  return mizTranslationEntrySectionStubModule;
});

const mizTranslationDialogStubModule = {
  __esModule: true,
  default: defineComponent({
    name: 'MizTranslationDialogStub',
    props: {
      modelValue: {
        type: Boolean,
        required: true,
      },
      loadedFileName: {
        type: String,
        required: true,
      },
      isLoading: {
        type: Boolean,
        required: true,
      },
      entries: {
        type: Array,
        required: true,
      },
      filter: {
        type: Object,
        required: true,
      },
      visibleEntryCount: {
        type: Number,
        required: true,
      },
      totalEntryCount: {
        type: Number,
        required: true,
      },
      errorMessage: {
        type: String,
        required: false,
        default: null,
      },
    },
    emits: [
      'update:modelValue',
      'update:show-enabled',
      'update:show-disabled',
      'update:show-only-untranslated',
      'update:hide-non-translatable',
      'update:hide-empty-source-text',
      'toggle-enabled',
      'update-translation',
      'update-sort',
      'import-dictionary',
      'download',
      'error',
    ],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h('div', { 'data-testid': 'miz-dialog-stub' }, [
              h('output', { 'data-testid': 'miz-dialog-file-name' }, props.loadedFileName),
              h('output', { 'data-testid': 'miz-dialog-loading' }, String(props.isLoading)),
              h('output', { 'data-testid': 'miz-dialog-entry-count' }, String((props.entries as Array<unknown>).length)),
              h('output', { 'data-testid': 'miz-dialog-visible-entry-count' }, String(props.visibleEntryCount)),
              h('output', { 'data-testid': 'miz-dialog-total-entry-count' }, String(props.totalEntryCount)),
              h(
                'output',
                { 'data-testid': 'miz-dialog-entry-state' },
                JSON.stringify(
                  (props.entries as Array<{ key: string; enabled: boolean; translatedText: string }>).map((entry) => {
                    return {
                      key: entry.key,
                      enabled: entry.enabled,
                      translatedText: entry.translatedText,
                    };
                  }),
                ),
              ),
              h('output', { 'data-testid': 'miz-dialog-error' }, props.errorMessage),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-close',
                  onClick: () => emit('update:modelValue', false),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-filter-untranslated',
                  onClick: () => emit('update:show-only-untranslated', true),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-toggle-entry',
                  onClick: () => emit('toggle-enabled', 'DictKey_1', false),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-translate-entry',
                  onClick: () => emit('update-translation', 'DictKey_1', '翻訳1'),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-update-sort',
                  onClick: () => emit('update-sort', { sortKey: 'sourceText', sortOrder: 'desc' }),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-import-dictionary',
                  onClick: () =>
                    emit(
                      'import-dictionary',
                      'dictionary',
                      new File(['dictionary = {}'], 'dictionary', { type: 'text/plain' }),
                    ),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-import-po',
                  onClick: () => emit('import-dictionary', 'po', new File(['po'], 'sample.po', { type: 'text/plain' })),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-import-csv',
                  onClick: () => emit('import-dictionary', 'csv', new File(['csv'], 'sample.csv', { type: 'text/csv' })),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-download-dictionary',
                  onClick: () => emit('download', 'dictionary'),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-download-po',
                  onClick: () => emit('download', 'po'),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-download-csv',
                  onClick: () => emit('download', 'csv'),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-dialog-error-button',
                  onClick: () => emit('error', 'copy error'),
                },
                undefined,
              ),
            ])
          : null;
    },
  }),
};

vi.mock('@/components/mizTranslation/MizTranslationDialog.vue', () => {
  return mizTranslationDialogStubModule;
});

vi.mock('@/components/mizTranslation/MizTranslationDialog.vue', () => {
  return mizTranslationDialogStubModule;
});

const mizTranslationCloseConfirmDialogStubModule = {
  __esModule: true,
  default: defineComponent({
    name: 'MizTranslationCloseConfirmDialogStub',
    props: {
      modelValue: {
        type: Boolean,
        required: true,
      },
    },
    emits: ['update:modelValue', 'confirm'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h('div', { 'data-testid': 'miz-close-confirm-dialog-stub' }, [
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-close-confirm-cancel',
                  onClick: () => emit('update:modelValue', false),
                },
                undefined,
              ),
              h(
                'button',
                {
                  type: 'button',
                  'data-testid': 'miz-close-confirm-confirm',
                  onClick: () => emit('confirm'),
                },
                undefined,
              ),
            ])
          : null;
    },
  }),
};

vi.mock('@/components/mizTranslation/MizTranslationCloseConfirmDialog.vue', () => {
  return mizTranslationCloseConfirmDialogStubModule;
});

vi.mock('@/components/mizTranslation/MizTranslationCloseConfirmDialog.vue', () => {
  return mizTranslationCloseConfirmDialogStubModule;
});

const downloadCategoryTabsMockModule = {
  __esModule: true,
  default: defineComponent({
    name: 'DownloadCategoryTabsStub',
    props: {
      rows: {
        type: Array,
        required: true,
      },
      searchCandidates: {
        type: Array,
        required: false,
      },
    },
    setup(props) {
      /**
       * @summary ダウンロードカテゴリ行一覧をテスト用の表示形式へ変換する。
       * @returns 行名を `|` 区切りで連結した文字列を返す。
       */
      const toRowNamesText = (): string => {
        return (props.rows as Array<{ name: string }>).map((row) => row.name).join('|');
      };

      return () =>
        h('div', { 'data-testid': 'download-category-tabs-stub' }, [
          h('output', { 'data-testid': 'rows-is-array' }, String(Array.isArray(props.rows))),
          h('output', { 'data-testid': 'row-names' }, toRowNamesText()),
          h(
            'output',
            { 'data-testid': 'search-candidates' },
            (props.searchCandidates as string[] | undefined)?.join('|') ?? '',
          ),
        ]);
    },
  }),
};

vi.mock('@/components/download/DownloadCategoryTabs.vue', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('@/components/download/DownloadCategoryTabs.vue', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('@/components/download/DownloadCategoryTabs.vue?vue&type=script&setup=true&lang.ts', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('@/components/download/DownloadCategoryTabs.vue?vue&type=script&setup=true&lang.tsx', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('@/components/download/DownloadCategoryTabs.vue?vue', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('@/components/download/DownloadCategoryTabs.vue?vue', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('@/components/download/DownloadCategoryTabs.vue?vue&type=script&setup=true&lang.ts', () => {
  return downloadCategoryTabsMockModule;
});

/**
 * @summary 非同期コンポーネント描画と onMounted 完了を待機する。
 */
const flushApp = async (): Promise<void> => {
  for (const _index of [0, 1, 2, 3]) {
    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
};

/**
 * @summary 子要素をそのまま描画する簡易ラッパーを生成する。
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
 * @summary App 描画に必要な Vuetify シェルをテスト用に登録する。
 * @param app 登録先のアプリケーションを指定する。
 */
const registerAppShellComponents = (app: ReturnType<typeof createApp>): void => {
  app.component('v-app', createWrapperComponent('VAppStub'));
  app.component('v-app-bar', createWrapperComponent('VAppBarStub'));
  app.component('v-app-bar-title', createWrapperComponent('VAppBarTitleStub'));
  app.component('v-main', createWrapperComponent('VMainStub'));
  app.component('v-responsive', createWrapperComponent('VResponsiveStub'));
  app.component('v-container', createWrapperComponent('VContainerStub'));
  app.component('v-expansion-panels', createWrapperComponent('VExpansionPanelsStub'));
  app.component('v-expansion-panel', createWrapperComponent('VExpansionPanelStub'));
  app.component('v-expansion-panel-title', createWrapperComponent('VExpansionPanelTitleStub'));
  app.component('v-expansion-panel-text', createWrapperComponent('VExpansionPanelTextStub'));
  app.component('v-divider', createWrapperComponent('VDividerStub'));
  app.component(
    'v-icon',
    defineComponent({
      name: 'VIconStub',
      setup(_, { attrs }) {
        return () => h('i', attrs);
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
      setup(props, { attrs, slots }) {
        return () => h('div', attrs, props.text || slots.default?.());
      },
    }),
  );
};

/**
 * @summary 実アプリ相当のプラグインを登録した App をマウントする。
 * @returns アプリケーション本体と描画先コンテナを返す。
 */
const mountApp = async (): Promise<{
  app: ReturnType<typeof createApp>;
  container: HTMLDivElement;
}> => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const app = createApp(App);
  registerAppShellComponents(app);
  app.mount(container);

  await flushApp();

  return { app, container };
};

describe('App', () => {
  /**
   * @summary ダイアログへ渡された翻訳行状態を取得する。
   * @param container 描画済みコンテナを指定する。
   * @returns key と編集状態の一覧を返す。
   */
  const parseDialogEntryState = (container: HTMLElement): Array<{ key: string; enabled: boolean; translatedText: string }> => {
    const raw = container.querySelector('[data-testid="miz-dialog-entry-state"]')?.textContent ?? '[]';
    return JSON.parse(raw) as Array<{ key: string; enabled: boolean; translatedText: string }>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mizEntrySelectedFileState.fileName = 'mission.miz';
    healthCheckMock.mockResolvedValue(true);
    fetchTreeMock.mockResolvedValue([
      {
        path: 'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
        type: 'blob',
        mode: '100644',
        url: 'https://example.test/F-16C',
        sha: 'sha-f16',
        size: 1,
        updatedAt: new Date('2026-05-11T00:00:00Z'),
      },
    ]);
    fetchCreatePrMock.mockResolvedValue([]);
    readMizDictionaryEntriesMock.mockResolvedValue({
      entries: [
        {
          key: 'DictKey_1',
          sourceText: 'Alpha',
          translatedText: '',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
      ],
      source: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}',
      fileName: 'mission.miz',
      document: parseMizDictionaryDocument('dictionary = {\n  ["DictKey_1"] = "Alpha",\n}'),
    });
    parseImportedDictionaryValuesMock.mockReturnValue(new Map());
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('DownloadCategoryTabs へ配列の rows を渡して描画する', async () => {
    const { app, container } = await mountApp();

    const tabsElement = container.querySelector('[data-testid="download-category-tabs-stub"]');
    const rowsIsArrayElement = container.querySelector('[data-testid="rows-is-array"]');
    const rowNamesElement = container.querySelector('[data-testid="row-names"]');
    const searchCandidatesElement = container.querySelector('[data-testid="search-candidates"]');

    expect(tabsElement).not.toBeNull();
    expect(rowsIsArrayElement?.textContent).toBe('true');
    expect(rowNamesElement?.textContent).toBe('F-16C');
    expect(searchCandidatesElement?.textContent).toBe('F-16C');

    app.unmount();
  });

  it('MIZ 導線を Upload より前に描画する', async () => {
    const { app, container } = await mountApp();

    const mizEntry = container.querySelector('[data-testid="miz-entry-section-stub"]');
    const uploadDialog = container.querySelector('[data-testid="upload-dialog-stub"]');

    expect(mizEntry).not.toBeNull();
    expect(uploadDialog).not.toBeNull();
    expect(mizEntry?.compareDocumentPosition(uploadDialog as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    app.unmount();
  });

  it.each(['mission.miz', 'mission.trk'])('%s 選択成功で dictionary 読込後にダイアログを開く', async (fileName) => {
    mizEntrySelectedFileState.fileName = fileName;
    readMizDictionaryEntriesMock.mockResolvedValueOnce({
      entries: [
        {
          key: 'DictKey_1',
          sourceText: 'Alpha',
          translatedText: '',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
      ],
      source: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}',
      fileName,
      document: parseMizDictionaryDocument('dictionary = {\n  ["DictKey_1"] = "Alpha",\n}'),
    });
    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(readMizDictionaryEntriesMock).toHaveBeenCalledTimes(1);
    expect(readMizDictionaryEntriesMock.mock.calls[0]?.[0]).toBeInstanceOf(File);
    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-dialog-file-name"]')?.textContent).toBe(fileName);
    expect(container.querySelector('[data-testid="miz-dialog-entry-count"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="miz-dialog-visible-entry-count"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="miz-dialog-total-entry-count"]')?.textContent).toBe('1');

    app.unmount();
  });

  it('MIZ 読込失敗時は専用エラーを表示してダイアログを開かない', async () => {
    readMizDictionaryEntriesMock.mockRejectedValueOnce(new Error('broken archive'));
    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).toBeNull();
    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).not.toBe('');

    app.unmount();
  });

  it('ダイアログ内 error を MIZ エラー表示へ反映する', async () => {
    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-error-button"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).not.toBe('');

    app.unmount();
  });

  it('ダイアログの toggle-enabled を親状態へ反映する', async () => {
    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-toggle-entry"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(parseDialogEntryState(container)).toContainEqual({
      key: 'DictKey_1',
      enabled: false,
      translatedText: '',
    });

    app.unmount();
  });

  it('ダイアログの update-translation を親状態へ反映する', async () => {
    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-translate-entry"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(parseDialogEntryState(container)).toContainEqual({
      key: 'DictKey_1',
      enabled: true,
      translatedText: '翻訳1',
    });

    app.unmount();
  });

  it('ダイアログのフィルター更新を親状態へ反映する', async () => {
    readMizDictionaryEntriesMock.mockResolvedValueOnce({
      entries: [
        {
          key: 'DictKey_1',
          sourceText: 'Alpha',
          translatedText: '',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
        {
          key: 'DictKey_2',
          sourceText: 'Bravo',
          translatedText: '翻訳済み',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
      ],
      source: 'dictionary = {}',
      fileName: 'mission.miz',
      document: {
        source: 'dictionary = {}',
        entries: [],
      },
    });

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-entry-count"]')?.textContent).toBe('2');
    expect(parseDialogEntryState(container).map((entry) => entry.key)).toEqual(['DictKey_1', 'DictKey_2']);

    container
      .querySelector('[data-testid="miz-dialog-filter-untranslated"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-entry-count"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="miz-dialog-visible-entry-count"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="miz-dialog-total-entry-count"]')?.textContent).toBe('2');
    expect(parseDialogEntryState(container).map((entry) => entry.key)).toEqual(['DictKey_1']);

    app.unmount();
  });

  it('dictionary import で一致 key の翻訳だけを更新し、enabled を維持する', async () => {
    readMizDictionaryEntriesMock.mockResolvedValueOnce({
      entries: [
        {
          key: 'DictKey_1',
          sourceText: 'Alpha',
          translatedText: '',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
        {
          key: 'DictKey_2',
          sourceText: 'Bravo',
          translatedText: '',
          enabled: false,
          isDictionaryKey: true,
          isTranslatable: true,
        },
      ],
      source: 'dictionary = {}',
      fileName: 'mission.miz',
      document: {
        source: 'dictionary = {}',
        entries: [],
      },
    });
    parseImportedDictionaryValuesMock.mockReturnValueOnce(
      new Map([
        ['DictKey_1', '翻訳1'],
        ['DictKey_3', 'ignored'],
      ]),
    );

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-import-dictionary"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(parseImportedDictionaryValuesMock).toHaveBeenCalledTimes(1);
    expect(parseDialogEntryState(container)).toEqual([
      {
        key: 'DictKey_1',
        enabled: true,
        translatedText: '翻訳1',
      },
      {
        key: 'DictKey_2',
        enabled: false,
        translatedText: '',
      },
    ]);

    app.unmount();
  });

  it('PO import で key と原文が完全一致した行だけを更新する', async () => {
    readMizDictionaryEntriesMock.mockResolvedValueOnce({
      entries: [
        {
          key: 'DictKey_1',
          sourceText: 'Alpha',
          translatedText: '',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
        {
          key: 'DictKey_2',
          sourceText: 'Bravo',
          translatedText: '',
          enabled: false,
          isDictionaryKey: true,
          isTranslatable: true,
        },
      ],
      source: 'dictionary = {}',
      fileName: 'mission.miz',
      document: {
        source: 'dictionary = {}',
        entries: [],
      },
    });
    parseMizTranslationImportEntriesMock.mockReturnValueOnce([
      {
        key: 'DictKey_1',
        sourceText: 'Alpha',
        translatedText: '翻訳1',
      },
      {
        key: 'DictKey_2',
        sourceText: 'Mismatch',
        translatedText: 'ignored',
      },
    ]);

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container.querySelector('[data-testid="miz-dialog-import-po"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(parseMizTranslationImportEntriesMock).toHaveBeenCalledWith('po', 'po');
    expect(parseDialogEntryState(container)).toEqual([
      {
        key: 'DictKey_1',
        enabled: true,
        translatedText: '翻訳1',
      },
      {
        key: 'DictKey_2',
        enabled: false,
        translatedText: '',
      },
    ]);

    app.unmount();
  });

  it('CSV import で key と原文が完全一致した行だけを更新する', async () => {
    readMizDictionaryEntriesMock.mockResolvedValueOnce({
      entries: [
        {
          key: 'DictKey_1',
          sourceText: 'Alpha',
          translatedText: '',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
        {
          key: 'DictKey_2',
          sourceText: 'Bravo',
          translatedText: '',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
      ],
      source: 'dictionary = {}',
      fileName: 'mission.miz',
      document: {
        source: 'dictionary = {}',
        entries: [],
      },
    });
    parseMizTranslationImportEntriesMock.mockReturnValueOnce([
      {
        key: 'DictKey_1',
        sourceText: 'Mismatch',
        translatedText: 'ignored',
      },
      {
        key: 'DictKey_2',
        sourceText: 'Bravo',
        translatedText: '翻訳2',
      },
    ]);

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container.querySelector('[data-testid="miz-dialog-import-csv"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(parseMizTranslationImportEntriesMock).toHaveBeenCalledWith('csv', 'csv');
    expect(parseDialogEntryState(container)).toEqual([
      {
        key: 'DictKey_1',
        enabled: true,
        translatedText: '',
      },
      {
        key: 'DictKey_2',
        enabled: true,
        translatedText: '翻訳2',
      },
    ]);

    app.unmount();
  });

  it('dictionary download で再構築済み dictionary を生成する', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:miz-dictionary');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-translate-entry"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-download-dictionary"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(await (createObjectUrlSpy.mock.calls[0]?.[0] as Blob).text()).toBe(
      ['dictionary = {', '  ["DictKey_1"] = "翻訳1",', '}'].join('\n'),
    );
    const appendedAnchor = appendChildSpy.mock.calls.find((call) => call[0] instanceof HTMLAnchorElement)?.[0] as
      | HTMLAnchorElement
      | undefined;
    expect(appendedAnchor?.download).toBe('dictionary');
    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).toBe('');

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    anchorClickSpy.mockRestore();
    appendChildSpy.mockRestore();
    app.unmount();
  });

  it('dictionary download で翻訳文の改行をバックスラッシュと実改行で出力する', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:miz-dictionary');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    parseImportedDictionaryValuesMock.mockReturnValueOnce(new Map([['DictKey_1', '1行目\n2行目']]));

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-import-dictionary"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-download-dictionary"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectUrlSpy.mock.calls[0]?.[0] as Blob;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).not.toEqual([0xef, 0xbb, 0xbf]);
    expect(await blob.text()).toBe(['dictionary = {', '  ["DictKey_1"] = "1行目\\', '2行目",', '}'].join('\n'));
    expect(await blob.text()).not.toContain('\r');

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    anchorClickSpy.mockRestore();
    app.unmount();
  });

  it('PO download で現在ソート順と obsolete entry を反映する', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:miz-po');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-update-sort"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-translate-entry"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-toggle-entry"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-download-po"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    const content = await (createObjectUrlSpy.mock.calls[0]?.[0] as Blob).text();
    expect(content).toContain(['msgid ""', 'msgstr ""'].join('\n'));
    expect(content).toMatch(/"PO-Revision-Date: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+0900\\n"/);
    expect(content).toContain(`"X-Generator: dcs-translation-japanese-downloader ${MIZ_TRANSLATION_GENERATOR_VERSION}\\n"`);
    expect(content).toContain('#~ #, no-wrap');
    expect(content).toContain('#~ msgctxt "DictKey_1"');
    const appendedAnchor = appendChildSpy.mock.calls.find((call) => call[0] instanceof HTMLAnchorElement)?.[0] as
      | HTMLAnchorElement
      | undefined;
    expect(appendedAnchor?.download).toBe('mission.miz.ja_JP.po');

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    anchorClickSpy.mockRestore();
    appendChildSpy.mockRestore();
    app.unmount();
  });

  it('ダウンロードメニュー項目のクリックで即座に PO download を実行する', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:miz-po');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-download-po"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(await (createObjectUrlSpy.mock.calls[0]?.[0] as Blob).text()).toContain(
      '"Project-Id-Version: Digital Combat Simulator World\\n"',
    );

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    anchorClickSpy.mockRestore();
    app.unmount();
  });

  it('CSV download で BOM と改行保持と MIZ ベースのファイル名を出力する', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:miz-csv');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    parseImportedDictionaryValuesMock.mockReturnValueOnce(new Map([['DictKey_1', '1行目\n2行目']]));

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-import-dictionary"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-download-csv"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectUrlSpy.mock.calls[0]?.[0] as Blob;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const content = await blob.text();
    expect(content).toContain('"有効","key","原文","翻訳"');
    expect(content).toContain('"TRUE","DictKey_1","Alpha","1行目\r\n2行目"');
    const appendedAnchor = appendChildSpy.mock.calls.find((call) => call[0] instanceof HTMLAnchorElement)?.[0] as
      | HTMLAnchorElement
      | undefined;
    expect(appendedAnchor?.download).toBe('mission.miz.ja_JP.csv');

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    anchorClickSpy.mockRestore();
    appendChildSpy.mockRestore();
    app.unmount();
  });

  it('dictionary import 失敗時は MIZ エラー表示へ反映する', async () => {
    parseImportedDictionaryValuesMock.mockImplementationOnce(() => {
      throw new Error('invalid dictionary');
    });

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-import-dictionary"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).not.toBe('');

    app.unmount();
  });

  it('PO/CSV import 失敗時は MIZ エラー表示へ反映する', async () => {
    parseMizTranslationImportEntriesMock.mockImplementationOnce(() => {
      throw new Error('invalid po');
    });

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container.querySelector('[data-testid="miz-dialog-import-po"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).not.toBe('');

    app.unmount();
  });

  it('ダイアログ close で表示を閉じる', async () => {
    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container.querySelector('[data-testid="miz-dialog-close"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).toBeNull();

    app.unmount();
  });

  it('dirty ありで close すると確認ダイアログを出し、キャンセルで編集状態を維持する', async () => {
    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-translate-entry"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container.querySelector('[data-testid="miz-dialog-close"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-close-confirm-dialog-stub"]')).not.toBeNull();

    container
      .querySelector('[data-testid="miz-close-confirm-cancel"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-close-confirm-dialog-stub"]')).toBeNull();
    expect(parseDialogEntryState(container)).toContainEqual({
      key: 'DictKey_1',
      enabled: true,
      translatedText: '翻訳1',
    });

    app.unmount();
  });

  it('dirty ありで close 確定すると表示を閉じて state を初期化する', async () => {
    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-translate-entry"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container.querySelector('[data-testid="miz-dialog-close"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-close-confirm-confirm"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).toBeNull();
    expect(container.querySelector('[data-testid="miz-close-confirm-dialog-stub"]')).toBeNull();

    app.unmount();
  });

  it('download 後は確認なしで close する', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:miz-dictionary');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const { app, container } = await mountApp();

    container.querySelector('[data-testid="miz-entry-select"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-translate-entry"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container
      .querySelector('[data-testid="miz-dialog-download-dictionary"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    container.querySelector('[data-testid="miz-dialog-close"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-close-confirm-dialog-stub"]')).toBeNull();
    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).toBeNull();

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    anchorClickSpy.mockRestore();
    app.unmount();
  });
});
