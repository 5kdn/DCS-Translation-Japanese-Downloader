import type { DownloadFileTreeNode } from '@/features/downloads/downloadListModels';
import type { TreeItem } from '@/types/type';

type MutableDownloadFileTreeNode = DownloadFileTreeNode & {
  children: MutableDownloadFileTreeNode[];
  childMap: Map<string, MutableDownloadFileTreeNode>;
};

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * @summary ツリーノード一覧を表示順に並べ替える。
 * @param nodes 並べ替え対象ノード一覧を指定する。
 * @returns ディレクトリ優先かつ名称昇順に整列したノード一覧を返す。
 */
const sortNodes = (nodes: MutableDownloadFileTreeNode[]): DownloadFileTreeNode[] => {
  return [...nodes]
    .sort((left: MutableDownloadFileTreeNode, right: MutableDownloadFileTreeNode): number => {
      if (left.nodeType !== right.nodeType) {
        return left.nodeType === 'directory' ? -1 : 1;
      }
      return collator.compare(left.name, right.name);
    })
    .map((node: MutableDownloadFileTreeNode): DownloadFileTreeNode => {
      const childNodes = [...node.childMap.values()];
      const children = childNodes.length > 0 ? sortNodes(childNodes) : undefined;
      return {
        id: node.id,
        name: node.name,
        path: node.path,
        nodeType: node.nodeType,
        ...(children === undefined ? {} : { children }),
      };
    });
};

/**
 * @summary ファイル一覧から v-treeview 用ノード構造を生成する。
 * @param items 対象ファイル一覧を指定する。
 * @returns ルートノード一覧を返す。
 */
export const createDownloadFileTreeNodes = (items: TreeItem[]): DownloadFileTreeNode[] => {
  const rootNodes = new Map<string, MutableDownloadFileTreeNode>();

  items.forEach((item: TreeItem): void => {
    const path = item.path;
    if (item.type !== 'blob' || typeof path !== 'string' || path.length === 0) return;

    const segments = path.split('/').filter((segment: string): boolean => segment.length > 0);
    if (segments.length === 0) return;

    let currentLevel = rootNodes;
    let currentPath = '';

    segments.forEach((segment: string, index: number): void => {
      currentPath = currentPath.length === 0 ? segment : `${currentPath}/${segment}`;
      const isFile = index === segments.length - 1;
      let node = currentLevel.get(segment);

      if (node === undefined) {
        node = {
          id: currentPath,
          name: segment,
          path: currentPath,
          nodeType: isFile ? 'file' : 'directory',
          children: [],
          childMap: new Map<string, MutableDownloadFileTreeNode>(),
        };
        currentLevel.set(segment, node);
      }

      if (!isFile) {
        currentLevel = node.childMap;
      }
    });
  });

  return sortNodes([...rootNodes.values()]);
};
