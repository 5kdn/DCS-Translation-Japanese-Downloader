<script setup lang="ts">
import type { ComputedRef, Ref } from 'vue';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
// biome-ignore lint/correctness/noUnusedImports: used in Vue template
import associate_miz_with_zip from '@/assets/associate_miz_with_zip.reg.txt?raw';
import { toErrorMessageForDisplay } from '@/errors/errorMessage';
import { fetchTree, healthCheck } from '@/lib/client';
import type { DownloadItemRequirement, TreeItem } from '@/types/type';

defineOptions({
  components: {
    CategorySection: defineAsyncComponent(() => import('./components/CategorySection.vue')),
    Footer: defineAsyncComponent(() => import('./components/Footer.vue')),
    IssueViewer: defineAsyncComponent(() => import('./components/IssueViewer.vue')),
    Button: defineAsyncComponent(() => import('./components/common/Button.vue')),
  },
});

const isLoadingTree = ref(false);
const errorMessage = ref<string | null>(null);
const treeItems = ref<TreeItem[]>([]);

/**
 * @summary ツリー項目からカテゴリごとのパスリストを生成する。
 * @param treeItems ツリー項目一覧を保持する参照を受け取る。
 * @param prefix カテゴリ抽出対象とするパスのプレフィックスを指定する。
 * @param ignorePatterns カテゴリ抽出時に除外するパスのプレフィックス一覧を指定する。
 * @returns プレフィックスに合致したカテゴリ名とパス配列の組をリアクティブに返す。
 */
const createCategoryList = (
  treeItems: Ref<TreeItem[]>,
  prefix: string,
  ignorePatterns: string[] = [],
): ComputedRef<{ name: string; items: TreeItem[] }[]> =>
  computed<DownloadItemRequirement[]>((): DownloadItemRequirement[] => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    const categories: Record<string, TreeItem[]> = {};
    treeItems.value.forEach((item: TreeItem): void => {
      const path = item.path;
      if (typeof path !== 'string' || !path.startsWith(prefix)) return;
      if (item.type !== 'blob') return;
      if (ignorePatterns.some((pattern: string): boolean => path.startsWith(pattern))) return;
      const name = path.slice(prefix.length).split('/')[0];
      if (name === undefined) return;
      if (!categories[name]) categories[name] = [] as TreeItem[];
      categories[name].push(item);
    });

    return Object.keys(categories)
      .sort(collator.compare)
      .map((key: string): DownloadItemRequirement => {
        return {
          name: key,
          items: [...(categories[key] ?? [])].sort((a: TreeItem, b: TreeItem): number => {
            const left = a.path ?? '';
            const right = b.path ?? '';
            return collator.compare(left, right);
          }),
        } as DownloadItemRequirement;
      });
  });

const _aircrafts = createCategoryList(treeItems, 'DCSWorld/Mods/aircraft/');
const _dlcCampaigns = createCategoryList(treeItems, 'DCSWorld/Mods/campaigns/');
const _userCampaigns = createCategoryList(treeItems, 'UserMissions/Campaigns/');
const _userMissions = createCategoryList(treeItems, 'UserMissions/', ['UserMissions/Campaigns/']);

/**
 * @summary 例外を画面表示向けメッセージへ変換する。
 * @param error 例外オブジェクトを指定する。
 * @returns 表示用メッセージを返す。
 */
const toErrorMessage = (error: unknown): string => toErrorMessageForDisplay(error);

/**
 * @summary エラー表示位置までスクロールする。
 */
const scrollToAnnounce = (): void => {
  if (typeof window === 'undefined') return;
  const target = document.getElementById('alert-area');
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * @summary treeを取得する。
 */
const getTree = async (): Promise<void> => {
  if (isLoadingTree.value) {
    console.info('ロード処理中のため中止します');
    return;
  }
  console.info('ファイルリストを取得する。');
  isLoadingTree.value = true;

  try {
    treeItems.value = await fetchTree();
    console.info('ファイルリストを取得した。');
  } catch (err: unknown) {
    const msg = toErrorMessage(err);
    console.error(err);
    errorMessage.value = msg;
    scrollToAnnounce();
  } finally {
    isLoadingTree.value = false;
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

/**
 * @summary デスクトップアプリのダウンロードページへ別タブで遷移する。
 */
const _browseToDesktopAppDownloadPage = (): void => {
  const url = 'https://github.com/5kdn/DCS-Translation-Tool/releases/latest';
  window.open(url, '_blank', 'noopener,noreferrer');
};

onMounted(async (): Promise<void> => {
  console.log('onMounted() called');
  try {
    const health = await healthCheck();
    if (!health) {
      throw new Error('API サーバーが稼働していません');
    }

    await Promise.all([getTree()]);
  } catch (err: unknown) {
    const msg = toErrorMessage(err);
    console.error(err);
    errorMessage.value = msg;
    scrollToAnnounce();
  } finally {
    console.log('onMounted() finished');
  }
});
</script>


<template lang="pug">
v-app
  v-app-bar
    v-app-bar-title.text-center DCS Translation Japanese
    template(#append)
      IssueViewer(v-slot="{ toggle, isLoading }")
        v-btn(icon="mdi-alert-circle-outline" variant="text" aria-label="Open issues" :disabled="isLoading" @click="toggle")

  v-main
    v-responsive.main-frame
      v-container.py-2.my-2.py-xs-4.my-xs-4.py-sm-8.my-sm-8.my-md-16.py-md-16.smooth-space
        h1.text-h2.text-sm-h1.text-center.smooth-space DCS Translation Japanese
      v-container#announce-area
        v-container.bg-surface.rounded
          v-container#about-this-page.text-center
            p.text-balance 本ページは、Eagle Dynamics社の Digital Combat Simulator World のミッション・キャンペーンを日本語化する<strong>非公式</strong>プロジェクト <a href="https://github.com/5kdn/DCS-Translation-Japanese" target="_blank" rel="noopener noreferrer">5kdn/DCS-Translation-Japanese</a> の Web UI です。
            p.text-balance 翻訳データの利用条件については、<a href="https://github.com/5kdn/DCS-Translation-Japanese/blob/master/DISTRIBUTION_POLICY.md" target="_blank" rel="noopener noreferrer">流通制御ポリシー</a>をご確認ください。プロジェクトの詳細はリポジトリページをご覧ください。

          v-container#announce-desktop-app.text-center
            p.text-balance 翻訳データをmizファイルに追加までを自動化するWindowsデスクトップアプリがダウンロード可能です。
            p.text-balance デスクトップアプリ版ではファイルのアップロードも可能です。
            Button(label="デスクトップアプリ" @click="_browseToDesktopAppDownloadPage").mt-2

          v-container#announce-how-to-apply.text-center
            h2 ミッションファイルへの適用のしかた

            ol.d-inline-block.text-left.border.rounded.px-16.py-4.bg-blue-grey-lighten-5
              li mizファイルの拡張子をzipに変更する
              li zipファイルを開き、ダウンロードしたファイルの "*.mizフォルダ" の中身を同名のzipに追加する
              li 拡張子をzipからmizに戻す

            v-alert(type="info" variant="tonal").my-4 ファイルを適用する前に必ずバックアップを作成してください。
            v-alert(type="info" variant="tonal").my-4 DCSのインストールフォルダに直接追加すると、DCSのアップデートや整合性チェックによって、追加したファイルが削除される可能性があります。<br/>Open Mod ManagerなどのMOD管理ツールの使用を推奨します。
            v-expansion-panels
              v-expansion-panel
                v-expansion-panel-title mizファイルをzipと同様に扱う（上級者向け）
                v-expansion-panel-text
                  div
                    p.text-balance 以下のレジストリファイルを実行することで、mizファイルをzipと同様に扱うことができるようになります。
                    v-alert(type="warning" variant="tonal").text-balance.my-4 コードの内容を十分に理解したうえで実行してください。<br/>このコードを実行したことによるいかなる責任も負いません。
                    pre.pa-4.text-left.overflow-x-auto.border.rounded.bg-blue-grey-lighten-5
                      code {{ associate_miz_with_zip }}


          v-divider

          v-container#disclaimer.text-center
            h2 免責事項
            p.text-balance 提供する日本語翻訳データ（以下「本翻訳データ」）は、DCS:Worldをより理解しやすくすることを目的として、無償で提供されています。
            p.text-balance 本翻訳データを使用したこと、または使用できなかったことによって発生したいかなる損害・不利益についても、開発者および貢献者は一切の責任を負いません。
            p.text-balance 本翻訳データの品質、正確性、完全性、特定目的適合性について、いかなる保証も行いません。
            p.text-balance 本翻訳データの使用は、すべて利用者自身の責任において行ってください。

        v-container#alert-area.alert-area
          v-alert(type="info" variant="tonal" v-if="isLoadingTree") 読み込み中です...
          v-alert(type="error" variant="tonal" :text="errorMessage" v-if="errorMessage" class="my-4" closable @click:close="_handleAlertClose")

      v-container#filelist
        CategorySection(title="Aircrafts" :items="_aircrafts" @error="_handleDownloadError")
        CategorySection(title="DLC Campaigns" :items="_dlcCampaigns" @error="_handleDownloadError")
        CategorySection(title="User Campaigns" :items="_userCampaigns" @error="_handleDownloadError")
        CategorySection(title="User Missions" :items="_userMissions" @error="_handleDownloadError")

  Footer
</template>

<style lang="scss" scoped>
.smooth-space {
  transition: font-size 0.5s, padding 0.5s ease, margin 0.5s ease;
}

#announce-how-to-apply li {
  margin-block: 0.25rem;
}

.text-balance {
  text-wrap: balance;
}
</style>
