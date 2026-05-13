// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import App from '@/App.vue';

const { healthCheckMock, fetchTreeMock, fetchCreatePrMock } = vi.hoisted(() => {
  return {
    healthCheckMock: vi.fn(),
    fetchTreeMock: vi.fn(),
    fetchCreatePrMock: vi.fn(),
  };
});

vi.mock('@/lib/client', () => {
  return {
    healthCheck: healthCheckMock,
    fetchTree: fetchTreeMock,
    fetchCreatePr: fetchCreatePrMock,
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
      setup: () => () => h('div', 'UploadDialogStub'),
    }),
  };
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
      return () =>
        h('div', { 'data-testid': 'download-category-tabs-stub' }, [
          h('output', { 'data-testid': 'rows-is-array' }, String(Array.isArray(props.rows))),
          h('output', { 'data-testid': 'row-names' }, props.rows.map((row: { name: string }) => row.name).join('|')),
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

vi.mock('@/components/DownloadCategoryTabs.vue', () => {
  return {
    ...downloadCategoryTabsMockModule,
  };
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
});
