import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UploadDescriptionStep from './UploadDescriptionStep.vue';

const meta = {
  title: 'Upload/UploadDescriptionStep',
  component: UploadDescriptionStep,
  tags: ['autodocs'],
  args: {
    targetType: 'Aircraft',
    targetName: 'F-16C',
    fileEntryCount: 1,
    uploadChangeTypes: ['ファイルの追加', 'ファイルの削除', 'バグ修正', '誤字の修正', 'その他の修正'],
    selectedChangeTypes: [],
    overview: '',
    changeDetails: '- briefing.txt を更新',
    notes: 'N/A',
    hasConfirmedNoPersonalInformation: false,
    hasAgreedDistributionPolicy: false,
  },
  render: (args) => ({
    components: { UploadDescriptionStep },
    setup: () => ({ args }),
    template: `
      <UploadDescriptionStep
        v-bind="args"
        v-model:selected-change-types="args.selectedChangeTypes"
        v-model:overview="args.overview"
        v-model:change-details="args.changeDetails"
        v-model:notes="args.notes"
        v-model:has-confirmed-no-personal-information="args.hasConfirmedNoPersonalInformation"
        v-model:has-agreed-distribution-policy="args.hasAgreedDistributionPolicy"
      />
    `,
  }),
} satisfies Meta<typeof UploadDescriptionStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
