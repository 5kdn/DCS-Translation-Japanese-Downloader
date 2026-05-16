import type { Locator, Page } from '@playwright/test';
import type { BrowserFilePayload } from './fileFixtures';

const applyFiles = async (locator: Locator, files: BrowserFilePayload[]): Promise<void> => {
  await locator.evaluate((input, payloads) => {
    const fileInput = input as HTMLInputElement;
    const transfer = new DataTransfer();
    for (const payload of payloads) {
      const file = new File([new Uint8Array(payload.bytes)], payload.name, { type: payload.type });
      if (payload.relativePath !== undefined) {
        Object.defineProperty(file, 'webkitRelativePath', {
          configurable: true,
          value: payload.relativePath,
        });
      }
      transfer.items.add(file);
    }
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  }, files);
};

/**
 * @summary ディレクトリー input へ仮想ファイル群を投入する。
 * @param page 対象ページを指定する。
 * @param files 投入するファイル群を指定する。
 * @returns Promise<void> を返す。
 */
export const uploadDirectory = async (page: Page, files: BrowserFilePayload[]): Promise<void> => {
  await applyFiles(page.locator('input[webkitdirectory]').first(), files);
};

/**
 * @summary 単一ファイル input へ仮想ファイルを投入する。
 * @param locator 対象 input を指定する。
 * @param file 投入するファイルを指定する。
 * @returns Promise<void> を返す。
 */
export const uploadSingleFile = async (locator: Locator, file: BrowserFilePayload): Promise<void> => {
  await applyFiles(locator, [file]);
};
