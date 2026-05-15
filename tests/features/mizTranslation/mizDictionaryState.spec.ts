import { describe, expect, it } from 'vitest';
import type { MizDictionaryEntry, MizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryModels';
import { getMizDictionaryFixedGroupRank, sortMizDictionaryEntries } from '@/features/mizTranslation/mizDictionarySort';
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
      createEntry({ key: 'DictKey_6', sourceText: '   ', translatedText: '' }),
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

  it('空欄非表示は空文字だけでなく空白のみの原文にも適用する', () => {
    const entries = [
      createEntry({ key: 'DictKey_1', sourceText: '' }),
      createEntry({ key: 'DictKey_2', sourceText: '   ' }),
      createEntry({ key: 'DictKey_3', sourceText: '\n\t' }),
      createEntry({ key: 'DictKey_4', sourceText: 'Alpha' }),
    ];
    const filter: MizDictionaryFilter = {
      showEnabled: true,
      showDisabled: true,
      showOnlyUntranslated: false,
      hideNonTranslatable: false,
      hideEmptySourceText: true,
    };

    expect(applyMizDictionaryFilter(entries, filter).map((entry) => entry.key)).toEqual(['DictKey_4']);
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

  it('固定先頭 5 グループの優先順を常に維持する', () => {
    const entries = [
      createEntry({ key: 'DictKey_30' }),
      createEntry({ key: 'DictKey_descriptionRedTask_4' }),
      createEntry({ key: 'DictKey_sortie_2' }),
      createEntry({ key: 'DictKey_descriptionText_3' }),
      createEntry({ key: 'DictKey_descriptionNeutralsTask_5' }),
      createEntry({ key: 'DictKey_descriptionBlueTask_1' }),
    ];

    expect(sortMizDictionaryEntries(entries).map((entry) => entry.key)).toEqual([
      'DictKey_sortie_2',
      'DictKey_descriptionText_3',
      'DictKey_descriptionBlueTask_1',
      'DictKey_descriptionRedTask_4',
      'DictKey_descriptionNeutralsTask_5',
      'DictKey_30',
    ]);
  });

  it('固定先頭グループ以外は key 昇順で並べる', () => {
    const entries = [createEntry({ key: 'DictKey_20' }), createEntry({ key: 'DictKey_3' }), createEntry({ key: 'AAA' })];

    expect(sortMizDictionaryEntries(entries).map((entry) => entry.key)).toEqual(['AAA', 'DictKey_20', 'DictKey_3']);
    expect(getMizDictionaryFixedGroupRank('DictKey_GroupName_3')).toBeNull();
  });
});
