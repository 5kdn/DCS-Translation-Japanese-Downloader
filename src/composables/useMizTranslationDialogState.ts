import { ref } from 'vue';
import type { MizDictionaryEntriesResult } from '@/features/mizTranslation/mizArchiveModels';

/**
 * @summary MIZ 翻訳ダイアログの状態を管理する。
 * @returns ダイアログ状態と操作関数を返す。
 */
export const useMizTranslationDialogState = () => {
  const isDialogOpen = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);
  const loadedFileName = ref('');

  /**
   * @summary 読込済み dictionary をダイアログ状態へ反映して開く。
   * @param result 読込済み dictionary 結果を指定する。
   */
  const openForLoadedDictionary = (result: Pick<MizDictionaryEntriesResult, 'fileName'>): void => {
    loadedFileName.value = result.fileName;
    errorMessage.value = null;
    isLoading.value = false;
    isDialogOpen.value = true;
  };

  /**
   * @summary ダイアログを閉じる。
   */
  const closeDialog = (): void => {
    isDialogOpen.value = false;
  };

  /**
   * @summary 読込中状態を更新する。
   * @param value 設定する読込中状態を指定する。
   */
  const setLoading = (value: boolean): void => {
    isLoading.value = value;
  };

  /**
   * @summary エラーメッセージを設定する。
   * @param message 表示用メッセージを指定する。
   */
  const setErrorMessage = (message: string): void => {
    errorMessage.value = message;
  };

  /**
   * @summary エラーメッセージを初期化する。
   */
  const clearErrorMessage = (): void => {
    errorMessage.value = null;
  };

  /**
   * @summary ダイアログ状態を初期化する。
   */
  const resetDialogState = (): void => {
    isDialogOpen.value = false;
    isLoading.value = false;
    errorMessage.value = null;
    loadedFileName.value = '';
  };

  return {
    isDialogOpen,
    isLoading,
    errorMessage,
    loadedFileName,
    openForLoadedDictionary,
    closeDialog,
    setLoading,
    setErrorMessage,
    clearErrorMessage,
    resetDialogState,
  };
};
