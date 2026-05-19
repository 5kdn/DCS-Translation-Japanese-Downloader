import JSZip from 'jszip';
import type { MizArchiveDictionarySource } from '@/features/mizTranslation/mizArchiveModels';

/**
 * @summary MIZ 内から読込対象とする dictionary の固定パスを表す。
 */
const DEFAULT_DICTIONARY_PATH = 'l10n/DEFAULT/dictionary';

/**
 * @summary MIZ アーカイブ読込失敗を表す。
 */
export class MizArchiveReadError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'MizArchiveReadError';
  }
}

/**
 * @summary MIZ 内の `l10n/DEFAULT/dictionary` 未存在を表す。
 */
export class MizDefaultDictionaryNotFoundError extends Error {
  public constructor(message = 'MIZ 内に l10n/DEFAULT/dictionary が見つかりません。') {
    super(message);
    this.name = 'MizDefaultDictionaryNotFoundError';
  }
}

/**
 * @summary MIZ アーカイブから `l10n/DEFAULT/dictionary` を抽出する。
 * @param mizFile 読込対象の MIZ データを指定する。
 * @returns 抽出した dictionary ソースと入力ファイル名を返す。
 */
export const readMizArchiveDictionarySource = async (
  mizFile: Blob | File | ArrayBuffer,
): Promise<MizArchiveDictionarySource> => {
  let archive: JSZip;

  try {
    archive = await JSZip.loadAsync(await toArrayBuffer(mizFile));
  } catch (error: unknown) {
    throw new MizArchiveReadError('.miz を zip として読み込めません。', { cause: error });
  }

  const dictionaryEntry = archive.file(DEFAULT_DICTIONARY_PATH);
  if (dictionaryEntry === null) {
    throw new MizDefaultDictionaryNotFoundError();
  }

  try {
    return {
      source: await dictionaryEntry.async('string'),
      fileName: resolveFileName(mizFile),
    };
  } catch (error: unknown) {
    throw new MizArchiveReadError('MIZ 内の dictionary 読込に失敗しました。', { cause: error });
  }
};

/**
 * @summary MIZ 入力を ArrayBuffer へ正規化する。
 * @param mizFile 読込対象の MIZ データを指定する。
 * @returns ArrayBuffer を返す。
 */
const toArrayBuffer = async (mizFile: Blob | File | ArrayBuffer): Promise<ArrayBuffer> => {
  if (mizFile instanceof ArrayBuffer) {
    return mizFile;
  }

  return mizFile.arrayBuffer();
};

/**
 * @summary 入力 MIZ から利用可能なファイル名を解決する。
 * @param mizFile 読込対象の MIZ データを指定する。
 * @returns 入力ファイル名を返す。取得できない場合は空文字を返す。
 */
const resolveFileName = (mizFile: Blob | File | ArrayBuffer): string => {
  if (typeof File !== 'undefined' && mizFile instanceof File) {
    return mizFile.name;
  }

  return '';
};
