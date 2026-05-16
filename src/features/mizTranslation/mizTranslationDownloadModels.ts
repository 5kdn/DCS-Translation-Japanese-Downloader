import type { MizDictionarySortKey, MizDictionarySortOrder } from '@/features/mizTranslation/mizDictionarySort';

/**
 * @summary MIZ 翻訳ダウンロード形式を表す。
 */
export type MizTranslationDownloadFormat = 'dictionary' | 'po' | 'csv';

/**
 * @summary MIZ 翻訳エクスポート時のソート状態を表す。
 */
export type MizTranslationExportSort = {
  sortKey?: MizDictionarySortKey;
  sortOrder?: MizDictionarySortOrder;
};
