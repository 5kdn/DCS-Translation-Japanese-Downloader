import { isBlankDictionarySourceText } from '@/features/mizTranslation/mizDictionaryKey';
import type { MizDictionaryEntry, MizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryModels';

/**
 * @summary MIZ dictionary 一覧へフィルター条件を適用する。
 * @param entries 判定対象の dictionary エントリー一覧を指定する。
 * @param filter 適用するフィルター条件を指定する。
 * @returns 条件を満たすエントリー一覧を返す。
 */
export const applyMizDictionaryFilter = (
  entries: ReadonlyArray<MizDictionaryEntry>,
  filter: MizDictionaryFilter,
): MizDictionaryEntry[] => {
  return entries.filter((entry: MizDictionaryEntry): boolean => {
    if (entry.enabled && !filter.showEnabled) return false;
    if (!entry.enabled && !filter.showDisabled) return false;
    if (filter.showOnlyUntranslated && entry.translatedText !== '') return false;
    if (filter.hideNonTranslatable && !entry.isTranslatable) return false;
    if (filter.hideEmptySourceText && isBlankDictionarySourceText(entry.sourceText)) return false;
    return true;
  });
};

/**
 * @summary 現在の dictionary 編集内容に未保存変更があるか判定する。
 * @param currentEntries 現在のエントリー一覧を指定する。
 * @param baselineEntries 保存基準のエントリー一覧を指定する。
 * @returns `enabled` または `translatedText` に差分がある場合は true を返す。
 */
export const hasMizDictionaryChanges = (
  currentEntries: ReadonlyArray<MizDictionaryEntry>,
  baselineEntries: ReadonlyArray<MizDictionaryEntry>,
): boolean => {
  if (currentEntries.length !== baselineEntries.length) {
    return true;
  }

  /**
   * @summary key ごとの保存基準値を保持する参照マップを表す。
   */
  const baselineEntryMap = new Map<string, Pick<MizDictionaryEntry, 'enabled' | 'translatedText'>>();
  for (const entry of baselineEntries) {
    baselineEntryMap.set(entry.key, {
      enabled: entry.enabled,
      translatedText: entry.translatedText,
    });
  }

  for (const entry of currentEntries) {
    const baselineEntry = baselineEntryMap.get(entry.key);
    if (baselineEntry === undefined) {
      return true;
    }
    if (baselineEntry.enabled !== entry.enabled) {
      return true;
    }
    if (baselineEntry.translatedText !== entry.translatedText) {
      return true;
    }
  }

  return false;
};
