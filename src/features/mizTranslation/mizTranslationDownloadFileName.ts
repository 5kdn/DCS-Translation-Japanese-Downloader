import type { MizTranslationDownloadFormat } from '@/features/mizTranslation/mizTranslationDownloadModels';

/**
 * @summary MIZ 翻訳ダウンロード時の保存ファイル名を解決する。
 * @param mizFileName 読込元 MIZ ファイル名を指定する。
 * @param format ダウンロード形式を指定する。
 * @returns 形式に応じた保存ファイル名を返す。
 */
export const resolveMizTranslationDownloadFileName = (
  mizFileName: string,
  format: Exclude<MizTranslationDownloadFormat, 'dictionary'>,
): string => {
  return `${mizFileName}.ja_JP.${format}`;
};
