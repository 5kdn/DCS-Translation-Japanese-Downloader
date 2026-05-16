import { computed, ref } from 'vue';
import { useBeforeUnloadGuard } from '@/composables/useBeforeUnloadGuard';
import { useMizTranslationCloseGuardState } from '@/composables/useMizTranslationCloseGuardState';
import { useMizTranslationDialogState } from '@/composables/useMizTranslationDialogState';
import { useMizTranslationDirtyState } from '@/composables/useMizTranslationDirtyState';
import { useMizTranslationEditorState } from '@/composables/useMizTranslationEditorState';
import { useMizTranslationFilterState } from '@/composables/useMizTranslationFilterState';
import type { MizDictionaryEntriesResult } from '@/features/mizTranslation/mizArchiveModels';
import { sortMizDictionaryEntries } from '@/features/mizTranslation/mizDictionarySort';
import { applyMizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryState';
import { resolveMizTranslationExportEntries } from '@/features/mizTranslation/mizTranslationDownloadEntries';
import type {
  MizTranslationDownloadFormat,
  MizTranslationExportSort,
} from '@/features/mizTranslation/mizTranslationDownloadModels';

/**
 * @summary MIZ 翻訳機能の状態管理 composable 群を束ねる。
 * @returns UI から利用する統合状態と操作関数を返す。
 */
export const useMizTranslationState = () => {
  const dialogState = useMizTranslationDialogState();
  const filterState = useMizTranslationFilterState();
  const editorState = useMizTranslationEditorState();
  const dirtyState = useMizTranslationDirtyState(editorState.entries);
  const exportSort = ref<MizTranslationExportSort>({});

  const filteredEntries = computed(() => {
    return sortMizDictionaryEntries(applyMizDictionaryFilter(editorState.entries.value, filterState.filter.value));
  });

  const visibleEntryCount = computed((): number => {
    return filteredEntries.value.length;
  });

  const exportEntries = computed(() => {
    return resolveMizTranslationExportEntries(editorState.entries.value, exportSort.value);
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
    exportSort.value = {};
    dialogState.openForLoadedDictionary(result);
  };

  /**
   * @summary エクスポート用ソート状態を更新する。
   * @param value 更新後ソート状態を指定する。
   */
  const setExportSort = (value: MizTranslationExportSort): void => {
    exportSort.value = {
      sortKey: value.sortKey,
      sortOrder: value.sortOrder,
    };
  };

  /**
   * @summary 現在の編集内容から形式別ダウンロード payload を構築する。
   * @param format ダウンロード形式を指定する。
   * @returns 保存用 payload を返す。
   */
  const buildDownloadPayload = (format: MizTranslationDownloadFormat) => {
    return editorState.buildDownloadPayload(format, exportSort.value);
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
    exportSort.value = {};
  };

  return {
    ...dialogState,
    ...filterState,
    ...editorState,
    ...dirtyState,
    ...closeGuardState,
    ...beforeUnloadGuard,
    filteredEntries,
    exportEntries,
    exportSort,
    visibleEntryCount,
    totalEntryCount,
    needsCloseConfirmation,
    canCloseWithoutConfirm,
    setExportSort,
    loadMizResult,
    buildDownloadPayload,
    markDownloadSucceeded,
    resetAll,
  };
};
