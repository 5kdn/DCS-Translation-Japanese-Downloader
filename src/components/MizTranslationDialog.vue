<script setup lang="ts">
import { computed } from 'vue';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
// biome-ignore lint/correctness/noUnusedImports: used in Vue template
import MizTranslationTable from './MizTranslationTable.vue';

/**
 * @summary MIZ 翻訳ダイアログ props を表す。
 */
type MizTranslationDialogProps = {
  modelValue: boolean;
  loadedFileName: string;
  isLoading: boolean;
  entries: MizDictionaryEntry[];
  errorMessage: string | null;
};

const props = withDefaults(defineProps<MizTranslationDialogProps>(), {
  modelValue: false,
  loadedFileName: '',
  isLoading: false,
  entries: () => [],
  errorMessage: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'toggle-enabled', key: string, value: boolean): void;
  (e: 'update-translation', key: string, value: string): void;
  (e: 'error', message: string): void;
}>();

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

/**
 * @summary 有効状態変更を親へ通知する。
 * @param key 更新対象 key を指定する。
 * @param value 更新値を指定する。
 */
const _handleToggleEnabled = (key: string, value: boolean): void => {
  emit('toggle-enabled', key, value);
};

/**
 * @summary 翻訳更新を親へ通知する。
 * @param key 更新対象 key を指定する。
 * @param value 翻訳文を指定する。
 */
const _handleUpdateTranslation = (key: string, value: string): void => {
  emit('update-translation', key, value);
};

/**
 * @summary テーブル内エラーを親へ通知する。
 * @param message 表示用エラーメッセージを指定する。
 */
const _handleTableError = (message: string): void => {
  emit('error', message);
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
          v-if="errorMessage"
          type="error"
          variant="tonal"
          :text="errorMessage"
          class="mb-4"
          data-testid="miz-dialog-error"
        )

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
          class="mb-4"
          data-testid="miz-dialog-information"
        ) 原文と key は読み取り専用です。翻訳欄を編集し、必要な行だけ有効化してください。

        MizTranslationTable(
          v-if="!isLoading"
          :entries="entries"
          @toggle-enabled="_handleToggleEnabled"
          @update-translation="_handleUpdateTranslation"
          @error="_handleTableError"
        )
</template>
