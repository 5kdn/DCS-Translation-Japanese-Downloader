<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { ApiClient } from '@/services/apiClient';
import type { Category, TreeItem } from '@/types/type';

// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const DownloadItem = defineAsyncComponent(() => import('./components/common/DownloadItem.vue'));

const fetchingTreeFlg = ref(false);
const treeItems = ref([] as TreeItem[]);

const aircrafts = computed<Category[]>(() => {
  const PREFIX = 'DCSWorld/Mods/aircraft/';
  const names = new Set<string>();

  for (const { path } of treeItems.value) {
    if (!path.startsWith(PREFIX)) continue;
    const rest = path.slice(PREFIX.length);
    const end = rest.indexOf('/');
    const name = end === -1 ? rest : rest.slice(0, end);
    if (name) names.add(name);
  }

  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      path: `${PREFIX}${name}`,
    }));
});

const dlcCampaigns = computed<Category[]>(() => {
  const PREFIX = 'DCSWorld/Mods/campaigns/';
  const names = new Set<string>();

  for (const { path } of treeItems.value) {
    if (!path.startsWith(PREFIX)) continue;
    const rest = path.slice(PREFIX.length);
    const end = rest.indexOf('/');
    const name = end === -1 ? rest : rest.slice(0, end);
    if (name) names.add(name);
  }

  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      path: `${PREFIX}${name}`,
    }));
});

/**
 * treeを取得する。
 */
const fetchTree = async () => {
  console.log('start fetch');
  fetchingTreeFlg.value = true;
  try {
    treeItems.value = await ApiClient.Tree();
  } catch (err) {
    console.error(err);
  } finally {
    fetchingTreeFlg.value = false;
    console.log('end fetch');
  }
};

onMounted(async () => {
  console.log('App.onMounted called');
  try {
    await fetchTree();
  } catch (err) {
    console.error(err);
    alert(err);
  }
  console.log('App.onMounted finished');
});

defineExpose({ aircrafts, dlcCampaigns });
</script>


<template lang="pug">
v-container#app-wrapper.pt-10
  h1.text-h1.text-center DCS Transition Japanese
  v-divider

  h2.text-h2.mt-10.mb-5 Aircrafts
  v-list
    v-list-item(v-for="item in aircrafts" :key="item.name")
      DownloadItem(:path="item.path" :title="item.name")

  h2.text-h2.mt-10.mb-5 DLC Campaigns
  v-list
    v-list-item(v-for="item in dlcCampaigns" :key="item.name")
      DownloadItem(:path="item.path" :title="item.name")
</template>

<style lang="scss" scoped>
#app-wrapper {
  max-width: min(80svw, 1200px);
}
</style>
