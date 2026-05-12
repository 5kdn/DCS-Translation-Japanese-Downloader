import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, spyOn, within } from 'storybook/test';
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
  title: 'DownloadFileDialog/DownloadFileDialog',
  component: DownloadFileDialog,
  tags: ['autodocs'],
  args: {
    modelValue: true,
    row: createRow(),
  },
} satisfies Meta<typeof DownloadFileDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    import.meta.env.VITE_TARGET_OWNER = '5kdn';
    import.meta.env.VITE_TARGET_REPO = 'DCS-Translation-Japanese';
    import.meta.env.VITE_TARGET_REF = 'master';

    const dialogScope = within(canvasElement.ownerDocument.body);
    expect(dialogScope.getAllByText('Operation Black Knight').length).toBeGreaterThan(0);
    dialogScope.getByText('ファイル数: 3');
    dialogScope.getByText('README_Translation.md');
    dialogScope.getByText('01 - Operation Black Knight - Mission 1.miz');
  },
};

export const OpenNodeLink: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    import.meta.env.VITE_TARGET_OWNER = '5kdn';
    import.meta.env.VITE_TARGET_REPO = 'DCS-Translation-Japanese';
    import.meta.env.VITE_TARGET_REF = 'master';

    const openSpy = spyOn(window, 'open').mockImplementation(() => null);
    const dialogScope = within(canvasElement.ownerDocument.body);
    const readmeButton = dialogScope.getByRole('button', { name: 'README_Translation.md' }) as HTMLButtonElement;

    readmeButton.click();

    await expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/5kdn/DCS-Translation-Japanese/blob/master/UserMissions/Campaigns/Operation Black Knight/README_Translation.md',
      '_blank',
      'noopener,noreferrer',
    );

    openSpy.mockRestore();
  },
};

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
