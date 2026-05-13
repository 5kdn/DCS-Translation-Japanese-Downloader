import type { TreeItem } from '@/types/type';

/**
 * @summary ダウンロード一覧のカテゴリ行を表す。
 */
export type DownloadListRow = {
  name: string;
  items: TreeItem[];
  latestUpdatedAt: Date | null;
  directoryPath: string;
};

/**
 * @summary ダウンロード一覧のフィルター条件を表す。
 */
export type DownloadListFilter = {
  searchText: string;
  updatedAfter: Date | null;
};

/**
 * @summary ファイル一覧ダイアログで使用するツリーノードを表す。
 */
export type DownloadFileTreeNode = {
  id: string;
  name: string;
  path: string;
  nodeType: 'directory' | 'file';
  children?: DownloadFileTreeNode[];
};
