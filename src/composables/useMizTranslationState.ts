import { computed } from 'vue';
import { useBeforeUnloadGuard } from '@/composables/useBeforeUnloadGuard';
import { useMizTranslationCloseGuardState } from '@/composables/useMizTranslationCloseGuardState';
import { useMizTranslationDialogState } from '@/composables/useMizTranslationDialogState';
import { useMizTranslationDirtyState } from '@/composables/useMizTranslationDirtyState';
import { useMizTranslationEditorState } from '@/composables/useMizTranslationEditorState';
import { useMizTranslationFilterState } from '@/composables/useMizTranslationFilterState';
import type { MizDictionaryEntriesResult } from '@/features/mizTranslation/mizArchiveModels';
import { sortMizDictionaryEntries } from '@/features/mizTranslation/mizDictionarySort';
import { applyMizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryState';

/**
 * @summary MIZ 翻訳機能の状態管理 composable 群を束ねる。
 * @returns UI から利用する統合状態と操作関数を返す。
 */
export const useMizTranslationState = () => {
  const dialogState = useMizTranslationDialogState();
  const filterState = useMizTranslationFilterState();
  const editorState = useMizTranslationEditorState();
  const dirtyState = useMizTranslationDirtyState(editorState.entries);

  const filteredEntries = computed(() => {
    return sortMizDictionaryEntries(applyMizDictionaryFilter(editorState.entries.value, filterState.filter.value));
  });

  const visibleEntryCount = computed((): number => {
    return filteredEntries.value.length;
  });

  const totalEntryCount = computed((): number => {
    return editorState.entries.value.length;
  });

  const needsCloseConfirmation = computed((): boolean => {
    return dialogState.isDialogOpen.value && dirtyState.hasUnsavedChanges.value;
  });

  const canCloseWithoutConfirm = computed((): boolean => {
    return !needsCloseConfirmation.value;
  });

  const beforeUnloadGuard = useBeforeUnloadGuard(dirtyState.hasUnsavedChanges, dialogState.isDialogOpen);

  const closeGuardState = useMizTranslationCloseGuardState(needsCloseConfirmation, () => {
    resetAll();
  });

  /**
   * @summary 読込済み MIZ dictionary を統合状態へ反映する。
   * @param result 読込済み dictionary 結果を指定する。
   */
  const loadMizResult = (result: MizDictionaryEntriesResult): void => {
    closeGuardState.resetCloseGuardState();
    editorState.replaceEntries(result);
    dirtyState.resetBaseline(editorState.entries.value);
    filterState.resetFilter();
    dialogState.openForLoadedDictionary(result);
  };

  /**
   * @summary ダウンロード成功後の保存済み状態更新を反映する。
   */
  const markDownloadSucceeded = (): void => {
    dirtyState.markSaved();
  };

  /**
   * @summary すべての MIZ 翻訳状態を初期化する。
   */
  const resetAll = (): void => {
    dialogState.resetDialogState();
    filterState.resetFilter();
    editorState.resetEntries();
    dirtyState.clearBaseline();
    closeGuardState.resetCloseGuardState();
  };

  return {
    ...dialogState,
    ...filterState,
    ...editorState,
    ...dirtyState,
    ...closeGuardState,
    ...beforeUnloadGuard,
    filteredEntries,
    visibleEntryCount,
    totalEntryCount,
    needsCloseConfirmation,
    canCloseWithoutConfirm,
    loadMizResult,
    markDownloadSucceeded,
    resetAll,
  };
};
