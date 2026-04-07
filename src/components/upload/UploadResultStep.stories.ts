import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UploadResultStep from './UploadResultStep.vue';

const meta = {
  title: 'Upload/UploadResultStep',
  component: UploadResultStep,
  tags: ['autodocs'],
} satisfies Meta<typeof UploadResultStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    result: {
      isSuccess: true,
      message: 'PR #123 を作成しました。',
      prNumber: 123,
      prUrl: 'https://example.test/pr/123',
      branchName: 'feature/Aircraft/F-16C/AddFile--20260223-161501JST',
      commitSha: 'abc123',
      note: 'created',
    },
  },
};

export const Failure: Story = {
  args: {
    result: {
      isSuccess: false,
      message: 'エラーが発生しました。',
    },
  },
};

export const Empty: Story = {
  args: {
    result: null,
  },
};
