import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { defineComponent } from 'vue';
import MizTranslationEntrySection from './MizTranslationEntrySection.vue';

const meta = {
  title: 'MizTranslation/MizTranslationEntrySection',
  component: MizTranslationEntrySection,
  tags: ['autodocs'],
  args: {
    isLoading: false,
    errorMessage: null,
  },
  render: (args) =>
    defineComponent({
      components: { MizTranslationEntrySection },
      setup: () => {
        return {
          args,
        };
      },
      template: `
        <MizTranslationEntrySection v-bind="args" />
      `,
    }),
} satisfies Meta<typeof MizTranslationEntrySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('MIZ Translation')).toBeInTheDocument();
    await expect(await canvas.findByText('MIZ ファイルをドロップする')).toBeInTheDocument();
    await expect(await canvas.findByRole('button', { name: 'MIZ ファイルを選択' })).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  args: {
    errorMessage: 'MIZ 内に l10n/DEFAULT/dictionary が見つかりません。',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('MIZ 内に l10n/DEFAULT/dictionary が見つかりません。')).toBeInTheDocument();
  },
};

export const DragOver: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const dropzone = canvasElement.querySelector('[data-testid="miz-dropzone"]');
    if (!(dropzone instanceof HTMLElement)) {
      throw new Error('MIZ dropzone の取得に失敗した。');
    }

    dropzone.dispatchEvent(new Event('dragenter', { bubbles: true }));
    await waitFor(() => {
      expect(dropzone.className).toContain('drop-zone--active');
    });
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }): Promise<void> => {
    const input = canvasElement.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('MIZ file input の取得に失敗した。');
    }

    expect(input.disabled).toBe(true);
    await expect((await within(canvasElement).findByRole('button')).hasAttribute('disabled')).toBe(true);
  },
};
