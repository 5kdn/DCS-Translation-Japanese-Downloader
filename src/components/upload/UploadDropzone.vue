<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in Vue template
import DropZone from '../common/DropZone.vue';

defineProps<{
  isDragOver: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  chooseFolder: [];
  dragover: [event: DragEvent];
  dragleave: [];
  drop: [event: DragEvent];
}>();

/**
 * @summary フォルダー選択要求を親へ通知する。
 */
const _emitChooseFolder = (): void => {
  emit('chooseFolder');
};

/**
 * @summary ドラッグオーバーイベントを親へ通知する。
 * @param event DragEvent を指定する。
 */
const _emitDragOver = (event: DragEvent): void => {
  emit('dragover', event);
};

/**
 * @summary ドラッグリーブイベントを親へ通知する。
 */
const _emitDragLeave = (): void => {
  emit('dragleave');
};

/**
 * @summary ドロップイベントを親へ通知する。
 * @param event DragEvent を指定する。
 */
const _emitDrop = (event: DragEvent): void => {
  emit('drop', event);
};
</script>

<template lang="pug">
DropZone(
  :is-drag-over="isDragOver"
  :is-loading="isLoading"
  icon="mdi-folder-upload-outline"
  headline="フォルダーをドロップする"
  button-label="フォルダーを選択"
  @action="_emitChooseFolder"
  @dragover="_emitDragOver"
  @dragleave="_emitDragLeave"
  @drop="_emitDrop"
)
</template>
