import { describe, expect, it } from 'vitest';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import {
  parseMizDictionaryDocument,
  parseMizDictionaryEntries,
  parseMizDictionaryValues,
  rebuildMizDictionary,
  serializeMizDictionary,
} from '@/features/mizTranslation/mizDictionaryParser';

describe('mizDictionaryParser', () => {
  it('dictionary 文字列からコメントを除外してエントリーを抽出する', () => {
    const source = [
      'local ignored = "dictionary = { not target }"',
      'dictionary = {',
      '  -- ["DictKey_100"] = "commented out",',
      '  ["DictKey_1"] = "Alpha",',
      '  --[[',
      '    ["DictKey_200"] = "commented block",',
      '  ]]',
      '  ["DictKey_WptName_2"] = "",',
      '}',
    ].join('\n');

    expect(parseMizDictionaryEntries(source)).toEqual<MizDictionaryEntry[]>([
      {
        key: 'DictKey_1',
        sourceText: 'Alpha',
        translatedText: '',
        enabled: true,
        isDictionaryKey: true,
        isTranslatable: true,
      },
      {
        key: 'DictKey_WptName_2',
        sourceText: '',
        translatedText: '',
        enabled: false,
        isDictionaryKey: true,
        isTranslatable: false,
      },
    ]);
  });

  it('複数行値をデコードして key 重複時は後勝ちにする', () => {
    const source = ['dictionary = {', '  ["DictKey_1"] = "old",', '  ["DictKey_1"] = "line1\\nline2",', '}'].join('\n');

    expect([...parseMizDictionaryValues(source).entries()]).toEqual([['DictKey_1', 'line1\nline2']]);
  });

  it('文字列以外の Lua value を壊さず抽出できる', () => {
    const source = ['dictionary = {', '  ["DictKey_1"] = _("Alpha"),', '  ["DictKey_2"] = [=[line1', 'line2]=],', '}'].join(
      '\n',
    );

    expect([...parseMizDictionaryValues(source).entries()]).toEqual([
      ['DictKey_1', '_("Alpha")'],
      ['DictKey_2', 'line1\nline2'],
    ]);
  });

  it('長括弧文字列内の dictionary テーブル表現を無視して本体を抽出する', () => {
    const source = [
      'local ignored = [=[dictionary = {',
      '  ["DictKey_999"] = "ignored",',
      '}]=]',
      'dictionary = {',
      '  ["DictKey_1"] = "Alpha",',
      '}',
    ].join('\n');

    expect([...parseMizDictionaryValues(source).entries()]).toEqual([['DictKey_1', 'Alpha']]);
  });

  it('長括弧コメント内の dictionary テーブル表現を無視して本体を抽出する', () => {
    const source = [
      '--[=[dictionary = {',
      '  ["DictKey_999"] = "ignored",',
      '}]=]',
      'dictionary = {',
      '  ["DictKey_1"] = "Alpha",',
      '}',
    ].join('\n');

    expect([...parseMizDictionaryValues(source).entries()]).toEqual([['DictKey_1', 'Alpha']]);
  });

  it('dictionary を UTF-8 BOM 無しの文字列として serializer できる', () => {
    const result = serializeMizDictionary([
      { key: 'DictKey_1', translatedText: 'Alpha' },
      { key: 'DictKey_2', translatedText: 'line1\nline2' },
      { key: 'DictKey_3', translatedText: '' },
    ]);

    expect(result.charCodeAt(0)).not.toBe(0xfeff);
    expect(result).toBe(
      ['dictionary = {', '  ["DictKey_1"] = "Alpha",', '  ["DictKey_2"] = "line1\\nline2",', '  ["DictKey_3"] = "",', '}'].join(
        '\n',
      ),
    );
  });

  it('コメントと並び順を維持しながら value だけを書き換えて再構築する', () => {
    const source = [
      'dictionary = {',
      '  -- keep comment',
      '  ["DictKey_1"] = "Alpha",',
      '  ["DictKey_2"] = "Bravo",',
      '}',
    ].join('\n');
    const document = parseMizDictionaryDocument(source);

    const rebuilt = rebuildMizDictionary(
      document,
      new Map([
        ['DictKey_1', '翻訳1'],
        ['DictKey_2', 'line1\nline2'],
      ]),
    );

    expect(rebuilt).toBe(
      ['dictionary = {', '  -- keep comment', '  ["DictKey_1"] = "翻訳1",', '  ["DictKey_2"] = "line1\\nline2",', '}'].join(
        '\n',
      ),
    );
  });
});
