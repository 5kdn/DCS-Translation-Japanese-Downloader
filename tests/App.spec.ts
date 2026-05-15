// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import App from '@/App.vue';
import { parseMizDictionaryDocument } from '@/features/mizTranslation/mizDictionaryParser';

const { healthCheckMock, fetchTreeMock, fetchCreatePrMock, readMizDictionaryEntriesMock, parseImportedDictionaryValuesMock } =
  vi.hoisted(() => {
    return {
      healthCheckMock: vi.fn(),
      fetchTreeMock: vi.fn(),
      fetchCreatePrMock: vi.fn(),
      readMizDictionaryEntriesMock: vi.fn(),
      parseImportedDictionaryValuesMock: vi.fn(),
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
              onClick: () => {
                emit('select-miz', new File(['zip'], 'mission.miz', { type: 'application/zip' }));
              },
            },
            'select miz',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('clear-error'),
            },
            'clear miz error',
          ),
        ]);
    },
  }),
};

vi.mock('@/components/mizTranslation/MizTranslationEntrySection.vue', () => {
  return mizTranslationEntrySectionStubModule;
});

vi.mock('/src/components/mizTranslation/MizTranslationEntrySection.vue', () => {
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
      'import-dictionary',
      'download-dictionary',
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
                  onClick: () => emit('update:modelValue', false),
                },
                'close miz dialog',
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('update:show-only-untranslated', true),
                },
                'filter untranslated only',
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('toggle-enabled', 'DictKey_1', false),
                },
                'toggle miz entry',
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('update-translation', 'DictKey_1', '翻訳1'),
                },
                'translate miz entry',
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('import-dictionary', new File(['dictionary = {}'], 'dictionary', { type: 'text/plain' })),
                },
                'import miz dictionary',
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('download-dictionary'),
                },
                'download miz dictionary',
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('error', 'copy error'),
                },
                'miz dialog error',
              ),
            ])
          : null;
    },
  }),
};

vi.mock('@/components/mizTranslation/MizTranslationDialog.vue', () => {
  return mizTranslationDialogStubModule;
});

vi.mock('/src/components/mizTranslation/MizTranslationDialog.vue', () => {
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
                  onClick: () => emit('update:modelValue', false),
                },
                'cancel miz close confirm',
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('confirm'),
                },
                'confirm miz close',
              ),
            ])
          : null;
    },
  }),
};

vi.mock('@/components/mizTranslation/MizTranslationCloseConfirmDialog.vue', () => {
  return mizTranslationCloseConfirmDialogStubModule;
});

vi.mock('/src/components/mizTranslation/MizTranslationCloseConfirmDialog.vue', () => {
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

vi.mock('/src/components/download/DownloadCategoryTabs.vue', () => {
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

vi.mock('/src/components/download/DownloadCategoryTabs.vue?vue', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('/src/components/download/DownloadCategoryTabs.vue?vue&type=script&setup=true&lang.ts', () => {
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

  it('.miz 選択成功で dictionary 読込後にダイアログを開く', async () => {
    const { app, container } = await mountApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(readMizDictionaryEntriesMock).toHaveBeenCalledTimes(1);
    expect(readMizDictionaryEntriesMock.mock.calls[0]?.[0]).toBeInstanceOf(File);
    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-dialog-file-name"]')?.textContent).toBe('mission.miz');
    expect(container.querySelector('[data-testid="miz-dialog-entry-count"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="miz-dialog-visible-entry-count"]')?.textContent).toBe('1');
    expect(container.querySelector('[data-testid="miz-dialog-total-entry-count"]')?.textContent).toBe('1');

    app.unmount();
  });

  it('MIZ 読込失敗時は専用エラーを表示してダイアログを開かない', async () => {
    readMizDictionaryEntriesMock.mockRejectedValueOnce(new Error('broken archive'));
    const { app, container } = await mountApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).toBeNull();
    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).not.toBe('');

    app.unmount();
  });

  it('ダイアログ内 error を MIZ エラー表示へ反映する', async () => {
    const { app, container } = await mountApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const dialogErrorButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'miz dialog error',
    );
    dialogErrorButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).toContain('copy error');

    app.unmount();
  });

  it('ダイアログの toggle-enabled を親状態へ反映する', async () => {
    const { app, container } = await mountApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const toggleButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'toggle miz entry',
    );
    toggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const updateButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'translate miz entry',
    );
    updateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-entry-count"]')?.textContent).toBe('2');
    expect(parseDialogEntryState(container).map((entry) => entry.key)).toEqual(['DictKey_1', 'DictKey_2']);

    const filterButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'filter untranslated only',
    );
    filterButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const importButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'import miz dictionary',
    );
    importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

  it('dictionary download で再構築済み dictionary を生成する', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:miz-dictionary');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    const { app, container } = await mountApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const updateButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'translate miz entry',
    );
    updateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const downloadButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'download miz dictionary',
    );
    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const importButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'import miz dictionary',
    );
    importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const downloadButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'download miz dictionary',
    );
    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(await (createObjectUrlSpy.mock.calls[0]?.[0] as Blob).text()).toBe(
      ['dictionary = {', '  ["DictKey_1"] = "1行目\\', '2行目",', '}'].join('\n'),
    );

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    anchorClickSpy.mockRestore();
    app.unmount();
  });

  it('dictionary import 失敗時は MIZ エラー表示へ反映する', async () => {
    parseImportedDictionaryValuesMock.mockImplementationOnce(() => {
      throw new Error('invalid dictionary');
    });

    const { app, container } = await mountApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const importButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'import miz dictionary',
    );
    importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).not.toBe('');

    app.unmount();
  });

  it('ダイアログ close で表示を閉じる', async () => {
    const { app, container } = await mountApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const closeButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'close miz dialog');
    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).toBeNull();

    app.unmount();
  });

  it('dirty ありで close すると確認ダイアログを出し、キャンセルで編集状態を維持する', async () => {
    const { app, container } = await mountApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const updateButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'translate miz entry',
    );
    updateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const closeButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'close miz dialog');
    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-close-confirm-dialog-stub"]')).not.toBeNull();

    const cancelButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'cancel miz close confirm',
    );
    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const updateButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'translate miz entry',
    );
    updateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const closeButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'close miz dialog');
    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const confirmButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'confirm miz close',
    );
    confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const updateButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'translate miz entry',
    );
    updateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const downloadButton = [...container.querySelectorAll('button')].find(
      (element) => element.textContent === 'download miz dictionary',
    );
    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    const closeButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'close miz dialog');
    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-close-confirm-dialog-stub"]')).toBeNull();
    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).toBeNull();

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    anchorClickSpy.mockRestore();
    app.unmount();
  });
});
