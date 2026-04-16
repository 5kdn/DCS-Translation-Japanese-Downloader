<script setup lang="ts">
import type { UploadChangeType, UploadDialogEntry, UploadTargetType } from '@/features/upload/uploadDialogDomain';

defineProps<{
  fileEntries: UploadDialogEntry[];
  expandedConfirmPanels: number[];
  selectedFolderName: string | null;
  fileSizeText: string;
  fileEntryCount: number;
  targetType: UploadTargetType | null;
  targetName: string;
  selectedChangeTypes: UploadChangeType[];
  title: string;
  overview: string;
  changeDetails: string;
  notes: string;
}>();

const emit = defineEmits<{
  'update:expandedConfirmPanels': [value: number[]];
}>();

/**
 * @summary 展開中パネル一覧の更新を親へ通知する。
 * @param value 展開中パネル一覧を指定する。
 */
const _handleExpandedConfirmPanelsUpdate = (value: number[]): void => {
  emit('update:expandedConfirmPanels', value);
};
</script>

<template lang="pug">
div.pt-2
  v-expansion-panels(
    :model-value="expandedConfirmPanels"
    multiple
    @update:model-value="_handleExpandedConfirmPanelsUpdate"
  )
    v-expansion-panel
      v-expansion-panel-title
        span.font-weight-medium ファイル一覧
      v-expansion-panel-text
        div.overflow-y-auto(style="max-height: 320px;")
          v-list(density="compact")
            v-list-item(v-for="entry in fileEntries" :key="entry.path")
              template(#prepend)
                v-icon(icon="mdi-file-outline" size="18")
              v-list-item-title.confirm-file-path {{ entry.path }}
  v-card.mt-4(variant="tonal")
    v-card-text
      p.text-title-medium.font-weight-medium アップロード内容
      p.mt-3 選択名: {{ selectedFolderName }}
      p.text-medium-emphasis サイズ: {{ fileSizeText }}
      p.text-medium-emphasis ファイル数: {{ fileEntryCount }}
      p.text-medium-emphasis 対象の種類: {{ targetType }}
      p.text-medium-emphasis 対象名: {{ targetName }}
      p.text-medium-emphasis 変更点: {{ selectedChangeTypes.join('/') }}
      p.text-medium-emphasis 同意事項: すべて同意済み
      v-divider.my-4
      p.text-title-small.font-weight-medium タイトル
      p.mt-2.text-break {{ title }}
      p.text-title-small.font-weight-medium.mt-4 概要
      p.mt-2.text-pre-wrap.text-break {{ overview }}
      p.text-title-small.font-weight-medium.mt-4 変更内容
      p.mt-2.text-pre-wrap.text-break {{ changeDetails }}
      p.text-title-small.font-weight-medium.mt-4 留意点
      p.mt-2.text-pre-wrap.text-break {{ notes }}
</template>

<style lang="scss" scoped>
.confirm-file-path {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
