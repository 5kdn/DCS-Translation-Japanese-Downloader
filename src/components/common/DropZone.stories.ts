import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import DropZone from './DropZone.vue';

const meta = {
  title: 'Common/DropZone',
  component: DropZone,
  tags: ['autodocs'],
  args: {
    isDragOver: false,
    isLoading: false,
    color: 'primary',
    icon: 'mdi-folder-upload-outline',
    headline: 'ファイルをドロップする',
    buttonLabel: 'ファイルを選択',
  },
} satisfies Meta<typeof DropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('ファイルをドロップする')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'ファイルを選択' })).toBeInTheDocument();
    await expect(canvas.getByText('または')).toBeInTheDocument();
  },
};

export const DragOver: Story = {
  args: {
    isDragOver: true,
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dropZone = canvasElement.querySelector('.drop-zone');
    if (!(dropZone instanceof HTMLElement)) {
      throw new Error('DropZone の取得に失敗した。');
    }

    expect(dropZone.className).toContain('drop-zone--active');
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button')).toBeDisabled();
  },
};

export const MizVariant: Story = {
  args: {
    icon: 'mdi-archive-arrow-up-outline',
    headline: 'MIZ ファイルをドロップする',
    buttonLabel: 'MIZ ファイルを選択',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('MIZ ファイルをドロップする')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'MIZ ファイルを選択' })).toBeInTheDocument();
  },
};

export const SecondaryColor: Story = {
  args: {
    color: 'secondary',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('ファイルをドロップする')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'ファイルを選択' })).toBeInTheDocument();
  },
};
