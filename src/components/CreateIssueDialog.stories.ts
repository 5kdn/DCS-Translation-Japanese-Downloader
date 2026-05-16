import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';
import { ref } from 'vue';
import CreateIssueDialog from './CreateIssueDialog.vue';

const meta = {
  title: 'Issue/CreateIssueDialog',
  component: CreateIssueDialog,
  tags: ['autodocs'],
  argTypes: {
    'onUpdate:modelValue': { action: 'update:modelValue' },
    onSubmit: { action: 'submit' },
    onClose: { action: 'close' },
    onError: { action: 'error' },
  },
  args: {
    onSubmit: fn(),
    onClose: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof CreateIssueDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
};

export const Closed: Story = {
  args: {
    modelValue: false,
    path: 'UserMissions/sample.miz',
  },
};

export const LongPath: Story = {
  args: {
    modelValue: true,
    path: `${Array(12).fill('VeryLongFolderName').join('/')}/Mission Name (Night).miz`,
  },
};

export const SpecialCharsPath: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/日本語/スペース あり/[test](a)_b-c.miz',
  },
};

export const PathChangesTitle: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/first.miz',
  },
  render: (args) => ({
    components: { CreateIssueDialog },
    setup() {
      const path = ref(args.path);
      const swapPath = (): void => {
        path.value = 'UserMissions/second.miz';
      };
      return { args, path, swapPath };
    },
    template: `
      <div>
        <button type="button" @click="swapPath">変更</button>
        <CreateIssueDialog v-bind="args" :path="path" />
      </div>
    `,
  }),
};
