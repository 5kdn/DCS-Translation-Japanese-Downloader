import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUploadBranchName, fetchCreatePr, sanitizeBranchNameSegment } from '@/lib/client';
import type { CreatePrPostRequestBody } from '@/lib/http/apiClient/createPr';

const createPrPostMock = vi.fn();
// biome-ignore lint/complexity/useRegexLiterals: 本番コードと同じ理由で文字列ベースの RegExp 定義にそろえる。
const GIT_REF_FORBIDDEN_CHARACTER_PATTERN = new RegExp('[\\u0000-\\u001f\\u007f ~^:?*[\\\\\\]]');

vi.mock('@/lib/http/apiClient/apiClient', () => {
  return {
    createApiClient: vi.fn(() => ({
      createPr: {
        post: createPrPostMock,
      },
    })),
  };
});

/**
 * @summary Git のブランチ名制約を満たすか簡易判定する。
 * @param branchName 判定対象のブランチ名を指定する。
 * @returns 制約を満たす場合 true を返す。
 */
const isValidGitBranchName = (branchName: string): boolean => {
  if (branchName === '' || branchName.startsWith('/') || branchName.endsWith('/')) return false;
  if (branchName.includes('..')) return false;
  if (branchName.includes('@{')) return false;
  if (GIT_REF_FORBIDDEN_CHARACTER_PATTERN.test(branchName)) return false;

  return branchName.split('/').every((segment: string): boolean => {
    if (segment === '' || segment === '.' || segment === '..') return false;
    if (segment.startsWith('.') || segment.endsWith('.')) return false;
    if (segment.endsWith('.lock')) return false;
    return true;
  });
};

describe('client createPr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
  });

  it('ブランチ名を規約どおり生成する', () => {
    const result = buildUploadBranchName(
      {
        targetType: 'Aircraft',
        targetName: 'C130J',
        selectedChangeTypes: ['ファイルの追加'],
      },
      new Date('2026-02-23T07:15:01.000Z'),
    );

    expect(result).toBe('feature/Aircraft/C130J/AddFile--20260223-161501JST');
  });

  it('空白を含む対象でも安全なブランチ名を生成する', () => {
    const result = buildUploadBranchName(
      {
        targetType: 'DLC Campaigns',
        targetName: 'The Enemy Within',
        selectedChangeTypes: ['ファイルの追加'],
      },
      new Date('2026-02-23T07:15:01.000Z'),
    );

    expect(result).toBe('feature/DLC-Campaigns/The-Enemy-Within/AddFile--20260223-161501JST');
    expect(isValidGitBranchName(result)).toBe(true);
  });

  it('禁止文字と危険な終端を含む対象名を安全な slug へ変換する', () => {
    expect(sanitizeBranchNameSegment(' Sample:?*[]\\Name..lock ')).toBe('Sample-Name-lock');
    expect(sanitizeBranchNameSegment('...')).toBe('unknown');
    expect(sanitizeBranchNameSegment('User Mission')).toBe('User-Mission');
  });

  it('ユーザーキャンペーン名に空白や禁止文字があっても有効なブランチ名にする', () => {
    const result = buildUploadBranchName(
      {
        targetType: 'User Campaign',
        targetName: '.Sample Campaign:?*[\\Name.lock.',
        selectedChangeTypes: ['その他の修正'],
      },
      new Date('2026-02-23T07:15:01.000Z'),
    );

    expect(result).toBe('feature/User-Campaign/Sample-Campaign-Name-lock/OtherChange--20260223-161501JST');
    expect(isValidGitBranchName(result)).toBe(true);
  });

  it('createPr に期待どおりのリクエストを渡す', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-23T07:15:01.000Z'));
    createPrPostMock.mockResolvedValue({
      success: true,
      data: [
        {
          prNumber: 123,
          prUrl: 'https://example.test/pr/123',
          branchName: 'feature/Aircraft/C130J/AddFile--20260223-161501JST',
          commitSha: 'abc123',
          note: 'created',
        },
      ],
    });

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

    expect(result).toEqual([
      {
        prNumber: 123,
        prUrl: 'https://example.test/pr/123',
        branchName: 'feature/Aircraft/C130J/AddFile--20260223-161501JST',
        commitSha: 'abc123',
        note: 'created',
      },
    ]);
    expect(createPrPostMock).toHaveBeenCalledTimes(1);
    expect(createPrPostMock).toHaveBeenCalledWith({
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
    } satisfies CreatePrPostRequestBody);
  });

  it('空白入り対象でも createPr に有効なブランチ名を渡す', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-23T07:15:01.000Z'));
    createPrPostMock.mockResolvedValue({
      success: true,
      data: [
        {
          prNumber: 456,
          prUrl: 'https://example.test/pr/456',
          branchName: 'feature/DLC-Campaigns/The-Enemy-Within/AddFile--20260223-161501JST',
          commitSha: 'def456',
          note: 'created',
        },
      ],
    });

    const file = new File(['dictionary'], 'dictionary', { type: 'text/plain' });
    await fetchCreatePr({
      title: '[DLC Campaigns][The Enemy Within]ファイルの追加',
      description: '## 概要\nテスト',
      targetType: 'DLC Campaigns',
      targetName: 'The Enemy Within',
      selectedChangeTypes: ['ファイルの追加'],
      selectedFiles: [
        {
          path: 'DCSWorld/Mods/campaigns/The Enemy Within/mission_01.miz/l10n/JP/dictionary',
          file,
        },
      ],
    });

    const requestBody = createPrPostMock.mock.calls[0]?.[0] as CreatePrPostRequestBody | undefined;
    expect(requestBody?.branchName).toBe('feature/DLC-Campaigns/The-Enemy-Within/AddFile--20260223-161501JST');
    expect(requestBody?.branchName && isValidGitBranchName(requestBody.branchName)).toBe(true);
  });
});
