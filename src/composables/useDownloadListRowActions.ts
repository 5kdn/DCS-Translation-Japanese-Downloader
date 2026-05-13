import { type ComputedRef, computed, ref } from 'vue';
import { type Target, useDownloadZip } from '@/composables/useDownloadZip';
import { toErrorMessageForDisplay } from '@/errors/errorMessage';
import type { DownloadListRow } from '@/features/downloads/downloadListModels';
import { buildGitHubBlobUrl, buildGitHubRawUrl } from '@/lib/githubUrl';

type DownloadListRowActionsOptions = {
  onError: (message: string) => void;
};

type DownloadListRowActions = {
  createIssueDialogModel: ComputedRef<boolean>;
  createIssueDialogPath: ComputedRef<string>;
  downloadFileDialogModel: ComputedRef<boolean>;
  selectedFileDialogRow: ComputedRef<DownloadListRow | null>;
  isDownloading: (rowName: string) => boolean;
  isActionLocked: (rowName: string) => boolean;
  openGitHubDirectory: (row: DownloadListRow) => void;
  openCreateIssueDialog: (row: DownloadListRow) => void;
  closeCreateIssueDialog: () => void;
  openDownloadFileDialog: (row: DownloadListRow) => void;
  closeDownloadFileDialog: () => void;
  downloadRow: (row: DownloadListRow) => Promise<void>;
};

/**
 * @summary ダウンロード一覧の行操作状態と外部連携を管理する。
 * @param options エラー通知ハンドラーを指定する。
 * @returns 行操作用の状態とコマンドを返す。
 */
export const useDownloadListRowActions = (options: DownloadListRowActionsOptions): DownloadListRowActions => {
  const busyRowNames = ref<Set<string>>(new Set());
  const createIssueDialogRowName = ref<string | null>(null);
  const createIssueDialogPath = ref('');
  const selectedFileDialogRow = ref<DownloadListRow | null>(null);
  const { createZipFromTargets } = useDownloadZip({ maxConcurrentDownloads: 6 });

  /**
   * @summary 指定行を処理中としてマークする。
   * @param rowName 行名を指定する。
   */
  const startBusy = (rowName: string): void => {
    const next = new Set(busyRowNames.value);
    next.add(rowName);
    busyRowNames.value = next;
  };

  /**
   * @summary 指定行の処理中マークを解除する。
   * @param rowName 行名を指定する。
   */
  const endBusy = (rowName: string): void => {
    const next = new Set(busyRowNames.value);
    next.delete(rowName);
    busyRowNames.value = next;
  };

  /**
   * @summary 不明な例外を画面表示向けメッセージへ変換する。
   * @param error 例外オブジェクトを指定する。
   * @returns 表示用メッセージを返す。
   */
  const resolveErrorMessage = (error: unknown): string => {
    return toErrorMessageForDisplay(error);
  };

  /**
   * @summary ダウンロード対象一覧を生成する。
   * @param row 対象行を指定する。
   * @returns ダウンロード対象一覧を返す。
   */
  const generateDownloadTargets = (row: DownloadListRow): Target[] => {
    return row.items.map((item): Target => {
      const path = item.path ?? '';
      return {
        path,
        url: buildGitHubRawUrl(path),
      };
    });
  };

  const createIssueDialogModel = computed<boolean>(() => createIssueDialogRowName.value !== null);
  const downloadFileDialogModel = computed<boolean>(() => selectedFileDialogRow.value !== null);
  const isDownloading = (rowName: string): boolean => {
    return busyRowNames.value.has(rowName);
  };
  const isActionLocked = (rowName: string): boolean => {
    if (isDownloading(rowName)) return true;
    if (createIssueDialogRowName.value === rowName) return true;
    return selectedFileDialogRow.value?.name === rowName;
  };

  /**
   * @summary GitHub 上のカテゴリフォルダーを別タブで開く。
   * @param row 対象行を指定する。
   */
  const openGitHubDirectory = (row: DownloadListRow): void => {
    const url = buildGitHubBlobUrl(row.directoryPath);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /**
   * @summary 報告ダイアログを開く。
   * @param row 対象行を指定する。
   */
  const openCreateIssueDialog = (row: DownloadListRow): void => {
    createIssueDialogRowName.value = row.name;
    createIssueDialogPath.value = row.directoryPath;
  };

  /**
   * @summary 報告ダイアログを閉じる。
   */
  const closeCreateIssueDialog = (): void => {
    createIssueDialogRowName.value = null;
    createIssueDialogPath.value = '';
  };

  /**
   * @summary ファイル一覧ダイアログを開く。
   * @param row 対象行を指定する。
   */
  const openDownloadFileDialog = (row: DownloadListRow): void => {
    selectedFileDialogRow.value = row;
  };

  /**
   * @summary ファイル一覧ダイアログを閉じる。
   */
  const closeDownloadFileDialog = (): void => {
    selectedFileDialogRow.value = null;
  };

  /**
   * @summary ダウンロードを実行する。
   * @param row 対象行を指定する。
   * @returns Promise<void> を返す。
   */
  const downloadRow = async (row: DownloadListRow): Promise<void> => {
    startBusy(row.name);
    try {
      const blob = await createZipFromTargets(generateDownloadTargets(row));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${row.name}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout((): void => URL.revokeObjectURL(url), 500);
    } catch (error: unknown) {
      console.error(error);
      options.onError(resolveErrorMessage(error));
    } finally {
      endBusy(row.name);
    }
  };

  return {
    createIssueDialogModel,
    createIssueDialogPath: computed(() => createIssueDialogPath.value),
    downloadFileDialogModel,
    selectedFileDialogRow: computed(() => selectedFileDialogRow.value),
    isDownloading,
    isActionLocked,
    openGitHubDirectory,
    openCreateIssueDialog,
    closeCreateIssueDialog,
    openDownloadFileDialog,
    closeDownloadFileDialog,
    downloadRow,
  };
};
