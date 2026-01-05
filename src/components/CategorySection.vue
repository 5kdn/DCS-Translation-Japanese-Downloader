<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import type { DownloadItemRequirement } from '@/types/type';

defineOptions({
  components: {
    DownloadItem: defineAsyncComponent(() => import('./DownloadItem.vue')),
  },
});

const props = defineProps<{
  title: string;
  items: DownloadItemRequirement[];
}>();

const _hasItems = computed((): boolean => props.items.length > 0);

const emit = defineEmits<(e: 'error', message: string) => void>();

const _handleDownloadError = (message: string): void => {
  emit('error', message);
};
</script>

<template lang="pug">
v-container(v-if="_hasItems")
  h2.text-h2.mt-10.mb-5 {{ title }}
  DownloadItem(:items="items" @error="_handleDownloadError")
</template>
