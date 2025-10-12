<script setup lang="ts">
import { computed, ref } from 'vue';
import Button from '@/Views/parts/Button.vue';
import DownloadItem from '@/Views/parts/DownloadItem.vue';
import { ApiClient }  from '@/Services/apiClient';
import type { Category, TreeItem, TreeResponse } from '@/type';

const fetchingTreeFlg = ref(false);

const treeItems = ref([] as TreeItem[]);

const aircrafts = computed<Category[]>(() => {
  const PREFIX = "DCSWorld/Mods/aircraft/";
  const names = new Set<string>();

  for (const { path } of treeItems.value) {
    if (!path.startsWith(PREFIX)) continue;
    const rest = path.slice(PREFIX.length);
    const end = rest.indexOf("/");
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
  const PREFIX = "DCSWorld/Mods/campaigns/";
  const names = new Set<string>();

  for (const { path } of treeItems.value) {
    if (!path.startsWith(PREFIX)) continue;
    const rest = path.slice(PREFIX.length);
    const end = rest.indexOf("/");
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
  console.log("start fetch");
  fetchingTreeFlg.value = true;
  try {
    treeItems.value = await ApiClient.Tree();
  } catch (err) {
    console.error(err);
  } finally {
    fetchingTreeFlg.value = false;
    console.log("end fetch");
  }
};

const dummypath = ref("DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart")
const dummytitle = ref("QuickStart")
</script>


<template lang="pug">
v-container#app-wrapper.pt-10
  h1.text-h1.text-center DCS Transition Japanese
  v-divider
  Button(:primary='true', label='Fetch' :disable='fetchingTreeFlg' @click='fetchTree')

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
