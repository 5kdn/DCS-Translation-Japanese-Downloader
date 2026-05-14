import { computed, ref } from 'vue';
import type { MizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryModels';

/**
 * @summary MIZ dictionary フィルターの初期値を表す。
 */
const INITIAL_MIZ_DICTIONARY_FILTER: MizDictionaryFilter = {
  showEnabled: true,
  showDisabled: true,
  showOnlyUntranslated: false,
  hideNonTranslatable: true,
  hideEmptySourceText: true,
};

/**
 * @summary MIZ 翻訳一覧のフィルター状態を管理する。
 * @returns フィルター状態と操作関数を返す。
 */
export const useMizTranslationFilterState = () => {
  const showEnabled = ref(INITIAL_MIZ_DICTIONARY_FILTER.showEnabled);
  const showDisabled = ref(INITIAL_MIZ_DICTIONARY_FILTER.showDisabled);
  const showOnlyUntranslated = ref(INITIAL_MIZ_DICTIONARY_FILTER.showOnlyUntranslated);
  const hideNonTranslatable = ref(INITIAL_MIZ_DICTIONARY_FILTER.hideNonTranslatable);
  const hideEmptySourceText = ref(INITIAL_MIZ_DICTIONARY_FILTER.hideEmptySourceText);

  const filter = computed<MizDictionaryFilter>(() => {
    return {
      showEnabled: showEnabled.value,
      showDisabled: showDisabled.value,
      showOnlyUntranslated: showOnlyUntranslated.value,
      hideNonTranslatable: hideNonTranslatable.value,
      hideEmptySourceText: hideEmptySourceText.value,
    };
  });

  /**
   * @summary 有効項目の表示状態を更新する。
   * @param value 設定値を指定する。
   */
  const setShowEnabled = (value: boolean): void => {
    showEnabled.value = value;
  };

  /**
   * @summary 無効項目の表示状態を更新する。
   * @param value 設定値を指定する。
   */
  const setShowDisabled = (value: boolean): void => {
    showDisabled.value = value;
  };

  /**
   * @summary 未翻訳のみ表示するかを更新する。
   * @param value 設定値を指定する。
   */
  const setShowOnlyUntranslated = (value: boolean): void => {
    showOnlyUntranslated.value = value;
  };

  /**
   * @summary 翻訳対象外項目を非表示にするかを更新する。
   * @param value 設定値を指定する。
   */
  const setHideNonTranslatable = (value: boolean): void => {
    hideNonTranslatable.value = value;
  };

  /**
   * @summary 原文空欄項目を非表示にするかを更新する。
   * @param value 設定値を指定する。
   */
  const setHideEmptySourceText = (value: boolean): void => {
    hideEmptySourceText.value = value;
  };

  /**
   * @summary フィルター状態を初期値へ戻す。
   */
  const resetFilter = (): void => {
    showEnabled.value = INITIAL_MIZ_DICTIONARY_FILTER.showEnabled;
    showDisabled.value = INITIAL_MIZ_DICTIONARY_FILTER.showDisabled;
    showOnlyUntranslated.value = INITIAL_MIZ_DICTIONARY_FILTER.showOnlyUntranslated;
    hideNonTranslatable.value = INITIAL_MIZ_DICTIONARY_FILTER.hideNonTranslatable;
    hideEmptySourceText.value = INITIAL_MIZ_DICTIONARY_FILTER.hideEmptySourceText;
  };

  return {
    showEnabled,
    showDisabled,
    showOnlyUntranslated,
    hideNonTranslatable,
    hideEmptySourceText,
    filter,
    setShowEnabled,
    setShowDisabled,
    setShowOnlyUntranslated,
    setHideNonTranslatable,
    setHideEmptySourceText,
    resetFilter,
  };
};
