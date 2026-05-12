import type { DownloadListFilter, DownloadListRow } from '@/features/downloads/downloadListModels';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * @summary 名称フィルターを適用する。
 * @param rows 一覧行を指定する。
 * @param searchText 部分一致判定に使う検索文字列を指定する。
 * @returns 条件に一致した一覧行を返す。
 */
export const filterDownloadListRowsByName = (rows: DownloadListRow[], searchText: string): DownloadListRow[] => {
  const normalizedSearchText = searchText.trim().toLocaleLowerCase();
  if (normalizedSearchText.length === 0) return rows;

  return rows.filter((row: DownloadListRow): boolean => {
    return row.name.toLocaleLowerCase().includes(normalizedSearchText);
  });
};

/**
 * @summary 最終更新日フィルターを適用する。
 * @param rows 一覧行を指定する。
 * @param updatedAfter 指定日を含む下限日時を指定する。
 * @returns 指定日以降の一覧行を返す。
 */
export const filterDownloadListRowsByUpdatedAfter = (rows: DownloadListRow[], updatedAfter: Date | null): DownloadListRow[] => {
  if (updatedAfter === null || Number.isNaN(updatedAfter.getTime())) return rows;

  return rows.filter((row: DownloadListRow): boolean => {
    return row.latestUpdatedAt !== null && row.latestUpdatedAt.getTime() >= updatedAfter.getTime();
  });
};

/**
 * @summary 一覧行へフィルター条件をまとめて適用する。
 * @param rows 一覧行を指定する。
 * @param filter フィルター条件を指定する。
 * @returns 条件適用後の一覧行を返す。
 */
export const applyDownloadListFilter = (rows: DownloadListRow[], filter: DownloadListFilter): DownloadListRow[] => {
  return filterDownloadListRowsByUpdatedAfter(filterDownloadListRowsByName(rows, filter.searchText), filter.updatedAfter);
};

/**
 * @summary 一覧行を最終更新日の降順で並べ替える。
 * @description 更新日が同一または欠損している場合は名称昇順で安定化する。
 * @param rows 一覧行を指定する。
 * @returns 並べ替え後の一覧行を返す。
 */
export const sortDownloadListRowsByLatestUpdatedAtDesc = (rows: DownloadListRow[]): DownloadListRow[] => {
  return [...rows].sort((left: DownloadListRow, right: DownloadListRow): number => {
    const leftTime = left.latestUpdatedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
    const rightTime = right.latestUpdatedAt?.getTime() ?? Number.NEGATIVE_INFINITY;

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return collator.compare(left.name, right.name);
  });
};
