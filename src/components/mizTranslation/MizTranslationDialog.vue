<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, useTemplateRef } from 'vue';
import type { MizDictionaryEntry, MizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryModels';
import type {
  MizTranslationDownloadFormat,
  MizTranslationExportSort,
} from '@/features/mizTranslation/mizTranslationDownloadModels';

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

type MizDictionaryFormatOption = {
  value: MizTranslationDownloadFormat;
  label: string;
};

const _mizDictionaryFormatOptions: readonly MizDictionaryFormatOption[] = [
  {
    value: 'dictionary',
    label: 'dictionary形式（既定）',
  },
  {
    value: 'po',
    label: 'PO形式',
  },
  {
    value: 'csv',
    label: 'CSV形式',
  },
] as const;

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
  (e: 'update-sort', value: MizTranslationExportSort): void;
  (e: 'import-dictionary', format: MizTranslationDownloadFormat, file: File): void;
  (e: 'download', format: MizTranslationDownloadFormat): void;
  (e: 'error', message: string): void;
}>();

/**
 * @summary dictionary import 用 file input 参照を保持する。
 */
const _dictionaryInput = useTemplateRef<HTMLInputElement>('dictionaryInput');
const _isImportMenuOpen = ref(false);
const _isDownloadMenuOpen = ref(false);
const _selectedImportFormat = ref<MizTranslationDownloadFormat>('dictionary');
const _selectedDownloadFormat = ref<MizTranslationDownloadFormat>('dictionary');

const _formatAcceptMap: Readonly<Record<MizTranslationDownloadFormat, string>> = {
  dictionary: '',
  po: '.po',
  csv: '.csv',
} as const;

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
 * @summary 現在選択中の import 形式に応じた accept 属性を返す。
 */
const _selectedImportAccept = computed((): string => {
  return _formatAcceptMap[_selectedImportFormat.value];
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
    emit('import-dictionary', _selectedImportFormat.value, file);
  }

  if (input instanceof HTMLInputElement) {
    input.value = '';
  }
};

/**
 * @summary import 形式メニューの選択を処理する。
 * @param format 選択された import 形式を指定する。
 */
const _handleImportFormatSelect = async (format: MizTranslationDownloadFormat): Promise<void> => {
  _selectedImportFormat.value = format;
  _isImportMenuOpen.value = false;
  await nextTick();
  _openDictionaryImportPicker();
};

/**
 * @summary 指定形式の dictionary ダウンロード要求を親へ通知する。
 * @param format ダウンロード形式を指定する。
 */
const _emitDownload = (format: MizTranslationDownloadFormat): void => {
  if (!_canDownloadDictionary.value) return;
  emit('download', format);
};

/**
 * @summary 現在選択中形式の dictionary ダウンロード要求を親へ通知する。
 */
const _handleDownloadDictionary = (): void => {
  _emitDownload(_selectedDownloadFormat.value);
};

/**
 * @summary ダウンロード形式メニューの選択を処理する。
 * @param format 選択されたダウンロード形式を指定する。
 */
const _handleDownloadFormatSelect = (format: MizTranslationDownloadFormat): void => {
  _selectedDownloadFormat.value = format;
  _isDownloadMenuOpen.value = false;
  _emitDownload(format);
};

/**
 * @summary テーブルソート状態変更を親へ通知する。
 * @param value 更新後のソート状態を指定する。
 */
const _handleSortUpdate = (value: MizTranslationExportSort): void => {
  emit('update-sort', value);
};

/**
 * @summary 有効な項目を表示する設定変更を親へ通知する。
 * @param value 有効な項目を表示するかどうか。
 */
const _handleShowEnabledUpdate = (value: boolean): void => {
  emit('update:show-enabled', value);
};

/**
 * @summary 無効な項目を表示する設定変更を親へ通知する。
 * @param value 無効な項目を表示するかどうか。
 */
const _handleShowDisabledUpdate = (value: boolean): void => {
  emit('update:show-disabled', value);
};

/**
 * @summary 未翻訳項目のみを表示する設定変更を親へ通知する。
 * @param value 未翻訳項目のみを表示するかどうか。
 */
const _handleShowOnlyUntranslatedUpdate = (value: boolean): void => {
  emit('update:show-only-untranslated', value);
};

/**
 * @summary 翻訳対象外の項目を非表示にする設定変更を親へ通知する。
 * @param value 翻訳対象外の項目を非表示にするかどうか。
 */
const _handleHideNonTranslatableUpdate = (value: boolean): void => {
  emit('update:hide-non-translatable', value);
};

/**
 * @summary 元テキストが空の項目を非表示にする設定変更を親へ通知する。
 * @param value 元テキストが空の項目を非表示にするかどうか。
 */
const _handleHideEmptySourceTextUpdate = (value: boolean): void => {
  emit('update:hide-empty-source-text', value);
};
</script>

<template lang="pug">
v-dialog(v-model="_dialogModel" fullscreen)
  v-card
    input.d-none(
      ref="dictionaryInput"
      data-testid="miz-dialog-dictionary-input"
      type="file"
      :accept="_selectedImportAccept"
      @change="_handleDictionaryInputChange"
    )

    v-toolbar(border)
      v-toolbar-title.d-flex.align-center.ga-3
        span.text-h6 MIZ 翻訳
        span.text-body-2.text-medium-emphasis.text-truncate.ml-2(data-testid="miz-dialog-file-name") {{ loadedFileName || '未選択' }}
      v-spacer
      div.d-flex.align-center.ga-2
        v-btn-group(variant="tonal" color="primary")
          v-btn(
            prepend-icon="mdi-file-import-outline"
            size="small"
            density="compact"
            :disabled="!_canImportDictionary"
            data-testid="miz-dialog-import-button"
            @click="_openDictionaryImportPicker"
          ) Import
          v-menu(v-model="_isImportMenuOpen" location="bottom end" origin="top end")
            template(#activator="{ props: activatorProps }")
              v-btn(
                v-bind="activatorProps"
                icon="mdi-menu-down"
                size="small"
                density="comfortable"
                aria-label="読込形式を選択して翻訳を取り込む"
                :disabled="!_canImportDictionary"
                data-testid="miz-dialog-import-menu-button"
              )
            v-list(density="compact")
              v-list-item(
                v-for="formatOption in _mizDictionaryFormatOptions"
                :key="formatOption.value"
                :title="formatOption.label"
                :data-testid="`miz-dialog-import-option-${formatOption.value}`"
                @click="_handleImportFormatSelect(formatOption.value)"
              )

        v-btn-group(variant="tonal" color="primary")
          v-btn(
            prepend-icon="mdi-download"
            size="small"
            density="compact"
            :disabled="!_canDownloadDictionary"
            data-testid="miz-dialog-download-button"
            @click="_handleDownloadDictionary"
          ) Download
          v-menu(v-model="_isDownloadMenuOpen" location="bottom end" origin="top end")
            template(#activator="{ props: activatorProps }")
              v-btn(
                v-bind="activatorProps"
                icon="mdi-menu-down"
                size="small"
                density="comfortable"
                aria-label="ダウンロード形式を選択する"
                :disabled="!_canDownloadDictionary"
                data-testid="miz-dialog-download-menu-button"
              )
            v-list(density="compact")
              v-list-item(
                v-for="formatOption in _mizDictionaryFormatOptions"
                :key="formatOption.value"
                :title="formatOption.label"
                :data-testid="`miz-dialog-download-option-${formatOption.value}`"
                @click="_handleDownloadFormatSelect(formatOption.value)"
              )
      v-btn(
        icon="mdi-close"
        variant="text"
        aria-label="MIZ 翻訳ダイアログを閉じる"
        :disabled="isLoading"
        @click="_closeDialog"
      )

    v-card-text.py-6
      v-container
        v-alert.mb-4(
          v-if="_hasErrorMessage"
          type="error"
          variant="tonal"
          :text="_errorAlertText"
          data-testid="miz-dialog-error"
        )

        v-alert.mb-4(
          v-if="isLoading"
          type="info"
          variant="tonal"
          text="dictionary を読み込み中です。"
          data-testid="miz-dialog-loading"
        )

        v-alert.mb-4(
          v-else
          type="info"
          variant="tonal"
          data-testid="miz-dialog-information"
        )
          p.my-0 翻訳は自動でアップロードはされません。
          p.my-0 有効にチェックが入っている項目だけが翻訳した dictionary ファイルに追加されます。
          p.my-0 dictionary ファイルを直接編集するときのような \ エスケープは不要です。
          p.my-0 Lua コードが翻訳対象となっている可能性があります。

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
          @update-sort="_handleSortUpdate"
          @error="_handleTableError"
        )
</template>
