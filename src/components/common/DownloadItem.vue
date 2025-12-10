<script lang="ts" setup>
import type { ApiError } from '@microsoft/kiota-abstractions';
import JSZip from 'jszip';
import { defineAsyncComponent, ref } from 'vue';
import { type DownloadFileTarget, fetchArrayBufferWithTimeout, fetchDownloadFileUrls } from '@/lib/client';

defineOptions({
  components: {
    Button: defineAsyncComponent(() => import('./Button.vue')),
  },
});

const props = defineProps<{
  title: string;
  paths: string[];
}>();

const emit = defineEmits<(e: 'error', message: string) => void>();

const isEnable = ref(true);

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const fromServer =
      typeof (error as { messageEscaped?: string | null }).messageEscaped === 'string'
        ? (error as { messageEscaped: string }).messageEscaped
        : undefined;
    const statusCode =
      'responseStatusCode' in error && typeof (error as ApiError).responseStatusCode === 'number'
        ? (error as ApiError).responseStatusCode
        : undefined;
    const detail = fromServer ?? (error instanceof Error && error.message ? error.message : fallback);
    return statusCode ? `${detail}（HTTP ${statusCode}）` : detail;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

const createZipFromTargets = async (targets: DownloadFileTarget[]): Promise<Blob> => {
  const zip = new JSZip();
  await Promise.all(
    targets.map(async (target) => {
      const buffer = await fetchArrayBufferWithTimeout(target.url);
      zip.file(target.path, buffer);
    }),
  );
  return zip.generateAsync({ type: 'blob' });
};

// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const DownloadButtonClickCommand = async () => {
  isEnable.value = false;
  try {
    const targets = await fetchDownloadFileUrls(props.paths);
    const blob = await createZipFromTargets(targets);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.title}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err: unknown) {
    console.error(err);
    const message = resolveErrorMessage(err, '不明なエラーが発生しました');
    emit('error', message);
  } finally {
    isEnable.value = true;
  }
};
</script>

<template lang="pug">
v-container.rounded
  v-expansion-panels: v-expansion-panel
    v-expansion-panel-title#wrapper.d-flex.align-center
      div.text-area
        p.d-print-block {{ props.title }}
      div#button-wrapper.ml-1
        Button.dl(label='DL' size='small' :disabled="!isEnable" :loading="!isEnable" @click.stop='DownloadButtonClickCommand')
    v-expansion-panel-text.px-5
      v-list.pa-0
        v-list-item.mb-2(v-for='path in props.paths' :key='path' density='compact')
          v-list-item-title.path-text
            p.path-text__label {{ path }}
</template>

<style lang="scss" scoped>
.d-print-block {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

#wrapper {
  transition: background 0.1s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  &:hover {
    background: rgb(var(--v-theme-secondary));
  }
}

.text-area {
  flex: 1 1 auto;
  min-width: 0;
  align-self: stretch;
  display: flex;
  align-items: center;
}

#button-wrapper {
  flex: 0 0 auto;
  display: flex;
  gap: 0.25rem;
}

.path-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &__label {
    flex: 1 1 auto;
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    line-height: 1.2;
  }
}
</style>
