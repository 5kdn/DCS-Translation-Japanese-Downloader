import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DownloadItem from './DownloadItem.vue';

const meta = {
  title: 'Common/DownloadItem',
  component: DownloadItem,
  tags: ['autodocs'],
} satisfies Meta<typeof DownloadItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Uh-1H',
    paths: [
      'DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary1',
      'DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary2',
      'DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary3',
    ],
  },
};

export const ExtraLong: Story = {
  args: {
    title: 'A'.repeat(120),
    paths: [
      `${Array(200).fill('a').join('')}/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary1`,
      `${Array(200).fill('b').join('')}/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary2`,
      `${Array(200).fill('c').join('')}/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary3`,
    ],
  },
};
