import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { useArgs } from 'storybook/preview-api';
import { expect, fn, waitFor, within } from 'storybook/test';
import { h } from 'vue';
import { DOWNLOAD_LIST_CATEGORIES, DownloadListCategoryKey } from '@/features/downloads/downloadListCategory';
import { applyDownloadListFilter } from '@/features/downloads/downloadListFilter';
import type { DownloadListRow } from '@/features/downloads/downloadListModels';
import type { TreeItem } from '@/types/type';
import DownloadCategoryTabs from './DownloadCategoryTabs.vue';

const createTreeItem = (path: string, updatedAt: string): TreeItem => {
  return {
    path,
    type: 'blob',
    mode: undefined,
    url: undefined,
    sha: undefined,
    size: undefined,
    updatedAt: new Date(updatedAt),
  };
};

const createRow = (name: string, directoryPath: string, latestUpdatedAt: string, items: TreeItem[]): DownloadListRow => {
  return {
    name,
    directoryPath,
    latestUpdatedAt: new Date(latestUpdatedAt),
    items,
  };
};

const aircraftRows = [
  createRow('F-16C', 'DCSWorld/Mods/aircraft/F-16C', '2026-05-10T00:00:00Z', [
    createTreeItem(
      'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
      '2026-05-10T00:00:00Z',
    ),
  ]),
  createRow('AH-64D', 'DCSWorld/Mods/aircraft/AH-64D', '2026-05-08T00:00:00Z', [
    createTreeItem('DCSWorld/Mods/aircraft/AH-64D/Missions/QuickStart/Hover.miz/l10n/JP/dictionary', '2026-05-08T00:00:00Z'),
  ]),
];

const dlcCampaignRows = [
  createRow('The Enemy Within', 'DCSWorld/Mods/campaigns/The Enemy Within', '2026-05-11T00:00:00Z', [
    createTreeItem('DCSWorld/Mods/campaigns/The Enemy Within/Mission_01.miz/l10n/JP/dictionary', '2026-05-11T00:00:00Z'),
  ]),
];

const userCampaignRows = [
  createRow('Operation Black Knight', 'UserMissions/Campaigns/Operation Black Knight', '2026-05-12T00:00:00Z', [
    createTreeItem('UserMissions/Campaigns/Operation Black Knight/README_Translation.md', '2026-05-12T00:00:00Z'),
  ]),
];

const userMissionRows = [
  createRow('Georgian Oil War', 'UserMissions/Georgian Oil War', '2026-05-09T00:00:00Z', [
    createTreeItem('UserMissions/Georgian Oil War/Mission_01.miz/l10n/JP/dictionary', '2026-05-09T00:00:00Z'),
  ]),
];

const rowsByCategory: Record<DownloadListCategoryKey, DownloadListRow[]> = {
  [DownloadListCategoryKey.Aircrafts]: aircraftRows,
  [DownloadListCategoryKey.DlcCampaigns]: dlcCampaignRows,
  [DownloadListCategoryKey.UserCampaigns]: userCampaignRows,
  [DownloadListCategoryKey.UserMissions]: userMissionRows,
};

const meta = {
  title: 'Download/DownloadCategoryTabs',
  component: DownloadCategoryTabs,
  tags: ['autodocs'],
  argTypes: {
    'onUpdate:activeCategoryKey': { action: 'update:activeCategoryKey' },
    'onUpdate:searchText': { action: 'update:searchText' },
    'onUpdate:updatedAfter': { action: 'update:updatedAfter' },
    onError: { action: 'error' },
  },
  args: {
    categories: DOWNLOAD_LIST_CATEGORIES,
    activeCategoryKey: DownloadListCategoryKey.Aircrafts,
    searchText: '',
    searchCandidates: aircraftRows.map((row) => row.name),
    updatedAfter: null,
    rows: aircraftRows,
    'onUpdate:activeCategoryKey': fn(),
    'onUpdate:searchText': fn(),
    'onUpdate:updatedAfter': fn(),
    onError: fn(),
  },
  render: (args) => {
    const [, updateArgs] = useArgs<typeof args>();

    /**
     * @summary カテゴリに応じた行一覧を返す。
     * @returns 表示対象の一覧行を返す。
     */
    const resolveRows = (): DownloadListRow[] => {
      return applyDownloadListFilter(rowsByCategory[args.activeCategoryKey], {
        searchText: args.searchText,
        updatedAfter: args.updatedAfter,
      });
    };

    /**
     * @summary カテゴリに応じた検索候補一覧を返す。
     * @returns 検索候補一覧を返す。
     */
    const resolveSearchCandidates = (): readonly string[] => {
      return rowsByCategory[args.activeCategoryKey].map((row) => row.name);
    };

    /**
     * @summary カテゴリ変更を Storybook args へ反映する。
     * @param value 更新後のカテゴリを指定する。
     */
    const handleActiveCategoryKey = (value: DownloadListCategoryKey): void => {
      updateArgs({ activeCategoryKey: value });
      args['onUpdate:activeCategoryKey']?.(value);
    };

    /**
     * @summary 名称フィルター変更を Storybook args へ反映する。
     * @param value 更新後の検索文字列を指定する。
     */
    const handleSearchText = (value: string): void => {
      updateArgs({ searchText: value });
      args['onUpdate:searchText']?.(value);
    };

    /**
     * @summary 更新日フィルター変更を Storybook args へ反映する。
     * @param value 更新後の日時を指定する。
     */
    const handleUpdatedAfter = (value: Date | null): void => {
      updateArgs({ updatedAfter: value });
      args['onUpdate:updatedAfter']?.(value);
    };

    /**
     * @summary エラーイベントを Storybook action へ中継する。
     * @param message エラーメッセージを指定する。
     */
    const handleError = (message: string): void => {
      args.onError?.(message);
    };

    return () =>
      h(DownloadCategoryTabs, {
        categories: args.categories,
        activeCategoryKey: args.activeCategoryKey,
        searchText: args.searchText,
        searchCandidates: resolveSearchCandidates(),
        updatedAfter: args.updatedAfter,
        rows: resolveRows(),
        'onUpdate:activeCategoryKey': handleActiveCategoryKey,
        'onUpdate:searchText': handleSearchText,
        'onUpdate:updatedAfter': handleUpdatedAfter,
        onError: handleError,
      });
  },
} satisfies Meta<typeof DownloadCategoryTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SwitchCategory: Story = {
  args: {
    activeCategoryKey: DownloadListCategoryKey.UserCampaigns,
  },
};

export const InputFilters: Story = {
  args: {
    searchText: 'f16',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText('F-16C')).toBeInTheDocument();
    await expect(canvas.queryByText('AH-64D')).not.toBeInTheDocument();
  },
};

export const UpdatedAfterFilter: Story = {
  args: {
    updatedAfter: new Date('2026-05-10T00:00:00Z'),
  },
};

export const CombinedFilters: Story = {
  args: {
    searchText: 'f16',
    updatedAfter: new Date('2026-05-10T00:00:00Z'),
  },
};

export const SearchCandidateSelection: Story = {
  args: {
    searchText: 'AH-64D',
  },
};

export const EmptyAfterFiltering: Story = {
  args: {
    searchText: 'zzz',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await waitFor(
      async (): Promise<void> => {
        await expect(await canvas.findByText('表示できる項目がありません。')).toBeInTheDocument();
        await expect(canvas.queryByText('F-16C')).not.toBeInTheDocument();
        await expect(canvas.queryByText('AH-64D')).not.toBeInTheDocument();
      },
      { timeout: 5_000 },
    );
  },
};
