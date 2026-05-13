<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useDate } from 'vuetify';
import type { DownloadListCategoryDefinition, DownloadListCategoryKey } from '@/features/downloads/downloadListCategory';
import type { DownloadListRow } from '@/features/downloads/downloadListModels';
import { normalizeDatePickerValue } from '@/helpers/datePicker';

defineOptions({
  components: {
    DownloadListTable: defineAsyncComponent(() => import('./DownloadListTable.vue')),
  },
});

const props = defineProps<{
  categories: readonly DownloadListCategoryDefinition[];
  activeCategoryKey: DownloadListCategoryKey;
  searchText: string;
  updatedAfter: Date | null;
  rows: DownloadListRow[];
}>();

const emit = defineEmits<{
  (e: 'update:activeCategoryKey', value: DownloadListCategoryKey): void;
  (e: 'update:searchText', value: string): void;
  (e: 'update:updatedAfter', value: Date | null): void;
  (e: 'error', message: string): void;
}>();

const _dateAdapter = useDate();
const _isDateMenuOpen = ref(false);
const _activeCategoryKey = ref<DownloadListCategoryKey>(props.activeCategoryKey);
const _updatedAfterLabel = '最終更新日 (以降)';
const _dateFieldExtraInlinePaddingPx = 24;
const _dateFieldSizerElement = ref<HTMLElement | null>(null);
const _dateFieldInlineSize = ref<string>('auto');
let _dateFieldSizerResizeObserver: ResizeObserver | null = null;

watch(
  () => props.activeCategoryKey,
  (value: DownloadListCategoryKey): void => {
    if (_activeCategoryKey.value === value) return;
    _activeCategoryKey.value = value;
  },
);

watch(_activeCategoryKey, (value: DownloadListCategoryKey): void => {
  if (props.activeCategoryKey === value) return;
  emit('update:activeCategoryKey', value);
});

const _updatedAfterDisplay = computed<string>(() => {
  if (!(props.updatedAfter instanceof Date)) return '';
  if (Number.isNaN(props.updatedAfter.getTime())) return '';

  return props.updatedAfter.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
});

const _tableKey = computed<string>(() => {
  return props.rows.map((row) => `${row.name}:${row.directoryPath}`).join('|');
});

/**
 * @summary 名称フィルター入力を親へ通知する。
 * @param value 入力値を指定する。
 */
const _handleSearchTextChange = (value: string | null): void => {
  emit('update:searchText', value ?? '');
};

/**
 * @summary 日付フィルター入力を親へ通知する。
 * @param value 日付ピッカーが返した値を指定する。
 */
const _handleUpdatedAfterChange = (value: unknown): void => {
  emit('update:updatedAfter', normalizeDatePickerValue(value, _dateAdapter));
  _isDateMenuOpen.value = false;
};

/**
 * @summary 日付フィルターをクリアする。
 */
const _clearUpdatedAfter = (): void => {
  emit('update:updatedAfter', null);
};

/**
 * @summary 子コンポーネントからのエラーを親へ転送する。
 * @param message エラーメッセージを指定する。
 */
const _handleTableError = (message: string): void => {
  emit('error', message);
};

/**
 * @summary 日付フィールドの内容に必要な横幅を再計算する。
 */
const _updateDateFieldInlineSize = (): void => {
  const dateFieldSizerElement = _dateFieldSizerElement.value;
  if (dateFieldSizerElement === null) {
    _dateFieldInlineSize.value = 'auto';
    return;
  }

  const inlineSizePx = Math.ceil(dateFieldSizerElement.getBoundingClientRect().width) + _dateFieldExtraInlinePaddingPx;
  _dateFieldInlineSize.value = `${inlineSizePx}px`;
};

watch(_updatedAfterDisplay, async (): Promise<void> => {
  await nextTick();
  _updateDateFieldInlineSize();
});

onMounted(async (): Promise<void> => {
  await nextTick();
  _updateDateFieldInlineSize();

  if (_dateFieldSizerElement.value === null) {
    return;
  }

  _dateFieldSizerResizeObserver = new ResizeObserver((): void => {
    _updateDateFieldInlineSize();
  });
  _dateFieldSizerResizeObserver.observe(_dateFieldSizerElement.value);
});

onBeforeUnmount((): void => {
  _dateFieldSizerResizeObserver?.disconnect();
});
</script>

<template lang="pug">
h2.d-inline-flex.align-start.text-display-large.mt-10.mb-5 Download
v-card(variant="tonal")
  v-tabs(v-model="_activeCategoryKey" color="primary" grow mandatory)
    v-tab(v-for="category in categories" :key="category.key" :value="category.key") {{ category.label }}

  v-divider

  v-card-text
    .d-flex.flex-column.flex-lg-row.align-lg-center.ga-4.mb-4
      v-text-field.flex-1-1(
        :model-value="searchText"
        label="名称で絞り込み"
        prepend-inner-icon="mdi-magnify"
        autocomplete="off"
        clearable
        density="comfortable"
        hide-details
        @update:model-value="_handleSearchTextChange"
      )

      .filter-date-field-wrap(:style="{ '--date-field-inline-size': _dateFieldInlineSize }")
        v-menu(v-model="_isDateMenuOpen" :close-on-content-click="false" location="bottom end")
          template(v-slot:activator="{ props: menuProps }")
            v-text-field.filter-date-field(
              v-bind="menuProps"
              :model-value="_updatedAfterDisplay"
              :label="_updatedAfterLabel"
              prepend-inner-icon="mdi-calendar"
              readonly
              clearable
              density="comfortable"
              hide-details
              @click:clear.stop="_clearUpdatedAfter"
            )
          v-card.date-picker-menu-card
            v-date-picker(
              :model-value="updatedAfter"
              color="primary"
              hide-header
              @update:model-value="_handleUpdatedAfterChange"
            )
        .date-field-sizer(ref="_dateFieldSizerElement" aria-hidden="true")
          span.date-field-sizer__icon
          span.date-field-sizer__content
            span.date-field-sizer__sample {{ _updatedAfterLabel }}
            span.date-field-sizer__sample {{ _updatedAfterDisplay }}
          span.date-field-sizer__clear

    DownloadListTable(:key="_tableKey" :rows="rows" @error="_handleTableError")
</template>

<style lang="scss" scoped>
.filter-date-field-wrap {
  display: inline-block;
  flex: 0 0 auto;
  inline-size: var(--date-field-inline-size, auto);
  max-inline-size: 100%;
  position: relative;

  .filter-date-field {
    inline-size: 100%;
    max-inline-size: 100%;
  }
}

.date-field-sizer {
  align-items: center;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1.5rem max-content 1.5rem;
  min-block-size: 3rem;
  opacity: 0;
  padding-inline: 0.75rem;
  position: absolute;
  pointer-events: none;
  inset: 0 auto auto 0;
  visibility: hidden;

  &__content {
    display: grid;
  }

  &__sample {
    grid-area: 1 / 1;
    white-space: nowrap;
  }

  &__icon,
  &__clear {
    inline-size: 1.5rem;
  }
}

.date-picker-menu-card {
  inline-size: fit-content;
  max-inline-size: 100%;
}
</style>
