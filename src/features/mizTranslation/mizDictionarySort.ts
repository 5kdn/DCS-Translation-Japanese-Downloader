import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';

/**
 * @summary MIZ 翻訳テーブルで扱うソートキーを表す。
 */
export type MizDictionarySortKey = 'enabled' | 'key' | 'sourceText' | 'translatedText';

/**
 * @summary MIZ 翻訳テーブルのソート順を表す。
 */
export type MizDictionarySortOrder = 'asc' | 'desc';

/**
 * @summary 固定先頭グループの優先順を表す。
 */
const FIXED_GROUP_PREFIXES = [
  'DictKey_sortie_',
  'DictKey_descriptionText_',
  'DictKey_descriptionBlueTask_',
  'DictKey_descriptionRedTask_',
  'DictKey_descriptionNeutralsTask_',
] as const;

/**
 * @summary key が固定先頭グループに属する場合の優先順位を返す。
 * @param key 判定対象 key を指定する。
 * @returns 固定グループ順位を返し、該当しない場合は `null` を返す。
 */
export const getMizDictionaryFixedGroupRank = (key: string): number | null => {
  const index = FIXED_GROUP_PREFIXES.findIndex((prefix) => key.startsWith(prefix));
  return index === -1 ? null : index;
};

/**
 * @summary 固定先頭 5 グループ優先の規則で dictionary エントリーを整列する。
 * @param entries ソート対象エントリー一覧を指定する。
 * @returns 仕様順に並べ替えた新しい配列を返す。
 */
export const sortMizDictionaryEntries = (entries: ReadonlyArray<MizDictionaryEntry>): MizDictionaryEntry[] => {
  return [...entries].sort(compareMizDictionaryEntries);
};

/**
 * @summary テーブル列ソート状態を加味しつつ固定先頭 5 グループ優先で整列する。
 * @param entries ソート対象エントリー一覧を指定する。
 * @param sortKey テーブル列ソートキーを指定する。
 * @param sortOrder テーブル列ソート順を指定する。
 * @returns 表示用の並び順へ整列した新しい配列を返す。
 */
export const sortMizDictionaryEntriesForTable = (
  entries: ReadonlyArray<MizDictionaryEntry>,
  sortKey?: MizDictionarySortKey,
  sortOrder?: MizDictionarySortOrder,
): MizDictionaryEntry[] => {
  return [...entries].sort((left, right) => compareMizDictionaryEntriesForTable(left, right, sortKey, sortOrder));
};

/**
 * @summary 固定先頭 5 グループ優先の規則で dictionary key を比較する。
 * @param leftKey 比較左辺 key を指定する。
 * @param rightKey 比較右辺 key を指定する。
 * @returns `Array.prototype.sort` 互換の比較結果を返す。
 */
export const compareMizDictionaryKeys = (leftKey: string, rightKey: string): number => {
  const leftRank = getMizDictionaryFixedGroupRank(leftKey);
  const rightRank = getMizDictionaryFixedGroupRank(rightKey);

  if (leftRank !== null && rightRank !== null && leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  if (leftRank !== null && rightRank === null) {
    return -1;
  }

  if (leftRank === null && rightRank !== null) {
    return 1;
  }

  return leftKey.localeCompare(rightKey);
};

/**
 * @summary 固定先頭 5 グループ優先の規則で dictionary エントリーを比較する。
 * @param left 比較左辺エントリーを指定する。
 * @param right 比較右辺エントリーを指定する。
 * @returns `Array.prototype.sort` 互換の比較結果を返す。
 */
export const compareMizDictionaryEntries = (left: MizDictionaryEntry, right: MizDictionaryEntry): number => {
  return compareMizDictionaryKeys(left.key, right.key);
};

/**
 * @summary テーブル列ソート状態を加味しつつ固定先頭 5 グループ優先で比較する。
 * @param left 比較左辺エントリーを指定する。
 * @param right 比較右辺エントリーを指定する。
 * @param sortKey テーブル列ソートキーを指定する。
 * @param sortOrder テーブル列ソート順を指定する。
 * @returns `Array.prototype.sort` 互換の比較結果を返す。
 */
export const compareMizDictionaryEntriesForTable = (
  left: MizDictionaryEntry,
  right: MizDictionaryEntry,
  sortKey?: MizDictionarySortKey,
  sortOrder?: MizDictionarySortOrder,
): number => {
  const fixedGroupComparison = compareMizDictionaryKeys(left.key, right.key);
  const leftRank = getMizDictionaryFixedGroupRank(left.key);
  const rightRank = getMizDictionaryFixedGroupRank(right.key);

  if (leftRank !== rightRank) {
    return fixedGroupComparison;
  }

  if (sortKey === undefined || sortOrder === undefined) {
    return fixedGroupComparison;
  }

  const sortValueComparison = compareSortValues(resolveSortValue(left, sortKey), resolveSortValue(right, sortKey));
  if (sortValueComparison !== 0) {
    return sortOrder === 'desc' ? sortValueComparison * -1 : sortValueComparison;
  }

  return left.key.localeCompare(right.key);
};

/**
 * @summary 指定ソートキーに対応する比較用値を解決する。
 * @param entry 変換対象エントリーを指定する。
 * @param sortKey テーブル列ソートキーを指定する。
 * @returns 比較用 primitive 値を返す。
 */
const resolveSortValue = (entry: MizDictionaryEntry, sortKey: MizDictionarySortKey): boolean | string => {
  switch (sortKey) {
    case 'enabled':
      return entry.enabled;
    case 'key':
      return entry.key;
    case 'sourceText':
      return entry.sourceText;
    case 'translatedText':
      return entry.translatedText;
  }
};

/**
 * @summary 比較用 primitive 値を比較する。
 * @param leftValue 比較左辺値を指定する。
 * @param rightValue 比較右辺値を指定する。
 * @returns `Array.prototype.sort` 互換の比較結果を返す。
 */
const compareSortValues = (leftValue: boolean | string, rightValue: boolean | string): number => {
  if (typeof leftValue === 'boolean' && typeof rightValue === 'boolean') {
    return Number(leftValue) - Number(rightValue);
  }

  return String(leftValue).localeCompare(String(rightValue));
};
