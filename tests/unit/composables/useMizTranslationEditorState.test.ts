import { describe, expect, it } from 'vitest';
import { useMizTranslationEditorState } from '@/composables/useMizTranslationEditorState';
import type { MizDictionaryEntriesResult } from '@/features/mizTranslation/mizArchiveModels';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import { parseMizDictionaryDocument } from '@/features/mizTranslation/mizDictionaryParser';

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
  const source = 'dictionary = {\n  -- keep comment\n  ["DictKey_1"] = "Alpha",\n  ["DictKey_2"] = "Bravo",\n}';

  return {
    entries,
    source,
    fileName: 'sample.miz',
    document: parseMizDictionaryDocument(source),
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

  it('import エントリーは key と原文が完全一致した行だけを置き換える', () => {
    const state = useMizTranslationEditorState();
    state.replaceEntries(
      createResult([
        createEntry({ key: 'DictKey_1', sourceText: 'Alpha' }),
        createEntry({ key: 'DictKey_2', sourceText: 'Bravo', enabled: false }),
      ]),
    );

    state.replaceTranslationsFromImportEntries([
      {
        key: 'DictKey_1',
        sourceText: 'Alpha',
        translatedText: '翻訳1',
      },
      {
        key: 'DictKey_2',
        sourceText: 'Mismatch',
        translatedText: 'ignored',
      },
      {
        key: 'DictKey_3',
        sourceText: 'Charlie',
        translatedText: 'ignored',
      },
    ]);

    expect(state.entries.value).toEqual([
      createEntry({ key: 'DictKey_1', sourceText: 'Alpha', translatedText: '翻訳1' }),
      createEntry({ key: 'DictKey_2', sourceText: 'Bravo', enabled: false }),
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

    const payload = state.buildDownloadPayload('dictionary', {});

    expect(await payload.blob.text()).toBe(
      ['dictionary = {', '  -- keep comment', '  ["DictKey_1"] = "翻訳1",', '  ["DictKey_2"] = "Bravo",', '}'].join('\n'),
    );
  });

  it('dictionary ダウンロード payload は UTF-8 BOM 無しかつ LF で出力する', async () => {
    const source = 'dictionary = {\r\n  ["DictKey_1"] = "Alpha",\r\n}';
    const state = useMizTranslationEditorState();
    state.replaceEntries({
      entries: [createEntry({ translatedText: '翻訳1' })],
      source,
      fileName: 'sample.miz',
      document: parseMizDictionaryDocument(source),
    });

    const payload = state.buildDownloadPayload('dictionary', {});
    const bytes = new Uint8Array(await payload.blob.arrayBuffer());
    const content = await payload.blob.text();

    expect([...bytes.slice(0, 3)]).not.toEqual([0xef, 0xbb, 0xbf]);
    expect(content).toBe('dictionary = {\n  ["DictKey_1"] = "翻訳1",\n}');
    expect(content).not.toContain('\r');
  });
});
