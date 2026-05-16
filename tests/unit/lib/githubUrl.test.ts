import { afterEach, describe, expect, it } from 'vitest';
import { buildGitHubBlobUrl, buildGitHubRawUrl, normalizeGitHubPath } from '@/lib/githubUrl';

const originalOwner = import.meta.env.VITE_TARGET_OWNER;
const originalRepo = import.meta.env.VITE_TARGET_REPO;
const originalRef = import.meta.env.VITE_TARGET_REF;

describe('githubUrl', () => {
  afterEach(() => {
    if (originalOwner === undefined) {
      delete import.meta.env.VITE_TARGET_OWNER;
    } else {
      import.meta.env.VITE_TARGET_OWNER = originalOwner;
    }
    if (originalRepo === undefined) {
      delete import.meta.env.VITE_TARGET_REPO;
    } else {
      import.meta.env.VITE_TARGET_REPO = originalRepo;
    }
    if (originalRef === undefined) {
      delete import.meta.env.VITE_TARGET_REF;
    } else {
      import.meta.env.VITE_TARGET_REF = originalRef;
    }
  });

  it('blob URL を生成する', () => {
    import.meta.env.VITE_TARGET_OWNER = 'owner';
    import.meta.env.VITE_TARGET_REPO = 'repo';
    import.meta.env.VITE_TARGET_REF = 'main';

    expect(buildGitHubBlobUrl('UserMissions/Sample/README_Translation.md')).toBe(
      'https://github.com/owner/repo/blob/main/UserMissions/Sample/README_Translation.md',
    );
  });

  it('raw URL を生成する', () => {
    import.meta.env.VITE_TARGET_OWNER = 'owner';
    import.meta.env.VITE_TARGET_REPO = 'repo';
    import.meta.env.VITE_TARGET_REF = 'main';

    expect(buildGitHubRawUrl('UserMissions/Sample Campaign/README_Translation.md')).toBe(
      'https://raw.githubusercontent.com/owner/repo/main/UserMissions/Sample%20Campaign/README_Translation.md',
    );
  });

  it('パスを正規化する', () => {
    expect(normalizeGitHubPath('\\UserMissions\\\\Sample//README_Translation.md')).toBe(
      'UserMissions/Sample/README_Translation.md',
    );
  });

  it('環境変数が未設定なら例外を送出する', () => {
    delete import.meta.env.VITE_TARGET_OWNER;
    import.meta.env.VITE_TARGET_REPO = 'repo';
    import.meta.env.VITE_TARGET_REF = 'main';

    expect(() => buildGitHubRawUrl('UserMissions/Sample/README_Translation.md')).toThrow('VITE_TARGET_OWNER が未設定です。');
  });
});
