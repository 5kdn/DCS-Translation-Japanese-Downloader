// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import DownloadListTable from '@/components/download/DownloadListTable.vue';
import type { TreeItem } from '@/types/type';
import { mountIntegrationComponent } from '../../support/vueTestUtils/mountComponent';
import { createButtonStub, createTooltipStub } from '../../support/vueTestUtils/vuetifyStubs';

const { createZipFromTargetsMock, buildGitHubBlobUrlMock, buildGitHubRawUrlMock } = vi.hoisted(() => {
  return {
    createZipFromTargetsMock: vi.fn(),
    buildGitHubBlobUrlMock: vi.fn((path: string) => `blob:${path}`),
    buildGitHubRawUrlMock: vi.fn((path: string) => `raw:${path}`),
  };
});

const createIssueDialogStubModule = {
  __esModule: true,
  default: defineComponent({
    name: 'CreateIssueDialogStub',
    props: {
      modelValue: {
        type: Boolean,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
    },
    emits: ['update:modelValue', 'close', 'error'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h('div', { 'data-testid': 'create-issue-dialog' }, [
              h('output', { 'data-testid': 'create-issue-path' }, props.path),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => {
                    emit('update:modelValue', false);
                    emit('close');
                  },
                },
                'close issue dialog',
              ),
            ])
          : null;
    },
  }),
};

const downloadFileDialogStubModule = {
  __esModule: true,
  default: defineComponent({
    name: 'DownloadFileDialogStub',
    props: {
      modelValue: {
        type: Boolean,
        required: true,
      },
      row: {
        type: Object,
        required: false,
        default: null,
      },
    },
    emits: ['update:modelValue', 'close'],
    setup(props, { emit }) {
      return () =>
        props.modelValue && props.row !== null
          ? h('div', { 'data-testid': 'download-file-dialog' }, [
              h('output', { 'data-testid': 'download-file-row-name' }, (props.row as { name: string }).name),
              ...((props.row as { items: TreeItem[] }).items ?? []).map((item) =>
                h('div', { 'data-testid': 'download-file-item', key: item.path }, item.path ?? ''),
              ),
              h(
                'button',
                {
                  type: 'button',
                  onClick: () => {
                    emit('update:modelValue', false);
                    emit('close');
                  },
                },
                'close file dialog',
              ),
            ])
          : null;
    },
  }),
};

vi.mock('@/components/CreateIssueDialog.vue', () => {
  return createIssueDialogStubModule;
});

vi.mock('@/components/CreateIssueDialog.vue', () => {
  return createIssueDialogStubModule;
});

vi.mock('@/components/download/DownloadFileDialog.vue', () => {
  return downloadFileDialogStubModule;
});

vi.mock('@/components/download/DownloadFileDialog.vue', () => {
  return downloadFileDialogStubModule;
});

vi.mock('@/composables/useDownloadZip', () => {
  return {
    useDownloadZip: () => ({
      createZipFromTargets: createZipFromTargetsMock,
    }),
  };
});

vi.mock('@/lib/githubUrl', () => {
  return {
    buildGitHubBlobUrl: buildGitHubBlobUrlMock,
    buildGitHubRawUrl: buildGitHubRawUrlMock,
  };
});

const flushComponent = async (): Promise<void> => {
  for (const _index of [0, 1, 2, 3]) {
    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
};

const createTreeItem = (path: string, updatedAt: string): TreeItem => {
  return {
    path,
    type: 'blob',
    mode: '100644',
    url: `https://example.test/${encodeURIComponent(path)}`,
    sha: path,
    size: 1,
    updatedAt: new Date(updatedAt),
  };
};

const rows = [
  {
    name: 'F-16C',
    directoryPath: 'DCSWorld/Mods/aircraft/F-16C',
    latestUpdatedAt: new Date('2026-05-11T00:00:00Z'),
    items: [
      createTreeItem(
        'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
        '2026-05-10T00:00:00Z',
      ),
      createTreeItem(
        'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Hot Start.miz/l10n/JP/dictionary',
        '2026-05-11T00:00:00Z',
      ),
    ],
  },
  {
    name: 'Mi-24P',
    directoryPath: 'DCSWorld/Mods/aircraft/Mi-24P',
    latestUpdatedAt: new Date('2026-05-09T00:00:00Z'),
    items: [
      createTreeItem('DCSWorld/Mods/aircraft/Mi-24P/Missions/QuickStart/Start.miz/l10n/JP/dictionary', '2026-05-09T00:00:00Z'),
    ],
  },
];

const mountDownloadListTable = async (): Promise<{
  cleanup: () => void;
  onError: ReturnType<typeof vi.fn>;
  wrapper: ReturnType<typeof mountIntegrationComponent>['wrapper'];
}> => {
  const onError = vi.fn();

  const { cleanup, wrapper } = mountIntegrationComponent(DownloadListTable, {
    props: {
      rows,
      onError,
    },
    global: {
      stubs: {
        'v-data-table': defineComponent({
          name: 'VDataTableStub',
          props: {
            items: {
              type: Array,
              required: true,
            },
          },
          setup(props, { slots }) {
            return () =>
              h('div', { 'data-testid': 'v-data-table' }, [
                ...((props.items as typeof rows) ?? []).flatMap((item) => {
                  const actionsSlot = slots['item.actions']?.({ item });
                  const updatedAtSlot = slots['item.latestUpdatedAt']?.({ item });
                  return [
                    h('div', { 'data-testid': `row-${item.name}`, key: `${item.name}-name` }, item.name),
                    h('div', { key: `${item.name}-updatedAt` }, updatedAtSlot ?? []),
                    h('div', { key: `${item.name}-actions` }, actionsSlot ?? []),
                  ];
                }),
                ...(props.items.length === 0 ? (slots['no-data']?.() ?? []) : []),
              ]);
          },
        }),
        'v-tooltip': createTooltipStub(),
        'v-btn': createButtonStub(),
        'v-alert': defineComponent({
          name: 'VAlertStub',
          setup(_, { slots }) {
            return () => h('div', slots.default?.());
          },
        }),
      },
    },
  });
  await flushComponent();

  return { cleanup, onError, wrapper };
};

describe('DownloadListTable', () => {
  const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:download-result');
  const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    createZipFromTargetsMock.mockResolvedValue(new Blob(['zip']));
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  /**
   * @summary アクセシブル名から操作ボタンを取得する。
   * @param wrapper 検索対象の wrapper を指定する。
   * @param label ボタンの aria-label を指定する。
   * @returns 対象ボタンを返す。
   */
  const getButtonByAriaLabel = (wrapper: ReturnType<typeof mountIntegrationComponent>['wrapper'], label: string) => {
    return wrapper.get(`button[aria-label="${label}"]`);
  };

  it('ファイル一覧操作で対象行のダイアログを開いて閉じる', async () => {
    const { cleanup, wrapper } = await mountDownloadListTable();

    await getButtonByAriaLabel(wrapper, 'F-16C のファイル一覧を開く').trigger('click');
    await flushComponent();

    expect(document.body.querySelector('[data-testid="download-file-dialog"]')).not.toBeNull();
    expect(document.body.querySelectorAll('[data-testid="download-file-item"]')).toHaveLength(2);

    expect((getButtonByAriaLabel(wrapper, 'F-16C のファイル一覧を開く').element as HTMLButtonElement).disabled).toBe(true);

    (document.body.querySelector('[data-testid="download-file-dialog"] button') as HTMLButtonElement).click();
    await flushComponent();

    expect(document.body.querySelector('[data-testid="download-file-dialog"]')).toBeNull();
    expect((getButtonByAriaLabel(wrapper, 'F-16C のファイル一覧を開く').element as HTMLButtonElement).disabled).toBe(false);

    cleanup();
  });

  it('報告操作で対象ディレクトリを引き継いでダイアログを開く', async () => {
    const { cleanup, wrapper } = await mountDownloadListTable();

    await getButtonByAriaLabel(wrapper, 'Mi-24P の問題を報告する').trigger('click');
    await flushComponent();

    const pathOutput = document.body.querySelector('[data-testid="create-issue-path"]');
    expect(pathOutput?.textContent).toBe('DCSWorld/Mods/aircraft/Mi-24P');
    expect((getButtonByAriaLabel(wrapper, 'Mi-24P の問題を報告する').element as HTMLButtonElement).disabled).toBe(true);

    (document.body.querySelector('[data-testid="create-issue-dialog"] button') as HTMLButtonElement).click();
    await flushComponent();

    expect(document.body.querySelector('[data-testid="create-issue-dialog"]')).toBeNull();
    expect((getButtonByAriaLabel(wrapper, 'Mi-24P の問題を報告する').element as HTMLButtonElement).disabled).toBe(false);

    cleanup();
  });

  it('フォルダを見ると DL が既存導線を維持する', async () => {
    const { cleanup, onError, wrapper } = await mountDownloadListTable();

    await getButtonByAriaLabel(wrapper, 'F-16C のフォルダを開く').trigger('click');
    expect(buildGitHubBlobUrlMock).toHaveBeenCalledWith('DCSWorld/Mods/aircraft/F-16C');
    expect(windowOpenSpy).toHaveBeenCalledWith('blob:DCSWorld/Mods/aircraft/F-16C', '_blank', 'noopener,noreferrer');

    await getButtonByAriaLabel(wrapper, 'F-16C のZIP をダウンロードする').trigger('click');
    await flushComponent();

    expect(createZipFromTargetsMock).toHaveBeenCalledWith([
      {
        path: 'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
        url: 'raw:DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
      },
      {
        path: 'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Hot Start.miz/l10n/JP/dictionary',
        url: 'raw:DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Hot Start.miz/l10n/JP/dictionary',
      },
    ]);
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();

    cleanup();
  });
});
