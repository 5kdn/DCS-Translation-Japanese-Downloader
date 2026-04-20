<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
// biome-ignore lint/correctness/noUnusedImports: used in Vue template
import userMissionReadmeTranslationTemplateUrl from '@/assets/user_mission_README_Translation_template.md?url';
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

type TreeItem = {
  id: number;
  title: string;
  remarks?: string;
  isFile?: boolean;
  children?: TreeItem[];
};

type DirectorySample = {
  label: string;
  message: string;
  files: TreeItem[];
};

const aircraftTree: TreeItem[] = [
  {
    id: 0,
    title: 'DCSWorld',
    remarks: 'DCSインストールフォルダーから同じ構成でフォルダーを作成してください',
    children: [
      {
        id: 1,
        title: 'Mods',
        children: [
          {
            id: 2,
            title: 'aircraft',
            children: [
              {
                id: 3,
                title: 'Su-25T',
                remarks: '一度のアップロードには１つの機体だけをアップロードしてください',
                children: [
                  {
                    id: 4,
                    title: 'Missions',
                    children: [
                      {
                        id: 5,
                        title: 'Single',
                        children: [
                          { id: 6, title: 'localization.lua', isFile: true },
                          {
                            id: 7,
                            title: 'Su-25T - Anti-Radar Missiles Practice.miz',
                            remarks: 'mizファイルと同じ名前でフォルダーを作成してください',
                            children: [
                              {
                                id: 8,
                                title: 'l10n',
                                children: [
                                  {
                                    id: 9,
                                    title: 'JP',
                                    children: [
                                      {
                                        id: 10,
                                        title: 'dictionary',
                                        remarks: '自身が修正したファイルだけをアップロードしてください',
                                        isFile: true,
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                          {
                            id: 11,
                            title: 'Su-25T - Close Down Kopitnari.miz',
                            children: [
                              {
                                id: 12,
                                title: 'l10n',
                                children: [{ id: 13, title: 'JP', children: [{ id: 14, title: 'dictionary', isFile: true }] }],
                              },
                            ],
                          },
                          { id: 99, title: '...', isFile: false },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const campaignsTree: TreeItem[] = [
  {
    id: 0,
    title: 'DCSWorld',
    remarks: 'DCSインストールフォルダーから同じ構成でフォルダーを作成してください',
    children: [
      {
        id: 1,
        title: 'Mods',
        children: [
          {
            id: 2,
            title: 'campaigns',
            children: [
              {
                id: 3,
                title: 'A-10C The Enemy Within 3',
                remarks: '一度のアップロードには１つのDLCキャンペーンをアップロードしてください',
                children: [
                  { id: 4, title: 'TEW3.cmp', isFile: true },
                  {
                    id: 5,
                    title: 'TEW3 M01 FINAL.miz',
                    remarks: 'mizファイルと同じ名前でフォルダーを作成してください',
                    children: [
                      {
                        id: 6,
                        title: 'l10n',
                        children: [
                          {
                            id: 7,
                            title: 'JP',
                            children: [
                              {
                                id: 8,
                                title: 'dictionary',
                                remarks: '自身が修正したファイルだけをアップロードしてください',
                                isFile: true,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 9,
                    title: 'TEW3 M02 FINAL.miz',
                    children: [
                      {
                        id: 10,
                        title: 'l10n',
                        children: [{ id: 11, title: 'JP', children: [{ id: 12, title: 'dictionary', isFile: true }] }],
                      },
                    ],
                  },
                  { id: 99, title: '...', isFile: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const UserMissionsTree: TreeItem[] = [
  {
    id: 0,
    title: 'UserMissions',
    remarks: '%USERPROFILE%/Saved Games/DCS/Missions から同じ構成でフォルダーを作成してください',
    children: [
      {
        id: 1,
        title: 'Campaigns',
        children: [
          {
            id: 2,
            title: 'Operation Black Knight',
            remarks: 'ミッション/キャンペーンと同じ名前のフォルダを作成してください',
            children: [
              {
                id: 3,
                title: 'README_Translation.md',
                remarks: 'オリジナルファイルが何か確認できるファイルを作成してください（フォーマット指定有り）',
                isFile: true,
              },
              {
                id: 4,
                title: '01 - Operation Black Knight - Mission 1.miz',
                remarks: 'mizファイルと同じ名前でフォルダーを作成してください',
                children: [
                  {
                    id: 5,
                    title: 'l10n',
                    children: [
                      {
                        id: 6,
                        title: 'JP',
                        children: [
                          {
                            id: 7,
                            title: 'dictionary',
                            remarks: '自身が修正したファイルだけをアップロードしてください',
                            isFile: true,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 8,
                title: '02 - Operation Black Knight - Mission 2.miz',
                children: [
                  {
                    id: 9,
                    title: 'l10n',
                    children: [{ id: 10, title: 'JP', children: [{ id: 11, title: 'dictionary', isFile: true }] }],
                  },
                ],
              },
              { id: 99, title: '...', isFile: false },
            ],
          },
        ],
      },
    ],
  },
];

const _directorySamples: DirectorySample[] = [
  {
    label: '機体',
    message: 'Su-25Tのシングルミッションをアップロードする例\nフォルダー構成は実際の機体のフォルダー構成と一致させてください。',
    files: aircraftTree,
  },
  {
    label: 'DLCキャンペーン',
    message:
      'A-10C The Enemy Within 3.0をアップロードする例\nフォルダー構成は実際のキャンペーンのフォルダー構成と一致させてください。',
    files: campaignsTree,
  },
  {
    label: 'ユーザーミッション',
    message: 'Operation Black Knight キャンペーンをアップロードする例',
    files: UserMissionsTree,
  },
];
</script>

<template lang="pug">
v-container
  div
    h2.d-inline-flex.align-start.text-display-large.mt-10.mb-5 Upload

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
        p フォルダーを選択し、サーバーにアップロードします。
        ul
          li: p
            | 選択するフォルダーは&nbsp;
            b DCSWorld
            | &nbsp;または&nbsp;
            b UserMissions
            | &nbsp;フォルダー自体である必要があります。
          li: p
            | フォルダー構成は
            a(href="https://github.com/5kdn/DCS-Translation-Japanese" target="_blank" rel="noopener noreferrer" @click.stop) 5kdn/DCS-Translation-Japanese
            | リポジトリに合わせて作成してください。
          li: p 1回のアップロードには、1つの機体、DLCキャンペーン、ユーザーミッション、またはユーザーキャンペーンだけを含めてください。
          li
            p.d-inline-block.align-center.my-0
              | ユーザーミッションの翻訳を新規アップロードする際は、オリジナルが確認できるファイル(README_Translation.md)を追加してください
              v-btn.ml-2(color="secondary" prepend-icon="mdi-download" density="compact" :href="userMissionReadmeTranslationTemplateUrl" download="README_Translation.md") テンプレートをダウンロード

        v-divider
        p フォルダー構成例
        p.directory-configuration-hint.text-medium-emphasis 各項目をクリックすると構成例を表示します。
        ul.d-flex.ga-4.pa-0
          li(v-for="sample in _directorySamples" :index="sample.label" style="list-style: none;")
            v-tooltip(interactive :open-on-hover="false" open-on-click)
              template(v-slot:activator="{props}")
                v-chip(variant="tonal" color="primary" v-bind="props") {{ sample.label }}
              div
                p {{ sample.message }}
                v-treeview.rounded.text-body-2(
                  :items="sample.files"
                  density="compact"
                  item-value="id"
                  open-all
                  open-on-click
                  hide-actions
                  indent-lines
                )
                  template(v-slot:prepend="{item}")
                    v-icon(size="small" :icon="item.isFile ? 'mdi-file-document' : 'mdi-folder-open'")
                  template(v-slot:title="{item}")
                    span.d-inline-flex.align-center.flex-wrap.ga-1.py-0
                      span.text-body-2 {{ item.title }}
                      span.text-medium-emphasis.text-caption.ms-4(v-if="item.remarks") {{ item.remarks }}

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

<style scoped lang="scss">
.directory-configuration-hint {
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}
</style>
