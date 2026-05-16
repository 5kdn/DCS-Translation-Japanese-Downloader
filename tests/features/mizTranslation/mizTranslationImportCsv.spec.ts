import { describe, expect, it } from 'vitest';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import { buildMizTranslationCsvContent, parseMizTranslationCsvContent } from '@/features/mizTranslation/mizTranslationCsv';

const createEntry = (overrides: Partial<MizDictionaryEntry> = {}): MizDictionaryEntry => {
  return {
    key: 'DictKey_1',
    sourceText: 'Alpha',
    translatedText: '翻訳',
    enabled: true,
    isDictionaryKey: true,
    isTranslatable: true,
    ...overrides,
  };
};

describe('mizTranslationImportCsv', () => {
  it('新しい 4 列 CSV を import 用エントリー一覧へ変換する', () => {
    const source = '\uFEFF"有効","key","原文","翻訳"\r\n"TRUE","DictKey_1","Alpha","翻訳1"';

    expect(parseMizTranslationCsvContent(source)).toEqual([
      {
        key: 'DictKey_1',
        sourceText: 'Alpha',
        translatedText: '翻訳1',
      },
    ]);
  });

  it('セル内改行とクォートを維持して round-trip できる', () => {
    const content = buildMizTranslationCsvContent([
      createEntry({
        key: 'DictKey_2',
        sourceText: 'Quote "A"\n2行目',
        translatedText: '訳1\n訳2',
      }),
    ]);

    expect(parseMizTranslationCsvContent(content)).toEqual([
      {
        key: 'DictKey_2',
        sourceText: 'Quote "A"\n2行目',
        translatedText: '訳1\n訳2',
      },
    ]);
  });

  it('ヘッダーが不正な CSV は失敗する', () => {
    const source = '"有効","原文","翻訳"\r\n"TRUE","Alpha","翻訳1"';

    expect(() => parseMizTranslationCsvContent(source)).toThrowError(/CSV ヘッダー/);
  });
});
