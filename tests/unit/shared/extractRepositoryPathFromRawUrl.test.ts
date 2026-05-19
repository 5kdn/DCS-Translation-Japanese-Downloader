import { describe, expect, it } from 'vitest';
import { extractRepositoryPathFromRawUrl } from '../../shared/extractRepositoryPathFromRawUrl';

describe('extractRepositoryPathFromRawUrl', () => {
  it('通常の GitHub RAW URL からリポジトリ内パスを抽出する', () => {
    expect(
      extractRepositoryPathFromRawUrl(
        'https://raw.githubusercontent.com/dummy-owner/dummy-repo/master/UserMissions/Sample/README_Translation.md',
      ),
    ).toBe('UserMissions/Sample/README_Translation.md');
  });

  it('URL エンコードされたパスを復号して返す', () => {
    expect(
      extractRepositoryPathFromRawUrl(
        'https://raw.githubusercontent.com/dummy-owner/dummy-repo/master/UserMissions/Sample%20Campaign/README_Translation.md',
      ),
    ).toBe('UserMissions/Sample Campaign/README_Translation.md');
  });

  it('owner、repo、ref を含まない URL は例外を送出する', () => {
    expect(() => extractRepositoryPathFromRawUrl('https://raw.githubusercontent.com/dummy-owner/dummy-repo/master')).toThrow(
      'GitHub RAW URL のパスが不正です:',
    );
  });
});
