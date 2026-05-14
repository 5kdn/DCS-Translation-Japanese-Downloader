import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';

/**
 * @summary MIZ 翻訳テーブルで扱うソートキーを表す。
 */
export type MizDictionarySortKey = 'enabled' | 'key' | 'sourceText' | 'translatedText';

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
 * @summary 固定先頭 5 グループ優先の規則で dictionary エントリーを比較する。
 * @param left 比較左辺エントリーを指定する。
 * @param right 比較右辺エントリーを指定する。
 * @returns `Array.prototype.sort` 互換の比較結果を返す。
 */
export const compareMizDictionaryEntries = (left: MizDictionaryEntry, right: MizDictionaryEntry): number => {
  const leftRank = getMizDictionaryFixedGroupRank(left.key);
  const rightRank = getMizDictionaryFixedGroupRank(right.key);

  if (leftRank !== null && rightRank !== null && leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  if (leftRank !== null && rightRank === null) {
    return -1;
  }

  if (leftRank === null && rightRank !== null) {
    return 1;
  }

  return left.key.localeCompare(right.key);
};
