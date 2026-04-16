<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

defineOptions({
  components: {
    Button: defineAsyncComponent(() => import('../common/Button.vue')),
  },
});

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
div.upload-dropzone.rounded-lg.pa-8.text-center(
  :class="isDragOver ? 'upload-dropzone--active elevation-3' : ''"
  @dragover="_emitDragOver"
  @dragleave="_emitDragLeave"
  @drop="_emitDrop"
)
  .d-flex.align-center.justify-center.ga-3
    v-icon(size="24" color="primary") mdi-folder-upload-outline
    p.text-title-large.text-primary.mb-0 フォルダーをドロップする
  p.mt-2.text-primary または
  .d-flex.flex-column.flex-sm-row.justify-center.ga-3.mt-4
    Button(label="フォルダーを選択" :loading="isLoading" @click="_emitChooseFolder")
</template>

<style lang="scss" scoped>
.upload-dropzone {
  border-style: dashed;
  border-width: 3px;
  background-color: rgb(var(--v-theme-primary), 0.1);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: none;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &--active {
    background-color: rgb(var(--v-theme-primary), 0.3);
  }
}
</style>
