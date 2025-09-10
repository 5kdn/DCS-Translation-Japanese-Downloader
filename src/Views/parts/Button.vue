<script lang="ts" setup>
  import { computed } from 'vue';

  const props = withDefaults(
    defineProps<{
      label: string;
      primary?: boolean;
      size?: 'small' | 'medium' | 'large';
      disable?: boolean;
  }>(),
  {
    primary: true,
    disable: false
  })

  const emit = defineEmits<{
    (e: 'click'): void;
  }>();

  const color = computed(() => props.primary == false ? 'secondary' : 'primary')
  const size = computed(() => {
    switch (props.size) {
      case 'small': return 'small'
      case 'large': return 'large'
      default: return undefined
    }
  })

  const onClick = () => emit('click');
</script>

<template lang="pug">
v-btn(
  @click='onClick'
  :color='color'
  :size='size'
  :disabled='disable'
) {{ label }}
</template>
