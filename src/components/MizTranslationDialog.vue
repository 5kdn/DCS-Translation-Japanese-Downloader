<script setup lang="ts">
import { computed, defineAsyncComponent, useTemplateRef } from 'vue';
import type { MizDictionaryEntry, MizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryModels';

/**
 * @summary MIZ 翻訳ダイアログ props を表す。
 */
type MizTranslationDialogProps = {
  modelValue: boolean;
  loadedFileName: string;
  isLoading: boolean;
  entries: MizDictionaryEntry[];
  errorMessage: string | null;
  filter: MizDictionaryFilter;
  visibleEntryCount: number;
  totalEntryCount: number;
};

defineOptions({
  components: {
    MizTranslationFilterPanel: defineAsyncComponent(() => import('./MizTranslationFilterPanel.vue')),
    MizTranslationTable: defineAsyncComponent(() => import('./MizTranslationTable.vue')),
  },
});

const props = withDefaults(defineProps<MizTranslationDialogProps>(), {
  modelValue: false,
  loadedFileName: '',
  isLoading: false,
  entries: () => [],
  errorMessage: null,
  filter: () => ({
    showEnabled: true,
    showDisabled: true,
    showOnlyUntranslated: false,
    hideNonTranslatable: true,
    hideEmptySourceText: true,
  }),
  visibleEntryCount: 0,
  totalEntryCount: 0,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:show-enabled', value: boolean): void;
  (e: 'update:show-disabled', value: boolean): void;
  (e: 'update:show-only-untranslated', value: boolean): void;
  (e: 'update:hide-non-translatable', value: boolean): void;
  (e: 'update:hide-empty-source-text', value: boolean): void;
  (e: 'toggle-enabled', key: string, value: boolean): void;
  (e: 'update-translation', key: string, value: string): void;
  (e: 'import-dictionary', file: File): void;
  (e: 'download-dictionary'): void;
  (e: 'error', message: string): void;
}>();

/**
 * @summary dictionary import 用 file input 参照を保持する。
 */
const _dictionaryInput = useTemplateRef<HTMLInputElement>('dictionaryInput');

/**
 * @summary エラー alert の表示要否を返す。
 */
const _hasErrorMessage = computed((): boolean => {
  return props.errorMessage !== null;
});

/**
 * @summary エラー alert へ渡す文言を返す。
 */
const _errorAlertText = computed((): string | undefined => {
  return props.errorMessage ?? undefined;
});

/**
 * @summary ダイアログの双方向状態を返す。
 */
const _dialogModel = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean): void => emit('update:modelValue', value),
});

/**
 * @summary ダイアログを閉じる。
 */
const _closeDialog = (): void => {
  emit('update:modelValue', false);
};

/**
 * @summary 有効状態変更を親へ通知する。
 * @param key 更新対象 key を指定する。
 * @param value 更新値を指定する。
 */
const _handleToggleEnabled = (key: string, value: boolean): void => {
  emit('toggle-enabled', key, value);
};

/**
 * @summary 翻訳更新を親へ通知する。
 * @param key 更新対象 key を指定する。
 * @param value 翻訳文を指定する。
 */
const _handleUpdateTranslation = (key: string, value: string): void => {
  emit('update-translation', key, value);
};

/**
 * @summary テーブル内エラーを親へ通知する。
 * @param message 表示用エラーメッセージを指定する。
 */
const _handleTableError = (message: string): void => {
  emit('error', message);
};

/**
 * @summary import 実行可否を返す。
 */
const _canImportDictionary = computed((): boolean => {
  return !props.isLoading;
});

/**
 * @summary download 実行可否を返す。
 */
const _canDownloadDictionary = computed((): boolean => {
  return !props.isLoading && props.totalEntryCount > 0;
});

/**
 * @summary dictionary 読み込み用ファイル選択ダイアログを開く。
 */
const _openDictionaryImportPicker = (): void => {
  if (!_canImportDictionary.value) return;
  _dictionaryInput.value?.click();
};

/**
 * @summary 選択された dictionary ファイルを親へ通知する。
 * @param event file input change event を指定する。
 */
const _handleDictionaryInputChange = (event: Event): void => {
  const input = event.target;
  const file = input instanceof HTMLInputElement ? (input.files?.[0] ?? null) : null;

  if (file !== null) {
    emit('import-dictionary', file);
  }

  if (input instanceof HTMLInputElement) {
    input.value = '';
  }
};

/**
 * @summary dictionary ダウンロード要求を親へ通知する。
 */
const _handleDownloadDictionary = (): void => {
  if (!_canDownloadDictionary.value) return;
  emit('download-dictionary');
};

const _handleShowEnabledUpdate = (value: boolean): void => {
  emit('update:show-enabled', value);
};

const _handleShowDisabledUpdate = (value: boolean): void => {
  emit('update:show-disabled', value);
};

const _handleShowOnlyUntranslatedUpdate = (value: boolean): void => {
  emit('update:show-only-untranslated', value);
};

const _handleHideNonTranslatableUpdate = (value: boolean): void => {
  emit('update:hide-non-translatable', value);
};

const _handleHideEmptySourceTextUpdate = (value: boolean): void => {
  emit('update:hide-empty-source-text', value);
};
</script>

<template lang="pug">
v-dialog(v-model="_dialogModel" fullscreen)
  v-card
    input(
      ref="dictionaryInput"
      data-testid="miz-dialog-dictionary-input"
      type="file"
      accept=".lua,.txt,.dictionary,dictionary"
      class="miz-dialog-dictionary-input"
      @change="_handleDictionaryInputChange"
    )

    v-toolbar(border)
      v-toolbar-title.d-flex.align-center.ga-3
        span.text-h6 MIZ 翻訳
        span.text-body-2.text-medium-emphasis.text-truncate(data-testid="miz-dialog-file-name") {{ loadedFileName || '未選択' }}
      v-spacer
      v-btn(
        prepend-icon="mdi-file-import-outline"
        variant="text"
        :disabled="!_canImportDictionary"
        data-testid="miz-dialog-import-button"
        @click="_openDictionaryImportPicker"
      ) dictionary を読み込む
      v-btn(
        prepend-icon="mdi-download"
        variant="text"
        :disabled="!_canDownloadDictionary"
        data-testid="miz-dialog-download-button"
        @click="_handleDownloadDictionary"
      ) dictionary をダウンロード
      v-btn(
        icon="mdi-close"
        variant="text"
        aria-label="MIZ 翻訳ダイアログを閉じる"
        :disabled="isLoading"
        @click="_closeDialog"
      )

    v-card-text.py-6
      v-container
        v-alert(
          v-if="_hasErrorMessage"
          type="error"
          variant="tonal"
          :text="_errorAlertText"
          class="mb-4"
          data-testid="miz-dialog-error"
        )

        v-alert(
          v-if="isLoading"
          type="info"
          variant="tonal"
          text="dictionary を読み込み中です。"
          data-testid="miz-dialog-loading"
        )

        v-alert(
          v-else
          type="info"
          variant="tonal"
          class="mb-4"
          data-testid="miz-dialog-information"
        )
          p 原文と key は読み取り専用です。翻訳欄を編集し、必要な行だけ有効化してください。
          p 有効にチェックが入っている項目だけが翻訳した dictionary ファイルに追加されます。
          p dictionary ファイルを直接編集するときのような \ エスケープは不要です。
          p Lua コードが翻訳対象となっている可能性があります。

        MizTranslationFilterPanel(
          v-if="!isLoading"
          :show-enabled="props.filter.showEnabled"
          :show-disabled="props.filter.showDisabled"
          :show-only-untranslated="props.filter.showOnlyUntranslated"
          :hide-non-translatable="props.filter.hideNonTranslatable"
          :hide-empty-source-text="props.filter.hideEmptySourceText"
          :visible-entry-count="props.visibleEntryCount"
          :total-entry-count="props.totalEntryCount"
          @update:show-enabled="_handleShowEnabledUpdate"
          @update:show-disabled="_handleShowDisabledUpdate"
          @update:show-only-untranslated="_handleShowOnlyUntranslatedUpdate"
          @update:hide-non-translatable="_handleHideNonTranslatableUpdate"
          @update:hide-empty-source-text="_handleHideEmptySourceTextUpdate"
        )

        MizTranslationTable(
          v-if="!isLoading"
          :entries="entries"
          @toggle-enabled="_handleToggleEnabled"
          @update-translation="_handleUpdateTranslation"
          @error="_handleTableError"
        )
</template>

<style scoped lang="scss">
.miz-dialog-dictionary-input {
  display: none;
}
</style>
