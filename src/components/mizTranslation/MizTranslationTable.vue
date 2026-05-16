<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { copyText } from '@/composables/useClipboard';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import {
  type MizDictionarySortKey,
  type MizDictionarySortOrder,
  sortMizDictionaryEntries,
  sortMizDictionaryEntriesForTable,
} from '@/features/mizTranslation/mizDictionarySort';
import type { MizTranslationExportSort } from '@/features/mizTranslation/mizTranslationDownloadModels';

/**
 * @summary MIZ 翻訳テーブル props を表す。
 */
type MizTranslationTableProps = {
  entries: MizDictionaryEntry[];
};

/**
 * @summary MIZ 翻訳テーブルのソート用列 key を表す。
 */
type MizTranslationTableColumnKey = 'enabledSortValue' | 'keySortValue' | 'sourceTextSortValue' | 'translatedTextSortValue';

/**
 * @summary MIZ 翻訳テーブル header 定義を表す。
 */
type MizTranslationTableHeader = {
  title: string;
  key: MizTranslationTableColumnKey;
  sortable: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
  cellProps?: {
    class: string;
  };
  headerProps?: {
    class: string;
  };
};

/**
 * @summary MIZ 翻訳テーブルへ渡す描画用行データを表す。
 */
type MizTranslationTableRow = {
  entry: MizDictionaryEntry;
  enabledSortValue: string;
  keySortValue: string;
  sourceTextSortValue: string;
  translatedTextSortValue: string;
};

/**
 * @summary Vuetify の item slot から受け取る行データの型を表す。
 */
type MizTranslationTableSlotItem = MizTranslationTableRow | { raw: MizTranslationTableRow };

/**
 * @summary Vuetify が通知するソート状態 1 件分を表す。
 */
type MizTranslationTableSortItem = {
  key: MizTranslationTableColumnKey;
  order?: MizDictionarySortOrder | false;
};

const _props = defineProps<MizTranslationTableProps>();

const emit = defineEmits<{
  (e: 'toggle-enabled', key: string, value: boolean): void;
  (e: 'update-translation', key: string, value: string): void;
  (e: 'update-sort', value: MizTranslationExportSort): void;
  (e: 'error', message: string): void;
}>();

const _hoveredKey = ref<string | null>(null);
const _sortBy = ref<MizTranslationTableSortItem[]>([]);

/**
 * @summary テーブルソート状態をエクスポート用ソート状態へ変換する。
 * @param sortItem 現在のソート項目を指定する。
 * @returns エクスポート用ソート状態を返す。
 */
function resolveExportSort(sortItem?: MizTranslationTableSortItem): MizTranslationExportSort {
  const sortKey = resolveDictionarySortKey(sortItem?.key);
  const sortOrder = sortItem?.order === 'asc' || sortItem?.order === 'desc' ? sortItem.order : undefined;

  if (sortKey === undefined || sortOrder === undefined) {
    return {};
  }

  return {
    sortKey,
    sortOrder,
  };
}

const _tableRows = computed<MizTranslationTableRow[]>(() => {
  const activeSort = _sortBy.value[0];
  const exportSort = resolveExportSort(activeSort);
  const sortKey = exportSort.sortKey;
  const sortOrder = exportSort.sortOrder;
  const sortedEntries =
    sortKey === undefined || sortOrder === undefined
      ? sortMizDictionaryEntries(_props.entries)
      : sortMizDictionaryEntriesForTable(_props.entries, sortKey, sortOrder);
  const activeSortRanks = new Map<string, string>(
    sortedEntries.map((entry, index) => {
      return [entry.key, buildInternalSortRank(index, sortedEntries.length, sortOrder)];
    }),
  );

  return sortedEntries.map((entry: MizDictionaryEntry): MizTranslationTableRow => {
    const activeSortRank = activeSortRanks.get(entry.key) ?? entry.key;
    return {
      entry,
      enabledSortValue: activeSort?.key === 'enabledSortValue' ? activeSortRank : entry.key,
      keySortValue: activeSort?.key === 'keySortValue' ? activeSortRank : entry.key,
      sourceTextSortValue: activeSort?.key === 'sourceTextSortValue' ? activeSortRank : entry.key,
      translatedTextSortValue: activeSort?.key === 'translatedTextSortValue' ? activeSortRank : entry.key,
    };
  });
});

watch(
  _sortBy,
  (value): void => {
    emit('update-sort', resolveExportSort(value[0]));
  },
  { deep: true, immediate: true },
);

const _headers = computed<MizTranslationTableHeader[]>(() => {
  return [
    {
      title: '有効',
      key: 'enabledSortValue',
      sortable: true,
      align: 'center',
      cellProps: {
        class: 'miz-translation-table__enabled-column',
      },
      headerProps: {
        class: 'miz-translation-table__enabled-column',
      },
    },
    {
      title: 'key',
      key: 'keySortValue',
      sortable: true,
      align: 'start',
      cellProps: {
        class: 'miz-translation-table__key-column',
      },
      headerProps: {
        class: 'miz-translation-table__key-column',
      },
    },
    {
      title: '原文',
      key: 'sourceTextSortValue',
      sortable: true,
      align: 'start',
      cellProps: {
        class: 'miz-translation-table__balanced-column',
      },
      headerProps: {
        class: 'miz-translation-table__balanced-column',
      },
    },
    {
      title: '翻訳',
      key: 'translatedTextSortValue',
      sortable: true,
      align: 'start',
      cellProps: {
        class: 'miz-translation-table__balanced-column',
      },
      headerProps: {
        class: 'miz-translation-table__balanced-column',
      },
    },
  ];
});

/**
 * @summary v-data-table スロット項目から dictionary 行を解決する。
 * @param slotItem Vuetify が渡す項目を指定する。
 * @returns dictionary 行を返す。
 */
const _resolveEntry = (slotItem: MizTranslationTableSlotItem): MizDictionaryEntry => {
  if ('raw' in slotItem) {
    return slotItem.raw.entry;
  }

  return slotItem.entry;
};

/**
 * @summary 行 hover 状態を更新する。
 * @param key hover 対象 key を指定する。
 */
const _setHoveredKey = (key: string | null): void => {
  _hoveredKey.value = key;
};

/**
 * @summary 対象行のコピーボタン表示可否を返す。
 * @param key 判定対象 key を指定する。
 * @returns hover 中の場合は true を返す。
 */
const _isCopyVisible = (key: string): boolean => {
  return _hoveredKey.value === key;
};

/**
 * @summary 原文テキストに対応する翻訳入力欄の初期行数を返す。
 * @param sourceText 原文テキストを指定する。
 * @returns 少なくとも 1 行以上の行数を返す。
 */
const _resolveTextareaRows = (sourceText: string): number => {
  if (sourceText === '') {
    return 1;
  }

  return Math.max(sourceText.split('\n').length, 1);
};

/**
 * @summary 有効状態変更を親へ通知する。
 * @param key 更新対象 key を指定する。
 * @param value 更新値を指定する。
 */
const _handleEnabledChange = (key: string, value: boolean | null): void => {
  emit('toggle-enabled', key, value === true);
};

/**
 * @summary 翻訳入力変更を親へ通知する。
 * @param key 更新対象 key を指定する。
 * @param value 更新値を指定する。
 */
const _handleTranslatedTextChange = (key: string, value: string): void => {
  emit('update-translation', key, value);
};

/**
 * @summary 原文テキストをクリップボードへコピーする。
 * @param sourceText コピー対象原文を指定する。
 */
const _handleCopyClick = async (sourceText: string): Promise<void> => {
  try {
    await copyText(sourceText);
  } catch {
    emit('error', 'クリップボードへコピーできませんでした。');
  }
};

/**
 * @summary テーブル列 key を純粋ロジック用ソートキーへ変換する。
 * @param columnKey テーブル列 key を指定する。
 * @returns 対応するソートキーを返す。
 */
function resolveDictionarySortKey(columnKey?: MizTranslationTableColumnKey): MizDictionarySortKey | undefined {
  switch (columnKey) {
    case 'enabledSortValue':
      return 'enabled';
    case 'keySortValue':
      return 'key';
    case 'sourceTextSortValue':
      return 'sourceText';
    case 'translatedTextSortValue':
      return 'translatedText';
    default:
      return undefined;
  }
}

/**
 * @summary Vuetify 内部ソートへ渡す rank 文字列を生成する。
 * @param index 表示順 index を指定する。
 * @param total 全件数を指定する。
 * @param sortOrder 現在のソート順を指定する。
 * @returns 内部ソート用のゼロ埋め文字列を返す。
 */
const buildInternalSortRank = (index: number, total: number, sortOrder?: MizDictionarySortOrder): string => {
  const rank = sortOrder === 'desc' ? total - index : index + 1;
  return String(rank).padStart(String(total).length + 1, '0');
};
</script>

<template lang="pug">
v-data-table.miz-translation-table(
  :headers="_headers"
  :items="_tableRows"
  v-model:sort-by="_sortBy"
  item-value="keySortValue"
  hide-default-footer
  items-per-page="-1"
)
  template(v-slot:item.enabledSortValue="{ item }")
    .d-flex.align-center(style="min-height: 3rem;")
      v-checkbox(
        :model-value="_resolveEntry(item).enabled"
        hide-details
        density="compact"
        color="primary"
        :data-testid="`miz-entry-enabled-${_resolveEntry(item).key}`"
        @update:model-value="_handleEnabledChange(_resolveEntry(item).key, $event)"
      )

  template(v-slot:item.keySortValue="{ item }")
    .key-cell.d-flex.align-center(style="min-height: 3rem;")
      code.text-body-2.key-cell-text(data-testid="miz-entry-key") {{ _resolveEntry(item).key }}

  template(v-slot:item.sourceTextSortValue="{ item }")
    .position-relative.w-100(
      :data-testid="`miz-entry-source-${_resolveEntry(item).key}`"
      @mouseenter="_setHoveredKey(_resolveEntry(item).key)"
      @mouseleave="_setHoveredKey(null)"
    )
      v-textarea.translation-field.translation-field--source(
        readonly
        flat
        :model-value="_resolveEntry(item).sourceText"
        variant="solo"
        density="comfortable"
        :rows="_resolveTextareaRows(_resolveEntry(item).sourceText)"
        auto-grow
        hide-details
        data-testid="miz-entry-source-text"
      )
      v-btn.copy-button.position-absolute.top-0.right-0(
        icon="mdi-content-copy"
        size="small"
        variant="text"
        :class="{ 'copy-button--visible': _isCopyVisible(_resolveEntry(item).key) }"
        :aria-label="`${_resolveEntry(item).key} の原文をコピー`"
        :data-testid="`miz-entry-copy-${_resolveEntry(item).key}`"
        @click="_handleCopyClick(_resolveEntry(item).sourceText)"
      )

  template(v-slot:item.translatedTextSortValue="{ item }")
    .translated-cell.d-flex.w-100
      v-textarea.translation-field.translation-field--translated(
        :model-value="_resolveEntry(item).translatedText"
        variant="outlined"
        density="comfortable"
        :rows="_resolveTextareaRows(_resolveEntry(item).sourceText)"
        auto-grow
        hide-details
        :data-testid="`miz-entry-translation-${_resolveEntry(item).key}`"
        @update:model-value="_handleTranslatedTextChange(_resolveEntry(item).key, String($event ?? ''))"
      )

  template(v-slot:no-data)
    v-alert.my-4(type="info" variant="tonal") 表示できる翻訳項目がありません。
</template>

<style scoped lang="scss">
.miz-translation-table {
  :deep(td) {
    vertical-align: top;
  }

  :deep(.miz-translation-table__key-column) {
    white-space: nowrap;
  }

  :deep(.miz-translation-table__enabled-column) {
    width: 1%;
    white-space: nowrap;
  }

  :deep(.miz-translation-table__balanced-column) {
    width: 50%;
  }

  :deep(.translation-field .v-field__field) {
    align-items: flex-start;
  }

  :deep(.translation-field textarea) {
    font-size: 0.875rem;
    line-height: 1.375rem;
  }

  :deep(.translation-field--source .v-field) {
    box-shadow: none;
  }

  :deep(.translation-field--source .v-field__overlay) {
    background: transparent;
  }

  :deep(.translation-field--source .v-field__outline) {
    --v-field-border-opacity: 0;
  }
}

.translated-cell {
  min-height: 100%;
}

.copy-button {
  z-index: 1;
  visibility: hidden;

  &--visible {
    visibility: visible;
  }
}

.key-cell {
  &-text {
    display: block;
    max-width: none;
  }
}

:deep(.translation-field--translated) {
  display: flex;
  flex: 1 1 auto;
  min-height: 100%;
}

:deep(.translation-field--translated .v-input__control) {
  display: flex;
  flex: 1 1 auto;
}

:deep(.translation-field--translated .v-field) {
  display: flex;
  flex: 1 1 auto;
  min-height: 100%;
}

:deep(.translation-field--translated .v-field__field) {
  flex: 1 1 auto;
  min-height: 100%;
}

:deep(.translation-field--translated textarea) {
  min-height: 100%;
}
</style>
