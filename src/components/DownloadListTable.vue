<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import { useDownloadListRowActions } from '@/composables/useDownloadListRowActions';
import type { DownloadListRow } from '@/features/downloads/downloadListModels';

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
const _rowActions = useDownloadListRowActions({
  onError: (message: string): void => {
    emit('error', message);
  },
});

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
 * @summary CreateIssueDialog から受け取ったエラーを親へ通知する。
 * @param message エラーメッセージを指定する。
 */
const _handleCreateIssueDialogError = (message: string): void => {
  emit('error', message);
};

/**
 * @summary 報告ダイアログの表示状態更新を処理する。
 * @param value 更新後の表示状態を指定する。
 */
const _handleCreateIssueDialogModelUpdate = (value: boolean): void => {
  if (!value) {
    _rowActions.closeCreateIssueDialog();
  }
};

/**
 * @summary ファイル一覧ダイアログの表示状態更新を処理する。
 * @param value 更新後の表示状態を指定する。
 */
const _handleDownloadFileDialogModelUpdate = (value: boolean): void => {
  if (!value) {
    _rowActions.closeDownloadFileDialog();
  }
};
</script>

<template lang="pug">
div
  CreateIssueDialog(
    :model-value="_rowActions.createIssueDialogModel.value"
    :path="_rowActions.createIssueDialogPath.value"
    @update:model-value="_handleCreateIssueDialogModelUpdate"
    @close="_rowActions.closeCreateIssueDialog"
    @error="_handleCreateIssueDialogError"
  )
  DownloadFileDialog(
    :model-value="_rowActions.downloadFileDialogModel.value"
    :row="_rowActions.selectedFileDialogRow.value"
    @update:model-value="_handleDownloadFileDialogModelUpdate"
    @close="_rowActions.closeDownloadFileDialog"
  )

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
              :disabled="_rowActions.isActionLocked(_resolveRow(item).name)"
              @click="_rowActions.openDownloadFileDialog(_resolveRow(item))"
            ) ファイル一覧
          span ファイル一覧を表示する
        v-tooltip(location="top")
          template(v-slot:activator="{ props: tooltipProps }")
            v-btn(
              v-bind="tooltipProps"
              size="small"
              variant="outlined"
              color="primary"
              :disabled="_rowActions.isActionLocked(_resolveRow(item).name)"
              @click="_rowActions.openGitHubDirectory(_resolveRow(item))"
            ) フォルダを見る
          span GitHubでフォルダを開く
        v-tooltip(location="top")
          template(v-slot:activator="{ props: tooltipProps }")
            v-btn(
              v-bind="tooltipProps"
              size="small"
              color="error"
              :disabled="_rowActions.isActionLocked(_resolveRow(item).name)"
              @click="_rowActions.openCreateIssueDialog(_resolveRow(item))"
            ) 報告
          span 問題を報告する
        v-tooltip(location="top")
          template(v-slot:activator="{ props: tooltipProps }")
            v-btn(
              v-bind="tooltipProps"
              size="small"
              color="primary"
              :disabled="_rowActions.isActionLocked(_resolveRow(item).name)"
              :loading="_rowActions.isDownloading(_resolveRow(item).name)"
              @click="_rowActions.downloadRow(_resolveRow(item))"
            ) DL
          span 翻訳ファイル一式を ZIP でダウンロードする

    template(v-slot:no-data)
      v-alert.my-4(type="info" variant="tonal") 表示できる項目がありません。
</template>
