import { describe, expect, it } from 'vitest';
import { useMizTranslationEditorState } from '@/composables/useMizTranslationEditorState';
import type { MizDictionaryEntriesResult } from '@/features/mizTranslation/mizArchiveModels';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import type { MizDictionaryDocument } from '@/features/mizTranslation/mizDictionaryParser';

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

const createResult = (entries: MizDictionaryEntry[]): MizDictionaryEntriesResult => {
  return {
    entries,
    source: 'dictionary = {}',
    fileName: 'sample.miz',
    document: {
      source: 'dictionary = {}',
      entries: [],
    } satisfies MizDictionaryDocument,
  };
};

describe('useMizTranslationEditorState', () => {
  it('有効状態と翻訳文を個別更新できる', () => {
    const state = useMizTranslationEditorState();
    state.replaceEntries(createResult([createEntry({ key: 'DictKey_1' }), createEntry({ key: 'DictKey_2', enabled: false })]));

    state.setEntryEnabled('DictKey_2', true);
    state.setEntryTranslatedText('DictKey_1', '翻訳1');

    expect(state.entries.value).toEqual([
      createEntry({ key: 'DictKey_1', translatedText: '翻訳1' }),
      createEntry({ key: 'DictKey_2', enabled: true }),
    ]);
  });

  it('dictionary 読み込み結果で一致 key の翻訳だけを置き換え、enabled を維持する', () => {
    const state = useMizTranslationEditorState();
    state.replaceEntries(
      createResult([createEntry({ key: 'DictKey_1', enabled: true }), createEntry({ key: 'DictKey_2', enabled: false })]),
    );

    state.replaceTranslationsFromDictionary(
      new Map([
        ['DictKey_1', '翻訳1'],
        ['DictKey_3', 'ignored'],
      ]),
    );

    expect(state.entries.value).toEqual([
      createEntry({ key: 'DictKey_1', enabled: true, translatedText: '翻訳1' }),
      createEntry({ key: 'DictKey_2', enabled: false }),
    ]);
  });

  it('出力対象行だけを dictionary ダウンロード payload へ含める', async () => {
    const state = useMizTranslationEditorState();
    state.replaceEntries(
      createResult([
        createEntry({ key: 'DictKey_1', enabled: true, translatedText: '翻訳1', isTranslatable: true }),
        createEntry({ key: 'DictKey_2', enabled: false, translatedText: '翻訳2', isTranslatable: true }),
        createEntry({ key: 'DictKey_WptName_3', enabled: true, translatedText: '翻訳3', isTranslatable: false }),
        createEntry({ key: 'DictKey_4', enabled: true, translatedText: '', isTranslatable: true }),
      ]),
    );

    const payload = state.buildDownloadPayload();

    expect(await payload.blob.text()).toBe(['dictionary = {', '  ["DictKey_1"] = "翻訳1",', '}'].join('\n'));
  });
});
