import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useDownloadListState } from '@/composables/useDownloadListState';
import { DownloadListCategoryKey } from '@/features/downloads/downloadListCategory';
import type { TreeItem } from '@/types/type';

const createTreeItem = (path: string, updatedAt: string): TreeItem => {
  return {
    path,
    type: 'blob',
    mode: '100644',
    url: `https://example.test/${path}`,
    sha: `sha-${path}`,
    size: 1,
    updatedAt: new Date(updatedAt),
  };
};

describe('useDownloadListState', () => {
  it('初期状態では最初のタブを選択し、そのカテゴリだけを返す', () => {
    const treeItems = ref<TreeItem[]>([
      createTreeItem(
        'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
        '2026-05-11T00:00:00Z',
      ),
      createTreeItem('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', '2026-05-10T00:00:00Z'),
    ]);

    const state = useDownloadListState(treeItems);

    expect(state.activeCategoryKey.value).toBe(DownloadListCategoryKey.Aircrafts);
    expect(state.currentRows.value.map((row) => row.name)).toEqual(['F-16C']);
    expect(state.visibleRows.value.map((row) => row.name)).toEqual(['F-16C']);
  });

  it('タブ切り替え時に対象カテゴリだけを返す', () => {
    const treeItems = ref<TreeItem[]>([
      createTreeItem('DCSWorld/Mods/campaigns/The Enemy Within/Mission_01.miz/l10n/JP/dictionary', '2026-05-11T00:00:00Z'),
      createTreeItem('UserMissions/Campaigns/Sample Campaign/Mission_01.miz/l10n/JP/dictionary', '2026-05-10T00:00:00Z'),
      createTreeItem('UserMissions/Sample Mission/Mission_01.miz/l10n/JP/dictionary', '2026-05-09T00:00:00Z'),
    ]);

    const state = useDownloadListState(treeItems);
    state.setActiveCategory(DownloadListCategoryKey.UserCampaigns);

    expect(state.activeCategory.value.label).toBe('User Campaigns');
    expect(state.currentRows.value.map((row) => row.name)).toEqual(['Sample Campaign']);
    expect(state.rowsByCategory.value[DownloadListCategoryKey.UserMissions].map((row) => row.name)).toEqual(['Sample Mission']);
  });

  it('名称フィルターと日付フィルターを同時適用する', () => {
    const treeItems = ref<TreeItem[]>([
      createTreeItem(
        'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
        '2026-05-11T00:00:00Z',
      ),
      createTreeItem(
        'DCSWorld/Mods/aircraft/F-14B/Missions/QuickStart/Intercept.miz/l10n/JP/dictionary',
        '2026-05-09T00:00:00Z',
      ),
      createTreeItem('DCSWorld/Mods/aircraft/FA-18C/Missions/QuickStart/Case I.miz/l10n/JP/dictionary', '2026-05-08T00:00:00Z'),
    ]);

    const state = useDownloadListState(treeItems);
    state.setSearchText('f-');
    state.setUpdatedAfter(new Date('2026-05-10T00:00:00Z'));

    expect(state.visibleRows.value.map((row) => row.name)).toEqual(['F-16C']);
    expect(state.hasVisibleRows.value).toBe(true);
  });

  it('フィルター結果が空になった場合に検知できる', () => {
    const treeItems = ref<TreeItem[]>([
      createTreeItem(
        'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
        '2026-05-11T00:00:00Z',
      ),
    ]);

    const state = useDownloadListState(treeItems);
    state.setSearchText('AH-64');

    expect(state.visibleRows.value).toEqual([]);
    expect(state.hasVisibleRows.value).toBe(false);

    state.clearFilter();

    expect(state.visibleRows.value.map((row) => row.name)).toEqual(['F-16C']);
  });

  it('入力データ更新に追従して一覧を再計算する', () => {
    const treeItems = ref<TreeItem[]>([]);
    const state = useDownloadListState(treeItems);

    treeItems.value = [
      createTreeItem('UserMissions/Sample Mission/Mission_01.miz/l10n/JP/dictionary', '2026-05-10T00:00:00Z'),
      createTreeItem('UserMissions/Sample Mission/Mission_02.miz/l10n/JP/dictionary', '2026-05-11T00:00:00Z'),
    ];
    state.setActiveCategory(DownloadListCategoryKey.UserMissions);

    expect(state.currentRows.value).toHaveLength(1);
    expect(state.currentRows.value[0]?.latestUpdatedAt?.toISOString()).toBe('2026-05-11T00:00:00.000Z');
  });
});
