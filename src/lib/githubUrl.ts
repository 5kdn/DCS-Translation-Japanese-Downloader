/**
 * @summary GitHub URL 生成に必要な環境変数を解決する。
 * @returns owner, repo, ref の組を返す。
 */
const resolveGitHubRepositoryContext = (): { owner: string; repo: string; ref: string } => {
  const owner = import.meta.env.VITE_TARGET_OWNER;
  const repo = import.meta.env.VITE_TARGET_REPO;
  const ref = import.meta.env.VITE_TARGET_REF;

  if (typeof owner !== 'string') {
    throw new Error('VITE_TARGET_OWNER が未設定です。');
  }
  if (typeof repo !== 'string') {
    throw new Error('VITE_TARGET_REPO が未設定です。');
  }
  if (typeof ref !== 'string') {
    throw new Error('VITE_TARGET_REF が未設定です。');
  }

  return { owner, repo, ref };
};

/**
 * @summary GitHub URL 用にパスを正規化する。
 * @param path 正規化対象パスを指定する。
 * @returns 正規化済みパスを返す。
 */
export const normalizeGitHubPath = (path: string): string => {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '');
};

/**
 * @summary GitHub blob URL を生成する。
 * @param path リポジトリ内パスを指定する。
 * @returns GitHub blob URL を返す。
 */
export const buildGitHubBlobUrl = (path: string): string => {
  const { owner, repo, ref } = resolveGitHubRepositoryContext();
  const normalizedPath = normalizeGitHubPath(path);
  return `https://github.com/${owner}/${repo}/blob/${ref}/${normalizedPath}`;
};

/**
 * @summary GitHub raw URL を生成する。
 * @param path リポジトリ内パスを指定する。
 * @returns GitHub raw URL を返す。
 */
export const buildGitHubRawUrl = (path: string): string => {
  const { owner, repo, ref } = resolveGitHubRepositoryContext();
  const normalizedPath = normalizeGitHubPath(path).split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${normalizedPath}`;
};
