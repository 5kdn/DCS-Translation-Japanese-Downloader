<script setup lang="ts">
/**
 * @summary MIZ 翻訳クローズ確認ダイアログ props を表す。
 */
type MizTranslationCloseConfirmDialogProps = {
  modelValue: boolean;
};

withDefaults(defineProps<MizTranslationCloseConfirmDialogProps>(), {
  modelValue: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();

/**
 * @summary ダイアログを閉じる。
 */
const _closeDialog = (): void => {
  emit('update:modelValue', false);
};

/**
 * @summary クローズ破棄を確定する。
 */
const _confirmClose = (): void => {
  emit('confirm');
};
</script>

<template lang="pug">
v-dialog(:model-value="modelValue" max-width="480" @update:model-value="_closeDialog")
  v-card(data-testid="miz-close-confirm-dialog")
    v-card-title.text-h6 未保存の変更があります
    v-card-text
      p(data-testid="miz-close-confirm-message") 未保存の変更があります。保存していない変更は失われます。閉じますか？
    v-card-actions.justify-end
      v-btn(
        variant="text"
        data-testid="miz-close-confirm-cancel"
        @click="_closeDialog"
      ) キャンセル
      v-btn(
        color="error"
        variant="flat"
        data-testid="miz-close-confirm-submit"
        @click="_confirmClose"
      ) 閉じる
</template>
