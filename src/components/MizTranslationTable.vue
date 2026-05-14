<script setup lang="ts">
import { computed, ref } from 'vue';
import { copyText } from '@/composables/useClipboard';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';

type MizTranslationTableProps = {
  entries: MizDictionaryEntry[];
};

type MizTranslationTableHeader = {
  title: string;
  key: 'enabled' | 'key' | 'sourceText' | 'translatedText';
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

type MizTranslationTableSlotItem = MizDictionaryEntry | { raw: MizDictionaryEntry };

const _props = defineProps<MizTranslationTableProps>();

const emit = defineEmits<{
  (e: 'toggle-enabled', key: string, value: boolean): void;
  (e: 'update-translation', key: string, value: string): void;
  (e: 'error', message: string): void;
}>();

const _hoveredKey = ref<string | null>(null);

const _headers = computed<MizTranslationTableHeader[]>(() => {
  return [
    {
      title: '有効',
      key: 'enabled',
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
      key: 'key',
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
      key: 'sourceText',
      sortable: false,
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
      key: 'translatedText',
      sortable: false,
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
    return slotItem.raw;
  }

  return slotItem;
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
</script>

<template lang="pug">
v-data-table.miz-translation-table(
  :headers="_headers"
  :items="_props.entries"
  item-value="key"
  hide-default-footer
  items-per-page="-1"
)
  template(v-slot:item.enabled="{ item }")
    v-checkbox(
      :model-value="_resolveEntry(item).enabled"
      hide-details
      density="compact"
      color="primary"
      :data-testid="`miz-entry-enabled-${_resolveEntry(item).key}`"
      @update:model-value="_handleEnabledChange(_resolveEntry(item).key, $event)"
    )

  template(v-slot:item.key="{ item }")
    .key-cell
      code.text-body-2.key-cell-text(data-testid="miz-entry-key") {{ _resolveEntry(item).key }}

  template(v-slot:item.sourceText="{ item }")
    .source-cell(
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
      v-btn.copy-button(
        icon="mdi-content-copy"
        size="small"
        variant="text"
        :class="{ 'copy-button--visible': _isCopyVisible(_resolveEntry(item).key) }"
        :aria-label="`${_resolveEntry(item).key} の原文をコピー`"
        :data-testid="`miz-entry-copy-${_resolveEntry(item).key}`"
        @click="_handleCopyClick(_resolveEntry(item).sourceText)"
      )

  template(v-slot:item.translatedText="{ item }")
    v-textarea.translation-field(
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
}

.source-cell {
  position: relative;
  min-height: 3rem;
  width: 100%;
}

.key-cell {
  display: flex;
  align-items: center;
  min-height: 2.5rem;
}

.key-cell-text {
  display: block;
  max-width: none;
  white-space: nowrap;
  word-break: normal;
}

.copy-button {
  position: absolute;
  top: 0;
  right: 0;
  visibility: hidden;

  &--visible {
    visibility: visible;
  }
}

.miz-translation-table {
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
</style>
