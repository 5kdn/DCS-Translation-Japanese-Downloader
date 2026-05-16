import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import UploadReadmeStep from './UploadReadmeStep.vue';

const existingReadmeText = `# Existing README

- translated
- checked`;

const templateReadmeText = `# README_Translation

## Summary

Describe this mission here.`;

const meta = {
  title: 'Upload/UploadReadmeStep',
  component: UploadReadmeStep,
  tags: ['autodocs'],
  argTypes: {
    onReset: { action: 'reset' },
    onRequestCreate: { action: 'request-create' },
    onContinueWithoutChanges: { action: 'continue-without-changes' },
  },
  args: {
    mode: 'existing',
    readmePath: 'UserMissions/Campaigns/Sample Campaign/README_Translation.md',
    rawUrl: 'https://example.test/README_Translation.md',
    source: 'repository',
    initialText: existingReadmeText,
    editedText: templateReadmeText,
    noticeMessage: null,
    onReset: fn(),
    onRequestCreate: fn(),
    onContinueWithoutChanges: fn(),
  },
  render: (args) => ({
    components: { UploadReadmeStep },
    setup: () => ({ args }),
    template: `
      <UploadReadmeStep
        v-bind="args"
        v-model:edited-text="args.editedText"
      />
    `,
  }),
} satisfies Meta<typeof UploadReadmeStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ExistingRepositoryReadme: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('リポジトリに既存の README_Translation.md があります。')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'ダウンロード' })).toBeInTheDocument();
    await expect(canvas.getByText('translated')).toBeInTheDocument();
  },
};

export const CreateFromTemplate: Story = {
  args: {
    mode: 'create',
    rawUrl: null,
    source: 'template',
    initialText: templateReadmeText,
    editedText: templateReadmeText,
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('テンプレートを編集し、README_Translation.md を作成してください。')).toBeInTheDocument();
    await expect(canvas.getByRole('textbox', { name: 'README_Translation.md' })).toHaveValue(templateReadmeText);
    await expect(canvas.getByRole('button', { name: 'リセット' })).toBeInTheDocument();
  },
};

export const CreateWithFallbackNotice: Story = {
  args: {
    mode: 'create',
    rawUrl: null,
    source: 'template',
    initialText: templateReadmeText,
    editedText: templateReadmeText,
    noticeMessage: 'README_Translation.md の取得に失敗したため、テンプレートを表示しています。',
  },
};

export const ResetAction: Story = {
  args: {
    mode: 'create',
    rawUrl: null,
    source: 'template',
    initialText: templateReadmeText,
    editedText: `${templateReadmeText}\n\nAdditional draft line.`,
    onReset: fn(),
  },
  play: async ({ canvasElement, args }): Promise<void> => {
    const canvas = within(canvasElement);
    const onReset = args.onReset as unknown as ReturnType<typeof fn>;

    onReset.mockClear();

    await userEvent.click(canvas.getByRole('button', { name: 'リセット' }));

    await expect(onReset).toHaveBeenCalledTimes(1);
  },
};
