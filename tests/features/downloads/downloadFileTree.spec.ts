import { describe, expect, it } from 'vitest';
import { createDownloadFileTreeNodes } from '@/features/downloads/downloadFileTree';
import type { TreeItem } from '@/types/type';

const createTreeItem = (path: string, type: TreeItem['type'] = 'blob'): TreeItem => {
  return {
    path,
    type,
    mode: '100644',
    url: `https://example.test/${path}`,
    sha: `sha-${path}`,
    size: 1,
    updatedAt: new Date('2026-05-11T00:00:00Z'),
  };
};

describe('downloadFileTree', () => {
  it('パス配列からディレクトリとファイルのツリーを生成する', () => {
    const nodes = createDownloadFileTreeNodes([
      createTreeItem('UserMissions/Sample/Mission_02.miz/l10n/JP/dictionary'),
      createTreeItem('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary'),
    ]);

    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.path).toBe('UserMissions');
    expect(nodes[0]?.nodeType).toBe('directory');

    const missionNames = nodes[0]?.children?.[0]?.children?.map((child) => child.name);
    expect(missionNames).toEqual(['Mission_01.miz', 'Mission_02.miz']);
  });

  it('空パスや blob 以外を無視する', () => {
    const nodes = createDownloadFileTreeNodes([
      createTreeItem('', 'blob'),
      {
        ...createTreeItem('UserMissions/Sample'),
        type: undefined,
      },
    ]);

    expect(nodes).toEqual([]);
  });

  it('同階層ではディレクトリを先に並べる', () => {
    const nodes = createDownloadFileTreeNodes([createTreeItem('Root/file.txt'), createTreeItem('Root/folder/nested.txt')]);

    expect(nodes[0]?.children?.map((child) => `${child.nodeType}:${child.name}`)).toEqual([
      'directory:folder',
      'file:file.txt',
    ]);
  });
});
