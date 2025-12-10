<script setup lang="ts">
import type { ApiError } from '@microsoft/kiota-abstractions';
import type { ComputedRef, Ref } from 'vue';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { apiClient } from '@/lib/client';
import type { TreeGetResponse_data } from '@/lib/http/apiClient/tree/index';
import type { Category } from '@/types/type';

// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const DownloadItem = defineAsyncComponent(() => import('./components/common/DownloadItem.vue'));
// biome-ignore lint/correctness/noUnusedVariables: Templateで使用している
const Footer = defineAsyncComponent(() => import('./components/Footer.vue'));

type TreeEntry = TreeGetResponse_data & { path: string };

const treeItems = ref<TreeEntry[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

/**
 * @summary ツリー項目からカテゴリごとのパスリストを生成する。
 * @param treeItems ツリー項目一覧を保持する参照を受け取る。
 * @param prefix カテゴリ抽出対象とするパスのプレフィックスを指定する。
 * @param ignorePatterns カテゴリ抽出時に除外するパスのプレフィックス一覧を指定する。
 * @returns プレフィックスに合致したカテゴリ名とパス配列の組をリアクティブに返す。
 */
const createCategoryList = (
  treeItems: Ref<TreeEntry[]>,
  prefix: string,
  ignorePatterns: string[] = [],
): ComputedRef<{ name: string; paths: string[] }[]> =>
  computed<Category[]>(() => {
    const categories: Record<string, string[]> = {};
    treeItems.value.forEach((item) => {
      if (!item.path.startsWith(prefix)) return;
      if (item.type !== 'blob') return;
      if (ignorePatterns.some((pattern) => item.path.startsWith(pattern))) return;
      const name = item.path.slice(prefix.length).split('/')[0];
      if (name === undefined) return;
      if (!categories[name]) categories[name] = [] as string[];
      categories[name].push(item.path);
    });

    return Object.keys(categories).map((key) => {
      return {
        name: key,
        paths: categories[key],
      } as Category;
    });
  });

const _aircrafts = createCategoryList(treeItems, 'DCSWorld/Mods/aircraft/');
const _dlcCampaigns = createCategoryList(treeItems, 'DCSWorld/Mods/campaigns/');
const _userCampaigns = createCategoryList(treeItems, 'UserMissions/Campaigns/');
const _userMissions = createCategoryList(treeItems, 'UserMissions/', ['UserMissions/Campaigns/']);

/**
 * @summary APIエラーを表示用メッセージに変換する。
 * @param error APIクライアントから受け取るエラーオブジェクトを受け取る。
 * @param fallback messageが取得できなかった場合に用いるフォールバック文言を指定する。
 * @returns 画面表示向けのエラーメッセージ文字列を返す。
 */
const toErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'responseStatusCode' in error) {
    const { responseStatusCode } = error as ApiError;
    const detail =
      (error instanceof Error && error.message) ||
      (typeof (error as { messageEscaped?: string | null }).messageEscaped === 'string'
        ? (error as unknown as { messageEscaped: string }).messageEscaped
        : fallback);
    return responseStatusCode ? `${detail}（HTTP ${responseStatusCode}）` : detail;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

/**
 * @summary TreeGetResponseの要素がTreeEntryとして扱えるかを判定する。
 * @param item APIから受け取るツリー要素またはnull/undefinedを受け取る。
 * @returns path文字列を持つ場合にtrueを返し、ガードとしてTreeEntry型を確定させる。
 */
const isTreeEntry = (item: TreeGetResponse_data | null | undefined): item is TreeEntry =>
  typeof item?.path === 'string' && item.path.length > 0;

/**
 * @summary エラー表示位置までスクロールする。
 */
const scrollToAnnounce = (): void => {
  if (typeof window === 'undefined') return;
  const target = document.getElementById('announce-area');
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * @summary APIの死活監視を行う。正常時にtrueを返す。
 */
const checkApiHealth = async (): Promise<boolean> => {
  try {
    const result = await apiClient.health.get();
    if (!result || result.status !== 'ok') throw new Error('APIが正常ではありません');
    return true;
  } catch (err) {
    const msg = toErrorMessage(err, 'APIヘルスチェックに失敗しました');
    console.error(err);
    errorMessage.value = msg;
    scrollToAnnounce();
    return false;
  }
};

/**
 * @summary treeを取得する。
 */
const fetchTree = async (): Promise<void> => {
  try {
    const result = await apiClient.tree.get();
    if (!result?.success || !result.data) throw new Error('ツリーが読み込めませんでした');

    treeItems.value = result.data.filter(isTreeEntry);
  } catch (err: unknown) {
    const msg = toErrorMessage(err, '不明なエラーが発生しました');
    console.error(err);
    errorMessage.value = msg;
    scrollToAnnounce();
  } finally {
    isLoading.value = false;
  }
};

/**
 * @summary ダウンロード失敗時のエラーメッセージを設定する。
 */
const _handleDownloadError = (message: string): void => {
  errorMessage.value = message;
  scrollToAnnounce();
};

/**
 * @summary エラーメッセージを閉じる。
 */
const _handleAlertClose = (): void => {
  errorMessage.value = null;
};

onMounted(async () => {
  console.log('onMounted() called');
  isLoading.value = true;
  const healthy = await checkApiHealth();
  if (healthy) await fetchTree();
  else isLoading.value = false;
  console.log('onMounted() finished');
});
</script>


<template lang="pug">
v-container#app-wrapper.pt-10
  h1.text-h1.text-center DCS Translation Japanese
  v-divider

  v-container#announce-area
    v-alert(type="info" variant="tonal" v-if="isLoading") 読み込み中です...
    v-alert(type="error" variant="tonal" :text="errorMessage" v-if="errorMessage" class="my-4" closable @click:close="_handleAlertClose")

  v-container(v-if="_aircrafts.length > 0")
    h2.text-h2.mt-10.mb-5 Aircrafts
    v-list
      v-list-item(v-for="item in _aircrafts" :key="item.name")
        DownloadItem(:paths="item.paths" :title="item.name" @error="_handleDownloadError")

  v-container(v-if="_dlcCampaigns.length > 0")
    h2.text-h2.mt-10.mb-5 DLC Campaigns
    v-list
      v-list-item(v-for="item in _dlcCampaigns" :key="item.name")
        DownloadItem(:paths="item.paths" :title="item.name" @error="_handleDownloadError")

  v-container(v-if="_userCampaigns.length > 0")
    h2.text-h2.mt-10.mb-5 User Campaigns
    v-list
      v-list-item(v-for="item in _userCampaigns" :key="item.name")
        DownloadItem(:paths="item.paths" :title="item.name" @error="_handleDownloadError")

  v-container(v-if="_userMissions.length > 0")
    h2.text-h2.mt-10.mb-5 User Missions
    v-list
      v-list-item(v-for="item in _userMissions" :key="item.name")
        DownloadItem(:paths="item.paths" :title="item.name" @error="_handleDownloadError")

v-container
  Footer
</template>


<style lang="scss" scoped>
#app-wrapper {
  max-width: min(80svw, 1200px);
}
</style>
