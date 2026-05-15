<script setup lang="ts">
import { computed, defineAsyncComponent, ref, useTemplateRef } from 'vue';
import { normalizeMizFileSelection, validateSelectedMizFile } from '@/features/mizTranslation/mizFileSelection';

/**
 * @summary MIZ 選択セクション props を表す。
 */
type MizTranslationEntrySectionProps = {
  isLoading: boolean;
  errorMessage: string | null;
};

defineOptions({
  components: {
    DropZone: defineAsyncComponent(() => import('./common/DropZone.vue')),
  },
});

const props = withDefaults(defineProps<MizTranslationEntrySectionProps>(), {
  isLoading: false,
  errorMessage: null,
});

const emit = defineEmits<{
  (e: 'select-miz', file: File): void;
  (e: 'clear-error'): void;
}>();

/**
 * @summary MIZ ファイル入力要素参照を保持する。
 */
const _fileInput = useTemplateRef<HTMLInputElement>('fileInput');

/**
 * @summary ドラッグ中の視覚状態を表す。
 */
const _isDragOver = ref(false);

/**
 * @summary UI 内部で検出した入力検証エラーを保持する。
 */
const _localErrorMessage = ref<string | null>(null);

/**
 * @summary 画面へ表示するエラーメッセージを返す。
 */
const _displayErrorMessage = computed((): string | null => {
  return _localErrorMessage.value ?? props.errorMessage;
});

/**
 * @summary エラー alert の表示要否を返す。
 */
const _hasDisplayErrorMessage = computed((): boolean => {
  return _displayErrorMessage.value !== null;
});

/**
 * @summary エラー alert へ渡す文言を返す。
 */
const _displayErrorAlertText = computed((): string | undefined => {
  return _displayErrorMessage.value ?? undefined;
});

/**
 * @summary エラー表示を初期化する。
 */
const _clearErrors = (): void => {
  _localErrorMessage.value = null;
  emit('clear-error');
};

/**
 * @summary 正規化済みファイル一覧を検証し、選択イベントを親へ通知する。
 * @param files 検証対象のファイル一覧を指定する。
 */
const _applySelectedFiles = (files: ReadonlyArray<File>): void => {
  _clearErrors();

  try {
    const mizFile = validateSelectedMizFile(files);
    emit('select-miz', mizFile);
  } catch (error: unknown) {
    _localErrorMessage.value = error instanceof Error ? error.message : 'MIZ ファイルの選択に失敗しました。';
  }
};

/**
 * @summary MIZ ファイル選択ダイアログを開く。
 */
const _openFilePicker = (): void => {
  _fileInput.value?.click();
};

/**
 * @summary file input 変更時の選択値を処理する。
 * @param event file input change event を指定する。
 */
const _handleFileInputChange = (event: Event): void => {
  const input = event.target;
  const files =
    input instanceof HTMLInputElement && input.files !== null ? Array.from(input.files) : normalizeMizFileSelection(null);

  _applySelectedFiles(files);

  if (input instanceof HTMLInputElement) {
    input.value = '';
  }
};

/**
 * @summary drag enter 時に dropzone 状態を有効化する。
 */
const _handleDragEnter = (): void => {
  _isDragOver.value = true;
};

/**
 * @summary drag leave 時に dropzone 状態を解除する。
 */
const _handleDragLeave = (): void => {
  _isDragOver.value = false;
};

/**
 * @summary drag over 時に dropzone 状態を維持する。
 */
const _handleDragOver = (): void => {
  _isDragOver.value = true;
};

/**
 * @summary drop されたファイル一覧を検証して親へ通知する。
 * @param event drop event を指定する。
 */
const _handleDrop = (event: DragEvent): void => {
  _isDragOver.value = false;
  const files = event.dataTransfer?.files;
  _applySelectedFiles(files === undefined ? [] : [...files]);
};
</script>

<template lang="pug">
h2.d-inline-flex.align-start.text-display-large.mt-10.mb-5 MIZ Translation

div.miz-translation-panel
  p.text-body-1.text-medium-emphasis.mb-4 MIZ ファイルから `l10n/DEFAULT/dictionary` を読み込み、翻訳編集ダイアログを開きます。

  v-alert.mb-4(
    v-if="_hasDisplayErrorMessage"
    type="error"
    variant="tonal"
    :text="_displayErrorAlertText"
    data-testid="miz-entry-error"
  )

  input.d-none(
    ref="fileInput"
    data-testid="miz-file-input"
    type="file"
    accept=".miz"
    :disabled="isLoading"
    @change="_handleFileInputChange"
  )

  DropZone(
    data-testid="miz-dropzone"
    :is-drag-over="_isDragOver"
    :is-loading="isLoading"
    icon="mdi-folder-zip-outline"
    headline="MIZ ファイルをドロップする"
    button-label="MIZ ファイルを選択"
    @action="_openFilePicker"
    @dragenter="_handleDragEnter"
    @dragover="_handleDragOver"
    @dragleave="_handleDragLeave"
    @drop="_handleDrop"
  )
</template>
