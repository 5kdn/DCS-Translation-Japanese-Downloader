// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import type { MizDictionaryEntry, MizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryModels';
import type { MizTranslationExportSort } from '@/features/mizTranslation/mizTranslationDownloadModels';
import { mountIntegrationComponent } from '../../support/vueTestUtils/mountComponent';
import {
  createAlertStub,
  createButtonStub,
  createDialogStub,
  createWrapperStub,
} from '../../support/vueTestUtils/vuetifyStubs';

const sampleEntries: MizDictionaryEntry[] = [
  {
    key: 'DictKey_1',
    sourceText: 'Alpha',
    translatedText: '',
    enabled: true,
    isDictionaryKey: true,
    isTranslatable: true,
  },
];

const sampleFilter: MizDictionaryFilter = {
  showEnabled: true,
  showDisabled: true,
  showOnlyUntranslated: false,
  hideNonTranslatable: true,
  hideEmptySourceText: true,
};

vi.mock('@/components/mizTranslation/MizTranslationTable.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'MizTranslationTableStub',
      props: {
        entries: {
          type: Array,
          required: true,
        },
      },
      emits: ['toggle-enabled', 'update-translation', 'update-sort', 'error'],
      setup(props, { emit }) {
        return () =>
          h('div', { 'data-testid': 'miz-table-stub' }, [
            h('output', { 'data-testid': 'miz-table-entry-count' }, String(props.entries.length)),
            h(
              'output',
              { 'data-testid': 'miz-table-entry-state' },
              JSON.stringify(
                (props.entries as Array<{ key: string; enabled: boolean; sourceText: string }>).map((entry) => {
                  return {
                    key: entry.key,
                    enabled: entry.enabled,
                    sourceText: entry.sourceText,
                  };
                }),
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'miz-table-update-sort',
                onClick: () => emit('update-sort', { sortKey: 'sourceText', sortOrder: 'desc' }),
              },
              undefined,
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'miz-table-toggle-enabled',
                onClick: () => emit('toggle-enabled', 'DictKey_1', false),
              },
              undefined,
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'miz-table-update-translation',
                onClick: () => emit('update-translation', 'DictKey_1', '翻訳'),
              },
              undefined,
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'miz-table-error',
                onClick: () => emit('error', 'copy error'),
              },
              undefined,
            ),
          ]);
      },
    }),
  };
});

vi.mock('@/components/mizTranslation/MizTranslationTable.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'MizTranslationTableStub',
      props: {
        entries: {
          type: Array,
          required: true,
        },
      },
      emits: ['toggle-enabled', 'update-translation', 'update-sort', 'error'],
      setup(props, { emit }) {
        return () =>
          h('div', { 'data-testid': 'miz-table-stub' }, [
            h('output', { 'data-testid': 'miz-table-entry-count' }, String(props.entries.length)),
            h(
              'output',
              { 'data-testid': 'miz-table-entry-state' },
              JSON.stringify(
                (props.entries as Array<{ key: string; enabled: boolean; sourceText: string }>).map((entry) => {
                  return {
                    key: entry.key,
                    enabled: entry.enabled,
                    sourceText: entry.sourceText,
                  };
                }),
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'miz-table-update-sort',
                onClick: () => emit('update-sort', { sortKey: 'sourceText', sortOrder: 'desc' }),
              },
              undefined,
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'miz-table-toggle-enabled',
                onClick: () => emit('toggle-enabled', 'DictKey_1', false),
              },
              undefined,
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'miz-table-update-translation',
                onClick: () => emit('update-translation', 'DictKey_1', '翻訳'),
              },
              undefined,
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'miz-table-error',
                onClick: () => emit('error', 'copy error'),
              },
              undefined,
            ),
          ]);
      },
    }),
  };
});

vi.mock('@/components/mizTranslation/MizTranslationFilterPanel.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'MizTranslationFilterPanelStub',
      props: {
        visibleEntryCount: {
          type: Number,
          required: true,
        },
        totalEntryCount: {
          type: Number,
          required: true,
        },
      },
      emits: [
        'update:show-enabled',
        'update:show-disabled',
        'update:show-only-untranslated',
        'update:hide-non-translatable',
        'update:hide-empty-source-text',
      ],
      setup(props, { emit }) {
        return () =>
          h('div', { 'data-testid': 'miz-filter-stub' }, [
            h('output', { 'data-testid': 'miz-filter-count-stub' }, `${props.visibleEntryCount}/${props.totalEntryCount}`),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-show-enabled',
              onClick: () => emit('update:show-enabled', false),
            }),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-show-disabled',
              onClick: () => emit('update:show-disabled', false),
            }),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-show-untranslated',
              onClick: () => emit('update:show-only-untranslated', true),
            }),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-hide-non-translatable',
              onClick: () => emit('update:hide-non-translatable', false),
            }),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-hide-empty-source',
              onClick: () => emit('update:hide-empty-source-text', false),
            }),
          ]);
      },
    }),
  };
});

vi.mock('@/components/mizTranslation/MizTranslationFilterPanel.vue', () => {
  return {
    __esModule: true,
    default: defineComponent({
      name: 'MizTranslationFilterPanelStub',
      props: {
        visibleEntryCount: {
          type: Number,
          required: true,
        },
        totalEntryCount: {
          type: Number,
          required: true,
        },
      },
      emits: [
        'update:show-enabled',
        'update:show-disabled',
        'update:show-only-untranslated',
        'update:hide-non-translatable',
        'update:hide-empty-source-text',
      ],
      setup(props, { emit }) {
        return () =>
          h('div', { 'data-testid': 'miz-filter-stub' }, [
            h('output', { 'data-testid': 'miz-filter-count-stub' }, `${props.visibleEntryCount}/${props.totalEntryCount}`),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-show-enabled',
              onClick: () => emit('update:show-enabled', false),
            }),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-show-disabled',
              onClick: () => emit('update:show-disabled', false),
            }),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-show-untranslated',
              onClick: () => emit('update:show-only-untranslated', true),
            }),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-hide-non-translatable',
              onClick: () => emit('update:hide-non-translatable', false),
            }),
            h('button', {
              type: 'button',
              'data-testid': 'miz-filter-update-hide-empty-source',
              onClick: () => emit('update:hide-empty-source-text', false),
            }),
          ]);
      },
    }),
  };
});

import MizTranslationDialog from '@/components/mizTranslation/MizTranslationDialog.vue';

/**
 * @summary 非同期描画の完了を待機する。
 */
const flushComponent = async (): Promise<void> => {
  for (const _index of [0, 1, 2, 3]) {
    await Promise.resolve();
    await nextTick();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
};

const mountComponent = async (props?: {
  modelValue?: boolean;
  loadedFileName?: string;
  isLoading?: boolean;
  entries?: MizDictionaryEntry[];
  errorMessage?: string | null;
  filter?: MizDictionaryFilter;
  visibleEntryCount?: number;
  totalEntryCount?: number;
}) => {
  const onUpdateModelValue = vi.fn();
  const onToggleEnabled = vi.fn();
  const onUpdateTranslation = vi.fn();
  const onUpdateSort = vi.fn();
  const onImportDictionary = vi.fn();
  const onDownload = vi.fn();
  const onError = vi.fn();
  const onShowEnabled = vi.fn();
  const onShowDisabled = vi.fn();
  const onShowOnlyUntranslated = vi.fn();
  const onHideNonTranslatable = vi.fn();
  const onHideEmptySourceText = vi.fn();

  const { cleanup, container } = mountIntegrationComponent(MizTranslationDialog, {
    props: {
      modelValue: props?.modelValue ?? true,
      loadedFileName: props?.loadedFileName ?? 'mission.miz',
      isLoading: props?.isLoading ?? false,
      entries: props?.entries ?? sampleEntries,
      errorMessage: props?.errorMessage ?? null,
      filter: props?.filter ?? sampleFilter,
      visibleEntryCount: props?.visibleEntryCount ?? 1,
      totalEntryCount: props?.totalEntryCount ?? 1,
      'onUpdate:modelValue': onUpdateModelValue,
      'onUpdate:show-enabled': onShowEnabled,
      'onUpdate:show-disabled': onShowDisabled,
      'onUpdate:show-only-untranslated': onShowOnlyUntranslated,
      'onUpdate:hide-non-translatable': onHideNonTranslatable,
      'onUpdate:hide-empty-source-text': onHideEmptySourceText,
      onToggleEnabled,
      onUpdateTranslation,
      onUpdateSort,
      onImportDictionary,
      onDownload,
      onError,
    },
    global: {
      components: {
        'v-dialog': createDialogStub(),
        'v-card': createWrapperStub('VCardStub'),
        'v-toolbar': createWrapperStub('VToolbarStub'),
        'v-toolbar-title': createWrapperStub('VToolbarTitleStub'),
        'v-spacer': createWrapperStub('VSpacerStub'),
        'v-card-text': createWrapperStub('VCardTextStub'),
        'v-container': createWrapperStub('VContainerStub'),
        'v-btn-group': createWrapperStub('VBtnGroupStub'),
        'v-btn': createButtonStub(),
        'v-menu': defineComponent({
          name: 'VMenuStub',
          props: {
            modelValue: {
              type: Boolean,
              required: false,
              default: false,
            },
          },
          emits: ['update:modelValue'],
          setup(props, { emit, slots }) {
            const activatorProps = {
              onClick: () => emit('update:modelValue', !props.modelValue),
            };

            return () => h('div', [slots.activator?.({ props: activatorProps }), props.modelValue ? slots.default?.() : null]);
          },
        }),
        'v-list': createWrapperStub('VListStub'),
        'v-list-item': defineComponent({
          name: 'VListItemStub',
          props: {
            title: {
              type: String,
              required: false,
              default: '',
            },
            subtitle: {
              type: String,
              required: false,
              default: undefined,
            },
          },
          emits: ['click'],
          setup(props, { emit, attrs }) {
            return () =>
              h(
                'button',
                {
                  ...attrs,
                  type: 'button',
                  onClick: (event: MouseEvent) => emit('click', event),
                },
                props.subtitle ? `${props.title} ${props.subtitle}` : props.title,
              );
          },
        }),
        'v-alert': createAlertStub(),
      },
    },
  });
  await flushComponent();

  return {
    cleanup,
    container,
    onUpdateModelValue,
    onShowEnabled,
    onShowDisabled,
    onShowOnlyUntranslated,
    onHideNonTranslatable,
    onHideEmptySourceText,
    onToggleEnabled,
    onUpdateTranslation,
    onUpdateSort,
    onImportDictionary,
    onDownload,
    onError,
  };
};

describe('MizTranslationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('テーブルイベントを親へ中継する', async () => {
    const {
      cleanup,
      container,
      onShowEnabled,
      onShowDisabled,
      onShowOnlyUntranslated,
      onHideNonTranslatable,
      onHideEmptySourceText,
      onToggleEnabled,
      onUpdateTranslation,
      onUpdateSort,
      onError,
    } = await mountComponent();

    container
      .querySelector('[data-testid="miz-filter-update-show-enabled"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container
      .querySelector('[data-testid="miz-filter-update-show-disabled"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container
      .querySelector('[data-testid="miz-filter-update-show-untranslated"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container
      .querySelector('[data-testid="miz-filter-update-hide-non-translatable"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container
      .querySelector('[data-testid="miz-filter-update-hide-empty-source"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container
      .querySelector('[data-testid="miz-table-toggle-enabled"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container
      .querySelector('[data-testid="miz-table-update-translation"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container.querySelector('[data-testid="miz-table-update-sort"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container.querySelector('[data-testid="miz-table-error"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onShowEnabled).toHaveBeenCalledWith(false);
    expect(onShowDisabled).toHaveBeenCalledWith(false);
    expect(onShowOnlyUntranslated).toHaveBeenCalledWith(true);
    expect(onHideNonTranslatable).toHaveBeenCalledWith(false);
    expect(onHideEmptySourceText).toHaveBeenCalledWith(false);
    expect(onToggleEnabled).toHaveBeenCalledWith('DictKey_1', false);
    expect(onUpdateTranslation).toHaveBeenCalledWith('DictKey_1', '翻訳');
    expect(onUpdateSort).toHaveBeenCalledWith({
      sortKey: 'sourceText',
      sortOrder: 'desc',
    } satisfies MizTranslationExportSort);
    expect(onError).toHaveBeenCalledWith('copy error');

    cleanup();
  });

  it('dictionary import と選択形式 download イベントを親へ中継する', async () => {
    const { cleanup, container, onImportDictionary, onDownload } = await mountComponent();
    const dictionaryInput = container.querySelector('[data-testid="miz-dialog-dictionary-input"]') as HTMLInputElement | null;
    const importButton = container.querySelector('[data-testid="miz-dialog-import-button"]');
    const downloadButton = container.querySelector('[data-testid="miz-dialog-download-button"]');

    importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const file = new File(['dictionary = {}'], 'custom-name.txt', { type: 'text/plain' });
    if (dictionaryInput !== null) {
      Object.defineProperty(dictionaryInput, 'files', {
        configurable: true,
        value: [file],
      });
      dictionaryInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onImportDictionary).toHaveBeenCalledTimes(1);
    expect(onImportDictionary.mock.calls[0]?.[0]).toBe('dictionary');
    expect(onImportDictionary.mock.calls[0]?.[1]).toBeInstanceOf(File);
    expect(onImportDictionary.mock.calls[0]?.[1]?.name).toBe('custom-name.txt');
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledWith('dictionary');

    cleanup();
  });

  it('dictionary 形式では file picker の accept を空にして全ファイル選択を許可する', async () => {
    const { cleanup, container } = await mountComponent();
    const dictionaryInput = container.querySelector('[data-testid="miz-dialog-dictionary-input"]') as HTMLInputElement | null;
    const importMenuButton = container.querySelector('[data-testid="miz-dialog-import-menu-button"]');
    const clickedAcceptValues: string[] = [];
    const inputClickSpy =
      dictionaryInput === null
        ? null
        : vi.spyOn(dictionaryInput, 'click').mockImplementation(function mockClick(this: HTMLInputElement) {
            clickedAcceptValues.push(this.accept);
          });

    importMenuButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    [...container.querySelectorAll('button')]
      .find((button) => button.getAttribute('data-testid') === 'miz-dialog-import-option-dictionary')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(dictionaryInput?.accept).toBe('');
    expect(clickedAcceptValues).toEqual(['']);
    expect(inputClickSpy).not.toBeNull();
    expect(inputClickSpy).toHaveBeenCalledTimes(1);

    inputClickSpy?.mockRestore();

    cleanup();
  });

  it('読込形式メニューに dictionary と PO と CSV を表示する', async () => {
    const { cleanup, container } = await mountComponent();
    const dictionaryInput = container.querySelector('[data-testid="miz-dialog-dictionary-input"]') as HTMLInputElement | null;
    const importMenuButton = container.querySelector('[data-testid="miz-dialog-import-menu-button"]');
    const clickedAcceptValues: string[] = [];
    const inputClickSpy =
      dictionaryInput === null
        ? null
        : vi.spyOn(dictionaryInput, 'click').mockImplementation(function mockClick(this: HTMLInputElement) {
            clickedAcceptValues.push(this.accept);
          });

    importMenuButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(container.querySelectorAll('[data-testid^="miz-dialog-import-option-"]')).toHaveLength(3);

    [...container.querySelectorAll('button')]
      .find((button) => button.getAttribute('data-testid') === 'miz-dialog-import-option-po')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(dictionaryInput?.accept).toBe('.po');
    expect(clickedAcceptValues).toEqual(['.po']);
    expect(inputClickSpy).not.toBeNull();
    expect(inputClickSpy).toHaveBeenCalledTimes(1);

    inputClickSpy?.mockRestore();

    cleanup();
  });

  it('読込形式で CSV を選ぶと CSV 形式として親へ通知する', async () => {
    const { cleanup, container, onImportDictionary } = await mountComponent();
    const dictionaryInput = container.querySelector('[data-testid="miz-dialog-dictionary-input"]') as HTMLInputElement | null;
    const importMenuButton = container.querySelector('[data-testid="miz-dialog-import-menu-button"]');
    const clickedAcceptValues: string[] = [];
    const inputClickSpy =
      dictionaryInput === null
        ? null
        : vi.spyOn(dictionaryInput, 'click').mockImplementation(function mockClick(this: HTMLInputElement) {
            clickedAcceptValues.push(this.accept);
          });

    importMenuButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    [...container.querySelectorAll('button')]
      .find((button) => button.getAttribute('data-testid') === 'miz-dialog-import-option-csv')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    const file = new File(['csv'], 'sample.csv', { type: 'text/csv' });
    if (dictionaryInput !== null) {
      Object.defineProperty(dictionaryInput, 'files', {
        configurable: true,
        value: [file],
      });
      dictionaryInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await flushComponent();

    expect(dictionaryInput?.accept).toContain('.csv');
    expect(clickedAcceptValues).toEqual(['.csv']);
    expect(inputClickSpy).not.toBeNull();
    expect(inputClickSpy).toHaveBeenCalledTimes(1);
    expect(onImportDictionary).toHaveBeenCalledWith('csv', expect.any(File));

    inputClickSpy?.mockRestore();

    cleanup();
  });

  it('読込形式メニューで選択した形式は主ボタンにも維持される', async () => {
    const { cleanup, container, onImportDictionary } = await mountComponent();
    const dictionaryInput = container.querySelector('[data-testid="miz-dialog-dictionary-input"]') as HTMLInputElement | null;
    const importMenuButton = container.querySelector('[data-testid="miz-dialog-import-menu-button"]');
    const importButton = container.querySelector('[data-testid="miz-dialog-import-button"]');
    const clickedAcceptValues: string[] = [];
    const inputClickSpy =
      dictionaryInput === null
        ? null
        : vi.spyOn(dictionaryInput, 'click').mockImplementation(function mockClick(this: HTMLInputElement) {
            clickedAcceptValues.push(this.accept);
          });

    importMenuButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    [...container.querySelectorAll('button')]
      .find((button) => button.getAttribute('data-testid') === 'miz-dialog-import-option-po')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const file = new File(['po'], 'sample.po', { type: 'text/plain' });
    if (dictionaryInput !== null) {
      Object.defineProperty(dictionaryInput, 'files', {
        configurable: true,
        value: [file],
      });
      dictionaryInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await flushComponent();

    expect(dictionaryInput?.accept).toContain('.po');
    expect(clickedAcceptValues).toEqual(['.po', '.po']);
    expect(inputClickSpy).not.toBeNull();
    expect(inputClickSpy).toHaveBeenCalledTimes(2);
    expect(onImportDictionary).toHaveBeenCalledWith('po', expect.any(File));

    inputClickSpy?.mockRestore();

    cleanup();
  });

  it('ダウンロード形式メニューに dictionary と PO と CSV を表示し、項目クリック時点で通知する', async () => {
    const { cleanup, container, onDownload } = await mountComponent();
    const downloadMenuButton = container.querySelector('[data-testid="miz-dialog-download-menu-button"]');

    downloadMenuButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(container.querySelectorAll('[data-testid^="miz-dialog-download-option-"]')).toHaveLength(3);

    [...container.querySelectorAll('button')]
      .find((button) => button.getAttribute('data-testid') === 'miz-dialog-download-option-po')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(container.querySelector('[data-testid="miz-dialog-download-option-dictionary"]')).toBeNull();
    expect(onDownload).toHaveBeenCalledWith('po');

    cleanup();
  });

  it('entries が空のとき download ボタンを無効化する', async () => {
    const { cleanup, container, onDownload } = await mountComponent({
      entries: [],
      visibleEntryCount: 0,
      totalEntryCount: 0,
    });
    const downloadButton = container.querySelector('[data-testid="miz-dialog-download-button"]') as HTMLButtonElement | null;
    const downloadMenuButton = container.querySelector(
      '[data-testid="miz-dialog-download-menu-button"]',
    ) as HTMLButtonElement | null;

    expect(downloadButton?.disabled).toBe(true);
    expect(downloadMenuButton?.disabled).toBe(true);

    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onDownload).not.toHaveBeenCalled();

    cleanup();
  });

  it('ダウンロードメニューで dictionary をクリックした時点で通知する', async () => {
    const { cleanup, container, onDownload } = await mountComponent();
    const downloadMenuButton = container.querySelector('[data-testid="miz-dialog-download-menu-button"]');

    downloadMenuButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    [...container.querySelectorAll('button')]
      .find((button) => button.getAttribute('data-testid') === 'miz-dialog-download-option-dictionary')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onDownload).toHaveBeenCalledWith('dictionary');

    cleanup();
  });

  it('ダウンロードメニューで CSV をクリックした時点で通知し、続けて主ボタンでも同じ形式を通知する', async () => {
    const { cleanup, container, onDownload } = await mountComponent();
    const downloadMenuButton = container.querySelector('[data-testid="miz-dialog-download-menu-button"]');
    const downloadButton = container.querySelector('[data-testid="miz-dialog-download-button"]');

    downloadMenuButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    [...container.querySelectorAll('button')]
      .find((button) => button.getAttribute('data-testid') === 'miz-dialog-download-option-csv')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onDownload).toHaveBeenNthCalledWith(1, 'csv');
    expect(onDownload).toHaveBeenNthCalledWith(2, 'csv');

    cleanup();
  });

  it('filtered entries が空でも totalEntryCount が残っていれば download ボタンを有効化する', async () => {
    const { cleanup, container, onDownload } = await mountComponent({
      entries: [],
      visibleEntryCount: 0,
      totalEntryCount: 2,
    });
    const downloadButton = container.querySelector('[data-testid="miz-dialog-download-button"]') as HTMLButtonElement | null;
    const downloadMenuButton = container.querySelector(
      '[data-testid="miz-dialog-download-menu-button"]',
    ) as HTMLButtonElement | null;

    expect(downloadButton?.disabled).toBe(false);
    expect(downloadMenuButton?.disabled).toBe(false);

    downloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledWith('dictionary');

    cleanup();
  });

  it('空原文と空白原文の行を未チェック状態で受け取れる', async () => {
    const { cleanup, container } = await mountComponent({
      entries: [
        {
          key: 'DictKey_6',
          sourceText: '',
          translatedText: '',
          enabled: false,
          isDictionaryKey: true,
          isTranslatable: true,
        },
        {
          key: 'DictKey_7',
          sourceText: '   ',
          translatedText: '',
          enabled: false,
          isDictionaryKey: true,
          isTranslatable: true,
        },
      ],
      visibleEntryCount: 2,
      totalEntryCount: 2,
    });

    expect(container.querySelector('[data-testid="miz-table-entry-count"]')?.textContent).toBe('2');
    expect(container.querySelector('[data-testid="miz-table-entry-state"]')?.textContent).toBe(
      JSON.stringify([
        {
          key: 'DictKey_6',
          enabled: false,
          sourceText: '',
        },
        {
          key: 'DictKey_7',
          enabled: false,
          sourceText: '   ',
        },
      ]),
    );

    cleanup();
  });

  it('閉じる操作で update:modelValue(false) を通知する', async () => {
    const { cleanup, container, onUpdateModelValue } = await mountComponent({ modelValue: true });
    const closeButton = container.querySelector('button[aria-label="MIZ 翻訳ダイアログを閉じる"]');

    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushComponent();

    expect(onUpdateModelValue).toHaveBeenCalledWith(false);

    cleanup();
  });
});
