// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import DownloadListTable from '@/components/DownloadListTable.vue';
import type { TreeItem } from '@/types/type';

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

vi.mock('/src/components/CreateIssueDialog.vue', () => {
  return createIssueDialogStubModule;
});

vi.mock('@/components/DownloadFileDialog.vue', () => {
  return downloadFileDialogStubModule;
});

vi.mock('/src/components/DownloadFileDialog.vue', () => {
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
  app: ReturnType<typeof createApp>;
  container: HTMLDivElement;
  onError: ReturnType<typeof vi.fn>;
}> => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onError = vi.fn();

  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(DownloadListTable, {
            rows,
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
  );
  app.component(
    'v-tooltip',
    defineComponent({
      name: 'VTooltipStub',
      setup(_, { slots }) {
        return () => h('div', [slots.activator?.({ props: {} }), slots.default?.()]);
      },
    }),
  );
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
        loading: {
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
              'data-loading': props.loading ? 'true' : 'false',
              onClick: (event: MouseEvent) => {
                if (props.disabled) return;
                emit('click', event);
              },
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
      setup(_, { slots }) {
        return () => h('div', slots.default?.());
      },
    }),
  );
  app.mount(container);
  await flushComponent();

  return { app, container, onError };
};

const getButtonsByLabel = (label: string): HTMLButtonElement[] => {
  return [...document.body.querySelectorAll('button')].filter((element): element is HTMLButtonElement => {
    return element.textContent?.trim() === label;
  });
};

const getButtonByLabel = (label: string, index = 0): HTMLButtonElement => {
  const buttons = getButtonsByLabel(label);
  const button = buttons[index];
  if (button === undefined) {
    throw new Error(`button not found: ${label}[${index}]`);
  }
  return button;
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

  it('ファイル一覧操作で対象行のダイアログを開いて閉じる', async () => {
    const { app } = await mountDownloadListTable();

    getButtonByLabel('ファイル一覧').click();
    await flushComponent();

    expect(document.body.querySelector('[data-testid="download-file-row-name"]')?.textContent).toBe('F-16C');
    expect(document.body.textContent).toContain('Cold Start.miz');

    const fileListButtons = getButtonsByLabel('ファイル一覧');
    expect(fileListButtons[0]?.hasAttribute('disabled')).toBe(true);

    const closeButton = getButtonByLabel('close file dialog');
    closeButton?.click();
    await flushComponent();

    expect(document.body.querySelector('[data-testid="download-file-dialog"]')).toBeNull();
    expect(getButtonsByLabel('ファイル一覧')[0]?.hasAttribute('disabled')).toBe(false);

    app.unmount();
  });

  it('報告操作で対象ディレクトリを引き継いでダイアログを開く', async () => {
    const { app } = await mountDownloadListTable();

    getButtonByLabel('報告', 1).click();
    await flushComponent();

    const pathOutput = document.body.querySelector('[data-testid="create-issue-path"]');
    expect(pathOutput?.textContent).toBe('DCSWorld/Mods/aircraft/Mi-24P');
    expect(getButtonsByLabel('報告')[1]?.hasAttribute('disabled')).toBe(true);

    const closeButton = getButtonByLabel('close issue dialog');
    closeButton.click();
    await flushComponent();

    expect(document.body.querySelector('[data-testid="create-issue-dialog"]')).toBeNull();
    expect(getButtonsByLabel('報告')[1]?.hasAttribute('disabled')).toBe(false);

    app.unmount();
  });

  it('フォルダを見ると DL が既存導線を維持する', async () => {
    const { app, onError } = await mountDownloadListTable();

    getButtonByLabel('フォルダを見る').click();
    expect(buildGitHubBlobUrlMock).toHaveBeenCalledWith('DCSWorld/Mods/aircraft/F-16C');
    expect(windowOpenSpy).toHaveBeenCalledWith('blob:DCSWorld/Mods/aircraft/F-16C', '_blank', 'noopener,noreferrer');

    getButtonByLabel('DL').click();
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

    app.unmount();
  });
});
