<script setup lang="ts">
import { computed } from 'vue';

/**
 * @summary MIZ 翻訳ダイアログ props を表す。
 */
type MizTranslationDialogProps = {
  modelValue: boolean;
  loadedFileName: string;
  isLoading: boolean;
};

const props = withDefaults(defineProps<MizTranslationDialogProps>(), {
  modelValue: false,
  loadedFileName: '',
  isLoading: false,
});

const emit = defineEmits<(e: 'update:modelValue', value: boolean) => void>();

/**
 * @summary ダイアログの双方向状態を返す。
 */
const _dialogModel = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean): void => emit('update:modelValue', value),
});

/**
 * @summary ダイアログを閉じる。
 */
const _closeDialog = (): void => {
  emit('update:modelValue', false);
};
</script>

<template lang="pug">
v-dialog(v-model="_dialogModel" fullscreen)
  v-card
    v-toolbar(border)
      v-toolbar-title.d-flex.align-center.ga-3
        span.text-h6 MIZ 翻訳
        span.text-body-2.text-medium-emphasis.text-truncate(data-testid="miz-dialog-file-name") {{ loadedFileName || '未選択' }}
      v-spacer
      v-btn(
        icon="mdi-close"
        variant="text"
        aria-label="MIZ 翻訳ダイアログを閉じる"
        :disabled="isLoading"
        @click="_closeDialog"
      )

    v-card-text.py-6
      v-container
        v-alert(
          v-if="isLoading"
          type="info"
          variant="tonal"
          text="dictionary を読み込み中です。"
          data-testid="miz-dialog-loading"
        )

        v-alert(
          v-else
          type="info"
          variant="tonal"
          data-testid="miz-dialog-placeholder"
        ) Not Implemented
</template>
