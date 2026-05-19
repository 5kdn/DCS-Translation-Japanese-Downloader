import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  MizArchiveReadError,
  MizDefaultDictionaryNotFoundError,
  readMizArchiveDictionarySource,
} from '@/features/mizTranslation/mizArchiveReader';

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

describe('mizArchiveReader', () => {
  it('MIZ から l10n/DEFAULT/dictionary を読める', async () => {
    const mizFile = await createMizFile([
      {
        path: 'l10n/DEFAULT/dictionary',
        content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}',
      },
    ]);

    const result = await readMizArchiveDictionarySource(mizFile);

    expect(result).toEqual({
      source: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}',
      fileName: 'sample.miz',
    });
  });

  it('l10n/DEFAULT/dictionary が存在しない場合は専用例外を送出する', async () => {
    const mizFile = await createMizFile([
      {
        path: 'l10n/JP/dictionary',
        content: 'dictionary = {}',
      },
    ]);

    await expect(readMizArchiveDictionarySource(mizFile)).rejects.toBeInstanceOf(MizDefaultDictionaryNotFoundError);
  });

  it('壊れた zip の場合は読込失敗を返す', async () => {
    const invalidMizFile = new File(['not a zip'], 'broken.miz', { type: 'application/octet-stream' });

    await expect(readMizArchiveDictionarySource(invalidMizFile)).rejects.toBeInstanceOf(MizArchiveReadError);
  });
});
