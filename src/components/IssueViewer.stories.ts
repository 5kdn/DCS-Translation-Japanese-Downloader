import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IssueViewer from './IssueViewer.vue';

const meta = {
  title: 'Issue/IssueViewer',
  component: IssueViewer,
  tags: ['autodocs'],
  render: (args: Record<string, unknown>) => ({
    components: { IssueViewer },
    setup: () => ({ args }),
    template: `
      <IssueViewer v-bind="args" v-slot="{ toggle, isLoading }">
        <v-btn
          icon="mdi-message-alert-outline"
          aria-label="Issues"
          :disabled="isLoading"
          @click="toggle"
        />
      </IssueViewer>
    `,
  }),
} satisfies Meta<typeof IssueViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ZeroIssue: Story = {};

export const Default: Story = {};

export const LongText: Story = {};

export const UndefinedBody: Story = {};

export const Linkify: Story = {};

export const XssSanitized: Story = {};

export const ManyIssues: Story = {};
