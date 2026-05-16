import { describe, expect, it } from 'vitest';
import { parseMizTranslationPoContent } from '@/features/mizTranslation/mizTranslationPo';

describe('mizTranslationImportPo', () => {
  it('msgctxt と msgid と msgstr を import 用エントリーへ変換する', () => {
    const source = [
      'msgid ""',
      'msgstr ""',
      '"Project-Id-Version: DCS\\n"',
      '',
      '#, no-wrap',
      'msgctxt "DictKey_1"',
      'msgid "Alpha"',
      'msgstr "翻訳1"',
    ].join('\n');

    expect(parseMizTranslationPoContent(source)).toEqual([
      {
        key: 'DictKey_1',
        sourceText: 'Alpha',
        translatedText: '翻訳1',
      },
    ]);
  });

  it('obsolete entry と複数行 msgstr を import 対象として扱える', () => {
    const source = [
      '#~ #, no-wrap',
      '#~ msgctxt "DictKey_2"',
      '#~ msgid ""',
      '#~ "1行目\\n"',
      '#~ "2行目"',
      '#~ msgstr ""',
      '#~ "訳1\\n"',
      '#~ "訳2"',
    ].join('\n');

    expect(parseMizTranslationPoContent(source)).toEqual([
      {
        key: 'DictKey_2',
        sourceText: '1行目\n2行目',
        translatedText: '訳1\n訳2',
      },
    ]);
  });

  it('key または msgstr を欠くブロックは無視する', () => {
    const source = [
      '#, no-wrap',
      'msgid "Alpha"',
      'msgstr "翻訳1"',
      '',
      '#, no-wrap',
      'msgctxt "DictKey_2"',
      'msgid "Bravo"',
    ].join('\n');

    expect(parseMizTranslationPoContent(source)).toEqual([]);
  });
});
