import { expect, type Page } from '@playwright/test';

/**
 * @summary README 確認から説明入力へ進む。
 * @param page 対象ページを指定する。
 * @param action README ステップで押下する操作を指定する。
 * @returns Promise<void> を返す。
 */
export const moveFromReadmeStep = async (page: Page, action: 'change' | 'skip' | 'next'): Promise<void> => {
  if (action === 'change') {
    await page.getByRole('button', { name: '修正する' }).click();
  } else if (action === 'skip') {
    await page.getByRole('button', { name: '変更無し' }).click();
  } else {
    await page.getByRole('button', { name: '次へ' }).click();
  }

  await expect(page.getByText(/対象の種類:/)).toBeVisible();
};

/**
 * @summary 説明入力ステップを埋めて確認画面へ進む。
 * @param page 対象ページを指定する。
 * @param overview 概要を指定する。
 * @param details 変更内容を指定する。
 * @param notes 留意点を指定する。
 * @returns Promise<void> を返す。
 */
export const fillUploadDescriptionAndGoToConfirm = async (
  page: Page,
  overview: string,
  details: string,
  notes: string,
): Promise<void> => {
  await page.getByLabel('ファイルの追加').click();
  await page.locator('[name="upload-overview"]').fill(overview);
  await page.locator('[name="upload-change-details"]').fill(details);
  await page.locator('[name="upload-notes"]').fill(notes);
  await page.getByLabel('アップロードするファイルに個人情報は含まれていません').click();
  await page.getByLabel(/流通制御ポリシー/).click();
  await page.getByRole('button', { name: '確認する' }).click();
  await expect(page.getByText('アップロード内容')).toBeVisible();
};
