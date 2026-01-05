<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    primary?: boolean;
    color?: 'primary' | 'secondary' | 'error';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    primary: true,
    color: undefined,
    disabled: false,
    loading: false,
  },
);

const emit = defineEmits<(e: 'click', event: MouseEvent) => void>();

const color = computed((): 'primary' | 'secondary' | 'error' => {
  if (props.color) return props.color;
  return props.primary === false ? 'secondary' : 'primary';
});
const size = computed((): 'small' | 'large' | undefined => {
  switch (props.size) {
    case 'small':
      return 'small';
    case 'large':
      return 'large';
    default:
      return undefined;
  }
});

const isDisabled = computed((): boolean => props.disabled || props.loading);
const spinnerSize = computed((): number => {
  switch (props.size) {
    case 'small':
      return 16;
    case 'large':
      return 24;
    default:
      return 20;
  }
});

/**
 * @summary クリックイベントを処理して親へ通知する。
 * @description ローディング中はクリックを無視する。
 * @param event マウスイベントを指定する。
 */
const onClick = (event: MouseEvent): void => {
  if (props.loading) return;
  emit('click', event);
};

defineExpose({ color, size, onClick, isDisabled, spinnerSize });
</script>

<template lang="pug">
v-btn(
  @click='onClick'
  :color='color'
  :size='size'
  :disabled='isDisabled'
)
  template(v-if='props.loading')
    v-progress-circular(indeterminate color='currentColor' :size='spinnerSize' width='2')
  template(v-else)
    | {{ label }}
</template>
