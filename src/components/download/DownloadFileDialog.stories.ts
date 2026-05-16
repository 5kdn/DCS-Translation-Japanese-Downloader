import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { DownloadListRow } from '@/features/downloads/downloadListModels';
import type { TreeItem } from '@/types/type';
import DownloadFileDialog from './DownloadFileDialog.vue';

const createTreeItem = (path: string): TreeItem => {
  return {
    path,
    type: 'blob',
    mode: undefined,
    url: undefined,
    sha: undefined,
    size: undefined,
    updatedAt: new Date('2026-05-12T00:00:00Z'),
  };
};

const createRow = (): DownloadListRow => {
  return {
    name: 'Operation Black Knight',
    directoryPath: 'UserMissions/Campaigns/Operation Black Knight',
    latestUpdatedAt: new Date('2026-05-12T00:00:00Z'),
    items: [
      createTreeItem('UserMissions/Campaigns/Operation Black Knight/README_Translation.md'),
      createTreeItem(
        'UserMissions/Campaigns/Operation Black Knight/01 - Operation Black Knight - Mission 1.miz/l10n/JP/dictionary',
      ),
      createTreeItem(
        'UserMissions/Campaigns/Operation Black Knight/02 - Operation Black Knight - Mission 2.miz/l10n/JP/dictionary',
      ),
    ],
  };
};

const meta = {
  title: 'Download/DownloadFileDialog',
  component: DownloadFileDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    row: createRow(),
  },
} satisfies Meta<typeof DownloadFileDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    row: {
      name: 'Empty Category',
      directoryPath: 'UserMissions/Empty Category',
      latestUpdatedAt: null,
      items: [],
    },
  },
};
