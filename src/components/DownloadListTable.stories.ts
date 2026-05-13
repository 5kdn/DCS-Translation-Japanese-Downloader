import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, spyOn, userEvent, waitFor, within } from 'storybook/test';
import type { DownloadListRow } from '@/features/downloads/downloadListModels';
import type { TreeItem } from '@/types/type';
import { installFetchMock } from '../../.storybook/fetchMock';
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
  title: 'DownloadListTable/DownloadListTable',
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

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    import.meta.env.VITE_TARGET_OWNER = '5kdn';
    import.meta.env.VITE_TARGET_REPO = 'DCS-Translation-Japanese';
    import.meta.env.VITE_TARGET_REF = 'master';

    const canvas = within(canvasElement);
    canvas.getByText('名称');
    canvas.getByText('最終更新日');
    canvas.getByText('Operation Black Knight');
    expect(canvas.getAllByRole('button', { name: 'ファイル一覧' })).toHaveLength(2);
    expect(canvas.getAllByRole('button', { name: 'フォルダを見る' })).toHaveLength(2);
    expect(canvas.getAllByRole('button', { name: '報告' })).toHaveLength(2);
    expect(canvas.getAllByRole('button', { name: 'DL' })).toHaveLength(2);
  },
};

export const OpenFileDialog: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    import.meta.env.VITE_TARGET_OWNER = '5kdn';
    import.meta.env.VITE_TARGET_REPO = 'DCS-Translation-Japanese';
    import.meta.env.VITE_TARGET_REF = 'master';

    const canvas = within(canvasElement);
    const fileListButtons = canvas.getAllByRole('button', { name: 'ファイル一覧' });
    fileListButtons[0]?.click();

    const dialogScope = within(canvasElement.ownerDocument.body);
    await expect(dialogScope.getAllByText('Operation Black Knight').length).toBeGreaterThan(0);
  },
};

export const OpenGitHubDirectory: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    import.meta.env.VITE_TARGET_OWNER = '5kdn';
    import.meta.env.VITE_TARGET_REPO = 'DCS-Translation-Japanese';
    import.meta.env.VITE_TARGET_REF = 'master';

    const openSpy = spyOn(window, 'open').mockImplementation(() => null);
    const canvas = within(canvasElement);
    const directoryButtons = canvas.getAllByRole('button', { name: 'フォルダを見る' });

    directoryButtons[1]?.click();

    await expect(openSpy).toHaveBeenCalledWith(
      'https://github.com/5kdn/DCS-Translation-Japanese/blob/master/UserMissions/Campaigns/Operation Black Knight',
      '_blank',
      'noopener,noreferrer',
    );

    openSpy.mockRestore();
  },
};

export const OpenReportDialog: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    const reportButtons = canvas.getAllByRole('button', { name: '報告' });

    await userEvent.click(reportButtons[1] as HTMLElement);

    const dialogScope = within(canvasElement.ownerDocument.body);
    const title = dialogScope.getByLabelText('タイトル') as HTMLInputElement;
    await expect(title.value).toBe('[typo] UserMissions/Campaigns/Operation Black Knight');
  },
};

export const DownloadStarts: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    import.meta.env.VITE_TARGET_OWNER = '5kdn';
    import.meta.env.VITE_TARGET_REPO = 'DCS-Translation-Japanese';
    import.meta.env.VITE_TARGET_REF = 'master';

    const createObjectUrlSpy = spyOn(URL, 'createObjectURL').mockReturnValue('blob:download-list-table');
    const revokeObjectUrlSpy = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const anchorClickSpy = spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const appendChildSpy = spyOn(document.body, 'appendChild');
    const fetchMock = installFetchMock({
      match: ({ url, method }) => method === 'GET' && url.startsWith('https://raw.githubusercontent.com/'),
      handle: () => new Response(new Uint8Array([0x50, 0x4b]).buffer, { status: 200 }),
    });
    const canvas = within(canvasElement);
    const downloadButtons = canvas.getAllByRole('button', { name: 'DL' });

    await userEvent.click(downloadButtons[1] as HTMLElement);

    await waitFor(() => {
      expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    });

    const anchorElement = appendChildSpy.mock.calls[0]?.[0] as HTMLAnchorElement | undefined;
    await expect(anchorElement?.download).toBe('Operation Black Knight.zip');

    fetchMock.restore();
    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    anchorClickSpy.mockRestore();
    appendChildSpy.mockRestore();
  },
};

export const InitialSortByNameAsc: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const rows = Array.from(canvasElement.querySelectorAll('tbody tr'));
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toContain('F-16C');
    expect(rows[1]?.textContent).toContain('Operation Black Knight');
  },
};

export const UpdatedAtUnset: Story = {
  args: {
    rows: [
      createRow('NoDate', 'UserMissions/NoDate', null, [
        createTreeItem('UserMissions/NoDate/Mission_01.miz/l10n/JP/dictionary', '2026-05-10T00:00:00Z'),
      ]),
    ],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    canvas.getByText('NoDate');
    canvas.getByText('-');
  },
};

export const TooltipDisplay: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    const fileListButtons = canvas.getAllByRole('button', { name: 'ファイル一覧' });

    await userEvent.hover(fileListButtons[0] as HTMLElement);

    const dialogScope = within(canvasElement.ownerDocument.body);
    await waitFor(() => {
      expect(dialogScope.getAllByText('ファイル一覧を表示する').length).toBeGreaterThan(0);
    });
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
  play: async ({ canvasElement, args }): Promise<void> => {
    const onError = args.onError as unknown as ReturnType<typeof fn>;
    onError.mockClear();
    const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'DL' }));

    await expect(onError).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  },
};

export const Empty: Story = {
  args: {
    rows: [],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    canvas.getByText('表示できる項目がありません。');
  },
};
