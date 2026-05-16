import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';
import type { DownloadListRow } from '@/features/downloads/downloadListModels';
import type { TreeItem } from '@/types/type';
import DownloadListTable from './DownloadListTable.vue';

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

const createRow = (name: string, directoryPath: string, latestUpdatedAt: string | null, items: TreeItem[]): DownloadListRow => {
  return {
    name,
    directoryPath,
    latestUpdatedAt: latestUpdatedAt === null ? null : new Date(latestUpdatedAt),
    items,
  };
};

const meta = {
  title: 'Download/DownloadListTable',
  component: DownloadListTable,
  tags: ['autodocs'],
  argTypes: {
    onError: { action: 'error' },
  },
  args: {
    onError: fn(),
    rows: [
      createRow('Operation Black Knight', 'UserMissions/Campaigns/Operation Black Knight', '2026-05-12T00:00:00Z', [
        createTreeItem('UserMissions/Campaigns/Operation Black Knight/README_Translation.md', '2026-05-12T00:00:00Z'),
        createTreeItem(
          'UserMissions/Campaigns/Operation Black Knight/01 - Operation Black Knight - Mission 1.miz/l10n/JP/dictionary',
          '2026-05-11T00:00:00Z',
        ),
      ]),
      createRow('F-16C', 'DCSWorld/Mods/aircraft/F-16C', '2026-05-10T00:00:00Z', [
        createTreeItem(
          'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary',
          '2026-05-10T00:00:00Z',
        ),
      ]),
    ],
  },
} satisfies Meta<typeof DownloadListTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UpdatedAtUnset: Story = {
  args: {
    rows: [
      createRow('NoDate', 'UserMissions/NoDate', null, [
        createTreeItem('UserMissions/NoDate/Mission_01.miz/l10n/JP/dictionary', '2026-05-10T00:00:00Z'),
      ]),
    ],
  },
};

export const SortByUpdatedAt: Story = {
  args: {
    rows: [
      createRow('Alpha', 'UserMissions/Alpha', '2026-05-12T00:00:00Z', [
        createTreeItem('UserMissions/Alpha/Mission_01.miz/l10n/JP/dictionary', '2026-05-12T00:00:00Z'),
      ]),
      createRow('Zulu', 'UserMissions/Zulu', '2026-05-10T00:00:00Z', [
        createTreeItem('UserMissions/Zulu/Mission_01.miz/l10n/JP/dictionary', '2026-05-10T00:00:00Z'),
      ]),
    ],
  },
};

export const DownloadErrorEmitsError: Story = {
  args: {
    onError: fn(),
    rows: [
      createRow('BrokenModule', 'UserMissions/BrokenModule', '2026-05-12T00:00:00Z', [
        {
          path: '',
          type: 'blob',
          mode: undefined,
          url: undefined,
          sha: undefined,
          size: undefined,
          updatedAt: new Date('2026-05-12T00:00:00Z'),
        },
      ]),
    ],
  },
};

export const Empty: Story = {
  args: {
    rows: [],
  },
};
