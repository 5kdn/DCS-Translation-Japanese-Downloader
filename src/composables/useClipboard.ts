/**
 * @summary クリップボードへテキストをコピーする。
 * @param text コピー対象テキストを指定する。
 * @returns コピー完了を表す Promise を返す。
 */
export const copyText = async (text: string): Promise<void> => {
  if (typeof navigator === 'undefined' || navigator.clipboard === undefined) {
    throw new Error('Clipboard API is not available.');
  }

  await navigator.clipboard.writeText(text);
};
