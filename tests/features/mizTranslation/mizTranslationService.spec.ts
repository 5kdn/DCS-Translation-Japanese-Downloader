import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { MizDictionaryParseError } from '@/features/mizTranslation/mizDictionaryParser';
import {
  buildDictionaryDownloadPayload,
  buildDictionaryDownloadPayloadFromEntries,
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
    expect(result.mimeType).toBe('text/plain;charset=utf-8');
    expect(result.blob.type).toBe('text/plain;charset=utf-8');
    expect(await result.blob.text()).toBe(content);
    expect((await result.blob.text()).charCodeAt(0)).not.toBe(0xfeff);
  });

  it('dictionary エントリー一覧から serializer 経由でダウンロード用 payload を組み立てる', async () => {
    const result = buildDictionaryDownloadPayloadFromEntries([
      { key: 'DictKey_1', translatedText: '翻訳1' },
      { key: 'DictKey_2', translatedText: 'line1\nline2' },
    ]);

    expect(result.fileName).toBe('dictionary');
    expect(result.mimeType).toBe('text/plain;charset=utf-8');
    expect(await result.blob.text()).toBe(
      ['dictionary = {', '  ["DictKey_1"] = "翻訳1",', '  ["DictKey_2"] = "line1\\nline2",', '}'].join('\n'),
    );
  });
});
