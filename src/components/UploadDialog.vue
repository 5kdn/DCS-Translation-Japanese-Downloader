<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { UploadDialogStep, useUploadDialogState } from '@/composables/useUploadDialogState';
import { toErrorMessageForDisplay } from '@/errors/errorMessage';
import { type ParsedUploadSelection, parseSelectedFolder, UPLOAD_CHANGE_TYPES } from '@/features/upload/uploadDialogDomain';
import { collectFilesFromDroppedFolder } from '@/features/upload/uploadDialogFileSource';
import type { UploadDialogSubmitHandler, UploadDialogSubmitResult } from '@/features/upload/uploadDialogSubmit';
import type { CreatePrResponseItem } from '@/lib/client';

defineOptions({
  components: {
    UploadConfirmStep: defineAsyncComponent(() => import('./upload/UploadConfirmStep.vue')),
    UploadDescriptionStep: defineAsyncComponent(() => import('./upload/UploadDescriptionStep.vue')),
    UploadDropzone: defineAsyncComponent(() => import('./upload/UploadDropzone.vue')),
    UploadResultStep: defineAsyncComponent(() => import('./upload/UploadResultStep.vue')),
  },
});

const props = defineProps<{
  onSubmit?: UploadDialogSubmitHandler;
}>();

const {
  folderInput,
  isDialogOpen: _isDialogOpen,
  isLoading,
  isDragOver,
  step,
  selectedFolderName,
  selectedFolderSize,
  fileEntries,
  selectedFiles,
  fileEntryCount: _fileEntryCount,
  detectedTargetType: _detectedTargetType,
  detectedTargetName: _detectedTargetName,
  expandedConfirmPanels: _expandedConfirmPanels,
  selectedChangeTypes: _selectedChangeTypes,
  overview: _overview,
  changeDetails: _changeDetails,
  notes: _notes,
  hasConfirmedNoPersonalInformation: _hasConfirmedNoPersonalInformation,
  hasAgreedDistributionPolicy: _hasAgreedDistributionPolicy,
  errorMessage: _errorMessage,
  successMessage: _successMessage,
  title: _title,
  description: _description,
  fileSizeText: _fileSizeText,
  canGoToConfirm,
  clearNotifications,
  setErrorMessage,
  setSuccessMessage,
  applySelectedUpload,
  clearSelectedUpload,
  resetState,
} = useUploadDialogState();

const _uploadChangeTypes = computed(() => [...UPLOAD_CHANGE_TYPES]);
const _submitResult = ref<UploadDialogSubmitResult | null>(null);

/**
 * @summary 不明な例外を画面表示用メッセージへ変換する。
 * @param error 例外オブジェクトを指定する。
 */
const setErrorFromUnknown = (error: unknown): void => {
  setErrorMessage(toErrorMessageForDisplay(error));
};

/**
 * @summary 解析済みの選択結果を状態へ反映する。
 * @param selectedUpload 反映対象のアップロード情報を指定する。
 */
const handleParsedSelection = (selectedUpload: ParsedUploadSelection): void => {
  clearNotifications();
  _submitResult.value = null;
  applySelectedUpload(selectedUpload);
};

/**
 * @summary フォルダー選択処理の失敗を状態へ反映する。
 * @param error 例外オブジェクトを指定する。
 */
const handleSelectionError = (error: unknown): void => {
  clearSelectedUpload();
  _submitResult.value = null;
  if (error instanceof Error) {
    setErrorMessage(error.message.trim());
    return;
  }
  setErrorFromUnknown(error);
};

/**
 * @summary 入力内容を破棄して初期状態へ戻す。
 */
const _cancelUpload = (): void => {
  if (isLoading.value) return;
  _submitResult.value = null;
  resetState();
};

/**
 * @summary フォルダー選択ダイアログを開く。
 */
const _openFolderPicker = (): void => {
  if (isLoading.value) return;
  folderInput.value?.click();
};

/**
 * @summary フォルダー入力変更を処理する。
 * @param event input change イベントを指定する。
 * @returns Promise<void> を返す。
 */
const _handleFolderInputChange = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement | null;
  const fileList = input?.files;
  if (fileList === null || fileList === undefined) {
    handleSelectionError(new Error('フォルダーが選択されていません。'));
    return;
  }

  try {
    handleParsedSelection(parseSelectedFolder(Array.from(fileList)));
  } catch (error: unknown) {
    handleSelectionError(error);
  }
};

/**
 * @summary ドロップ領域へのドラッグオーバーを処理する。
 * @param event DragEvent を指定する。
 */
const _handleDragOver = (event: DragEvent): void => {
  event.preventDefault();
  if (isLoading.value) return;
  isDragOver.value = true;
};

/**
 * @summary ドロップ領域からドラッグが離れた際の表示を更新する。
 */
const _handleDragLeave = (): void => {
  isDragOver.value = false;
};

/**
 * @summary フォルダードロップを処理する。
 * @param event Drop イベントを指定する。
 * @returns Promise<void> を返す。
 */
const _handleDrop = async (event: DragEvent): Promise<void> => {
  event.preventDefault();
  isDragOver.value = false;
  if (isLoading.value) return;

  try {
    const droppedFolder = await collectFilesFromDroppedFolder(event.dataTransfer);
    handleParsedSelection(parseSelectedFolder(droppedFolder.files));
  } catch (error: unknown) {
    handleSelectionError(error);
  }
};

/**
 * @summary 確認ステップへ遷移する。
 */
const _goToConfirm = (): void => {
  if (!canGoToConfirm.value) return;
  _errorMessage.value = null;
  _submitResult.value = null;
  _expandedConfirmPanels.value = [0];
  step.value = UploadDialogStep.Confirm;
};

/**
 * @summary 入力ステップへ戻る。
 */
const _goBackToDescription = (): void => {
  if (isLoading.value) return;
  step.value = UploadDialogStep.Description;
};

/**
 * @summary 成功時の送信結果を生成する。
 * @param item API応答の先頭要素を指定する。
 * @returns 送信結果を返す。
 */
const buildSuccessResult = (item: CreatePrResponseItem | undefined): UploadDialogSubmitResult => {
  const prNumberText = item?.prNumber != null ? `PR #${item.prNumber}` : 'PR';
  return {
    isSuccess: true,
    message: `${prNumberText} を作成しました。`,
    prNumber: item?.prNumber,
    prUrl: item?.prUrl,
    branchName: item?.branchName,
    commitSha: item?.commitSha,
    note: item?.note,
  };
};

/**
 * @summary 失敗時の送信結果を生成する。
 * @param error 例外オブジェクトを指定する。
 * @returns 送信結果を返す。
 */
const buildFailureResult = (error: unknown): UploadDialogSubmitResult => {
  return {
    isSuccess: false,
    message: toErrorMessageForDisplay(error),
  };
};

/**
 * @summary アップロードを送信する。
 * @returns Promise<void> を返す。
 */
const _submitUpload = async (): Promise<void> => {
  if (
    !canGoToConfirm.value ||
    selectedFolderName.value === null ||
    _detectedTargetType.value === null ||
    fileEntries.value.length === 0 ||
    selectedFiles.value.length === 0
  ) {
    return;
  }

  isLoading.value = true;
  clearNotifications();

  try {
    if (props.onSubmit === undefined) {
      throw new Error('アップロード処理が設定されていません。');
    }

    const result = await props.onSubmit({
      fileName: selectedFolderName.value,
      fileSize: selectedFolderSize.value,
      entries: [...fileEntries.value],
      selectedFiles: [...selectedFiles.value],
      targetType: _detectedTargetType.value,
      targetName: _detectedTargetName.value,
      selectedChangeTypes: [..._selectedChangeTypes.value],
      title: _title.value.trim(),
      description: _description.value.trim(),
    });
    _submitResult.value = buildSuccessResult(result[0]);
    setSuccessMessage(_submitResult.value.message);
  } catch (error: unknown) {
    _submitResult.value = buildFailureResult(error);
    setErrorMessage(_submitResult.value.message);
  } finally {
    step.value = UploadDialogStep.Result;
    isLoading.value = false;
  }
};
</script>

<template lang="pug">
v-container
  div
    .d-flex.align-start.mt-10.mb-5
      h2.text-h2 Upload
      v-tooltip(interactive :open-on-hover="false" open-on-click)
        template(#activator="{ props }")
          v-icon(color="medium-emphasis" v-bind="props") mdi-help-circle-outline
        div
          p フォルダーを選択し、サーバーにアップロードします。
          p
            | 選択するフォルダーは
            b DCSWorld
            | または
            b UserMissions
            | フォルダー自体である必要があります。
          p
            | フォルダ構成は
            a(href="https://github.com/5kdn/DCS-Translation-Japanese" target="_blank" rel="noopener noreferrer" @click.stop) 5kdn/DCS-Translation-Japanese
            | リポジトリを参考に作成してください。
          p 1回のアップロードには、1つの機体、DLCキャンペーン、ユーザーミッション、またはユーザーキャンペーンだけを含めてください。
  div.upload-panel
    input(
      ref="folderInput"
      type="file"
      webkitdirectory
      directory
      multiple
      class="d-none"
      @change="_handleFolderInputChange"
    )

    v-card
      v-card-title
      v-card-text
        v-alert.mb-4.text-pre-wrap(type="error" variant="tonal" v-if="_errorMessage") {{ _errorMessage }}
        v-alert.mb-4(type="success" variant="tonal" v-if="_successMessage") {{ _successMessage }}
        UploadDropzone(
          :is-drag-over="isDragOver"
          :is-loading="isLoading"
          @choose-folder="_openFolderPicker"
          @dragover="_handleDragOver"
          @dragleave="_handleDragLeave"
          @drop="_handleDrop"
        )

    v-dialog(v-model="_isDialogOpen" max-width="960" persistent)
      v-card
        v-card-title.d-flex.align-center
          span.font-weight-medium {{ step === UploadDialogStep.Confirm ? '確認' : step === UploadDialogStep.Result ? '送信結果' : '説明入力' }}
          v-spacer
          v-btn(
            icon="mdi-close"
            variant="text"
            aria-label="Close upload dialog"
            :disabled="isLoading"
            @click="_cancelUpload"
          )
        v-card-text
          v-alert.mb-4.text-pre-wrap(type="error" variant="tonal" v-if="step !== UploadDialogStep.Result && _errorMessage") {{ _errorMessage }}
          v-alert.mb-4(type="success" variant="tonal" v-if="step !== UploadDialogStep.Result && _successMessage") {{ _successMessage }}

          UploadDescriptionStep(
            v-if="step === UploadDialogStep.Description"
            :target-type="_detectedTargetType"
            :target-name="_detectedTargetName"
            :file-entry-count="_fileEntryCount"
            :upload-change-types="_uploadChangeTypes"
            v-model:selected-change-types="_selectedChangeTypes"
            v-model:overview="_overview"
            v-model:change-details="_changeDetails"
            v-model:notes="_notes"
            v-model:has-confirmed-no-personal-information="_hasConfirmedNoPersonalInformation"
            v-model:has-agreed-distribution-policy="_hasAgreedDistributionPolicy"
          )

          UploadConfirmStep(
            v-else-if="step === UploadDialogStep.Confirm"
            :file-entries="fileEntries"
            :expanded-confirm-panels="_expandedConfirmPanels"
            :selected-folder-name="selectedFolderName"
            :file-size-text="_fileSizeText"
            :file-entry-count="_fileEntryCount"
            :target-type="_detectedTargetType"
            :target-name="_detectedTargetName"
            :selected-change-types="_selectedChangeTypes"
            :title="_title"
            :overview="_overview"
            :change-details="_changeDetails"
            :notes="_notes"
            @update:expanded-confirm-panels="_expandedConfirmPanels = $event"
          )

          UploadResultStep(
            v-else
            :result="_submitResult"
          )

        v-card-actions.px-6.pb-4
          v-btn(variant="tonal" :disabled="isLoading" @click="_cancelUpload") {{ step === UploadDialogStep.Result ? '閉じる' : 'キャンセル' }}
          v-spacer
          v-btn(variant="text" :disabled="isLoading" v-if="step === UploadDialogStep.Confirm" @click="_goBackToDescription") 戻る
          v-btn(color="primary" variant="tonal" :disabled="!canGoToConfirm" v-if="step === UploadDialogStep.Description" @click="_goToConfirm") 確認する
          v-btn(color="primary" :loading="isLoading" :disabled="!canGoToConfirm" v-if="step === UploadDialogStep.Confirm" @click="_submitUpload") アップロード
</template>
