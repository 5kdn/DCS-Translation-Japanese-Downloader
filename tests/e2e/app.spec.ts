import { expect, test } from '@playwright/test';
import { installAppApiMocks } from './support/apiMock';

test.describe('App E2E', () => {
  test('初期表示後にファイル一覧ダイアログを開閉できる', async ({ page }) => {
    await installAppApiMocks(page);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'DCS Translation Japanese' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Upload' })).toBeVisible();

    await page.getByLabel('F-16C のファイル一覧を開く').click();

    await expect(page.getByLabel('ファイル一覧ダイアログを閉じる')).toBeVisible();
    await expect(page.getByLabel('dictionary を GitHub で開く').first()).toBeVisible();

    await page.getByLabel('ファイル一覧ダイアログを閉じる').click();

    await expect(page.getByLabel('ファイル一覧ダイアログを閉じる')).toBeHidden();
  });

  test('tree が空のときは空表示になる', async ({ page }) => {
    await installAppApiMocks(page, { treeItems: [] });

    await page.goto('/');

    await expect(page.getByText('表示できる項目がありません。')).toBeVisible();
  });
});
