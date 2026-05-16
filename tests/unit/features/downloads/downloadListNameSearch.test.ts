import { describe, expect, it } from 'vitest';
import {
  filterDownloadListNameCandidates,
  matchesDownloadListNameSearch,
  normalizeDownloadListNameSearchText,
} from '@/features/downloads/downloadListNameSearch';

describe('downloadListNameSearch', () => {
  it('区切り文字と大文字小文字差を吸収して正規化する', () => {
    expect(normalizeDownloadListNameSearchText('F-16_C Demo')).toBe('f16cdemo');
  });

  it('区切り文字を無視した部分一致を許容する', () => {
    expect(matchesDownloadListNameSearch('F-16C', 'f16')).toBe(true);
  });

  it('部分列一致を許容する', () => {
    expect(matchesDownloadListNameSearch('Operation Black Knight', 'blkngt')).toBe(true);
  });

  it('空文字検索では常に一致する', () => {
    expect(matchesDownloadListNameSearch('MiG-29', '')).toBe(true);
  });

  it('一致しない候補を除外する', () => {
    expect(filterDownloadListNameCandidates(['F-16C', 'AH-64D'], 'hornet')).toEqual([]);
  });
});
