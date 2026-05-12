import type { MaybeRefOrGetter } from 'vue';
import { computed, ref, toValue } from 'vue';
import { DOWNLOAD_LIST_CATEGORIES, DownloadListCategoryKey } from '@/features/downloads/downloadListCategory';
import { applyDownloadListFilter, sortDownloadListRowsByLatestUpdatedAtDesc } from '@/features/downloads/downloadListFilter';
import type { DownloadListFilter, DownloadListRow } from '@/features/downloads/downloadListModels';
import { createDownloadListRows } from '@/features/downloads/downloadListRow';
import type { TreeItem } from '@/types/type';

type DownloadListRowsByCategory = Record<DownloadListCategoryKey, DownloadListRow[]>;

/**
 * @summary ダウンロード一覧のタブ選択とフィルター状態を管理する。
 * @param treeItems ツリー項目一覧を指定する。
 * @returns 一覧表示に必要な状態と操作関数を返す。
 */
export const useDownloadListState = (treeItems: MaybeRefOrGetter<TreeItem[]>) => {
  const activeCategoryKey = ref<DownloadListCategoryKey>(DOWNLOAD_LIST_CATEGORIES[0].key);
  const searchText = ref('');
  const updatedAfter = ref<Date | null>(null);

  const filter = computed<DownloadListFilter>(() => {
    return {
      searchText: searchText.value,
      updatedAfter: updatedAfter.value,
    };
  });

  const rowsByCategory = computed<DownloadListRowsByCategory>(() => {
    const source = toValue(treeItems);

    return DOWNLOAD_LIST_CATEGORIES.reduce<DownloadListRowsByCategory>(
      (acc, category) => {
        acc[category.key] = sortDownloadListRowsByLatestUpdatedAtDesc(
          createDownloadListRows(source, category.prefix, category.ignorePatterns),
        );
        return acc;
      },
      {
        [DownloadListCategoryKey.Aircrafts]: [],
        [DownloadListCategoryKey.DlcCampaigns]: [],
        [DownloadListCategoryKey.UserCampaigns]: [],
        [DownloadListCategoryKey.UserMissions]: [],
      },
    );
  });

  const activeCategory = computed(() => {
    return DOWNLOAD_LIST_CATEGORIES.find((category) => category.key === activeCategoryKey.value) ?? DOWNLOAD_LIST_CATEGORIES[0];
  });

  const currentRows = computed<DownloadListRow[]>(() => {
    return rowsByCategory.value[activeCategoryKey.value];
  });

  const visibleRows = computed<DownloadListRow[]>(() => {
    return applyDownloadListFilter(currentRows.value, filter.value);
  });

  const hasVisibleRows = computed((): boolean => visibleRows.value.length > 0);

  /**
   * @summary 選択中カテゴリを更新する。
   * @param categoryKey 選択対象のカテゴリキーを指定する。
   */
  const setActiveCategory = (categoryKey: DownloadListCategoryKey): void => {
    activeCategoryKey.value = categoryKey;
  };

  /**
   * @summary 名称フィルターを更新する。
   * @param value 検索文字列を指定する。
   */
  const setSearchText = (value: string): void => {
    searchText.value = value;
  };

  /**
   * @summary 更新日フィルターを更新する。
   * @param value 指定日を含む下限日時を指定する。
   */
  const setUpdatedAfter = (value: Date | null): void => {
    updatedAfter.value = value;
  };

  /**
   * @summary フィルター条件を初期化する。
   */
  const clearFilter = (): void => {
    searchText.value = '';
    updatedAfter.value = null;
  };

  return {
    categories: DOWNLOAD_LIST_CATEGORIES,
    activeCategoryKey,
    activeCategory,
    searchText,
    updatedAfter,
    filter,
    rowsByCategory,
    currentRows,
    visibleRows,
    hasVisibleRows,
    setActiveCategory,
    setSearchText,
    setUpdatedAfter,
    clearFilter,
  };
};
