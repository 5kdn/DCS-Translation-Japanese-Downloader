import { expect, test } from '@playwright/test';
import { type CapturedRequest, installAppApiMocks } from './support/apiMock';

test.describe('Issue E2E', () => {
  test('報告ダイアログでバリデーションと path 連動タイトルを確認できる', async ({ page }) => {
    await installAppApiMocks(page);
    await page.goto('/');

    await page.getByRole('tab', { name: 'User Campaigns' }).click();
    await page.getByLabel('Operation Black Knight の問題を報告する').click();

    await expect(page.locator('[name="issue-typo-title"]')).toHaveValue('[typo] UserMissions/Campaigns/Operation Black Knight');
    await expect(page.getByRole('button', { name: '送信' })).toBeDisabled();

    await page.getByRole('tab', { name: '不具合' }).click();
    await expect(page.locator('[name="issue-bug-title"]')).toHaveValue('[bugs] UserMissions/Campaigns/Operation Black Knight');
    await expect(page.getByRole('button', { name: '送信' })).toBeDisabled();

    await page.getByRole('tab', { name: 'その他' }).click();
    await expect(page.locator('[name="issue-other-title"]')).toHaveValue(
      '[others] UserMissions/Campaigns/Operation Black Knight',
    );
  });

  test('誤字報告の payload を送信できる', async ({ page }) => {
    const issueRequests: CapturedRequest[] = [];
    await installAppApiMocks(page, { issueRequests });
    await page.goto('/');

    await page.getByRole('tab', { name: 'User Campaigns' }).click();
    await page.getByLabel('Operation Black Knight の問題を報告する').click();

    await page.locator('[name="issue-typo-line-hint"]').fill('Briefing 2行目（"Welcom" の綴り）');
    await page.locator('[name="issue-typo-expect"]').fill('Welcome');
    await page.getByRole('button', { name: '送信' }).click();

    await expect(page.locator('[name="issue-typo-line-hint"]')).toBeHidden();
    expect(issueRequests).toHaveLength(1);
    const body = JSON.parse(issueRequests[0]?.bodyText ?? '{}') as { title?: string; labels?: string[]; body?: string };
    expect(body.title).toBe('[typo] UserMissions/Campaigns/Operation Black Knight');
    expect(body.labels).toEqual(['translation', 'typo']);
    expect(body.body).toContain('## 修正場所が分かる情報');
    expect(body.body).toContain('Welcome');
  });

  test('送信失敗時はダイアログを閉じずエラー表示する', async ({ page }) => {
    await installAppApiMocks(page, { createIssueErrorMessage: 'issue create failed' });
    await page.goto('/');

    await page.getByRole('tab', { name: 'User Campaigns' }).click();
    await page.getByLabel('Operation Black Knight の問題を報告する').click();
    await page.getByRole('tab', { name: 'その他' }).click();
    await page.locator('[name="issue-other-message"]').fill('要望があります。');
    await page.getByRole('button', { name: '送信' }).click();

    await expect(page.getByText(/サーバー側のInternal Errorに起因するエラー/)).toBeVisible();
    await expect(page.locator('[name="issue-other-message"]')).toBeVisible();
  });
});
