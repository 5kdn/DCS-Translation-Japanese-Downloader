import type { MaybeRefOrGetter } from 'vue';
import { computed, getCurrentScope, onScopeDispose, toValue, watch } from 'vue';

/**
 * @summary 未保存変更がある場合の beforeunload 制御を管理する。
 * @param hasUnsavedChanges 未保存変更の有無を指定する。
 * @param isDialogOpen ダイアログ表示状態を指定する。
 * @returns ガード有効状態を返す。
 */
export const useBeforeUnloadGuard = (hasUnsavedChanges: MaybeRefOrGetter<boolean>, isDialogOpen: MaybeRefOrGetter<boolean>) => {
  /**
   * @summary beforeunload ガードを有効化する条件を表す。
   */
  const isBeforeUnloadGuardEnabled = computed((): boolean => {
    return toValue(hasUnsavedChanges) && toValue(isDialogOpen);
  });

  if (typeof window === 'undefined') {
    return {
      isBeforeUnloadGuardEnabled,
    };
  }

  /**
   * @summary 未保存変更がある場合にページ離脱確認を発火させる。
   * @param event beforeunload イベントを指定する。
   */
  const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (!isBeforeUnloadGuardEnabled.value) return;
    event.preventDefault();
    event.returnValue = '';
  };

  let isAttached = false;

  /**
   * @summary beforeunload ハンドラーを登録する。
   */
  const attach = (): void => {
    if (isAttached) return;
    window.addEventListener('beforeunload', handleBeforeUnload);
    isAttached = true;
  };

  /**
   * @summary beforeunload ハンドラーを解除する。
   */
  const detach = (): void => {
    if (!isAttached) return;
    window.removeEventListener('beforeunload', handleBeforeUnload);
    isAttached = false;
  };

  /**
   * @summary beforeunload ガード状態を監視する watch を解除する。
   */
  const stop = watch(
    isBeforeUnloadGuardEnabled,
    (enabled: boolean): void => {
      if (enabled) {
        attach();
        return;
      }
      detach();
    },
    { immediate: true },
  );

  if (getCurrentScope() !== undefined) {
    onScopeDispose((): void => {
      stop();
      detach();
    });
  }

  return {
    isBeforeUnloadGuardEnabled,
  };
};
