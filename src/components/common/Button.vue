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

const color = computed(() => {
  if (props.color) return props.color;
  return props.primary === false ? 'secondary' : 'primary';
});
const size = computed(() => {
  switch (props.size) {
    case 'small':
      return 'small';
    case 'large':
      return 'large';
    default:
      return undefined;
  }
});

const isDisabled = computed(() => props.disabled || props.loading);
const spinnerSize = computed(() => {
  switch (props.size) {
    case 'small':
      return 16;
    case 'large':
      return 24;
    default:
      return 20;
  }
});

const onClick = (event: MouseEvent) => {
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
