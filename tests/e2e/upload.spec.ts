import { expect, test } from '@playwright/test';
import { installAppApiMocks } from './support/apiMock';
import {
  createAircraftFolderFiles,
  createDlcCampaignFolderFiles,
  createRelativeFile,
  createUserCampaignFolderFiles,
  createUserMissionFolderFiles,
} from './support/fileFixtures';
import { uploadDirectory, uploadSingleFile } from './support/fileInput';
import { fillUploadDescriptionAndGoToConfirm, moveFromReadmeStep } from './support/uploadHelpers';

test.describe('Upload E2E', () => {
  test('直接ファイル選択と無効ルートのエラーを表示する', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await uploadSingleFile(page.locator('input[webkitdirectory]').first(), {
      name: 'briefing.txt',
      type: 'text/plain',
      bytes: [...Buffer.from('briefing', 'utf8')],
    });
    await expect(page.getByText(/ファイルを直接選択することはできません。/)).toBeVisible();

    await uploadDirectory(page, createAircraftFolderFiles('sample-root/'));
    await expect(page.getByText(/選択されたルートフォルダーが許可されていません/)).toBeVisible();
  });

  test('禁止ファイル形式のエラーを表示する', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await uploadDirectory(page, [
      ...createAircraftFolderFiles(),
      createRelativeFile('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/manual.pdf', 'pdf', 'application/pdf'),
    ]);
    await expect(page.getByRole('alert').filter({ hasText: '現在PDFはアップロードすることができません。' })).toContainText(
      '現在PDFはアップロードすることができません。',
    );
  });

  test('対象種別を自動判定して確認画面へ進める', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await uploadDirectory(page, createAircraftFolderFiles());
    await expect(page.getByText('対象の種類: Aircraft')).toBeVisible();
    await expect(page.getByText('対象名: F-16C')).toBeVisible();

    await fillUploadDescriptionAndGoToConfirm(page, 'アップロード確認用の概要です。', '- briefing.txt を更新', 'N/A');
    await expect(page.getByText('[Aircraft][F-16C]ファイルの追加')).toBeVisible();
    await expect(page.getByText('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt')).toBeVisible();
  });

  test('DLC Campaign と User Mission の対象名を自動判定できる', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await uploadDirectory(page, createDlcCampaignFolderFiles());
    await expect(page.getByText('対象の種類: DLC Campaigns')).toBeVisible();
    await expect(page.getByText('対象名: The Enemy Within')).toBeVisible();
    await page.getByLabel('Close upload dialog').click();

    await uploadDirectory(page, createUserMissionFolderFiles({ includeReadme: true }));
    await expect(page.getByText('対象の種類: User Mission')).toBeVisible();
    await expect(page.getByText('対象名: Sample')).toBeVisible();
  });

  test('README 既存取得失敗時はテンプレートへフォールバックする', async ({ page }) => {
    await installAppApiMocks(page, {
      rawErrorPaths: ['UserMissions/Campaigns/Sample Campaign/README_Translation.md'],
    });
    await page.goto('/');

    await uploadDirectory(page, createUserCampaignFolderFiles());
    await expect(page.getByText('README_Translation.md の取得に失敗したため、テンプレートを表示しています。')).toBeVisible();
    await expect(page.getByText('テンプレートを編集し、README_Translation.md を作成してください。')).toBeVisible();
  });

  test('アップロード済み README がある場合は README 確認をスキップする', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await uploadDirectory(page, createUserCampaignFolderFiles({ includeReadme: true }));
    await expect(page.getByText('対象の種類: User Campaign')).toBeVisible();
    await expect(page.getByRole('button', { name: '戻る' })).not.toBeVisible();
  });

  test('README テンプレートを編集した場合は送信結果まで進める', async ({ page }) => {
    await installAppApiMocks(page, {
      treeItems: [],
    });
    await page.goto('/');

    await uploadDirectory(page, createUserCampaignFolderFiles());
    await page
      .getByRole('textbox', { name: 'README_Translation.md' })
      .fill(
        '# Sample Campaign\n\n## Original\n- https://example.test/original\n- version: 2026-05-16\n- License: CC-BY\n\nTranslator note: updated.',
      );
    await moveFromReadmeStep(page, 'next');
    await fillUploadDescriptionAndGoToConfirm(
      page,
      'README を作成して送信するケースです。',
      '- README_Translation.md を更新',
      'N/A',
    );
    await expect(page.getByText('UserMissions/Campaigns/Sample Campaign/README_Translation.md', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'アップロード' }).click();
    await expect(page.getByText('PR #456 を作成しました。').last()).toBeVisible();
  });

  test('送信成功を表示する', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await uploadDirectory(page, createAircraftFolderFiles());
    await fillUploadDescriptionAndGoToConfirm(page, '成功ケース', '- briefing.txt を更新', 'N/A');
    await page.getByRole('button', { name: 'アップロード' }).click();
    await expect(page.getByText('PR #456 を作成しました。').last()).toBeVisible();
  });

  test('送信失敗を表示する', async ({ page }) => {
    await installAppApiMocks(page, { createPrErrorMessage: 'API呼び出しに失敗しました。' });
    await page.goto('/');

    await uploadDirectory(page, createAircraftFolderFiles());
    await fillUploadDescriptionAndGoToConfirm(page, '失敗ケース', '- briefing.txt を更新', 'N/A');
    await page.getByRole('button', { name: 'アップロード' }).click();
    await expect(page.getByText('ステータス: 失敗')).toBeVisible();
    await expect(page.getByText(/サーバー側のInternal Errorに起因するエラー/).last()).toBeVisible();
  });
});
