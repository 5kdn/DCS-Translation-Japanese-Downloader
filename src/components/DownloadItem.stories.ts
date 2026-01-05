import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, spyOn, userEvent, within } from 'storybook/test';
import type { TreeItem } from '@/types/type';
import DownloadItem from './DownloadItem.vue';

const createTreeItem = (path: string, updatedAt?: Date): TreeItem => {
  return {
    path,
    type: 'blob',
    mode: undefined,
    url: undefined,
    sha: undefined,
    size: undefined,
    updatedAt,
  };
};

const formatUpdatedAtForStory = (updatedAt?: unknown): string => {
  if (!(updatedAt instanceof Date)) return '-';
  if (Number.isNaN(updatedAt.getTime())) return '-';
  return updatedAt.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const meta = {
  title: 'DownloadItem/DownloadItem',
  component: DownloadItem,
  tags: ['autodocs'],
  argTypes: {
    onError: { action: 'error' },
  },
  args: {
    onError: fn(),
  },
} satisfies Meta<typeof DownloadItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        name: 'Uh-1H',
        items: [
          createTreeItem(
            'DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary1',
            new Date('2024-01-02T03:04:05Z'),
          ),
          createTreeItem(
            'DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary2',
            new Date('2024-02-03T04:05:06Z'),
          ),
          createTreeItem(
            'DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary3',
            new Date('2024-03-04T05:06:07Z'),
          ),
        ],
      },
    ],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Uh-1H/ }));

    const reportButton = await canvas.findByRole('button', { name: '報告' });
    const downloadButton = await canvas.findByRole('button', { name: 'DL' });

    canvas.getByText('DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary1');
    canvas.getByText('DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary2');
    canvas.getByText('DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary3');

    await expect(reportButton).not.toHaveAttribute('disabled');
    await expect(downloadButton).not.toHaveAttribute('disabled');
  },
};

export const ExtraLong: Story = {
  args: {
    items: [
      {
        name: 'A'.repeat(120),
        items: [
          createTreeItem(`${Array(200).fill('a').join('')}/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary1`),
          createTreeItem(`${Array(200).fill('b').join('')}/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary2`),
          createTreeItem(`${Array(200).fill('c').join('')}/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary3`),
        ],
      },
    ],
  },
};

export const MultipleItems: Story = {
  args: {
    items: [
      {
        name: 'F-16C',
        items: [
          createTreeItem('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary'),
          createTreeItem('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Hot Start.miz/l10n/JP/dictionary'),
        ],
      },
      {
        name: 'F/A-18C',
        items: [
          createTreeItem('DCSWorld/Mods/aircraft/FA-18C/Missions/QuickStart/Case I.miz/l10n/JP/dictionary'),
          createTreeItem('DCSWorld/Mods/aircraft/FA-18C/Missions/QuickStart/Case III.miz/l10n/JP/dictionary'),
          createTreeItem('DCSWorld/Mods/aircraft/FA-18C/Missions/QuickStart/Night Carrier.miz/l10n/JP/dictionary'),
        ],
      },
      {
        name: 'Mi-24P',
        items: [createTreeItem('DCSWorld/Mods/aircraft/Mi-24P/Missions/QuickStart/Start.miz/l10n/JP/dictionary')],
      },
    ],
  },
};

export const ManyPaths: Story = {
  args: {
    items: [
      {
        name: 'A-10C II',
        items: Array.from({ length: 40 }, (_: unknown, i: number): TreeItem => {
          const index = String(i + 1).padStart(2, '0');
          return createTreeItem(`DCSWorld/Mods/aircraft/A-10C_2/Missions/QuickStart/Mission_${index}.miz/l10n/JP/dictionary`);
        }),
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const panels = canvasElement.querySelectorAll('.v-expansion-panel');
    await expect(panels).toHaveLength(0);
  },
};

export const SpecialChars: Story = {
  args: {
    items: [
      {
        name: '日本語/スペース & 記号 _-[]()',
        items: [
          createTreeItem('UserMissions/日本語/スペースあり/ミッション 01.miz/l10n/JP/dictionary'),
          createTreeItem('UserMissions/special_chars/[test](a)_b-c.miz/l10n/JP/dictionary'),
        ],
      },
    ],
  },
};

export const CategoryWithoutPaths: Story = {
  args: {
    items: [
      {
        name: 'NoPaths',
        items: [],
      },
    ],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('NoPaths'));
    const labels = canvasElement.querySelectorAll('.path-text__label');
    await expect(labels).toHaveLength(0);

    await userEvent.click(await canvas.findByRole('button', { name: '報告' }));
    const dialogScope = within(canvasElement.ownerDocument.body);
    const title = dialogScope.getByLabelText('タイトル') as HTMLInputElement;
    await expect(title.value).toBe('[typo] NoPaths');
  },
};

export const UpdatedAtDisplay: Story = {
  args: {
    items: [
      {
        name: 'AH-64D',
        items: [
          createTreeItem('DCSWorld/Mods/aircraft/AH-64D/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary'),
          createTreeItem(
            'DCSWorld/Mods/aircraft/AH-64D/Missions/QuickStart/Hot Start.miz/l10n/JP/dictionary',
            new Date('2024-04-05T06:07:08Z'),
          ),
        ],
      },
    ],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    const panelButton = canvas.getByRole('button', { name: /AH-64D/ });
    const expected = formatUpdatedAtForStory(new Date('2024-04-05T06:07:08Z'));
    within(panelButton).getByText(`最終更新日: ${expected}`);
  },
};

export const UpdatedAtUnset: Story = {
  args: {
    items: [
      {
        name: 'NoDate',
        items: [createTreeItem('DCSWorld/Mods/aircraft/NoDate/Missions/QuickStart/Start.miz/l10n/JP/dictionary')],
      },
    ],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    const panelButton = canvas.getByRole('button', { name: /NoDate/ });
    within(panelButton).getByText('最終更新日: -');
  },
};

export const ManyItems: Story = {
  args: {
    items: Array.from({ length: 12 }, (_: unknown, i: number) => ({
      name: `Module_${String(i + 1).padStart(2, '0')}`,
      items: [createTreeItem(`DCSWorld/Mods/aircraft/Module_${i + 1}/Missions/QuickStart/Mission_01.miz/l10n/JP/dictionary`)],
    })),
  },
};

export const OpenReportDialog: Story = {
  args: {
    items: [
      {
        name: 'Uh-1H',
        items: [
          createTreeItem('DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary'),
        ],
      },
    ],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: '報告' }));
    const dialogScope = within(canvasElement.ownerDocument.body);
    const title = dialogScope.getByLabelText('タイトル') as HTMLInputElement;
    await expect(title.value).toBe('[typo] DCSWorld/Mods/aircraft/Uh-1H');
  },
};

export const DownloadInvalidPathEmitsError: Story = {
  args: {
    items: [
      {
        name: 'BrokenModule',
        items: [createTreeItem('')],
      },
    ],
  },
  play: async ({ canvasElement, args }): Promise<void> => {
    const canvas = within(canvasElement);
    const onError = args.onError as unknown as ReturnType<typeof fn>;
    onError.mockClear();
    const consoleError = spyOn(console, 'error').mockImplementation(() => {});

    await userEvent.click(await canvas.findByRole('button', { name: 'DL' }));
    await expect(onError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  },
};
