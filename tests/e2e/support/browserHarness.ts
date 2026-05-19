import type { Page } from '@playwright/test';

type HarnessDownload = {
  href: string;
  download: string;
  text: string | null;
};

/**
 * @summary ブラウザ API 観測用ハーネスを登録する。
 * @param page 対象ページを指定する。
 * @returns Promise<void> を返す。
 */
export const installBrowserHarness = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const state = {
      openedUrls: [] as Array<{ url: string; target: string | undefined; features: string | undefined }>,
      clipboardWrites: [] as string[],
      downloads: [] as HarnessDownload[],
    };

    const originalWindowOpen = window.open.bind(window);
    window.open = ((url?: string | URL, target?: string, features?: string): Window | null => {
      state.openedUrls.push({
        url: typeof url === 'string' ? url : (url?.toString() ?? ''),
        target,
        features,
      });
      return null;
    }) as typeof window.open;

    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        ...(originalClipboard ?? {}),
        writeText: async (text: string): Promise<void> => {
          state.clipboardWrites.push(text);
        },
      },
    });

    const objectUrlMap = new Map<string, Blob>();
    let objectUrlIndex = 0;
    URL.createObjectURL = ((object: Blob | MediaSource): string => {
      const nextUrl = `blob:e2e-${objectUrlIndex}`;
      objectUrlIndex += 1;
      if (object instanceof Blob) {
        objectUrlMap.set(nextUrl, object);
      }
      return nextUrl;
    }) as typeof URL.createObjectURL;

    URL.revokeObjectURL = ((url: string): void => {
      objectUrlMap.delete(url);
    }) as typeof URL.revokeObjectURL;

    HTMLAnchorElement.prototype.click = function click(): void {
      const record: HarnessDownload = {
        href: this.href,
        download: this.download,
        text: null,
      };
      state.downloads.push(record);
      const blob = objectUrlMap.get(this.href);
      if (blob !== undefined) {
        void blob.text().then((text) => {
          record.text = text;
        });
      }
    };

    Object.defineProperty(window, '__e2eHarness', {
      configurable: true,
      value: state,
    });

    void originalWindowOpen;
  });
};

/**
 * @summary `window.open` 呼び出し一覧を返す。
 * @param page 対象ページを指定する。
 * @returns 記録済み URL 一覧を返す。
 */
export const readOpenedUrls = async (page: Page): Promise<Array<{ url: string; target?: string; features?: string }>> => {
  return page.evaluate(() => {
    return (
      window as typeof window & { __e2eHarness: { openedUrls: Array<{ url: string; target?: string; features?: string }> } }
    ).__e2eHarness.openedUrls;
  });
};

/**
 * @summary クリップボード書き込み一覧を返す。
 * @param page 対象ページを指定する。
 * @returns 書き込み内容一覧を返す。
 */
export const readClipboardWrites = async (page: Page): Promise<string[]> => {
  return page.evaluate(() => {
    return (window as typeof window & { __e2eHarness: { clipboardWrites: string[] } }).__e2eHarness.clipboardWrites;
  });
};

/**
 * @summary ダウンロード観測結果を返す。
 * @param page 対象ページを指定する。
 * @returns ダウンロード結果一覧を返す。
 */
export const readDownloads = async (page: Page): Promise<HarnessDownload[]> => {
  return page.evaluate(() => {
    return (window as typeof window & { __e2eHarness: { downloads: HarnessDownload[] } }).__e2eHarness.downloads;
  });
};
