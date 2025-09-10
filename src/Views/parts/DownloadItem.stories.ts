import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';
import DownloadItem from './DownloadItem.vue';

const meta = {
  title: 'Parts/DownloadItem',
  component: DownloadItem,
  tags: ['autodocs'],
  argTypes: {},
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof DownloadItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    path: "aaa/bbb/ccc"
  },
};

export const ExtraLong: Story = {
  args: {
    path: Array(200).fill("a").join("")+"/asdf"
  },
};
