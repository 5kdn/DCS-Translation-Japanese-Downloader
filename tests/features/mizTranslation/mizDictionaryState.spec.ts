import { describe, expect, it } from 'vitest';
import type { MizDictionaryEntry, MizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryModels';
import { applyMizDictionaryFilter, hasMizDictionaryChanges } from '@/features/mizTranslation/mizDictionaryState';

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

describe('mizDictionaryState', () => {
  it('5 条件の組み合わせでフィルターを適用する', () => {
    const entries = [
      createEntry({ key: 'DictKey_1', enabled: true, translatedText: '' }),
      createEntry({ key: 'DictKey_2', enabled: false, translatedText: '' }),
      createEntry({ key: 'DictKey_WptName_3', enabled: false, isTranslatable: false, translatedText: '' }),
      createEntry({ key: 'DictKey_4', sourceText: '', translatedText: '' }),
      createEntry({ key: 'DictKey_5', translatedText: '翻訳済み' }),
    ];
    const filter: MizDictionaryFilter = {
      showEnabled: true,
      showDisabled: false,
      showOnlyUntranslated: true,
      hideNonTranslatable: true,
      hideEmptySourceText: true,
    };

    expect(applyMizDictionaryFilter(entries, filter).map((entry) => entry.key)).toEqual(['DictKey_1']);
  });

  it('enabled と translatedText の差分だけを dirty として判定する', () => {
    const baselineEntries = [
      createEntry({ key: 'DictKey_1', translatedText: '' }),
      createEntry({ key: 'DictKey_2', enabled: false, translatedText: '既存翻訳' }),
    ];
    const currentEntries = [
      createEntry({ key: 'DictKey_2', enabled: false, translatedText: '既存翻訳' }),
      createEntry({ key: 'DictKey_1', translatedText: '' }),
    ];

    expect(hasMizDictionaryChanges(currentEntries, baselineEntries)).toBe(false);
    expect(
      hasMizDictionaryChanges(
        [createEntry({ key: 'DictKey_1', translatedText: '変更後' }), baselineEntries[1] as MizDictionaryEntry],
        baselineEntries,
      ),
    ).toBe(true);
    expect(
      hasMizDictionaryChanges(
        [
          baselineEntries[0] as MizDictionaryEntry,
          createEntry({ key: 'DictKey_2', enabled: true, translatedText: '既存翻訳' }),
        ],
        baselineEntries,
      ),
    ).toBe(true);
  });
});
