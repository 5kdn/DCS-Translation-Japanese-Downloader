// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import App from '@/App.vue';

const { healthCheckMock, fetchTreeMock, fetchCreatePrMock, readMizDictionaryEntriesMock } = vi.hoisted(() => {
  return {
    healthCheckMock: vi.fn(),
    fetchTreeMock: vi.fn(),
    fetchCreatePrMock: vi.fn(),
    readMizDictionaryEntriesMock: vi.fn(),
  };
});

vi.mock('@/lib/client', () => {
  return {
    healthCheck: healthCheckMock,
    fetchTree: fetchTreeMock,
    fetchCreatePr: fetchCreatePrMock,
  };
});

vi.mock('@/features/mizTranslation/mizTranslationService', () => {
  return {
    readMizDictionaryEntries: readMizDictionaryEntriesMock,
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

vi.mock('@/components/MizTranslationEntrySection.vue', () => {
  return mizTranslationEntrySectionStubModule;
});

vi.mock('/src/components/MizTranslationEntrySection.vue', () => {
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
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h('div', { 'data-testid': 'miz-dialog-stub' }, [
              h('output', { 'data-testid': 'miz-dialog-file-name' }, props.loadedFileName),
              h('output', { 'data-testid': 'miz-dialog-loading' }, String(props.isLoading)),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => emit('update:modelValue', false),
                },
                'close miz dialog',
              ),
            ])
          : null;
    },
  }),
};

vi.mock('@/components/MizTranslationDialog.vue', () => {
  return mizTranslationDialogStubModule;
});

vi.mock('/src/components/MizTranslationDialog.vue', () => {
  return mizTranslationDialogStubModule;
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

vi.mock('@/components/DownloadCategoryTabs.vue', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('/src/components/DownloadCategoryTabs.vue', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('@/components/DownloadCategoryTabs.vue?vue&type=script&setup=true&lang.ts', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('@/components/DownloadCategoryTabs.vue?vue&type=script&setup=true&lang.tsx', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('@/components/DownloadCategoryTabs.vue?vue', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('/src/components/DownloadCategoryTabs.vue?vue', () => {
  return downloadCategoryTabsMockModule;
});

vi.mock('/src/components/DownloadCategoryTabs.vue?vue&type=script&setup=true&lang.ts', () => {
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

describe('App', () => {
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
      entries: [],
      source: 'dictionary = {}',
      fileName: 'mission.miz',
      document: {
        source: 'dictionary = {}',
        entries: [],
      },
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('DownloadCategoryTabs へ配列の rows を渡して描画する', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp(App);
    app.mount(container);

    await flushApp();

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
    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp(App);
    app.mount(container);

    await flushApp();

    const mizEntry = container.querySelector('[data-testid="miz-entry-section-stub"]');
    const uploadDialog = container.querySelector('[data-testid="upload-dialog-stub"]');

    expect(mizEntry).not.toBeNull();
    expect(uploadDialog).not.toBeNull();
    expect(mizEntry?.compareDocumentPosition(uploadDialog as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    app.unmount();
  });

  it('.miz 選択成功で dictionary 読込後にダイアログを開く', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp(App);
    app.mount(container);

    await flushApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(readMizDictionaryEntriesMock).toHaveBeenCalledTimes(1);
    expect(readMizDictionaryEntriesMock.mock.calls[0]?.[0]).toBeInstanceOf(File);
    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="miz-dialog-file-name"]')?.textContent).toBe('mission.miz');

    app.unmount();
  });

  it('MIZ 読込失敗時は専用エラーを表示してダイアログを開かない', async () => {
    readMizDictionaryEntriesMock.mockRejectedValueOnce(new Error('broken archive'));

    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp(App);
    app.mount(container);

    await flushApp();

    const selectButton = [...container.querySelectorAll('button')].find((element) => element.textContent === 'select miz');
    selectButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushApp();

    expect(container.querySelector('[data-testid="miz-dialog-stub"]')).toBeNull();
    expect(container.querySelector('[data-testid="miz-entry-error"]')?.textContent).not.toBe('');

    app.unmount();
  });
});
