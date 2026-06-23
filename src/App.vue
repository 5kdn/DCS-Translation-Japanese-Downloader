<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
// biome-ignore lint/correctness/noUnusedImports: used in Vue template
import associate_miz_with_zip from '@/assets/associate_miz_with_zip.reg.txt?raw';
import { useDownloadListState } from '@/composables/useDownloadListState';
import { useMizTranslationState } from '@/composables/useMizTranslationState';
import { toErrorMessageForDisplay } from '@/errors/errorMessage';
import type {
  MizTranslationDownloadFormat,
  MizTranslationExportSort,
} from '@/features/mizTranslation/mizTranslationDownloadModels';
import {
  parseImportedDictionaryValues,
  parseMizTranslationImportEntries,
  readMizDictionaryEntries,
} from '@/features/mizTranslation/mizTranslationService';
import type { UploadDialogSubmitPayload } from '@/features/upload/uploadDialogSubmit';
import type { CreatePrResponse } from '@/lib/client';
import { fetchCreatePr, fetchTree, healthCheck } from '@/lib/client';
import type { TreeItem } from '@/types/type';

defineOptions({
  components: {
    DownloadCategoryTabs: defineAsyncComponent(() => import('./components/download/DownloadCategoryTabs.vue')),
    AppFooter: defineAsyncComponent(() => import('./components/AppFooter.vue')),
    IssueViewer: defineAsyncComponent(() => import('./components/IssueViewer.vue')),
    MizTranslationCloseConfirmDialog: defineAsyncComponent(
      () => import('./components/mizTranslation/MizTranslationCloseConfirmDialog.vue'),
    ),
    MizTranslationDialog: defineAsyncComponent(() => import('./components/mizTranslation/MizTranslationDialog.vue')),
    MizTranslationEntrySection: defineAsyncComponent(
      () => import('./components/mizTranslation/MizTranslationEntrySection.vue'),
    ),
    AppButton: defineAsyncComponent(() => import('./components/common/AppButton.vue')),
    UploadDialog: defineAsyncComponent(() => import('./components/UploadDialog.vue')),
  },
});

const isLoadingTree = ref(false);
const errorMessage = ref<string | null>(null);
const treeItems = ref<TreeItem[]>([]);
const _downloadListState = useDownloadListState(treeItems);
const {
  isDialogOpen: _mizIsDialogOpen,
  isLoading: _mizIsLoading,
  errorMessage: _mizErrorMessage,
  loadedFileName: _mizLoadedFileName,
  isCloseConfirmDialogOpen: _mizIsCloseConfirmDialogOpen,
  filter: _mizFilter,
  filteredEntries: _mizFilteredEntries,
  visibleEntryCount: _mizVisibleEntryCount,
  totalEntryCount: _mizTotalEntryCount,
  clearErrorMessage: _clearMizErrorMessage,
  setLoading: _setMizLoading,
  loadMizResult: _loadMizResult,
  setErrorMessage: _setMizErrorMessage,
  setEntryEnabled: _setMizEntryEnabled,
  setEntryTranslatedText: _setMizEntryTranslatedText,
  replaceTranslationsFromDictionary: _replaceMizTranslationsFromDictionary,
  replaceTranslationsFromImportEntries: _replaceMizTranslationsFromImportEntries,
  setShowEnabled: _setMizShowEnabled,
  setShowDisabled: _setMizShowDisabled,
  setShowOnlyUntranslated: _setMizShowOnlyUntranslated,
  setHideNonTranslatable: _setMizHideNonTranslatable,
  setHideEmptySourceText: _setMizHideEmptySourceText,
  setExportSort: _setMizExportSort,
  buildDownloadPayload: _buildMizDownloadPayload,
  markDownloadSucceeded: _markMizDownloadSucceeded,
  requestClose: _requestMizClose,
  confirmClose: _confirmMizClose,
  cancelClose: _cancelMizClose,
} = useMizTranslationState();

const _activeCategoryKey = computed({
  get: () => _downloadListState.activeCategoryKey.value,
  set: (value) => {
    _downloadListState.setActiveCategory(value);
  },
});

const _searchText = computed({
  get: () => _downloadListState.searchText.value,
  set: (value: string) => {
    _downloadListState.setSearchText(value);
  },
});

const _updatedAfter = computed({
  get: () => _downloadListState.updatedAfter.value,
  set: (value) => {
    _downloadListState.setUpdatedAfter(value);
  },
});

const _searchCandidates = computed(() => _downloadListState.searchCandidates.value);
const _visibleRows = computed(() => _downloadListState.visibleRows.value);
const _hasErrorMessage = computed(() => errorMessage.value !== null);
const _errorAlertText = computed(() => errorMessage.value ?? undefined);

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
 * @summary アップロード送信を処理する。
 * @param payload アップロード対象情報を指定する。
 * @returns PR作成結果を返す。
 */
const _handleUploadSubmit = async (payload: UploadDialogSubmitPayload): Promise<CreatePrResponse> => {
  return fetchCreatePr({
    title: payload.title,
    description: payload.description,
    targetType: payload.targetType,
    targetName: payload.targetName,
    selectedChangeTypes: payload.selectedChangeTypes,
    selectedFiles: payload.selectedFiles,
  });
};

/**
 * @summary MIZ ファイル選択後の dictionary 読込を処理する。
 * @param file 読込対象の MIZ ファイルを指定する。
 */
const _handleMizFileSelected = async (file: File): Promise<void> => {
  _clearMizErrorMessage();
  _setMizLoading(true);

  try {
    const result = await readMizDictionaryEntries(file);
    _loadMizResult(result);
  } catch (error: unknown) {
    _setMizLoading(false);
    _setMizErrorMessage(toErrorMessage(error));
  }
};

/**
 * @summary MIZ 読込エラー表示を初期化する。
 */
const _handleMizErrorClear = (): void => {
  _clearMizErrorMessage();
};

/**
 * @summary MIZ 翻訳行の有効状態変更を反映する。
 * @param key 更新対象 key を指定する。
 * @param value 更新値を指定する。
 */
const _handleMizEntryToggleEnabled = (key: string, value: boolean): void => {
  _setMizEntryEnabled(key, value);
};

/**
 * @summary MIZ 翻訳行の翻訳文変更を反映する。
 * @param key 更新対象 key を指定する。
 * @param value 翻訳文を指定する。
 */
const _handleMizEntryTranslationUpdate = (key: string, value: string): void => {
  _setMizEntryTranslatedText(key, value);
};

/**
 * @summary 既存翻訳ファイルを読み込み、翻訳列へ反映する。
 * @param format 読込形式を指定する。
 * @param file 読込対象ファイルを指定する。
 */
const _handleMizDictionaryImport = async (format: MizTranslationDownloadFormat, file: File): Promise<void> => {
  try {
    const source = await file.text();
    if (format === 'dictionary') {
      const importedValues = parseImportedDictionaryValues(source);
      _replaceMizTranslationsFromDictionary(importedValues);
    } else {
      const importedEntries = parseMizTranslationImportEntries(format, source);
      _replaceMizTranslationsFromImportEntries(importedEntries);
    }

    _clearMizErrorMessage();
  } catch (error: unknown) {
    _setMizErrorMessage(toErrorMessage(error));
  }
};

/**
 * @summary 現在の編集内容を dictionary としてダウンロードする。
 */
const _handleMizDictionaryDownload = (format: MizTranslationDownloadFormat): void => {
  try {
    const payload = _buildMizDownloadPayload(format);
    const url = URL.createObjectURL(payload.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = payload.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout((): void => URL.revokeObjectURL(url), 500);
    _markMizDownloadSucceeded();
    _clearMizErrorMessage();
  } catch (error: unknown) {
    _setMizErrorMessage(toErrorMessage(error));
  }
};

/**
 * @summary MIZ エクスポート用ソート状態を更新する。
 * @param value 更新後ソート状態を指定する。
 */
const _handleMizSortUpdate = (value: MizTranslationExportSort): void => {
  _setMizExportSort(value);
};

/**
 * @summary MIZ フィルターの有効表示状態を更新する。
 * @param value 更新値を指定する。
 */
const _handleMizShowEnabledUpdate = (value: boolean): void => {
  _setMizShowEnabled(value);
};

/**
 * @summary MIZ フィルターの無効表示状態を更新する。
 * @param value 更新値を指定する。
 */
const _handleMizShowDisabledUpdate = (value: boolean): void => {
  _setMizShowDisabled(value);
};

/**
 * @summary MIZ フィルターの未翻訳のみ表示状態を更新する。
 * @param value 更新値を指定する。
 */
const _handleMizShowOnlyUntranslatedUpdate = (value: boolean): void => {
  _setMizShowOnlyUntranslated(value);
};

/**
 * @summary MIZ フィルターの対象外非表示状態を更新する。
 * @param value 更新値を指定する。
 */
const _handleMizHideNonTranslatableUpdate = (value: boolean): void => {
  _setMizHideNonTranslatable(value);
};

/**
 * @summary MIZ フィルターの空欄非表示状態を更新する。
 * @param value 更新値を指定する。
 */
const _handleMizHideEmptySourceTextUpdate = (value: boolean): void => {
  _setMizHideEmptySourceText(value);
};

/**
 * @summary MIZ 翻訳ダイアログ内エラーを表示する。
 * @param message 表示用メッセージを指定する。
 */
const _handleMizDialogError = (message: string): void => {
  _setMizErrorMessage(message);
};

/**
 * @summary MIZ 翻訳ダイアログの開閉要求を処理する。
 * @param value 更新後のダイアログ表示状態を指定する。
 */
const _handleMizDialogModelUpdate = (value: boolean): void => {
  if (value) return;
  _requestMizClose();
};

/**
 * @summary MIZ 翻訳クローズ確認ダイアログの開閉要求を処理する。
 * @param value 更新後のダイアログ表示状態を指定する。
 */
const _handleMizCloseConfirmDialogModelUpdate = (value: boolean): void => {
  if (value) return;
  _cancelMizClose();
};

/**
 * @summary MIZ 翻訳のクローズ破棄を確定する。
 */
const _handleMizCloseConfirm = (): void => {
  _confirmMizClose();
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
    div.mr-4
      IssueViewer(v-slot="{ toggle, isLoading }")
        v-icon(icon="mdi-alert-circle-outline" variant="text" aria-label="Open issues" :disabled="isLoading" @click="toggle")

  v-main
    v-responsive.main-frame
      v-container.py-2.my-2.py-xs-4.my-xs-4.py-sm-8.my-sm-8.my-md-16.py-md-16.smooth-space
        h1.text-display-large.text-sm-display-large.text-center.smooth-space DCS Translation Japanese
      v-container#announce-area
        v-container.bg-surface.rounded
          v-container#about-this-page.text-center
            p.text-balance 本ページは、Eagle Dynamics社の Digital Combat Simulator World のミッション・キャンペーンを日本語化する<strong>非公式</strong>プロジェクト <a href="https://github.com/5kdn/DCS-Translation-Japanese" target="_blank" rel="noopener noreferrer">5kdn/DCS-Translation-Japanese</a> の Web UI です。
            p.text-balance 翻訳データの利用条件については、<a href="https://github.com/5kdn/DCS-Translation-Japanese/blob/master/DISTRIBUTION_POLICY.md" target="_blank" rel="noopener noreferrer">流通制御ポリシー</a>をご確認ください。プロジェクトの詳細はリポジトリページをご覧ください。

          v-container#announce-desktop-app.text-center
            p.text-balance 翻訳データをmizファイルに追加までを自動化するWindowsデスクトップアプリがダウンロード可能です。
            p.text-balance デスクトップアプリ版ではファイルのアップロードも可能です。
            AppButton(label="デスクトップアプリ" @click="_browseToDesktopAppDownloadPage").mt-2

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
          v-alert(
            type="error"
            variant="tonal"
            :text="_errorAlertText"
            v-if="_hasErrorMessage"
            class="my-4"
            closable
            @click:close="_handleAlertClose"
          )

      v-container#upload-area
        MizTranslationEntrySection(
          :is-loading="_mizIsLoading"
          :error-message="_mizErrorMessage"
          @select-miz="_handleMizFileSelected"
          @clear-error="_handleMizErrorClear"
        )

        UploadDialog(:on-submit="_handleUploadSubmit" :tree-items="treeItems")

      v-container#download-area
        DownloadCategoryTabs(
          :categories="_downloadListState.categories"
          v-model:activeCategoryKey="_activeCategoryKey"
          v-model:searchText="_searchText"
          v-model:updatedAfter="_updatedAfter"
          :search-candidates="_searchCandidates"
          :rows="_visibleRows"
          @error="_handleDownloadError"
        )

      MizTranslationDialog(
        :model-value="_mizIsDialogOpen"
        :loaded-file-name="_mizLoadedFileName"
        :is-loading="_mizIsLoading"
        :filter="_mizFilter"
        :entries="_mizFilteredEntries"
        :visible-entry-count="_mizVisibleEntryCount"
        :total-entry-count="_mizTotalEntryCount"
        :error-message="_mizErrorMessage"
        @update:modelValue="_handleMizDialogModelUpdate"
        @update:show-enabled="_handleMizShowEnabledUpdate"
        @update:show-disabled="_handleMizShowDisabledUpdate"
        @update:show-only-untranslated="_handleMizShowOnlyUntranslatedUpdate"
        @update:hide-non-translatable="_handleMizHideNonTranslatableUpdate"
        @update:hide-empty-source-text="_handleMizHideEmptySourceTextUpdate"
        @toggle-enabled="_handleMizEntryToggleEnabled"
        @update-translation="_handleMizEntryTranslationUpdate"
        @update-sort="_handleMizSortUpdate"
        @import-dictionary="_handleMizDictionaryImport"
        @download="_handleMizDictionaryDownload"
        @error="_handleMizDialogError"
      )

      MizTranslationCloseConfirmDialog(
        :model-value="_mizIsCloseConfirmDialogOpen"
        @update:modelValue="_handleMizCloseConfirmDialogModelUpdate"
        @confirm="_handleMizCloseConfirm"
      )

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
