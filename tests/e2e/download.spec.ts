import { expect, test } from '@playwright/test';
import { installAppApiMocks } from './support/apiMock';
import { installBrowserHarness, readDownloads, readOpenedUrls } from './support/browserHarness';

test.describe('Download E2E', () => {
  test.beforeEach(async ({ page }) => {
    await installBrowserHarness(page);
  });

  test('カテゴリ切替と検索で一覧を絞り込める', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await page.getByRole('tab', { name: 'User Campaigns' }).click();
    await expect(page.getByRole('tab', { name: 'User Campaigns' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('tbody').getByRole('cell', { name: 'Operation Black Knight', exact: true })).toBeVisible();

    await page.getByRole('combobox', { name: '名称で絞り込み' }).fill('Operation');
    await expect(page.locator('tbody').getByRole('cell', { name: 'Operation Black Knight', exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Aircrafts' }).click();
    await page.getByRole('combobox', { name: '名称で絞り込み' }).fill('AH');
    await page.keyboard.press('Enter');
    await expect(page.locator('tbody').getByRole('cell', { name: 'AH-64D', exact: true })).toBeVisible();
    await expect(page.locator('tbody').getByRole('cell', { name: 'F-16C', exact: true })).toHaveCount(0);
  });

  test('日付絞り込みとソートを実行できる', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await page.getByRole('textbox', { name: '最終更新日 (以降)' }).click();
    const dayButton = page.getByRole('button', { name: '10' }).first();
    await dayButton.click();

    await expect(page.locator('tbody').getByRole('cell', { name: 'F-16C', exact: true })).toBeVisible();
    await expect(page.locator('tbody').getByRole('cell', { name: 'AH-64D', exact: true })).toHaveCount(0);

    await page.getByRole('columnheader', { name: /最終更新日/ }).click();
    await expect(page.locator('tbody tr').first()).toContainText('F-16C');
  });

  test('フォルダ遷移、ファイル一覧、ZIP ダウンロード導線を実行できる', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await page.getByRole('tab', { name: 'User Campaigns' }).click();

    await page.getByLabel('Operation Black Knight のフォルダを開く').click();
    const openedUrls = await readOpenedUrls(page);
    expect(openedUrls[0]?.url).toContain('/UserMissions/Campaigns/Operation Black Knight');

    await page.getByLabel('Operation Black Knight のファイル一覧を開く').click();
    await expect(page.getByText('ファイル数: 2')).toBeVisible();
    await page.getByLabel('README_Translation.md を GitHub で開く').click();
    const openedAfterDialog = await readOpenedUrls(page);
    expect(openedAfterDialog.some((item) => item.url.includes('README_Translation.md'))).toBe(true);
    await page.getByLabel('ファイル一覧ダイアログを閉じる').click();

    await page.getByLabel('Operation Black Knight のZIP をダウンロードする').click();
    await expect.poll(async () => (await readDownloads(page)).length).toBe(1);
    const downloads = await readDownloads(page);
    expect(downloads[0]?.download).toBe('Operation Black Knight.zip');
  });

  test('ダウンロード失敗時はエラーを表示する', async ({ page }) => {
    await installAppApiMocks(page, {
      rawErrorPaths: ['UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary'],
    });
    await page.goto('/');

    await page.getByRole('tab', { name: 'User Missions' }).click();
    await page.getByLabel('Sample のZIP をダウンロードする').click();

    await expect(page.getByText('エラーが発生しました。')).toBeVisible();
  });
});
