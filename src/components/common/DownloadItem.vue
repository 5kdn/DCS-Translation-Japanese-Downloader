<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { apiClient } from '@/lib/api/client';
import type { DownloadZipResponse } from '@/types/server';

defineOptions({
  components: {
    Button: defineAsyncComponent(() => import('./Button.vue')),
  },
});

const props = defineProps<{
  title: string;
  path: string;
}>();

const emit = defineEmits<(e: 'error', message: string) => void>();

const isEnable = ref(true);

const fetchDownloadZip = async (path: string): Promise<Blob> => {
  const res = await apiClient['download-zip'].$post({
    json: { path },
  });

  if (!res.ok || res.status >= 400) {
    const statusText = res.statusText || '不明な理由';
    throw new Error(
      `ダウンロードに失敗しました。しばらく待ってからもう一度お試しください。（HTTP ${res.status}: ${statusText}）`,
    );
  }

  const body: DownloadZipResponse = await res.json();
  // success と data の両方を満たすまで関数を継続しない
  const data = body.data;
  if (!(body.success && data)) {
    const message = body.message ?? 'ファイルを取得できませんでした。';
    throw new Error(message);
  }
  const binary = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));

  return new Blob([binary], { type: 'application/zip' });
};

// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const ButtonClickCommand = async () => {
  isEnable.value = false;
  try {
    const blob = await fetchDownloadZip(props.path);
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
    const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
    emit('error', message);
  } finally {
    isEnable.value = true;
  }
};
</script>

<template lang="pug">
v-container#wrapper.d-flex.align-center.rounded
  div.text-area(style="min-width:0")
    p.d-print-block {{ props.title }}
  v-spacer
  div#button-wrapper.ml-1
    Button(label='DL' size='small' :disabled="!isEnable" :loading="!isEnable" @click='ButtonClickCommand')
</template>

<style lang="scss" scoped>
.d-print-block {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

#wrapper {
  transition: background 0.1s;
  &:hover {
    background: rgb(var(--v-theme-secondary));
  }
}
</style>
