<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { apiClient } from '@/lib/api/client';
import type { TreeItem, TreeResponse } from '@/types/server';
import type { Category } from '@/types/type';

// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const DownloadItem = defineAsyncComponent(() => import('./components/common/DownloadItem.vue'));

const treeItems = ref([] as TreeItem[]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

/** エラー表示位置までスクロールする。 */
const scrollToAnnounce = (): void => {
  if (typeof window === 'undefined') return;
  const target = document.getElementById('announce-area');
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** APIの死活監視を行う。正常時にtrueを返す。 */
const checkApiHealth = async (): Promise<boolean> => {
  try {
    const res = await apiClient.health.$get();
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
    }
    const result = await res.json().catch(() => null);
    if (!result || result.status !== 'ok') throw new Error('APIが正常ではありません');
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'APIヘルスチェックに失敗しました';
    console.error(err);
    errorMessage.value = msg;
    scrollToAnnounce();
    return false;
  }
};

/** treeを取得する。 */
const fetchTree = async (): Promise<void> => {
  try {
    const res = await apiClient.tree.$get();
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
    }
    const result: TreeResponse = await res.json();
    if (!result?.success || !result.data) throw new Error('ツリーが読み込めませんでした');

    treeItems.value = result.data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '不明なエラーが発生しました';
    console.error(err);
    errorMessage.value = msg;
    scrollToAnnounce();
  } finally {
    isLoading.value = false;
  }
};

/** ダウンロード失敗時のエラーメッセージを設定する。 */
// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const handleDownloadError = (message: string): void => {
  errorMessage.value = message;
  scrollToAnnounce();
};

// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const handleAlertClose = (): void => {
  errorMessage.value = null;
};

const createCategoryList = (treeItems: Ref<{ path: string }[]>, prefix: string) =>
  computed<Category[]>(() => {
    const names = new Set<string>();

    for (const { path } of treeItems.value) {
      if (!path.startsWith(prefix)) continue;
      const rest = path.slice(prefix.length);
      const end = rest.indexOf('/');
      const name = end === -1 ? rest : rest.slice(0, end);
      if (name) names.add(name);
    }

    return [...names]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        path: `${prefix}${name}`,
      }));
  });

onMounted(async () => {
  console.log('onMounted() called');
  isLoading.value = true;
  const healthy = await checkApiHealth();
  if (healthy) await fetchTree();
  else isLoading.value = false;
  console.log('onMounted() finished');
});

// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const aircrafts = createCategoryList(treeItems, 'DCSWorld/Mods/aircraft/');
// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const dlcCampaigns = createCategoryList(treeItems, 'DCSWorld/Mods/campaigns/');
</script>


<template lang="pug">
v-container#app-wrapper.pt-10
  h1.text-h1.text-center DCS Translation Japanese
  v-divider

  v-container#announce-area
    v-alert(type="info" variant="tonal" v-if="isLoading") 読み込み中です...
    v-alert(type="error" variant="tonal" :text="errorMessage" v-if="errorMessage" class="my-4" closable @click:close="handleAlertClose")

  v-container(v-if="aircrafts.length > 0")
    h2.text-h2.mt-10.mb-5 Aircrafts
    v-list
      v-list-item(v-for="item in aircrafts" :key="item.name")
        DownloadItem(:path="item.path" :title="item.name" @error="handleDownloadError")

  v-container(v-if="dlcCampaigns.length > 0")
    h2.text-h2.mt-10.mb-5 DLC Campaigns
    v-list
      v-list-item(v-for="item in dlcCampaigns" :key="item.name")
        DownloadItem(:path="item.path" :title="item.name" @error="handleDownloadError")
</template>


<style lang="scss" scoped>
#app-wrapper {
  max-width: min(80svw, 1200px);
}
</style>
