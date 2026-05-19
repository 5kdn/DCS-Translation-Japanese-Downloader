import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { installAppApiMocks } from './support/apiMock';
import { installBrowserHarness, readClipboardWrites, readDownloads } from './support/browserHarness';
import { createImportedDictionaryPayload, createSampleMizFilePayload } from './support/fileFixtures';
import { uploadSingleFile } from './support/fileInput';

/**
 * @summary MIZ 翻訳ダイアログを開く。
 * @param page 対象ページを指定する。
 * @returns 翻訳入力欄 locator を返す。
 */
const openMizTranslationDialog = async (page: Page) => {
  const mizFile = await createSampleMizFilePayload();
  await uploadSingleFile(page.getByTestId('miz-file-input'), mizFile);

  await expect(page.getByText('MIZ 翻訳')).toBeVisible();
  await expect(page.getByTestId('miz-dialog-file-name')).toContainText('storybook-sample.miz');
  await expect(page.getByTestId('miz-entry-key').first()).toContainText('DictKey_sortie_10');

  return page.getByTestId('miz-entry-translation-DictKey_60').locator('textarea').first();
};

test.describe('MizTranslation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await installBrowserHarness(page);
  });

  test('MIZ 翻訳導線が Upload より前に描画される', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    const mizEntryHeading = page.getByRole('heading', { name: 'MIZ Translation' });
    const uploadHeading = page.getByRole('heading', { name: 'Upload' });

    await expect(mizEntryHeading).toBeVisible();
    await expect(uploadHeading).toBeVisible();
    const mizTitleHandle = await mizEntryHeading.elementHandle();
    const uploadTitleHandle = await uploadHeading.elementHandle();

    if (mizTitleHandle === null || uploadTitleHandle === null) {
      throw new Error('導線順序比較に必要な見出し要素を取得できません。');
    }

    const isMizBeforeUpload = await page.evaluate(
      ([mizTitle, uploadTitle]) => {
        return Boolean(mizTitle.compareDocumentPosition(uploadTitle) & Node.DOCUMENT_POSITION_FOLLOWING);
      },
      [mizTitleHandle, uploadTitleHandle],
    );

    expect(isMizBeforeUpload).toBe(true);
  });

  test('MIZ 読込から編集、import、download、クローズ確認まで実行できる', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    const translationArea = await openMizTranslationDialog(page);
    await translationArea.fill('Edited translation');
    await expect(translationArea).toHaveValue('Edited translation');

    await page.getByRole('button', { name: 'MIZ 翻訳ダイアログを閉じる' }).click();
    await expect(page.getByTestId('miz-close-confirm-dialog')).toBeVisible();
    await page.getByTestId('miz-close-confirm-cancel').click();
    await expect(page.getByTestId('miz-close-confirm-dialog')).toBeHidden();

    await page.getByTestId('miz-entry-source-DictKey_60').hover();
    await page.getByTestId('miz-entry-copy-DictKey_60').click();
    await expect.poll(async () => (await readClipboardWrites(page)).length).toBe(1);
    expect((await readClipboardWrites(page))[0]).toBe('Alpha source');

    const importFile = createImportedDictionaryPayload();
    await page.getByTestId('miz-dialog-import-button').click();
    await uploadSingleFile(page.getByTestId('miz-dialog-dictionary-input'), importFile);
    await expect(translationArea).toHaveValue('Imported translation');

    await page.getByTestId('miz-dialog-download-button').click();
    await expect.poll(async () => (await readDownloads(page)).length).toBe(1);
    await expect.poll(async () => (await readDownloads(page))[0]?.text ?? null).not.toBeNull();
    const downloads = await readDownloads(page);
    expect(downloads[0]?.download).toBe('dictionary');
    expect(downloads[0]?.text).toContain('["DictKey_60"] = "Imported translation"');

    await page.getByRole('button', { name: 'MIZ 翻訳ダイアログを閉じる' }).click();
    await expect(page.getByTestId('miz-close-confirm-dialog')).toBeHidden();
  });

  test('未保存変更ありでページ離脱時に beforeunload が発火する', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    const translationArea = await openMizTranslationDialog(page);
    await translationArea.fill('Unsaved translation');

    const beforeUnloadDialogPromise = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const dialog = await beforeUnloadDialogPromise;

    expect(dialog.type()).toBe('beforeunload');
    await dialog.dismiss();
  });

  test('download 後はページ離脱時に beforeunload が発火しない', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    const translationArea = await openMizTranslationDialog(page);
    await translationArea.fill('Saved translation');

    await page.getByTestId('miz-dialog-download-button').click();
    await expect.poll(async () => (await readDownloads(page)).length).toBe(1);

    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await page.close({ runBeforeUnload: true });
    await expect.poll(() => dialogTriggered).toBe(false);
  });
});
