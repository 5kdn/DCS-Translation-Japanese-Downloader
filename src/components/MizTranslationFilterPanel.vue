<script setup lang="ts">
/**
 * @summary MIZ 翻訳フィルターパネル props を表す。
 */
type MizTranslationFilterPanelProps = {
  showEnabled: boolean;
  showDisabled: boolean;
  showOnlyUntranslated: boolean;
  hideNonTranslatable: boolean;
  hideEmptySourceText: boolean;
  visibleEntryCount: number;
  totalEntryCount: number;
};

/**
 * @summary MIZ 翻訳フィルター更新イベント名を表す。
 */
type MizTranslationFilterUpdateEventName =
  | 'update:show-enabled'
  | 'update:show-disabled'
  | 'update:show-only-untranslated'
  | 'update:hide-non-translatable'
  | 'update:hide-empty-source-text';

const _props = withDefaults(defineProps<MizTranslationFilterPanelProps>(), {
  showEnabled: true,
  showDisabled: true,
  showOnlyUntranslated: false,
  hideNonTranslatable: true,
  hideEmptySourceText: true,
  visibleEntryCount: 0,
  totalEntryCount: 0,
});

type MizTranslationFilterPanelEmits = {
  'update:show-enabled': [value: boolean];
  'update:show-disabled': [value: boolean];
  'update:show-only-untranslated': [value: boolean];
  'update:hide-non-translatable': [value: boolean];
  'update:hide-empty-source-text': [value: boolean];
};

const emit = defineEmits<MizTranslationFilterPanelEmits>();

type MizTranslationFilterPanelEmit = <K extends keyof MizTranslationFilterPanelEmits>(
  eventName: K,
  ...args: MizTranslationFilterPanelEmits[K]
) => void;

const _emit = emit as MizTranslationFilterPanelEmit;

/**
 * @summary 固定 tooltip 文言を表す。
 */
const _NON_TRANSLATABLE_TOOLTIP_TEXT = `翻訳対象外であると思われる以下の項目を非表示にします
  - キーが DictKey_ から始まらない
  - キーが DictKey_WptName_* に当てはまる
  - キーが DictKey_ActionComment_* に当てはまる
  - キーが DictKey_GroupName_* に当てはまる
  - キーが DictKey_UnitName_* に当てはまる`;

/**
 * @summary 空原文 tooltip 文言を表す。
 */
const _EMPTY_SOURCE_TOOLTIP_TEXT = '原文が空の文字列である項目を非表示にします';

/**
 * @summary boolean 更新イベントを親へ通知する関数を生成する。
 * @param eventName 通知対象イベント名を指定する。
 * @returns 更新イベントハンドラーを返す。
 */
const createBooleanEmitter = <K extends MizTranslationFilterUpdateEventName>(
  eventName: K,
): ((value: boolean | null) => void) => {
  return (value: boolean | null): void => {
    _emit(eventName, value === true);
  };
};

const _handleShowEnabledChange = createBooleanEmitter('update:show-enabled');
const _handleShowDisabledChange = createBooleanEmitter('update:show-disabled');
const _handleShowOnlyUntranslatedChange = createBooleanEmitter('update:show-only-untranslated');
const _handleHideNonTranslatableChange = createBooleanEmitter('update:hide-non-translatable');
const _handleHideEmptySourceTextChange = createBooleanEmitter('update:hide-empty-source-text');
</script>

<template lang="pug">
section.miz-filter-panel
  .d-flex.flex-column.flex-lg-row.align-start.align-lg-center.justify-space-between.ga-4
    .d-flex.flex-wrap.ga-4
      v-checkbox(
        color="primary"
        :model-value="_props.showEnabled"
        hide-details
        density="comfortable"
        label="有効状態を表示"
        data-testid="miz-filter-show-enabled"
        @update:model-value="_handleShowEnabledChange"
      )
      v-checkbox(
        color="primary"
        :model-value="_props.showDisabled"
        hide-details
        density="comfortable"
        label="無効状態を表示"
        data-testid="miz-filter-show-disabled"
        @update:model-value="_handleShowDisabledChange"
      )
      v-checkbox(
        color="primary"
        :model-value="_props.showOnlyUntranslated"
        hide-details
        density="comfortable"
        label="未翻訳のみ表示"
        data-testid="miz-filter-show-only-untranslated"
        @update:model-value="_handleShowOnlyUntranslatedChange"
      )

    v-chip(
      variant="outlined"
      color="primary"
      data-testid="miz-filter-count"
    ) 表示 {{ _props.visibleEntryCount }} / {{ _props.totalEntryCount }} 件

  .d-flex.flex-wrap.ga-4
    .d-flex.align-center
      v-checkbox(
        color="primary"
        :model-value="_props.hideNonTranslatable"
        hide-details
        density="comfortable"
        label="対象外を非表示"
        data-testid="miz-filter-hide-non-translatable"
        @update:model-value="_handleHideNonTranslatableChange"
      )
      v-tooltip(location="top")
        template(v-slot:activator="{ props: activatorProps }")
          v-btn.miz-filter-panel__tooltip-button(
            color="blue-grey"
            v-bind="activatorProps"
            icon="mdi-help-circle-outline"
            variant="text"
            size="small"
            aria-label="対象外を非表示の説明"
            data-testid="miz-filter-hide-non-translatable-tooltip-trigger"
          )
        pre.miz-filter-panel__tooltip-text(data-testid="miz-filter-hide-non-translatable-tooltip-text") {{ _NON_TRANSLATABLE_TOOLTIP_TEXT }}

    .d-flex.align-center
      v-checkbox(
        color="primary"
        :model-value="_props.hideEmptySourceText"
        hide-details
        density="comfortable"
        label="空欄を非表示"
        data-testid="miz-filter-hide-empty-source-text"
        @update:model-value="_handleHideEmptySourceTextChange"
      )
      v-tooltip(location="top")
        template(v-slot:activator="{ props: activatorProps }")
          v-btn.miz-filter-panel__tooltip-button(
            color="blue-grey"
            v-bind="activatorProps"
            icon="mdi-help-circle-outline"
            variant="text"
            size="small"
            aria-label="空欄を非表示の説明"
            data-testid="miz-filter-hide-empty-source-text-tooltip-trigger"
          )
        span(data-testid="miz-filter-hide-empty-source-text-tooltip-text") {{ _EMPTY_SOURCE_TOOLTIP_TEXT }}
</template>

<style scoped lang="scss">
.miz-filter-panel {
  &__tooltip-button {
    margin-inline-start: -0.25rem;
  }

  &__tooltip-text {
    margin: 0;
    font-family: inherit;
    white-space: pre-wrap;
  }
}
</style>
