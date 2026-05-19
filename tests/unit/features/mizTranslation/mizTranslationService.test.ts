import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { MizDictionaryParseError, parseMizDictionaryDocument } from '@/features/mizTranslation/mizDictionaryParser';
import {
  buildDictionaryDownloadPayload,
  buildDictionaryDownloadPayloadFromDocument,
  buildDictionaryDownloadPayloadFromEntries,
  buildMizTranslatedDictionaryContent,
  parseImportedDictionaryValues,
  parseMizTranslationImportEntries,
  readMizDictionaryEntries,
  readMizDictionarySource,
} from '@/features/mizTranslation/mizTranslationService';

/**
 * @summary 指定エントリーを含む MIZ 相当ファイルを生成する。
 * @param entries ZIP に含めるパスと内容の一覧を指定する。
 * @param fileName 生成するファイル名を指定する。
 * @returns MIZ 相当の File を返す。
 */
const createMizFile = async (
  entries: ReadonlyArray<{ path: string; content: string }>,
  fileName = 'sample.miz',
): Promise<File> => {
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.path, entry.content);
  }

  const buffer = await zip.generateAsync({ type: 'arraybuffer' });
  return new File([buffer], fileName, { type: 'application/zip' });
};

describe('mizTranslationService', () => {
  it('MIZ 読込から entries/document/source/fileName を一貫して返す', async () => {
    const source = ['dictionary = {', '  ["DictKey_1"] = "Alpha",', '  ["DictKey_WptName_2"] = "",', '}'].join('\n');
    const mizFile = await createMizFile([{ path: 'l10n/DEFAULT/dictionary', content: source }], 'mission_01.miz');

    const result = await readMizDictionaryEntries(mizFile);

    expect(result.source).toBe(source);
    expect(result.fileName).toBe('mission_01.miz');
    expect(result.entries).toEqual([
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
    expect(result.document.source).toBe(source);
    expect(result.document.entries).toHaveLength(2);
  });

  it('readMizDictionarySource が dictionary ソースと入力ファイル名を返す', async () => {
    const mizFile = await createMizFile(
      [{ path: 'l10n/DEFAULT/dictionary', content: 'dictionary = {\n  ["DictKey_10"] = "Bravo",\n}' }],
      'briefing.miz',
    );

    await expect(readMizDictionarySource(mizFile)).resolves.toEqual({
      source: 'dictionary = {\n  ["DictKey_10"] = "Bravo",\n}',
      fileName: 'briefing.miz',
    });
  });

  it('parse 失敗時は MizDictionaryParseError をそのまま伝播する', async () => {
    const mizFile = await createMizFile([
      {
        path: 'l10n/DEFAULT/dictionary',
        content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n',
      },
    ]);

    await expect(readMizDictionaryEntries(mizFile)).rejects.toBeInstanceOf(MizDictionaryParseError);
  });

  it('dictionary ダウンロード用 payload を組み立てる', async () => {
    const content = 'dictionary = {\n  ["DictKey_1"] = "翻訳",\n}';

    const result = buildDictionaryDownloadPayload(content);

    expect(result.fileName).toBe('dictionary');
    expect(result.mimeType).toBe('application/octet-stream');
    expect(result.blob.type).toBe('application/octet-stream');
    expect(await result.blob.text()).toBe(content);
    expect((await result.blob.text()).charCodeAt(0)).not.toBe(0xfeff);
  });

  it('dictionary エントリー一覧から serializer 経由でダウンロード用 payload を組み立てる', async () => {
    const result = buildDictionaryDownloadPayloadFromEntries([
      { key: 'DictKey_1', translatedText: '翻訳1' },
      { key: 'DictKey_2', translatedText: 'line1\nline2' },
    ]);

    expect(result.fileName).toBe('dictionary');
    expect(result.mimeType).toBe('application/octet-stream');
    expect(await result.blob.text()).toBe(
      ['dictionary = {', '  ["DictKey_1"] = "翻訳1",', '  ["DictKey_2"] = "line1\\', 'line2",', '}'].join('\n'),
    );
  });

  it('import 用 dictionary は重複 key を後勝ちで解釈する', () => {
    const source = ['dictionary = {', '  ["DictKey_1"] = "old",', '  ["DictKey_1"] = "new",', '}'].join('\n');

    expect([...parseImportedDictionaryValues(source).entries()]).toEqual([['DictKey_1', 'new']]);
  });

  it('形式別 import API は dictionary を key/value から import エントリーへ変換する', () => {
    const source = ['dictionary = {', '  ["DictKey_1"] = "翻訳1",', '}'].join('\n');

    expect(parseMizTranslationImportEntries('dictionary', source)).toEqual([
      {
        key: 'DictKey_1',
        sourceText: '',
        translatedText: '翻訳1',
      },
    ]);
  });

  it('形式別 import API は PO を import エントリーへ変換する', () => {
    const source = ['#, no-wrap', 'msgctxt "DictKey_1"', 'msgid "Alpha"', 'msgstr "翻訳1"'].join('\n');

    expect(parseMizTranslationImportEntries('po', source)).toEqual([
      {
        key: 'DictKey_1',
        sourceText: 'Alpha',
        translatedText: '翻訳1',
      },
    ]);
  });

  it('形式別 import API は CSV を import エントリーへ変換する', () => {
    const source = '\uFEFF"有効","key","原文","翻訳"\r\n"TRUE","DictKey_1","Alpha","翻訳1"';

    expect(parseMizTranslationImportEntries('csv', source)).toEqual([
      {
        key: 'DictKey_1',
        sourceText: 'Alpha',
        translatedText: '翻訳1',
      },
    ]);
  });

  it('DEFAULT 文書のコメントと並び順を維持したまま有効な翻訳だけを再構築する', () => {
    const source = [
      'dictionary = {',
      '  -- keep comment',
      '  ["DictKey_1"] = "Alpha",',
      '  ["DictKey_WptName_2"] = "Bravo",',
      '  ["DictKey_3"] = "Charlie",',
      '}',
    ].join('\n');
    const result = {
      document: parseMizDictionaryDocument(source),
      entries: [
        {
          key: 'DictKey_1',
          sourceText: 'Alpha',
          translatedText: '翻訳1',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
        {
          key: 'DictKey_WptName_2',
          sourceText: 'Bravo',
          translatedText: '非対象',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: false,
        },
        {
          key: 'DictKey_3',
          sourceText: 'Charlie',
          translatedText: '',
          enabled: true,
          isDictionaryKey: true,
          isTranslatable: true,
        },
      ],
    };

    expect(buildMizTranslatedDictionaryContent(result.document, result.entries)).toBe(
      [
        'dictionary = {',
        '  -- keep comment',
        '  ["DictKey_1"] = "翻訳1",',
        '  ["DictKey_WptName_2"] = "Bravo",',
        '  ["DictKey_3"] = "Charlie",',
        '}',
      ].join('\n'),
    );
  });

  it('document ベースの payload 生成で再構築結果を返す', async () => {
    const source = ['dictionary = {', '  ["DictKey_1"] = "Alpha",', '}'].join('\n');
    const document = parseMizDictionaryDocument(source);

    const payload = buildDictionaryDownloadPayloadFromDocument(document, [
      {
        key: 'DictKey_1',
        sourceText: 'Alpha',
        translatedText: '翻訳1',
        enabled: true,
        isDictionaryKey: true,
        isTranslatable: true,
      },
    ]);

    expect(await payload.blob.text()).toBe(['dictionary = {', '  ["DictKey_1"] = "翻訳1",', '}'].join('\n'));
  });
});
