import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';
import { onUnmounted } from 'vue';
import App from '@/App.vue';
import type { TreeItem } from '@/types/type';
import { createJsonResponse, installFetchMock } from '../../.storybook/fetchMock';
import {
  createImportedDictionaryFile,
  createMizTranslationBrowserHarnessState,
  createSampleMizFile,
  type MizTranslationBrowserHarnessState,
} from '../../.storybook/mizTranslationStorySupport';

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

const defaultTreeItems: TreeItem[] = [
  createTreeItem('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary', '2026-05-10T00:00:00Z'),
  createTreeItem('UserMissions/Campaigns/Operation Black Knight/README_Translation.md', '2026-05-12T00:00:00Z'),
];

type AppStoryOptions = {
  healthOk?: boolean;
  treeItems?: TreeItem[];
};

let mizBrowserHarnessState: MizTranslationBrowserHarnessState | null = null;

/**
 * @summary Storybook 上で利用するブラウザ API モックを登録する。
 * @returns モック解除関数を返す。
 */
const installMizBrowserHarness = (): { restore: () => void } => {
  const state = createMizTranslationBrowserHarnessState();
  mizBrowserHarnessState = state;

  const originalCreateObjectUrl = URL.createObjectURL.bind(URL);
  const originalRevokeObjectUrl = URL.revokeObjectURL.bind(URL);
  const originalAnchorClick = HTMLAnchorElement.prototype.click;
  const objectUrlMap = new Map<string, Blob>();
  let objectUrlIndex = 0;

  URL.createObjectURL = ((object: Blob | MediaSource): string => {
    const nextUrl = `blob:storybook-${objectUrlIndex}`;
    objectUrlIndex += 1;
    if (object instanceof Blob) {
      objectUrlMap.set(nextUrl, object);
    }
    return nextUrl;
  }) as typeof URL.createObjectURL;

  URL.revokeObjectURL = ((url: string): void => {
    objectUrlMap.delete(url);
    originalRevokeObjectUrl(url);
  }) as typeof URL.revokeObjectURL;

  HTMLAnchorElement.prototype.click = function click(): void {
    state.anchorClickCount += 1;
    state.downloadedFileName = this.download;
    state.downloadedBlob = objectUrlMap.get(this.href) ?? null;
  };

  return {
    restore: (): void => {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
      HTMLAnchorElement.prototype.click = originalAnchorClick;
      mizBrowserHarnessState = null;
    },
  };
};

/**
 * @summary App 用の HTTP モックを設定した render 定義を生成する。
 * @param options Storybook 表示向けの固定応答を指定する。
 * @returns Storybook render 関数を返す。
 */
const createAppRender = (options?: AppStoryOptions) => {
  return () => ({
    components: { App },
    setup: () => {
      const browserHarness = installMizBrowserHarness();
      const installed = installFetchMock({
        match: (request): boolean => {
          return request.url.startsWith(import.meta.env.VITE_API_BASE_URL);
        },
        handle: async (request): Promise<Response> => {
          if (request.method === 'GET' && request.url.endsWith('/health')) {
            return createJsonResponse(
              {
                status: options?.healthOk === false ? 'ng' : 'ok',
                timestamp: '2026-05-15T00:00:00.000Z',
              },
              { status: 200 },
            );
          }

          if (request.method === 'GET' && request.url.endsWith('/tree')) {
            return createJsonResponse(
              {
                success: true,
                message: 'ok',
                data: (options?.treeItems ?? defaultTreeItems).map((item) => {
                  return {
                    path: item.path,
                    type: item.type,
                    mode: item.mode,
                    url: item.url,
                    sha: item.sha,
                    size: item.size,
                    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
                  };
                }),
              },
              { status: 200 },
            );
          }

          if (request.method === 'POST' && request.url.includes('/issue/list')) {
            return createJsonResponse(
              {
                success: true,
                message: 'ok',
                data: [],
              },
              { status: 200 },
            );
          }

          return new Response('Not Found', { status: 404, statusText: 'Not Found' });
        },
      });

      onUnmounted((): void => {
        installed.restore();
        browserHarness.restore();
      });

      return {};
    },
    template: '<App />',
  });
};

/**
 * @summary `beforeunload` 検証用の cancelable event を生成する。
 * @returns `returnValue` を観測可能な event を返す。
 */
const createBeforeUnloadEvent = (): BeforeUnloadEvent => {
  const event = new Event('beforeunload', { cancelable: true }) as unknown as BeforeUnloadEvent;
  Object.defineProperty(event, 'returnValue', {
    configurable: true,
    writable: true,
    value: undefined,
  });
  return event;
};

const meta = {
  title: 'App/App',
  component: App,
  tags: ['autodocs'],
  render: createAppRender(),
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole('heading', { name: 'DCS Translation Japanese' })).toBeInTheDocument();
    await expect(await canvas.findByText('F-16C')).toBeInTheDocument();
    await expect(
      await canvas.findByText('翻訳データをmizファイルに追加までを自動化するWindowsデスクトップアプリがダウンロード可能です。'),
    ).toBeInTheDocument();
    await expect(canvas.queryByText('API サーバーが稼働していません')).toBeNull();
  },
};

export const Empty: Story = {
  render: createAppRender({ treeItems: [] }),
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole('heading', { name: 'DCS Translation Japanese' })).toBeInTheDocument();
    await expect(await canvas.findByText('表示できる項目がありません。')).toBeInTheDocument();
  },
};

export const MizTranslationFlow: Story = {
  render: createAppRender(),
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    const appScope = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    const mizHeading = await canvas.findByRole('heading', { name: 'MIZ Translation' });
    const uploadHeading = await canvas.findByRole('heading', { name: 'Upload' });

    expect(mizHeading.compareDocumentPosition(uploadHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    const mizInput = await canvas.findByTestId('miz-file-input');
    const mizFile = await createSampleMizFile();

    if (!(mizInput instanceof HTMLInputElement)) {
      throw new Error('MIZ file input の取得に失敗した。');
    }

    await user.upload(mizInput, mizFile);

    await expect(await appScope.findByText('MIZ 翻訳')).toBeInTheDocument();
    await expect(appScope.getByTestId('miz-dialog-file-name')).toHaveTextContent('storybook-sample.miz');

    await waitFor(() => {
      expect(appScope.getAllByTestId('miz-entry-key').length).toBe(6);
    });

    const entryKeysBeforeSort = appScope.getAllByTestId('miz-entry-key').map((element) => element.textContent?.trim() ?? '');
    expect(entryKeysBeforeSort).toEqual([
      'DictKey_sortie_10',
      'DictKey_descriptionText_20',
      'DictKey_descriptionBlueTask_30',
      'DictKey_descriptionRedTask_40',
      'DictKey_descriptionNeutralsTask_50',
      'DictKey_60',
    ]);

    const beforeUnloadBeforeEdit = createBeforeUnloadEvent();
    window.dispatchEvent(beforeUnloadBeforeEdit);
    expect(beforeUnloadBeforeEdit.defaultPrevented).toBe(false);

    const translationField = appScope.getByTestId('miz-entry-translation-DictKey_60').querySelector('textarea');
    if (!(translationField instanceof HTMLTextAreaElement)) {
      throw new Error('翻訳 textarea の取得に失敗した。');
    }

    await user.click(translationField);
    await user.type(translationField, 'Edited translation');
    await waitFor(() => {
      expect(translationField.value).toContain('Edited translation');
    });

    const beforeUnloadAfterEdit = createBeforeUnloadEvent();
    window.dispatchEvent(beforeUnloadAfterEdit);
    expect(beforeUnloadAfterEdit.defaultPrevented).toBe(true);
    expect(beforeUnloadAfterEdit.returnValue).toBe('');

    const closeButton = appScope.getByRole('button', { name: 'MIZ 翻訳ダイアログを閉じる' });
    await user.click(closeButton);
    await expect(appScope.getByTestId('miz-close-confirm-dialog')).toBeInTheDocument();
    await user.click(appScope.getByTestId('miz-close-confirm-cancel'));
    await waitFor(() => {
      expect(appScope.queryByTestId('miz-close-confirm-dialog')).toBeNull();
    });

    const sourceCell = appScope.getByTestId('miz-entry-source-DictKey_60');
    const copyButton = appScope.getByTestId('miz-entry-copy-DictKey_60');
    expect(copyButton.className).not.toContain('copy-button--visible');
    const originalClipboard = navigator.clipboard;
    const clipboardWriteMock = fn().mockResolvedValue(undefined);

    if (originalClipboard === undefined) {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: clipboardWriteMock,
        },
      });
    }

    const clipboardWriteSpy =
      originalClipboard === undefined
        ? clipboardWriteMock
        : spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    await user.hover(sourceCell);
    await waitFor(() => {
      expect(copyButton.className).toContain('copy-button--visible');
    });
    if (!(copyButton instanceof HTMLButtonElement)) {
      throw new Error('copy button の取得に失敗した。');
    }
    copyButton.click();
    await waitFor(() => {
      expect(clipboardWriteSpy).toHaveBeenCalledWith('Alpha source');
    });
    await expect(appScope.queryByText('クリップボードへコピーできませんでした。')).toBeNull();
    await user.unhover(sourceCell);

    if (originalClipboard === undefined) {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
    } else {
      clipboardWriteSpy.mockRestore();
    }

    const importInput = appScope.getByTestId('miz-dialog-dictionary-input');
    if (!(importInput instanceof HTMLInputElement)) {
      throw new Error('dictionary import input の取得に失敗した。');
    }

    const importFile = createImportedDictionaryFile();
    await user.click(appScope.getByTestId('miz-dialog-import-button'));
    Object.defineProperty(importInput, 'files', {
      configurable: true,
      value: [importFile],
    });
    importInput.dispatchEvent(new Event('change', { bubbles: true }));

    const importedField = appScope.getByTestId('miz-entry-translation-DictKey_60').querySelector('textarea');
    if (!(importedField instanceof HTMLTextAreaElement)) {
      throw new Error('import 後 translation textarea の取得に失敗した。');
    }
    await waitFor(() => {
      expect(importedField.value).toBe('Imported translation');
    });

    const sortHeader = appScope.getByRole('columnheader', { name: '翻訳' });
    await user.click(sortHeader);
    await waitFor(() => {
      expect(appScope.getAllByTestId('miz-entry-key').map((element) => element.textContent?.trim() ?? '')).toEqual(
        entryKeysBeforeSort,
      );
    });
    await user.click(sortHeader);

    const entryKeysAfterDescendingSort = appScope
      .getAllByTestId('miz-entry-key')
      .map((element) => element.textContent?.trim() ?? '');
    expect(entryKeysAfterDescendingSort).toEqual(entryKeysBeforeSort);

    await user.click(appScope.getByTestId('miz-dialog-download-button'));

    await waitFor(async () => {
      expect(mizBrowserHarnessState?.anchorClickCount).toBe(1);
      expect(mizBrowserHarnessState?.downloadedFileName).toBe('dictionary');
      expect(await mizBrowserHarnessState?.downloadedBlob?.text()).toContain('["DictKey_60"] = "Imported translation"');
    });

    const beforeUnloadAfterDownload = createBeforeUnloadEvent();
    window.dispatchEvent(beforeUnloadAfterDownload);
    expect(beforeUnloadAfterDownload.defaultPrevented).toBe(false);

    await user.click(closeButton);
    await expect(appScope.queryByTestId('miz-close-confirm-dialog')).toBeNull();
  },
};
