import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UploadDropzone from './UploadDropzone.vue';

const meta = {
  title: 'Upload/UploadDropzone',
  component: UploadDropzone,
  tags: ['autodocs'],
  args: {
    isDragOver: false,
    isLoading: false,
  },
} satisfies Meta<typeof UploadDropzone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DragOver: Story = {
  args: {
    isDragOver: true,
  },
};
