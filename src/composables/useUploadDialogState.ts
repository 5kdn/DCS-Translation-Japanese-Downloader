import { computed, ref } from 'vue';
import type {
  UploadChangeType,
  UploadDialogEntry,
  UploadDialogSelectedFile,
  UploadTargetType,
} from '@/features/upload/uploadDialogDomain';
import { DEFAULT_CHANGE_DETAILS, DEFAULT_NOTES } from '@/features/upload/uploadDialogDomain';
import type { UploadReadmeMode, UploadReadmeSource } from '@/features/upload/uploadDialogReadme';
import { isReadmeTextValid } from '@/features/upload/uploadDialogReadme';

export const UploadDialogStep = {
  Idle: 1,
  Readme: 2,
  Description: 3,
  Confirm: 4,
  Result: 5,
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
  const readmeMode = ref<UploadReadmeMode | null>(null);
  const readmePath = ref('');
  const readmeRawUrl = ref<string | null>(null);
  const readmeSource = ref<UploadReadmeSource>('template');
  const readmeInitialText = ref('');
  const readmeEditedText = ref('');
  const readmeNoticeMessage = ref<string | null>(null);
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

  const readmeDownloadUrl = computed((): string => {
    return `data:text/plain;charset=utf-8,${encodeURIComponent(readmeEditedText.value)}`;
  });

  const isReadmeStepValid = computed((): boolean => {
    if (readmeMode.value !== 'create') return true;
    return isReadmeTextValid(readmeSource.value, readmeInitialText.value, readmeEditedText.value);
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
   * @summary README関連状態を設定する。
   * @param mode README確認モードを指定する。
   * @param path READMEファイルパスを指定する。
   * @param source README初期値の取得元を指定する。
   * @param initialText README初期本文を指定する。
   * @param rawUrl READMEダウンロードURLを指定する。
   */
  const setReadmeState = (
    mode: UploadReadmeMode,
    path: string,
    source: UploadReadmeSource,
    initialText: string,
    rawUrl: string | null = null,
  ): void => {
    readmeMode.value = mode;
    readmePath.value = path;
    readmeRawUrl.value = rawUrl;
    readmeSource.value = source;
    readmeInitialText.value = initialText;
    readmeEditedText.value = initialText;
  };

  /**
   * @summary README確認モードだけを更新する。
   * @param mode README確認モードを指定する。
   */
  const setReadmeMode = (mode: UploadReadmeMode): void => {
    readmeMode.value = mode;
  };

  /**
   * @summary README入力値を初期値へ戻す。
   */
  const resetReadmeEditedText = (): void => {
    readmeEditedText.value = readmeInitialText.value;
  };

  /**
   * @summary README用通知メッセージを設定する。
   * @param message 表示用メッセージを指定する。
   */
  const setReadmeNoticeMessage = (message: string): void => {
    readmeNoticeMessage.value = message;
  };

  /**
   * @summary README用通知メッセージを初期化する。
   */
  const clearReadmeNoticeMessage = (): void => {
    readmeNoticeMessage.value = null;
  };

  /**
   * @summary 生成したREADMEを送信対象へ追加する。
   * @param path READMEファイルパスを指定する。
   * @param content README本文を指定する。
   */
  const appendGeneratedReadmeFile = (path: string, content: string): void => {
    const file = new File([content], 'README_Translation.md', { type: 'text/markdown' });
    const entry: UploadDialogEntry = { path, isDirectory: false };
    const selectedFile: UploadDialogSelectedFile = { path, file };
    const existingEntryIndex = fileEntries.value.findIndex(
      (targetEntry: UploadDialogEntry): boolean => targetEntry.path === path,
    );
    const existingSelectedFileIndex = selectedFiles.value.findIndex(
      (targetSelectedFile: UploadDialogSelectedFile): boolean => targetSelectedFile.path === path,
    );

    if (existingEntryIndex >= 0) {
      fileEntries.value.splice(existingEntryIndex, 1, entry);
    } else {
      fileEntries.value = [...fileEntries.value, entry].sort((left: UploadDialogEntry, right: UploadDialogEntry): number =>
        left.path.localeCompare(right.path, undefined, { numeric: true }),
      );
      entries.value = [...entries.value, entry].sort((left: UploadDialogEntry, right: UploadDialogEntry): number =>
        left.path.localeCompare(right.path, undefined, { numeric: true }),
      );
      fileEntryCount.value += 1;
      selectedFolderSize.value += file.size;
    }

    if (existingSelectedFileIndex >= 0) {
      const previousFileSize = selectedFiles.value[existingSelectedFileIndex]?.file.size ?? 0;
      selectedFiles.value.splice(existingSelectedFileIndex, 1, selectedFile);
      selectedFolderSize.value = Math.max(0, selectedFolderSize.value + file.size - previousFileSize);
      return;
    }

    selectedFiles.value = [...selectedFiles.value, selectedFile].sort(
      (left: UploadDialogSelectedFile, right: UploadDialogSelectedFile): number =>
        left.path.localeCompare(right.path, undefined, { numeric: true }),
    );
  };

  /**
   * @summary 生成したREADMEを送信対象から除外する。
   * @param path READMEファイルパスを指定する。
   */
  const removeGeneratedReadmeFile = (path: string): void => {
    const existingEntryIndex = fileEntries.value.findIndex(
      (targetEntry: UploadDialogEntry): boolean => targetEntry.path === path,
    );
    const existingSelectedFileIndex = selectedFiles.value.findIndex(
      (targetSelectedFile: UploadDialogSelectedFile): boolean => targetSelectedFile.path === path,
    );
    if (existingEntryIndex < 0 && existingSelectedFileIndex < 0) return;

    const removedSelectedFile = existingSelectedFileIndex >= 0 ? selectedFiles.value[existingSelectedFileIndex] : null;

    if (existingEntryIndex >= 0) {
      fileEntries.value.splice(existingEntryIndex, 1);
      const existingEntriesIndex = entries.value.findIndex(
        (targetEntry: UploadDialogEntry): boolean => targetEntry.path === path,
      );
      if (existingEntriesIndex >= 0) entries.value.splice(existingEntriesIndex, 1);
      fileEntryCount.value = Math.max(0, fileEntryCount.value - 1);
    }

    if (existingSelectedFileIndex >= 0) {
      selectedFiles.value.splice(existingSelectedFileIndex, 1);
    }

    if (removedSelectedFile !== null) {
      selectedFolderSize.value = Math.max(0, selectedFolderSize.value - removedSelectedFile.file.size);
    }
  };

  /**
   * @summary README関連状態を初期化する。
   */
  const clearReadmeState = (): void => {
    readmeMode.value = null;
    readmePath.value = '';
    readmeRawUrl.value = null;
    readmeSource.value = 'template';
    readmeInitialText.value = '';
    readmeEditedText.value = '';
    clearReadmeNoticeMessage();
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
    clearReadmeState();
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
    clearReadmeState();
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
    readmeMode,
    readmePath,
    readmeRawUrl,
    readmeSource,
    readmeInitialText,
    readmeEditedText,
    readmeNoticeMessage,
    hasConfirmedNoPersonalInformation,
    hasAgreedDistributionPolicy,
    errorMessage,
    successMessage,
    title,
    description,
    fileSizeText,
    readmeDownloadUrl,
    isReadmeStepValid,
    canGoToConfirm,
    clearNotifications,
    setErrorMessage,
    setSuccessMessage,
    setReadmeState,
    setReadmeMode,
    resetReadmeEditedText,
    setReadmeNoticeMessage,
    clearReadmeNoticeMessage,
    appendGeneratedReadmeFile,
    removeGeneratedReadmeFile,
    clearReadmeState,
    applySelectedUpload,
    clearSelectedUpload,
    resetState,
  };
};
