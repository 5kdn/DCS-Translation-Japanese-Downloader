import type { MaybeRefOrGetter } from 'vue';
import { computed, ref, toValue } from 'vue';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import { hasMizDictionaryChanges } from '@/features/mizTranslation/mizDictionaryState';

/**
 * @summary MIZ dictionary の未保存変更状態を管理する。
 * @param currentEntries 現在の dictionary エントリー一覧を指定する。
 * @returns dirty state と基準更新用 API を返す。
 */
export const useMizTranslationDirtyState = (currentEntries: MaybeRefOrGetter<ReadonlyArray<MizDictionaryEntry>>) => {
  const baselineEntries = ref<MizDictionaryEntry[]>([]);

  const hasUnsavedChanges = computed((): boolean => {
    return hasMizDictionaryChanges(toValue(currentEntries), baselineEntries.value);
  });

  /**
   * @summary 現在値を保存済み基準へ反映する。
   */
  const markSaved = (): void => {
    baselineEntries.value = cloneEntries(toValue(currentEntries));
  };

  /**
   * @summary 指定エントリー一覧を保存基準として再設定する。
   * @param entries 保存基準へ反映するエントリー一覧を指定する。
   */
  const resetBaseline = (entries: ReadonlyArray<MizDictionaryEntry>): void => {
    baselineEntries.value = cloneEntries(entries);
  };

  /**
   * @summary 保存基準を初期化する。
   */
  const clearBaseline = (): void => {
    baselineEntries.value = [];
  };

  return {
    baselineEntries,
    hasUnsavedChanges,
    markSaved,
    resetBaseline,
    clearBaseline,
  };
};

/**
 * @summary dictionary エントリー一覧を未保存変更判定用に複製する。
 * @param entries 複製対象のエントリー一覧を指定する。
 * @returns 複製したエントリー一覧を返す。
 */
const cloneEntries = (entries: ReadonlyArray<MizDictionaryEntry>): MizDictionaryEntry[] => {
  return entries.map((entry: MizDictionaryEntry): MizDictionaryEntry => {
    return {
      ...entry,
    };
  });
};
