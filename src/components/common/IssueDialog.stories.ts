import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IssueDialog from './IssueDialog.vue';

const meta = {
  title: 'Common/IssueDialog',
  component: IssueDialog,
  tags: ['autodocs'],
  argTypes: {
    'onUpdate:modelValue': { action: 'update:modelValue' },
    onSubmit: { action: 'submit' },
    onClose: { action: 'close' },
    onError: { action: 'error' },
  },
} satisfies Meta<typeof IssueDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
};
