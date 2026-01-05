import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';
import type { TreeItem } from '@/types/type';
import CategorySection from './CategorySection.vue';

const createTreeItem = (path: string): TreeItem => {
  return {
    path,
    type: 'blob',
    mode: undefined,
    url: undefined,
    sha: undefined,
    size: undefined,
    updatedAt: undefined,
  };
};

const meta = {
  title: 'CategorySection/CategorySection',
  component: CategorySection,
  tags: ['autodocs'],
  argTypes: {
    onError: { action: 'error' },
  },
  args: {
    onError: fn(),
    title: 'UserMissions',
    items: [
      {
        name: 'Uh-1H',
        items: [
          createTreeItem('UserMissions/Uh-1H/Mission_01.miz/l10n/JP/dictionary'),
          createTreeItem('UserMissions/Uh-1H/Mission_02.miz/l10n/JP/dictionary'),
        ],
      },
    ],
  },
} satisfies Meta<typeof CategorySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MultipleItems: Story = {
  args: {
    title: 'Modules',
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
        ],
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
