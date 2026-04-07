import { computed, ref } from 'vue';
import type {
  UploadChangeType,
  UploadDialogEntry,
  UploadDialogSelectedFile,
  UploadTargetType,
} from '@/features/upload/uploadDialogDomain';
import { DEFAULT_CHANGE_DETAILS, DEFAULT_NOTES } from '@/features/upload/uploadDialogDomain';

export const UploadDialogStep = {
  Idle: 1,
  Description: 2,
  Confirm: 3,
  Result: 4,
} as const;

export type UploadDialogStep = (typeof UploadDialogStep)[keyof typeof UploadDialogStep];

type SelectedUploadData = {
  folderName: string;
  totalSize: number;
  entries: UploadDialogEntry[];
  fileEntries: UploadDialogEntry[];
  selectedFiles: UploadDialogSelectedFile[];
  fileCount: number;
  targetType: UploadTargetType;
  targetName: string;
};

/**
 * @summary アップロードダイアログの状態を管理する。
 * @returns ダイアログ状態と操作関数を返す。
 */
export const useUploadDialogState = () => {
  const folderInput = ref<HTMLInputElement | null>(null);
  const isDialogOpen = ref(false);
  const isLoading = ref(false);
  const isDragOver = ref(false);
  const step = ref<UploadDialogStep>(UploadDialogStep.Idle);
  const selectedFolderName = ref<string | null>(null);
  const selectedFolderSize = ref(0);
  const entries = ref<UploadDialogEntry[]>([]);
  const fileEntries = ref<UploadDialogEntry[]>([]);
  const selectedFiles = ref<UploadDialogSelectedFile[]>([]);
  const fileEntryCount = ref(0);
  const detectedTargetType = ref<UploadTargetType | null>(null);
  const detectedTargetName = ref('');
  const expandedConfirmPanels = ref<number[]>([0]);
  const selectedChangeTypes = ref<UploadChangeType[]>([]);
  const overview = ref('');
  const changeDetails = ref(DEFAULT_CHANGE_DETAILS);
  const notes = ref(DEFAULT_NOTES);
  const hasConfirmedNoPersonalInformation = ref(false);
  const hasAgreedDistributionPolicy = ref(false);
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const title = computed((): string => {
    const changeSummary = selectedChangeTypes.value.join('/');
    if (detectedTargetType.value === null || detectedTargetName.value.trim() === '' || changeSummary === '') return '';
    return `[${detectedTargetType.value}][${detectedTargetName.value.trim()}]${changeSummary}`;
  });

  const description = computed((): string => {
    const sections = [
      '## 概要',
      overview.value.trim(),
      '',
      '## 変更内容',
      changeDetails.value.trim(),
      '',
      '## 留意点',
      notes.value.trim(),
    ];
    return sections.join('\n');
  });

  const fileSizeText = computed((): string => {
    const size = selectedFolderSize.value;
    if (size <= 0) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  });

  const canGoToConfirm = computed(
    (): boolean =>
      detectedTargetType.value !== null &&
      selectedChangeTypes.value.length > 0 &&
      detectedTargetName.value.trim().length > 0 &&
      overview.value.trim().length > 0 &&
      changeDetails.value.trim().length > 0 &&
      notes.value.trim().length > 0 &&
      hasConfirmedNoPersonalInformation.value &&
      hasAgreedDistributionPolicy.value &&
      title.value.trim().length > 0 &&
      description.value.trim().length > 0 &&
      !isLoading.value,
  );

  /**
   * @summary 通知メッセージを初期化する。
   */
  const clearNotifications = (): void => {
    errorMessage.value = null;
    successMessage.value = null;
  };

  /**
   * @summary エラーメッセージを設定する。
   * @param message 表示用メッセージを指定する。
   */
  const setErrorMessage = (message: string): void => {
    errorMessage.value = message;
    successMessage.value = null;
  };

  /**
   * @summary 成功メッセージを設定する。
   * @param message 表示用メッセージを指定する。
   */
  const setSuccessMessage = (message: string): void => {
    successMessage.value = message;
    errorMessage.value = null;
  };

  /**
   * @summary 解析済みの選択結果を状態へ反映する。
   * @param selectedUploadData 反映対象のアップロード情報を指定する。
   */
  const applySelectedUpload = (selectedUploadData: SelectedUploadData): void => {
    entries.value = selectedUploadData.entries;
    fileEntries.value = selectedUploadData.fileEntries;
    selectedFiles.value = selectedUploadData.selectedFiles;
    fileEntryCount.value = selectedUploadData.fileCount;
    detectedTargetType.value = selectedUploadData.targetType;
    detectedTargetName.value = selectedUploadData.targetName;
    selectedFolderName.value = selectedUploadData.folderName;
    selectedFolderSize.value = selectedUploadData.totalSize;
    step.value = UploadDialogStep.Description;
    isDialogOpen.value = true;
  };

  /**
   * @summary 選択済みアップロード情報を破棄する。
   */
  const clearSelectedUpload = (): void => {
    selectedFolderName.value = null;
    selectedFolderSize.value = 0;
    entries.value = [];
    fileEntries.value = [];
    selectedFiles.value = [];
    fileEntryCount.value = 0;
    detectedTargetType.value = null;
    detectedTargetName.value = '';
    step.value = UploadDialogStep.Idle;
  };

  /**
   * @summary ダイアログ状態を初期化する。
   */
  const resetState = (): void => {
    isDialogOpen.value = false;
    clearSelectedUpload();
    expandedConfirmPanels.value = [0];
    selectedChangeTypes.value = [];
    overview.value = '';
    changeDetails.value = DEFAULT_CHANGE_DETAILS;
    notes.value = DEFAULT_NOTES;
    hasConfirmedNoPersonalInformation.value = false;
    hasAgreedDistributionPolicy.value = false;
    clearNotifications();
    isDragOver.value = false;
    if (folderInput.value !== null) folderInput.value.value = '';
  };

  return {
    folderInput,
    isDialogOpen,
    isLoading,
    isDragOver,
    step,
    selectedFolderName,
    selectedFolderSize,
    entries,
    fileEntries,
    selectedFiles,
    fileEntryCount,
    detectedTargetType,
    detectedTargetName,
    expandedConfirmPanels,
    selectedChangeTypes,
    overview,
    changeDetails,
    notes,
    hasConfirmedNoPersonalInformation,
    hasAgreedDistributionPolicy,
    errorMessage,
    successMessage,
    title,
    description,
    fileSizeText,
    canGoToConfirm,
    clearNotifications,
    setErrorMessage,
    setSuccessMessage,
    applySelectedUpload,
    clearSelectedUpload,
    resetState,
  };
};
