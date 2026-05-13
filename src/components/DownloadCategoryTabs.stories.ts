import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { computed, h, ref } from 'vue';
import { DOWNLOAD_LIST_CATEGORIES, DownloadListCategoryKey } from '@/features/downloads/downloadListCategory';
import { applyDownloadListFilter } from '@/features/downloads/downloadListFilter';
import type { DownloadListFilter, DownloadListRow } from '@/features/downloads/downloadListModels';
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
  title: 'DownloadCategoryTabs/DownloadCategoryTabs',
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
    updatedAfter: null,
    rows: aircraftRows,
    'onUpdate:activeCategoryKey': fn(),
    'onUpdate:searchText': fn(),
    'onUpdate:updatedAfter': fn(),
    onError: fn(),
  },
  render: (args) => ({
    setup: () => {
      const activeCategoryKey = ref(args.activeCategoryKey);
      const searchText = ref(args.searchText);
      const updatedAfter = ref(args.updatedAfter);
      const filter = computed<DownloadListFilter>(() => {
        return {
          searchText: searchText.value,
          updatedAfter: updatedAfter.value,
        };
      });
      const rows = computed<DownloadListRow[]>(() => {
        return applyDownloadListFilter(rowsByCategory[activeCategoryKey.value], filter.value);
      });

      const handleActiveCategoryKey = (value: DownloadListCategoryKey): void => {
        activeCategoryKey.value = value;
        args['onUpdate:activeCategoryKey']?.(value);
      };

      const handleSearchText = (value: string): void => {
        searchText.value = value;
        args['onUpdate:searchText']?.(value);
      };

      const handleUpdatedAfter = (value: Date | null): void => {
        updatedAfter.value = value;
        args['onUpdate:updatedAfter']?.(value);
      };

      const handleError = (message: string): void => {
        args.onError?.(message);
      };

      return () =>
        h('div', [
          h(DownloadCategoryTabs, {
            categories: args.categories,
            activeCategoryKey: activeCategoryKey.value,
            searchText: searchText.value,
            updatedAfter: updatedAfter.value,
            rows: rows.value,
            'onUpdate:activeCategoryKey': handleActiveCategoryKey,
            'onUpdate:searchText': handleSearchText,
            'onUpdate:updatedAfter': handleUpdatedAfter,
            onError: handleError,
          }),
          h(
            'output',
            {
              'data-testid': 'active-row-names',
              style: 'display:none',
            },
            rows.value.map((row) => row.name).join('|'),
          ),
        ]);
    },
  }),
} satisfies Meta<typeof DownloadCategoryTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Aircrafts' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByLabelText('名称で絞り込み')).toHaveValue('');
    canvas.getByLabelText('最終更新日 (以降)');
    await waitFor(() => {
      expect(canvas.getByText('AH-64D')).toBeTruthy();
    });
    await expect(canvas.getByTestId('active-row-names')).toHaveTextContent('F-16C|AH-64D');
  },
};

export const SwitchCategory: Story = {
  play: async ({ canvasElement, args }): Promise<void> => {
    const onActiveCategoryKey = args['onUpdate:activeCategoryKey'] as unknown as ReturnType<typeof fn>;
    onActiveCategoryKey.mockClear();
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('AH-64D')).toBeTruthy();
    });

    await userEvent.click(canvas.getByRole('tab', { name: 'User Campaigns' }));

    await waitFor(() => {
      expect(onActiveCategoryKey).toHaveBeenCalledWith(DownloadListCategoryKey.UserCampaigns);
    });

    await waitFor(() => {
      expect(canvas.getByRole('tab', { name: 'User Campaigns' })).toHaveAttribute('aria-selected', 'true');
      expect(canvas.getByTestId('active-row-names')).toHaveTextContent('Operation Black Knight');
    });

    await userEvent.click(canvas.getByRole('tab', { name: 'DLC Campaigns' }));

    await waitFor(() => {
      expect(onActiveCategoryKey).toHaveBeenCalledWith(DownloadListCategoryKey.DlcCampaigns);
      expect(canvas.getByRole('tab', { name: 'DLC Campaigns' })).toHaveAttribute('aria-selected', 'true');
      expect(canvas.getByTestId('active-row-names')).toHaveTextContent('The Enemy Within');
    });
  },
};

export const InputFilters: Story = {
  play: async ({ canvasElement, args }): Promise<void> => {
    const onSearchText = args['onUpdate:searchText'] as unknown as ReturnType<typeof fn>;
    onSearchText.mockClear();
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('名称で絞り込み'), 'F-16');

    await waitFor(() => {
      expect(onSearchText).toHaveBeenCalled();
    });
    await expect(canvas.getByTestId('active-row-names')).toHaveTextContent('F-16C');
  },
};

export const UpdatedAfterFilter: Story = {
  play: async ({ canvasElement, args }): Promise<void> => {
    const onUpdatedAfter = args['onUpdate:updatedAfter'] as unknown as ReturnType<typeof fn>;
    onUpdatedAfter.mockClear();
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByLabelText('最終更新日 (以降)'));
    const dayLabel = await documentBody.findByText('10');
    const dayButton = dayLabel.closest('button');
    if (dayButton === null) {
      throw new Error('日付ボタンが見つからない');
    }
    dayButton.click();

    await waitFor(() => {
      expect(onUpdatedAfter).toHaveBeenCalled();
    });
    await expect(canvas.getByTestId('active-row-names')).toHaveTextContent('F-16C');

    await userEvent.click(canvas.getByLabelText('Clear 最終更新日 (以降)'));

    await waitFor(() => {
      expect(onUpdatedAfter).toHaveBeenLastCalledWith(null);
    });
    await expect(canvas.getByTestId('active-row-names')).toHaveTextContent('F-16C|AH-64D');
  },
};
