import { describe, expect, it } from 'vitest';
import { createDownloadListRows, resolveDirectoryPath, resolveLatestUpdatedAt } from '@/features/downloads/downloadListRow';
import type { TreeItem } from '@/types/type';

const createTreeItem = (path: string, updatedAt?: string, type: TreeItem['type'] = 'blob'): TreeItem => {
  return {
    path,
    type,
    mode: '100644',
    url: `https://example.test/${path}`,
    sha: `sha-${path}`,
    size: 1,
    updatedAt: updatedAt === undefined ? undefined : new Date(updatedAt),
  };
};

describe('downloadListRow', () => {
  it('プレフィックス配下の blob をカテゴリ行へ集約する', () => {
    const rows = createDownloadListRows(
      [
        createTreeItem(
          'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Mission_10.miz/l10n/JP/dictionary',
          '2026-05-10T00:00:00Z',
        ),
        createTreeItem(
          'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Mission_2.miz/l10n/JP/dictionary',
          '2026-05-11T00:00:00Z',
        ),
        createTreeItem(
          'DCSWorld/Mods/aircraft/A-10C/Missions/QuickStart/Mission_1.miz/l10n/JP/dictionary',
          '2026-05-09T00:00:00Z',
        ),
        {
          ...createTreeItem('DCSWorld/Mods/aircraft/F-16C', '2026-05-11T00:00:00Z'),
          type: undefined,
        },
        createTreeItem('UserMissions/Sample/Mission_1.miz/l10n/JP/dictionary', '2026-05-08T00:00:00Z'),
      ],
      'DCSWorld/Mods/aircraft/',
    );

    expect(rows.map((row) => row.name)).toEqual(['A-10C', 'F-16C']);
    expect(rows[1]?.items.map((item) => item.path)).toEqual([
      'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Mission_2.miz/l10n/JP/dictionary',
      'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Mission_10.miz/l10n/JP/dictionary',
    ]);
    expect(rows[1]?.directoryPath).toBe('DCSWorld/Mods/aircraft/F-16C');
    expect(rows[1]?.latestUpdatedAt?.toISOString()).toBe('2026-05-11T00:00:00.000Z');
  });

  it('ignorePatterns に一致するパスを除外する', () => {
    const rows = createDownloadListRows(
      [
        createTreeItem('UserMissions/Campaigns/Sample Campaign/mission_01.miz/l10n/JP/dictionary', '2026-05-10T00:00:00Z'),
        createTreeItem('UserMissions/Sample Mission/mission_01.miz/l10n/JP/dictionary', '2026-05-11T00:00:00Z'),
      ],
      'UserMissions/',
      ['UserMissions/Campaigns/'],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe('Sample Mission');
  });

  it('有効な更新日時がない場合は null を返す', () => {
    const latest = resolveLatestUpdatedAt([
      createTreeItem('UserMissions/Sample/mission_01.miz/l10n/JP/dictionary'),
      {
        ...createTreeItem('UserMissions/Sample/mission_02.miz/l10n/JP/dictionary'),
        updatedAt: new Date(Number.NaN),
      },
    ]);

    expect(latest).toBeNull();
  });

  it('カテゴリ名を含む最短ディレクトリパスを返す', () => {
    const directoryPath = resolveDirectoryPath('The Enemy Within', [
      createTreeItem('DCSWorld/Mods/campaigns/The Enemy Within/Mission_01.miz/l10n/JP/dictionary'),
    ]);

    expect(directoryPath).toBe('DCSWorld/Mods/campaigns/The Enemy Within');
  });
});
