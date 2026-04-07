import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UploadConfirmStep from './UploadConfirmStep.vue';

const meta = {
  title: 'Upload/UploadConfirmStep',
  component: UploadConfirmStep,
  tags: ['autodocs'],
  args: {
    fileEntries: [{ path: 'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt', isDirectory: false }],
    expandedConfirmPanels: [0],
    selectedFolderName: 'F-16C',
    fileSizeText: '120 B',
    fileEntryCount: 1,
    targetType: 'Aircraft',
    targetName: 'F-16C',
    selectedChangeTypes: ['ファイルの追加'],
    title: '[Aircraft][F-16C]ファイルの追加',
    overview: 'アップロード確認用の概要です。',
    changeDetails: '- briefing.txt を更新',
    notes: 'N/A',
  },
} satisfies Meta<typeof UploadConfirmStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
