import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DownloadItem from './DownloadItem.vue';

const meta = {
  title: 'Common/DownloadItem',
  component: DownloadItem,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    title: 'Uh-1H',
    paths: ['DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary'],
  },
} satisfies Meta<typeof DownloadItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Uh-1H',
    paths: ['DCSWorld/Mods/aircraft/Uh-1H/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary'],
  },
};

export const ExtraLong: Story = {
  args: {
    title: 'A'.repeat(120),
    paths: [`${Array(200).fill('a').join('')}/Missions/QuickStart/PG Air Ambulance Easy.miz/l10n/JP/dictionary'`],
  },
};
