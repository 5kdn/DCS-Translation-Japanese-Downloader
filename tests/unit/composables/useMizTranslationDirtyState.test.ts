import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useMizTranslationDirtyState } from '@/composables/useMizTranslationDirtyState';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';

const createEntry = (overrides: Partial<MizDictionaryEntry> = {}): MizDictionaryEntry => {
  return {
    key: 'DictKey_1',
    sourceText: 'Alpha',
    translatedText: '',
    enabled: true,
    isDictionaryKey: true,
    isTranslatable: true,
    ...overrides,
  };
};

describe('useMizTranslationDirtyState', () => {
  it('初期 baseline 未設定では dirty でない', () => {
    const entries = ref<MizDictionaryEntry[]>([]);
    const state = useMizTranslationDirtyState(entries);

    expect(state.hasUnsavedChanges.value).toBe(false);
  });

  it('resetBaseline 後に差分なしなら dirty でない', () => {
    const entries = ref<MizDictionaryEntry[]>([createEntry(), createEntry({ key: 'DictKey_2', enabled: false })]);
    const state = useMizTranslationDirtyState(entries);

    state.resetBaseline(entries.value);

    expect(state.hasUnsavedChanges.value).toBe(false);
  });

  it('enabled と translatedText の変更を dirty state として扱う', () => {
    const entries = ref<MizDictionaryEntry[]>([createEntry(), createEntry({ key: 'DictKey_2', enabled: false })]);
    const state = useMizTranslationDirtyState(entries);

    state.resetBaseline(entries.value);
    entries.value = [createEntry(), createEntry({ key: 'DictKey_2', enabled: true })];
    expect(state.hasUnsavedChanges.value).toBe(true);

    entries.value = [createEntry(), createEntry({ key: 'DictKey_2', enabled: false })];
    expect(state.hasUnsavedChanges.value).toBe(false);

    entries.value = [createEntry({ translatedText: '翻訳' }), createEntry({ key: 'DictKey_2', enabled: false })];
    expect(state.hasUnsavedChanges.value).toBe(true);

    entries.value = [createEntry(), createEntry({ key: 'DictKey_2', enabled: false })];
    expect(state.hasUnsavedChanges.value).toBe(false);
  });

  it('markSaved 後に dirty state を解消する', () => {
    const entries = ref<MizDictionaryEntry[]>([createEntry()]);
    const state = useMizTranslationDirtyState(entries);

    state.resetBaseline(entries.value);
    entries.value = [createEntry({ translatedText: '翻訳' })];
    expect(state.hasUnsavedChanges.value).toBe(true);

    state.markSaved();

    expect(state.hasUnsavedChanges.value).toBe(false);
  });

  it('clearBaseline 後に空状態へ戻す', () => {
    const entries = ref<MizDictionaryEntry[]>([createEntry()]);
    const state = useMizTranslationDirtyState(entries);

    state.resetBaseline(entries.value);
    state.clearBaseline();

    expect(state.baselineEntries.value).toEqual([]);
    expect(state.hasUnsavedChanges.value).toBe(true);
  });
});
