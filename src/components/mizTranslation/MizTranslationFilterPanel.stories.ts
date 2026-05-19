import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { useArgs } from 'storybook/preview-api';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { defineComponent } from 'vue';
import MizTranslationFilterPanel from './MizTranslationFilterPanel.vue';

const meta = {
  title: 'MizTranslation/MizTranslationFilterPanel',
  component: MizTranslationFilterPanel,
  tags: ['autodocs'],
  args: {
    showEnabled: true,
    showDisabled: true,
    showOnlyUntranslated: false,
    hideNonTranslatable: true,
    hideEmptySourceText: true,
    visibleEntryCount: 12,
    totalEntryCount: 20,
  },
  render: (args) => {
    const [currentArgs, updateArgs] = useArgs<typeof args>();

    return defineComponent({
      components: { MizTranslationFilterPanel },
      setup: () => {
        /**
         * @summary 有効表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleShowEnabledUpdate = (value: boolean): void => {
          updateArgs({ showEnabled: value });
        };

        /**
         * @summary 無効表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleShowDisabledUpdate = (value: boolean): void => {
          updateArgs({ showDisabled: value });
        };

        /**
         * @summary 未翻訳のみ表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleShowOnlyUntranslatedUpdate = (value: boolean): void => {
          updateArgs({ showOnlyUntranslated: value });
        };

        /**
         * @summary 対象外非表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleHideNonTranslatableUpdate = (value: boolean): void => {
          updateArgs({ hideNonTranslatable: value });
        };

        /**
         * @summary 空欄非表示フィルターを Storybook args へ反映する。
         * @param value 更新値を指定する。
         */
        const handleHideEmptySourceTextUpdate = (value: boolean): void => {
          updateArgs({ hideEmptySourceText: value });
        };

        return {
          args,
          currentArgs,
          handleShowEnabledUpdate,
          handleShowDisabledUpdate,
          handleShowOnlyUntranslatedUpdate,
          handleHideNonTranslatableUpdate,
          handleHideEmptySourceTextUpdate,
        };
      },
      template: `
        <MizTranslationFilterPanel
          :show-enabled="currentArgs.showEnabled"
          :show-disabled="currentArgs.showDisabled"
          :show-only-untranslated="currentArgs.showOnlyUntranslated"
          :hide-non-translatable="currentArgs.hideNonTranslatable"
          :hide-empty-source-text="currentArgs.hideEmptySourceText"
          :visible-entry-count="currentArgs.visibleEntryCount"
          :total-entry-count="currentArgs.totalEntryCount"
          @update:show-enabled="handleShowEnabledUpdate"
          @update:show-disabled="handleShowDisabledUpdate"
          @update:show-only-untranslated="handleShowOnlyUntranslatedUpdate"
          @update:hide-non-translatable="handleHideNonTranslatableUpdate"
          @update:hide-empty-source-text="handleHideEmptySourceTextUpdate"
        />
      `,
    });
  },
} satisfies Meta<typeof MizTranslationFilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('miz-filter-count')).toHaveTextContent('表示 12 / 20 件');
    await expect(canvas.getByLabelText('有効状態を表示')).toBeChecked();
    await expect(canvas.getByLabelText('無効状態を表示')).toBeChecked();
    await expect(canvas.getByLabelText('未翻訳のみ表示')).not.toBeChecked();
  },
};

export const ToggleFilters: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByLabelText('未翻訳のみ表示'));

    await waitFor(() => {
      expect(canvas.getByLabelText('未翻訳のみ表示')).toBeChecked();
    });
  },
};

export const Tooltips: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const nonTranslatableTrigger = canvas.getByLabelText('対象外を非表示の説明');
    const emptySourceTrigger = canvas.getByLabelText('空欄を非表示の説明');

    await expect(canvas.getByTestId('miz-filter-hide-non-translatable-tooltip-trigger')).toBeInTheDocument();
    await expect(canvas.getByTestId('miz-filter-hide-empty-source-text-tooltip-trigger')).toBeInTheDocument();
    await expect(nonTranslatableTrigger).toBeInTheDocument();
    await expect(emptySourceTrigger).toBeInTheDocument();

    await user.hover(nonTranslatableTrigger);
    await waitFor(() => {
      expect(nonTranslatableTrigger).toHaveAttribute('aria-describedby');
    });
    await user.unhover(nonTranslatableTrigger);
    await user.hover(emptySourceTrigger);
    await waitFor(() => {
      expect(emptySourceTrigger).toHaveAttribute('aria-describedby');
    });
  },
};

export const NarrowedResult: Story = {
  args: {
    showOnlyUntranslated: true,
    visibleEntryCount: 3,
    totalEntryCount: 20,
  },
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('miz-filter-count')).toHaveTextContent('表示 3 / 20 件');
    await expect(canvas.getByLabelText('未翻訳のみ表示')).toBeChecked();
  },
};
