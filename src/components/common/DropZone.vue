<script setup lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used in Vue template
import CustomButton from './CustomButton.vue';

const _props = withDefaults(
  defineProps<{
    isDragOver: boolean;
    isLoading?: boolean;
    color?: 'primary' | 'secondary' | 'error';
    icon: string;
    headline: string;
    buttonLabel: string;
  }>(),
  {
    color: 'primary',
    isLoading: false,
  },
);

const emit = defineEmits<{
  (e: 'action'): void;
  (e: 'dragenter', event: DragEvent): void;
  (e: 'dragover', event: DragEvent): void;
  (e: 'dragleave'): void;
  (e: 'drop', event: DragEvent): void;
}>();

/**
 * @summary 操作ボタン押下を親へ通知する。
 */
const _emitAction = (): void => {
  emit('action');
};

/**
 * @summary ドラッグエンターイベントを親へ通知する。
 * @param event DragEvent を指定する。
 */
const _emitDragEnter = (event: DragEvent): void => {
  event.preventDefault();
  emit('dragenter', event);
};

/**
 * @summary ドラッグオーバーイベントを親へ通知する。
 * @param event DragEvent を指定する。
 */
const _emitDragOver = (event: DragEvent): void => {
  event.preventDefault();
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
  event.preventDefault();
  emit('drop', event);
};

/**
 * @summary DropZone のテーマカラー文字列を返す。
 * @returns Vuetify テーマカラー参照文字列を返す。
 */
const _getThemeColor = (): string => {
  return `rgb(var(--v-theme-${_props.color}))`;
};

/**
 * @summary DropZone 枠のインライン style を返す。
 * @returns 現在状態に応じた style を返す。
 */
const _dropZoneStyle = (): Record<string, string> => {
  const alpha = _props.isDragOver ? '0.3' : '0.1';

  return {
    backgroundColor: `rgba(var(--v-theme-${_props.color}), ${alpha})`,
    borderColor: _getThemeColor(),
  };
};
</script>

<template lang="pug">
div.drop-zone.rounded-lg.pa-8.text-center(
  :class="_props.isDragOver ? 'drop-zone--active elevation-3' : ''"
  :style="_dropZoneStyle()"
  @dragenter="_emitDragEnter"
  @dragover="_emitDragOver"
  @dragleave="_emitDragLeave"
  @drop="_emitDrop"
)
  .d-inline-flex.align-center.justify-center.ga-3
    v-icon(size="24" :color="_props.color") {{ _props.icon }}
    span.text-title-large(:style="{ color: _getThemeColor() }") {{ _props.headline }}
  p.mt-2(:style="{ color: _getThemeColor() }") または
  .d-flex.flex-column.flex-sm-row.justify-center.ga-3.mt-4
    CustomButton(:label="_props.buttonLabel" :loading="_props.isLoading" :color="_props.color" @click="_emitAction")
</template>

<style lang="scss" scoped>
.drop-zone {
  border-style: dashed;
  border-width: 3px;
  box-shadow: none;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
</style>
