<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { type Target, useDownloadZip } from '@/composables/useDownloadZip';
import { toErrorMessageForDisplay } from '@/errors/errorMessage';
import type { DownloadItemRequirement } from '@/types/type';

defineOptions({
  components: {
    Button: defineAsyncComponent(() => import('./common/Button.vue')),
    CreateIssueDialog: defineAsyncComponent(() => import('./CreateIssueDialog.vue')),
  },
});

defineProps<{
  items: DownloadItemRequirement[];
}>();

const emit = defineEmits<(e: 'error', message: string) => void>();

const busyItemNames = ref<Set<string>>(new Set());
const createIssueDialogModel = ref(false);
const createIssueDialogPath = ref('');

const { createZipFromTargets } = useDownloadZip({ maxConcurrentDownloads: 6 });

/**
 * @summary 指定カテゴリが処理中か判定する。
 * @param itemName カテゴリ名を指定する。
 * @returns 処理中であれば true を返す。
 */
const _isBusy = (itemName: string): boolean => {
  return busyItemNames.value.has(itemName);
};

/**
 * @summary 指定カテゴリを処理中としてマークする。
 * @param itemName カテゴリ名を指定する。
 */
const startBusy = (itemName: string): void => {
  const next = new Set(busyItemNames.value);
  next.add(itemName);
  busyItemNames.value = next;
};

/**
 * @summary 指定カテゴリの処理中マークを解除する。
 * @param itemName カテゴリ名を指定する。
 */
const endBusy = (itemName: string): void => {
  const next = new Set(busyItemNames.value);
  next.delete(itemName);
  busyItemNames.value = next;
};

/**
 * @summary Issue 作成ダイアログに渡すパスを解決する。
 * @description カテゴリ名が含まれる位置までのパスを優先して返す。
 * @param item 対象カテゴリを指定する。
 * @returns ダイアログ表示用のパスを返す。
 */
const resolveDirectoryPath = (item: DownloadItemRequirement): string => {
  const title = item.name ?? '';
  const basePath = item.items?.[0]?.path ?? '';
  if (!title || basePath.length === 0) return title || basePath;
  const idx = basePath.indexOf(title);
  return idx >= 0 ? basePath.slice(0, idx + title.length) : basePath;
};

/**
 * @summary 例外を画面表示向けメッセージへ変換する。
 * @param error 例外オブジェクトを指定する。
 * @returns 表示用メッセージを返す。
 */
const resolveErrorMessage = (error: unknown): string => toErrorMessageForDisplay(error);

/**
 * @summary アップロード日時をローカル時間で整形する。
 * @param updatedAt アップロード日時を指定する。
 * @returns 表示用の日時文字列を返す。
 */
const formatUpdatedAt = (updatedAt?: unknown): string => {
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
 * @summary カテゴリ内で最も新しい更新日時を取得する。
 * @param item 対象カテゴリを指定する。
 * @returns 表示用の日時文字列を返す。
 */
const _resolveLatestUpdatedAt = (item: DownloadItemRequirement): string => {
  const latest = item.items
    .map((treeItem) => treeItem.updatedAt)
    .filter((updatedAt): updatedAt is Date => updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  return formatUpdatedAt(latest);
};

/**
 * @summary 報告ボタン押下時の処理。
 */
const _CreateIssueDialogButtonClickCommand = async (item: DownloadItemRequirement): Promise<void> => {
  startBusy(item.name);
  try {
    createIssueDialogPath.value = resolveDirectoryPath(item);
    createIssueDialogModel.value = true;
  } catch (err: unknown) {
    console.error(err);
    const message = resolveErrorMessage(err);
    emit('error', message);
  } finally {
    endBusy(item.name);
  }
};

/**
 * @summary DLボタン押下時の処理。
 */
const _DownloadButtonClickCommand = async (item: DownloadItemRequirement): Promise<void> => {
  startBusy(item.name);
  try {
    const targets: Target[] = item.items.map((treeItem: (typeof item.items)[number]): Target => {
      return generateDownloadUrl(treeItem.path ?? '');
    });

    const blob = await createZipFromTargets(targets);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout((): void => URL.revokeObjectURL(url), 500);
  } catch (err: unknown) {
    console.error(err);
    const message = resolveErrorMessage(err);
    emit('error', message);
  } finally {
    endBusy(item.name);
  }
};

/**
 * @summary GitHub上の対象ファイルを別タブで開く。
 * @param path リポジトリ内のパスを指定する。
 * @throws 環境変数が未設定の場合は例外を投げる。
 */
const _NavToGitHubSourceFileCommand = (path: string): void => {
  const owner = import.meta.env.VITE_TARGET_OWNER;
  const repo = import.meta.env.VITE_TARGET_REPO;
  const ref = import.meta.env.VITE_TARGET_REF;
  const baseUrl = 'http://github.com';

  if (typeof owner !== 'string') {
    throw new Error('VITE_TARGET_OWNER が未設定です。');
  }
  if (typeof repo !== 'string') {
    throw new Error('VITE_TARGET_REPO が未設定です。');
  }
  if (typeof ref !== 'string') {
    throw new Error('VITE_TARGET_REF が未設定です。');
  }

  const url = `${baseUrl}/${import.meta.env.VITE_TARGET_OWNER}/${import.meta.env.VITE_TARGET_REPO}/blob/${import.meta.env.VITE_TARGET_REF}/${path}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const _NavToGitHubSourceDirCommand = (category: DownloadItemRequirement): void => {
  const owner = import.meta.env.VITE_TARGET_OWNER;
  const repo = import.meta.env.VITE_TARGET_REPO;
  const ref = import.meta.env.VITE_TARGET_REF;
  const baseUrl = 'http://github.com';

  if (typeof owner !== 'string') {
    throw new Error('VITE_TARGET_OWNER が未設定です。');
  }
  if (typeof repo !== 'string') {
    throw new Error('VITE_TARGET_REPO が未設定です。');
  }
  if (typeof ref !== 'string') {
    throw new Error('VITE_TARGET_REF が未設定です。');
  }

  const path = resolveDirectoryPath(category);
  const url = `${baseUrl}/${import.meta.env.VITE_TARGET_OWNER}/${import.meta.env.VITE_TARGET_REPO}/blob/${import.meta.env.VITE_TARGET_REF}/${path}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * @summary Issue ダイアログ側のエラーを親へ通知する。
 * @param message エラーメッセージを指定する。
 */
const _OnCreateIssueDialogError = (message: string): void => {
  emit('error', message);
};

/** GitHub のパスからダウンロードURLを生成する */
const generateDownloadUrl = (path: string): Target => {
  const owner = import.meta.env.VITE_TARGET_OWNER;
  const repo = import.meta.env.VITE_TARGET_REPO;
  const ref = import.meta.env.VITE_TARGET_REF;
  const baseUrl = 'https://raw.githubusercontent.com';

  if (typeof owner !== 'string') {
    throw new Error('VITE_TARGET_OWNER が未設定です。');
  }
  if (typeof repo !== 'string') {
    throw new Error('VITE_TARGET_REPO が未設定です。');
  }
  if (typeof ref !== 'string') {
    throw new Error('VITE_TARGET_REF が未設定です。');
  }

  const normalizedPath = path
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  const target: Target = {
    path: path,
    url: `${baseUrl}/${owner}/${repo}/${ref}/${normalizedPath}`,
  };
  return target;
};
</script>

<template lang="pug">
v-container.rounded.pa-0.pa-sm-auto
  CreateIssueDialog(v-model='createIssueDialogModel' :path='createIssueDialogPath' @error='_OnCreateIssueDialogError')
  v-expansion-panels
    v-expansion-panel(v-for='item in items' :key='item.name')
      v-expansion-panel-title.wrapper.d-flex.align-center.ga-1.flex-column.flex-sm-row.align-start.align-sm-center
        div.d-flex.align-center.flex-fill
          p.d-print-block {{ item.name }}
        div.updated-at
          p 最終更新日: {{ _resolveLatestUpdatedAt(item) }}
        div.button-wrapper.ml-1.d-flex.flex-0-0.ga-1
          Button(label='報告' color='error' size='small' :disabled="_isBusy(item.name)" @click.stop='_CreateIssueDialogButtonClickCommand(item)')
          Button(label='フォルダを見る' size='small' :disabled="_isBusy(item.name)" :loading="_isBusy(item.name)" @click.stop='_NavToGitHubSourceDirCommand(item)')
          Button(label='DL' size='small' :disabled="_isBusy(item.name)" :loading="_isBusy(item.name)" @click.stop='_DownloadButtonClickCommand(item)')
      v-expansion-panel-text.px-0.px-sm-5
        v-list.pa-0
          v-list-item.mb-2.pa-0.pa-sm-auto(v-for='treeItem in item.items' :key='treeItem.path' density='compact')
            v-list-item-title.d-flex.align-center.ga-2
              div.w-100.d-flex.align-center.ga-2.flex-column.flex-sm-row.align-start.align-sm-center
                p.flex-fill.text-break.text-pre-wrap {{ treeItem.path }}
                p.updated-at 最終更新日: {{ formatUpdatedAt(treeItem.updatedAt) }}
                Button.ms-auto(label='ファイルを見る' size='small' @click.stop='_NavToGitHubSourceFileCommand(treeItem.path ?? "")')
</template>

<style lang="scss" scoped>
.d-print-block {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.wrapper {
  transition: background 0.3s;
  &:hover {
    background: rgb(var(--v-theme-secondary));
  }
}
</style>
