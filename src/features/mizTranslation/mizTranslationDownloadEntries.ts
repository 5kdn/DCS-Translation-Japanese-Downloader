import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import { sortMizDictionaryEntries, sortMizDictionaryEntriesForTable } from '@/features/mizTranslation/mizDictionarySort';
import type { MizTranslationExportSort } from '@/features/mizTranslation/mizTranslationDownloadModels';

/**
 * @summary エクスポート用に現在ソート順で整列した dictionary エントリー一覧を返す。
 * @param entries 対象エントリー一覧を指定する。
 * @param sort 現在のソート状態を指定する。
 * @returns エクスポート順に整列した新しい配列を返す。
 */
export const resolveMizTranslationExportEntries = (
  entries: ReadonlyArray<MizDictionaryEntry>,
  sort: MizTranslationExportSort,
): MizDictionaryEntry[] => {
  if (sort.sortKey === undefined || sort.sortOrder === undefined) {
    return sortMizDictionaryEntries(entries);
  }

  return sortMizDictionaryEntriesForTable(entries, sort.sortKey, sort.sortOrder);
};
