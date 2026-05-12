<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import { type Target, useDownloadZip } from '@/composables/useDownloadZip';
import { toErrorMessageForDisplay } from '@/errors/errorMessage';
import type { DownloadListRow } from '@/features/downloads/downloadListModels';
import { buildGitHubBlobUrl, buildGitHubRawUrl } from '@/lib/githubUrl';

defineOptions({
  components: {
    CreateIssueDialog: defineAsyncComponent(() => import('./CreateIssueDialog.vue')),
    DownloadFileDialog: defineAsyncComponent(() => import('./DownloadFileDialog.vue')),
  },
});

defineProps<{
  rows: DownloadListRow[];
}>();

const emit = defineEmits<(e: 'error', message: string) => void>();

type DownloadListHeader = {
  title: string;
  key: 'name' | 'latestUpdatedAt' | 'actions';
  sortable: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
};

type DownloadListSortItem = {
  key: 'name' | 'latestUpdatedAt';
  order: 'asc' | 'desc';
};

type DownloadListSlotItem = DownloadListRow | { raw: DownloadListRow };

const _headers = computed<DownloadListHeader[]>(() => {
  return [
    { title: '名称', key: 'name', sortable: true, align: 'start' },
    { title: '最終更新日', key: 'latestUpdatedAt', sortable: true, align: 'start', width: '11rem' },
    { title: '', key: 'actions', sortable: false, align: 'end', width: '15rem' },
  ];
});

const _sortBy = ref<DownloadListSortItem[]>([{ key: 'name', order: 'asc' }]);
const _busyRowNames = ref<Set<string>>(new Set());
const _createIssueDialogModel = ref(false);
const _createIssueDialogPath = ref('');
const _downloadFileDialogModel = ref(false);
const _selectedFileDialogRow = ref<DownloadListRow | null>(null);

const { createZipFromTargets } = useDownloadZip({ maxConcurrentDownloads: 6 });

/**
 * @summary 指定行が処理中か判定する。
 * @param rowName 行名を指定する。
 * @returns 処理中であれば true を返す。
 */
const _isBusy = (rowName: string): boolean => {
  return _busyRowNames.value.has(rowName);
};

/**
 * @summary 指定行を処理中としてマークする。
 * @param rowName 行名を指定する。
 */
const _startBusy = (rowName: string): void => {
  const next = new Set(_busyRowNames.value);
  next.add(rowName);
  _busyRowNames.value = next;
};

/**
 * @summary 指定行の処理中マークを解除する。
 * @param rowName 行名を指定する。
 */
const _endBusy = (rowName: string): void => {
  const next = new Set(_busyRowNames.value);
  next.delete(rowName);
  _busyRowNames.value = next;
};

/**
 * @summary 不明な例外を画面表示向けメッセージへ変換する。
 * @param error 例外オブジェクトを指定する。
 * @returns 表示用メッセージを返す。
 */
const _resolveErrorMessage = (error: unknown): string => {
  return toErrorMessageForDisplay(error);
};

/**
 * @summary 一覧表示用に更新日時を整形する。
 * @param updatedAt 更新日時を指定する。
 * @returns 表示用文字列を返す。
 */
const _formatUpdatedAt = (updatedAt: Date | null): string => {
  if (!(updatedAt instanceof Date)) return '-';
  if (Number.isNaN(updatedAt.getTime())) return '-';
  return updatedAt.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * @summary v-data-table スロットから実行を解決する。
 * @param slotItem Vuetify が渡すスロット項目を指定する。
 * @returns ダウンロード一覧行を返す。
 */
const _resolveRow = (slotItem: DownloadListSlotItem): DownloadListRow => {
  if ('raw' in slotItem) {
    return slotItem.raw;
  }

  return slotItem;
};

/**
 * @summary ダウンロード対象一覧を生成する。
 * @param row 対象行を指定する。
 * @returns ダウンロード対象一覧を返す。
 */
const _generateDownloadTargets = (row: DownloadListRow): Target[] => {
  return row.items.map((item): Target => {
    const path = item.path ?? '';
    return {
      path,
      url: buildGitHubRawUrl(path),
    };
  });
};

/**
 * @summary GitHub 上のカテゴリフォルダーを別タブで開く。
 * @param row 対象行を指定する。
 */
const _openGitHubDirectory = (row: DownloadListRow): void => {
  const url = buildGitHubBlobUrl(row.directoryPath);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * @summary 報告ダイアログを開く。
 * @param row 対象行を指定する。
 */
const _openCreateIssueDialog = (row: DownloadListRow): void => {
  _createIssueDialogPath.value = row.directoryPath;
  _createIssueDialogModel.value = true;
};

/**
 * @summary ファイル一覧ダイアログを開く。
 * @param row 対象行を指定する。
 */
const _openDownloadFileDialog = (row: DownloadListRow): void => {
  _selectedFileDialogRow.value = row;
  _downloadFileDialogModel.value = true;
};

/**
 * @summary ファイル一覧ダイアログを閉じる。
 */
const _closeDownloadFileDialog = (): void => {
  _downloadFileDialogModel.value = false;
  _selectedFileDialogRow.value = null;
};

/**
 * @summary ダウンロードを実行する。
 * @param row 対象行を指定する。
 * @returns Promise<void> を返す。
 */
const _downloadRow = async (row: DownloadListRow): Promise<void> => {
  _startBusy(row.name);
  try {
    const blob = await createZipFromTargets(_generateDownloadTargets(row));
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
    emit('error', _resolveErrorMessage(error));
  } finally {
    _endBusy(row.name);
  }
};

/**
 * @summary CreateIssueDialog から受け取ったエラーを親へ通知する。
 * @param message エラーメッセージを指定する。
 */
const _handleCreateIssueDialogError = (message: string): void => {
  emit('error', message);
};
</script>

<template lang="pug">
div
  CreateIssueDialog(v-model="_createIssueDialogModel" :path="_createIssueDialogPath" @error="_handleCreateIssueDialogError")
  DownloadFileDialog(v-model="_downloadFileDialogModel" :row="_selectedFileDialogRow" @close="_closeDownloadFileDialog")

  v-data-table(:headers="_headers" :items="rows" item-value="name" v-model:sort-by="_sortBy" hide-default-footer items-per-page="-1")
    template(v-slot:item.latestUpdatedAt="{ item }")
      span.text-body-2 {{ _formatUpdatedAt(_resolveRow(item).latestUpdatedAt) }}

    template(v-slot:item.actions="{ item }")
      div.d-flex.flex-nowrap.text-no-wrap.justify-end.ga-2.py-2
        v-tooltip(location="top")
          template(v-slot:activator="{ props: tooltipProps }")
            v-btn(
              v-bind="tooltipProps"
              size="small"
              variant="outlined"
              color="primary"
              :disabled="_isBusy(_resolveRow(item).name)"
              @click="_openDownloadFileDialog(_resolveRow(item))"
            ) ファイル一覧
          span ファイル一覧を表示する
        v-tooltip(location="top")
          template(v-slot:activator="{ props: tooltipProps }")
            v-btn(
              v-bind="tooltipProps"
              size="small"
              variant="outlined"
              color="primary"
              :disabled="_isBusy(_resolveRow(item).name)"
              @click="_openGitHubDirectory(_resolveRow(item))"
            ) フォルダを見る
          span GitHubでフォルダを開く
        v-tooltip(location="top")
          template(v-slot:activator="{ props: tooltipProps }")
            v-btn(
              v-bind="tooltipProps"
              size="small"
              color="error"
              :disabled="_isBusy(_resolveRow(item).name)"
              @click="_openCreateIssueDialog(_resolveRow(item))"
            ) 報告
          span 問題を報告する
        v-tooltip(location="top")
          template(v-slot:activator="{ props: tooltipProps }")
            v-btn(
              v-bind="tooltipProps"
              size="small"
              color="primary"
              :disabled="_isBusy(_resolveRow(item).name)"
              :loading="_isBusy(_resolveRow(item).name)"
              @click="_downloadRow(_resolveRow(item))"
            ) DL
          span 翻訳ファイル一式を ZIP でダウンロードする

    template(v-slot:no-data)
      v-alert.my-4(type="info" variant="tonal") 表示できる項目がありません。
</template>
