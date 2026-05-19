import type { MaybeRefOrGetter } from 'vue';
import { ref, toValue } from 'vue';

/**
 * @summary MIZ 翻訳ダイアログのクローズ確認状態を管理する。
 * @param needsCloseConfirmation クローズ確認が必要かを指定する。
 * @param performClose 確認不要時または確認後に実行するクローズ処理を指定する。
 * @returns 確認ダイアログ状態とクローズ操作 API を返す。
 */
export const useMizTranslationCloseGuardState = (
  needsCloseConfirmation: MaybeRefOrGetter<boolean>,
  performClose: () => void,
) => {
  const isCloseConfirmDialogOpen = ref(false);

  /**
   * @summary ダイアログのクローズ要求を処理する。
   */
  const requestClose = (): void => {
    if (toValue(needsCloseConfirmation)) {
      isCloseConfirmDialogOpen.value = true;
      return;
    }

    isCloseConfirmDialogOpen.value = false;
    performClose();
  };

  /**
   * @summary クローズ確認を確定し、編集セッションを破棄する。
   */
  const confirmClose = (): void => {
    isCloseConfirmDialogOpen.value = false;
    performClose();
  };

  /**
   * @summary クローズ確認をキャンセルする。
   */
  const cancelClose = (): void => {
    isCloseConfirmDialogOpen.value = false;
  };

  /**
   * @summary クローズ確認状態を初期化する。
   */
  const resetCloseGuardState = (): void => {
    isCloseConfirmDialogOpen.value = false;
  };

  return {
    isCloseConfirmDialogOpen,
    requestClose,
    confirmClose,
    cancelClose,
    resetCloseGuardState,
  };
};
