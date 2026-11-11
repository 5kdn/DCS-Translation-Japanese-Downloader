import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUploadBranchName, type CreatePrRequest, fetchCreatePr, sanitizeBranchNameSegment } from '@/lib/client';

const createPrPostMock = vi.fn();
// biome-ignore lint/complexity/useRegexLiterals: 制御文字を含む Git ref の禁止文字を検証する。
const GIT_REF_FORBIDDEN_CHARACTER_PATTERN = new RegExp('[\\u0000-\\u001f\\u007f ~^:?*[\\\\\\]]');
vi.mock('@/lib/http/apiClient/apiClient', () => ({
  createApiClient: vi.fn(() => ({ v2: { prs: { post: createPrPostMock } } })),
}));

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
    expect(sanitizeBranchNameSegment('name@{ref')).toBe('name-ref');
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

  it('v2 PRへ単一結果を期待して送信する', async () => {
    createPrPostMock.mockResolvedValue({ number: 123, url: 'https://example.test/pr/123', reused: false });
    await expect(fetchCreatePr(request())).resolves.toMatchObject({ number: 123, reused: false });
    expect(createPrPostMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prTitle: 'Translation',
        files: [{ path: 'UserMissions/test.lua', operation: 'upsert', content: 'text' }],
      }),
      expect.objectContaining({ options: expect.any(Array) }),
    );
  });

  it.each([
    '',
    'other/test.lua',
    '/absolute',
    '../escape',
    'UserMissions/../escape',
    'UserMissions//test',
    'UserMissions/.git/config',
    'UserMissions/\\\\test',
    'x'.repeat(4097),
    'UserMissions/\u0000test',
  ])('不正なパスを送信しない: %s', async (path) => {
    const input = request();
    input.selectedFiles[0] = { path, file: new File(['text'], 'test') };
    await expect(fetchCreatePr(input)).rejects.toThrow();
    expect(createPrPostMock).not.toHaveBeenCalled();
  });

  it('重複パスを送信しない', async () => {
    const input = request();
    input.selectedFiles.push(...input.selectedFiles);
    await expect(fetchCreatePr(input)).rejects.toThrow();
    expect(createPrPostMock).not.toHaveBeenCalled();
  });

  it.each([0, 101])('件数制限違反を送信しない: %s', async (count) => {
    const input = request();
    input.selectedFiles = Array.from({ length: count }, (_, i) => ({
      path: `UserMissions/${i}.lua`,
      operation: 'delete' as const,
    }));
    await expect(fetchCreatePr(input)).rejects.toThrow();
    expect(createPrPostMock).not.toHaveBeenCalled();
  });

  it('100件の削除をcontentなしで送信できる', async () => {
    const input = request();
    input.selectedFiles = Array.from({ length: 100 }, (_, i) => ({
      path: `UserMissions/${i}.lua`,
      operation: 'delete' as const,
    }));
    createPrPostMock.mockResolvedValue({ number: 123, url: 'https://example.test/pr/123' });
    await fetchCreatePr(input);
    const body = createPrPostMock.mock.calls[0]?.[0];
    expect(body.files).toHaveLength(100);
    expect(body.files.every((file: object) => !('content' in file))).toBe(true);
  });

  it.each([1048576, 1048577])('内容の文字数制限を検証する: %s', async (size) => {
    const input = request();
    input.selectedFiles = [{ path: 'UserMissions/test.lua', file: new File(['x'.repeat(size)], 'test') }];
    createPrPostMock.mockResolvedValue({ number: 123, url: 'https://example.test/pr/123' });
    if (size === 1048576) await expect(fetchCreatePr(input)).resolves.toMatchObject({ number: 123 });
    else {
      await expect(fetchCreatePr(input)).rejects.toThrow();
      expect(createPrPostMock).not.toHaveBeenCalled();
    }
  });
});

const request = (): CreatePrRequest => ({
  title: 'Translation',
  description: 'Update',
  targetType: 'Aircraft',
  targetName: 'C130J',
  selectedChangeTypes: ['ファイルの追加'],
  selectedFiles: [{ path: 'UserMissions/test.lua', file: new File(['text'], 'test.lua') }],
});
