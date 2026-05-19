// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCreateIssue, fetchCreatePr, fetchTree, healthCheck } from '@/lib/client';
import { defaultTreeItems } from '../../shared/msw/fixtures/appApiFixtures';
import { createAppApiHandlers } from '../../shared/msw/handlers/createAppApiHandlers';
import type { CapturedRequest } from '../../shared/msw/models/appApiMockTypes';
import { mswServer } from '../support/mswServer';

describe('client integration', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
  });

  it('healthCheck が API 応答をそのまま評価する', async () => {
    mswServer.use(
      ...createAppApiHandlers({
        apiBaseUrl: 'https://api.example.test',
        healthOk: true,
      }),
    );

    await expect(healthCheck()).resolves.toBe(true);
  });

  it('fetchTree が API 応答を TreeItem へ変換する', async () => {
    mswServer.use(
      ...createAppApiHandlers({
        apiBaseUrl: 'https://api.example.test',
      }),
    );

    const treeItems = await fetchTree();

    expect(treeItems).toHaveLength(defaultTreeItems.length);
    expect(treeItems[0]).toMatchObject({
      path: defaultTreeItems[0]?.path,
      type: 'blob',
    });
    expect(treeItems[0]?.updatedAt).toBeInstanceOf(Date);
  });

  it('fetchCreateIssue が HTTP 経由で payload を送信する', async () => {
    const issueRequests: CapturedRequest[] = [];
    mswServer.use(
      ...createAppApiHandlers({
        apiBaseUrl: 'https://api.example.test',
        issueRequests,
      }),
    );

    const result = await fetchCreateIssue({
      title: '[typo] UserMissions/Campaigns/Operation Black Knight',
      body: 'fix typo',
      labels: ['translation', 'typo'],
      assignees: ['octocat'],
    });

    expect(result).toEqual([{ issueNumber: 123, issueUrl: 'https://example.test/issues/123' }]);
    expect(issueRequests).toHaveLength(1);
    expect(JSON.parse(issueRequests[0]?.bodyText ?? '{}')).toMatchObject({
      title: '[typo] UserMissions/Campaigns/Operation Black Knight',
      body: 'fix typo',
      labels: ['translation', 'typo'],
      assignees: ['octocat'],
    });
  });

  it('fetchCreatePr が create-pr API へ整形済み payload を送信する', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-23T07:15:01.000Z'));

    const createPrRequests: CapturedRequest[] = [];
    mswServer.use(
      ...createAppApiHandlers({
        apiBaseUrl: 'https://api.example.test',
        createPrRequests,
      }),
    );

    const file = new File(['briefing'], 'briefing.txt', { type: 'text/plain' });
    const result = await fetchCreatePr({
      title: '[Aircraft][C130J]ファイルの追加',
      description: '## 概要\nテスト',
      targetType: 'Aircraft',
      targetName: 'C130J',
      selectedChangeTypes: ['ファイルの追加'],
      selectedFiles: [
        {
          path: 'DCSWorld/Mods/aircraft/C130J/Missions/QuickStart/briefing.txt',
          file,
        },
      ],
    });

    expect(result[0]).toMatchObject({
      prNumber: 456,
      prUrl: 'https://example.test/pr/456',
    });
    expect(createPrRequests).toHaveLength(1);
    expect(JSON.parse(createPrRequests[0]?.bodyText ?? '{}')).toMatchObject({
      prTitle: '[Aircraft][C130J]ファイルの追加',
      prBody: '## 概要\nテスト',
      commitMessage: 'feat: [Aircraft][C130J]ファイルの追加',
      branchName: 'feature/Aircraft/C130J/AddFile--20260223-161501JST',
      files: [
        {
          path: 'DCSWorld/Mods/aircraft/C130J/Missions/QuickStart/briefing.txt',
          content: 'briefing',
          operation: 'upsert',
        },
      ],
    });
  });
});
