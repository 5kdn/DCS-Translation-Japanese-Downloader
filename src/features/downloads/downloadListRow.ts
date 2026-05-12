import type { DownloadListRow } from '@/features/downloads/downloadListModels';
import type { TreeItem } from '@/types/type';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * @summary カテゴリ内で最も新しい更新日時を返す。
 * @param items 対象ファイル一覧を指定する。
 * @returns 有効な更新日時が存在する場合は最大日時を返し、存在しない場合は null を返す。
 */
export const resolveLatestUpdatedAt = (items: TreeItem[]): Date | null => {
  const timestamps = items
    .map((item: TreeItem): Date | null => {
      if (!(item.updatedAt instanceof Date)) return null;
      if (Number.isNaN(item.updatedAt.getTime())) return null;
      return item.updatedAt;
    })
    .filter((updatedAt: Date | null): updatedAt is Date => updatedAt !== null);

  if (timestamps.length === 0) return null;

  return timestamps.reduce((latest: Date, current: Date): Date => {
    return current.getTime() > latest.getTime() ? current : latest;
  });
};

/**
 * @summary 一覧行に対応するディレクトリパスを解決する。
 * @description カテゴリ名が最初に現れる位置までを優先して返す。
 * @param name カテゴリ名を指定する。
 * @param items 対象ファイル一覧を指定する。
 * @returns ディレクトリパスを返す。
 */
export const resolveDirectoryPath = (name: string, items: TreeItem[]): string => {
  const firstPath = items[0]?.path ?? '';
  if (name.length === 0 || firstPath.length === 0) return name || firstPath;

  const index = firstPath.indexOf(name);
  return index >= 0 ? firstPath.slice(0, index + name.length) : firstPath;
};

/**
 * @summary 指定プレフィックス配下のファイルからカテゴリ行一覧を生成する。
 * @param treeItems リポジトリツリー項目一覧を指定する。
 * @param prefix カテゴリ抽出対象とするパスのプレフィックスを指定する。
 * @param ignorePatterns カテゴリ抽出時に除外するパスプレフィックス一覧を指定する。
 * @returns カテゴリ名ごとに集約した一覧行を返す。
 */
export const createDownloadListRows = (
  treeItems: TreeItem[],
  prefix: string,
  ignorePatterns: string[] = [],
): DownloadListRow[] => {
  const categories = new Map<string, TreeItem[]>();

  treeItems.forEach((item: TreeItem): void => {
    const path = item.path;
    if (typeof path !== 'string' || !path.startsWith(prefix)) return;
    if (item.type !== 'blob') return;
    if (ignorePatterns.some((pattern: string): boolean => path.startsWith(pattern))) return;

    const name = path.slice(prefix.length).split('/')[0];
    if (name === undefined || name.length === 0) return;

    const current = categories.get(name) ?? [];
    current.push(item);
    categories.set(name, current);
  });

  return [...categories.entries()]
    .sort(([left], [right]): number => collator.compare(left, right))
    .map(([name, items]): DownloadListRow => {
      const sortedItems = [...items].sort((left: TreeItem, right: TreeItem): number => {
        return collator.compare(left.path ?? '', right.path ?? '');
      });

      return {
        name,
        items: sortedItems,
        latestUpdatedAt: resolveLatestUpdatedAt(sortedItems),
        directoryPath: resolveDirectoryPath(name, sortedItems),
      };
    });
};
