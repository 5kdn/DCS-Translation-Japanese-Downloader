import type { MockTreeItem } from '../models/appApiMockTypes';

/**
 * @summary tree API 用のファイル項目を生成する。
 * @param path 対象パスを指定する。
 * @param updatedAt 最終更新日時を指定する。
 * @returns tree API 互換の項目を返す。
 */
export const createTreeItem = (path: string, updatedAt: string): MockTreeItem => {
  return {
    path,
    type: 'blob',
    mode: '100644',
    url: `https://example.test/${encodeURIComponent(path)}`,
    sha: path.replaceAll('/', '-'),
    size: 128,
    updatedAt,
  };
};

export const defaultTreeItems: MockTreeItem[] = [
  createTreeItem(
    'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
    '2026-05-10T00:00:00.000Z',
  ),
  createTreeItem(
    'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Hot Start.miz/l10n/JP/dictionary',
    '2026-05-11T00:00:00.000Z',
  ),
  createTreeItem('DCSWorld/Mods/aircraft/AH-64D/Missions/QuickStart/Hover.miz/l10n/JP/dictionary', '2026-05-08T00:00:00.000Z'),
  createTreeItem('DCSWorld/Mods/campaigns/The Enemy Within/Mission_01.miz/l10n/JP/dictionary', '2026-05-11T00:00:00.000Z'),
  createTreeItem('UserMissions/Campaigns/Operation Black Knight/README_Translation.md', '2026-05-12T00:00:00.000Z'),
  createTreeItem(
    'UserMissions/Campaigns/Operation Black Knight/01 - Operation Black Knight - Mission 1.miz/l10n/JP/dictionary',
    '2026-05-11T00:00:00.000Z',
  ),
  createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md', '2026-05-12T00:00:00.000Z'),
  createTreeItem('UserMissions/Campaigns/Sample Campaign/mission_01.miz/l10n/JP/dictionary', '2026-05-11T00:00:00.000Z'),
  createTreeItem('UserMissions/Sample/README_Translation.md', '2026-05-12T00:00:00.000Z'),
  createTreeItem('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', '2026-05-09T00:00:00.000Z'),
];

export const DEFAULT_RAW_TEXT_BY_PATH: Record<string, string> = {
  'UserMissions/Campaigns/Operation Black Knight/README_Translation.md': '# Existing README\n\nCurrent content.',
  'UserMissions/Campaigns/Sample Campaign/README_Translation.md': '# Existing README\n\nCurrent content.',
  'UserMissions/Sample/README_Translation.md': '# Existing Mission README\n\nCurrent mission content.',
  'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary': 'dictionary = {}',
  'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Hot Start.miz/l10n/JP/dictionary': 'dictionary = {}',
  'DCSWorld/Mods/aircraft/AH-64D/Missions/QuickStart/Hover.miz/l10n/JP/dictionary': 'dictionary = {}',
  'DCSWorld/Mods/campaigns/The Enemy Within/Mission_01.miz/l10n/JP/dictionary': 'dictionary = {}',
  'UserMissions/Campaigns/Operation Black Knight/01 - Operation Black Knight - Mission 1.miz/l10n/JP/dictionary':
    'dictionary = {}',
  'UserMissions/Campaigns/Sample Campaign/mission_01.miz/l10n/JP/dictionary': 'dictionary = {}',
  'UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary': 'dictionary = {}',
};
