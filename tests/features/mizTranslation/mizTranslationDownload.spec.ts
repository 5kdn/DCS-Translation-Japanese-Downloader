import { describe, expect, it } from 'vitest';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import { buildMizTranslationCsvContent } from '@/features/mizTranslation/mizTranslationCsv';
import { resolveMizTranslationExportEntries } from '@/features/mizTranslation/mizTranslationDownloadEntries';
import { resolveMizTranslationDownloadFileName } from '@/features/mizTranslation/mizTranslationDownloadFileName';
import { MIZ_TRANSLATION_GENERATOR_VERSION } from '@/features/mizTranslation/mizTranslationGeneratorVersion';
import { buildMizTranslationPoContent } from '@/features/mizTranslation/mizTranslationPo';

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

describe('mizTranslation download', () => {
  it('PO はヘッダーと no-wrap と msgctxt を含み、無効行を obsolete entry として出力する', () => {
    const content = buildMizTranslationPoContent(
      [
        createEntry({
          key: 'DictKey_1',
          sourceText: '1行目\n2行目',
          translatedText: '訳1\n訳2',
        }),
        createEntry({
          key: 'DictKey_2',
          enabled: false,
          translatedText: '',
        }),
      ],
      {
        revisionDate: new Date('2026-05-16T04:45:12.000Z'),
        generatorName: 'dcs-translation-japanese-downloader',
        generatorVersion: MIZ_TRANSLATION_GENERATOR_VERSION,
      },
    );

    expect(content).toContain(['msgid ""', 'msgstr ""'].join('\n'));
    expect(content).toContain('"Project-Id-Version: Digital Combat Simulator World\\n"');
    expect(content).toContain('"PO-Revision-Date: 2026-05-16 13:45:12+0900\\n"');
    expect(content).toContain(`"X-Generator: dcs-translation-japanese-downloader ${MIZ_TRANSLATION_GENERATOR_VERSION}\\n"`);
    expect(content).toContain('#, no-wrap');
    expect(content).toContain('msgctxt "DictKey_1"');
    expect(content).toContain(['msgid ""', '"1行目\\n"', '"2行目"'].join('\n'));
    expect(content).toContain(['msgstr ""', '"訳1\\n"', '"訳2"'].join('\n'));
    expect(content).toContain('#~ #, no-wrap');
    expect(content).toContain('#~ msgctxt "DictKey_2"');
  });

  it('CSV は BOM 付き UTF-8 でヘッダーとセル内改行を保持する', () => {
    const content = buildMizTranslationCsvContent([
      createEntry({
        sourceText: '1行目\n2行目',
        translatedText: '訳1\n訳2',
      }),
      createEntry({
        key: 'DictKey_2',
        enabled: false,
        sourceText: 'Quote "A"',
        translatedText: '',
      }),
    ]);

    expect(content.startsWith('\uFEFF')).toBe(true);
    expect(content).toContain('"有効","key","原文","翻訳"');
    expect(content).toContain('"TRUE","DictKey_1","1行目\r\n2行目","訳1\r\n訳2"');
    expect(content).toContain('"FALSE","DictKey_2","Quote ""A""",""');
  });

  it('PO/CSV ファイル名を MIZ ファイル名ベースで解決する', () => {
    expect(resolveMizTranslationDownloadFileName('briefing.miz', 'po')).toBe('briefing.miz.ja_JP.po');
    expect(resolveMizTranslationDownloadFileName('briefing.miz', 'csv')).toBe('briefing.miz.ja_JP.csv');
  });

  it('エクスポート対象は現在のソート状態で並び替える', () => {
    const entries = [
      createEntry({ key: 'DictKey_1', sourceText: 'Bravo' }),
      createEntry({ key: 'DictKey_2', sourceText: 'Alpha' }),
    ];

    expect(
      resolveMizTranslationExportEntries(entries, {
        sortKey: 'sourceText',
        sortOrder: 'asc',
      }).map((entry) => entry.key),
    ).toEqual(['DictKey_2', 'DictKey_1']);
  });
});
