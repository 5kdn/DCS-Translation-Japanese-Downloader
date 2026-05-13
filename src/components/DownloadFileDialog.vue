<script lang="ts" setup>
import { computed } from 'vue';
import { createDownloadFileTreeNodes } from '@/features/downloads/downloadFileTree';
import type { DownloadFileTreeNode, DownloadListRow } from '@/features/downloads/downloadListModels';
import { buildGitHubBlobUrl } from '@/lib/githubUrl';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    row: DownloadListRow | null;
  }>(),
  {
    modelValue: false,
    row: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const _dialogModel = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean): void => emit('update:modelValue', value),
});

const _treeNodes = computed<DownloadFileTreeNode[]>(() => {
  if (props.row === null) return [];
  return createDownloadFileTreeNodes(props.row.items);
});

const _dialogTitle = computed((): string => {
  return props.row?.name ?? 'ファイル一覧';
});

const _directoryPath = computed((): string => {
  return props.row?.directoryPath ?? '';
});

const _fileCount = computed((): number => {
  return props.row?.items.length ?? 0;
});

type TreeSlotItem = DownloadFileTreeNode | { raw: DownloadFileTreeNode };

/**
 * @summary v-treeview スロットから実ノードを解決する。
 * @param slotItem Vuetify が渡すスロット項目を指定する。
 * @returns ダウンロードファイルツリーノードを返す。
 */
const _resolveTreeNode = (slotItem: TreeSlotItem): DownloadFileTreeNode => {
  if ('raw' in slotItem) {
    return slotItem.raw;
  }

  return {
    id: slotItem.id,
    name: slotItem.name,
    path: slotItem.path,
    nodeType: slotItem.nodeType,
    children: slotItem.children,
  };
};

/**
 * @summary ダイアログを閉じる。
 */
const _closeDialog = (): void => {
  emit('update:modelValue', false);
  emit('close');
};

/**
 * @summary 指定ノードの GitHub 原本を別タブで開く。
 * @param node 開く対象ノードを指定する。
 */
const _openGitHubSource = (node: DownloadFileTreeNode): void => {
  const url = buildGitHubBlobUrl(node.path);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * @summary ツリーノード操作のアクセシブル名を生成する。
 * @param node 対象ノードを指定する。
 * @returns アクセシブル名を返す。
 */
const _buildNodeAriaLabel = (node: DownloadFileTreeNode): string => {
  return `${node.name} を GitHub で開く`;
};
</script>

<template lang="pug">
v-dialog(v-model="_dialogModel" max-width="960")
  v-card
    v-card-title.d-flex.align-center.justify-space-between.ga-2
      div
        div.text-h6 {{ _dialogTitle }}
        div.text-body-2.text-medium-emphasis(v-if="_directoryPath") {{ _directoryPath }}
      v-btn(icon="mdi-close" variant="text" density="comfortable" aria-label="ファイル一覧ダイアログを閉じる" @click="_closeDialog")

    v-card-text
      p.text-medium-emphasis.mb-4 ファイル数: {{ _fileCount }}

      v-alert.mb-4(type="info" variant="tonal" v-if="row === null || _treeNodes.length === 0") 表示できるファイルがありません。

      v-treeview.rounded.border.pa-2(
        v-else
        :items="_treeNodes"
        item-title="name"
        item-value="id"
        open-all
        hide-actions
        indent-lines
      )
        template(v-slot:prepend="{ item }")
          v-icon(size="small" :icon="_resolveTreeNode(item).nodeType === 'file' ? 'mdi-file-document-outline' : 'mdi-folder-open-outline'")

        template(v-slot:title="{ item }")
          v-tooltip(location="top")
            template(v-slot:activator="{ props: tooltipProps }")
              v-btn.pl-0.justify-start(
                v-bind="tooltipProps"
                variant="text"
                color="primary"
                block
                :aria-label="_buildNodeAriaLabel(_resolveTreeNode(item))"
                @click.stop="_openGitHubSource(_resolveTreeNode(item))"
              )
                span.text-body-2.text-none.text-break {{ _resolveTreeNode(item).name }}
            span 翻訳リポジトリ上の原本を見る

    v-card-actions.px-6.pb-4
      v-spacer
      v-btn(variant="tonal" @click="_closeDialog") 閉じる
</template>
