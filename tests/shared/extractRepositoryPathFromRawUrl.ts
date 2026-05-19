/**
 * @summary GitHub RAW URL からリポジトリ内パスを抽出する。
 * @param url GitHub RAW URL を指定する。
 * @returns リポジトリ相対パスを返す。
 * @throws owner、repo、ref の各セグメントを含まない場合に例外を送出する。
 */
export const extractRepositoryPathFromRawUrl = (url: string): string => {
  const { pathname } = new URL(url);
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  if (segments.length < 4) {
    throw new Error(`GitHub RAW URL のパスが不正です: ${url}`);
  }
  return decodeURIComponent(segments.slice(3).join('/'));
};
