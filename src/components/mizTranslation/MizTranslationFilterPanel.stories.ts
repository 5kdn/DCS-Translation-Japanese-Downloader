import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { defineComponent, ref, watch } from 'vue';
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
  render: (args) =>
    defineComponent({
      components: { MizTranslationFilterPanel },
      props: {
        showEnabled: {
          type: Boolean,
          required: true,
        },
        showDisabled: {
          type: Boolean,
          required: true,
        },
        showOnlyUntranslated: {
          type: Boolean,
          required: true,
        },
        hideNonTranslatable: {
          type: Boolean,
          required: true,
        },
        hideEmptySourceText: {
          type: Boolean,
          required: true,
        },
        visibleEntryCount: {
          type: Number,
          required: true,
        },
        totalEntryCount: {
          type: Number,
          required: true,
        },
      },
      setup: () => {
        const showEnabled = ref(args.showEnabled);
        const showDisabled = ref(args.showDisabled);
        const showOnlyUntranslated = ref(args.showOnlyUntranslated);
        const hideNonTranslatable = ref(args.hideNonTranslatable);
        const hideEmptySourceText = ref(args.hideEmptySourceText);

        watch(
          () => args.showEnabled,
          (value) => {
            showEnabled.value = value;
          },
        );
        watch(
          () => args.showDisabled,
          (value) => {
            showDisabled.value = value;
          },
        );
        watch(
          () => args.showOnlyUntranslated,
          (value) => {
            showOnlyUntranslated.value = value;
          },
        );
        watch(
          () => args.hideNonTranslatable,
          (value) => {
            hideNonTranslatable.value = value;
          },
        );
        watch(
          () => args.hideEmptySourceText,
          (value) => {
            hideEmptySourceText.value = value;
          },
        );

        /**
         * @summary 有効表示フィルターを更新する。
         * @param value 更新値を指定する。
         */
        const handleShowEnabledUpdate = (value: boolean): void => {
          showEnabled.value = value;
        };

        /**
         * @summary 無効表示フィルターを更新する。
         * @param value 更新値を指定する。
         */
        const handleShowDisabledUpdate = (value: boolean): void => {
          showDisabled.value = value;
        };

        /**
         * @summary 未翻訳のみ表示フィルターを更新する。
         * @param value 更新値を指定する。
         */
        const handleShowOnlyUntranslatedUpdate = (value: boolean): void => {
          showOnlyUntranslated.value = value;
        };

        /**
         * @summary 対象外非表示フィルターを更新する。
         * @param value 更新値を指定する。
         */
        const handleHideNonTranslatableUpdate = (value: boolean): void => {
          hideNonTranslatable.value = value;
        };

        /**
         * @summary 空欄非表示フィルターを更新する。
         * @param value 更新値を指定する。
         */
        const handleHideEmptySourceTextUpdate = (value: boolean): void => {
          hideEmptySourceText.value = value;
        };

        return {
          args,
          showEnabled,
          showDisabled,
          showOnlyUntranslated,
          hideNonTranslatable,
          hideEmptySourceText,
          handleShowEnabledUpdate,
          handleShowDisabledUpdate,
          handleShowOnlyUntranslatedUpdate,
          handleHideNonTranslatableUpdate,
          handleHideEmptySourceTextUpdate,
        };
      },
      template: `
        <MizTranslationFilterPanel
          :show-enabled="showEnabled"
          :show-disabled="showDisabled"
          :show-only-untranslated="showOnlyUntranslated"
          :hide-non-translatable="hideNonTranslatable"
          :hide-empty-source-text="hideEmptySourceText"
          :visible-entry-count="args.visibleEntryCount"
          :total-entry-count="args.totalEntryCount"
          @update:show-enabled="handleShowEnabledUpdate"
          @update:show-disabled="handleShowDisabledUpdate"
          @update:show-only-untranslated="handleShowOnlyUntranslatedUpdate"
          @update:hide-non-translatable="handleHideNonTranslatableUpdate"
          @update:hide-empty-source-text="handleHideEmptySourceTextUpdate"
        />
      `,
    }),
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
