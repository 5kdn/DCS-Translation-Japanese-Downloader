import type {
  MizArchiveDictionarySource,
  MizDictionaryDownloadPayload,
  MizDictionaryEntriesResult,
} from '@/features/mizTranslation/mizArchiveModels';
import { readMizArchiveDictionarySource } from '@/features/mizTranslation/mizArchiveReader';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import {
  parseMizDictionaryDocument,
  parseMizDictionaryEntries,
  serializeMizDictionary,
} from '@/features/mizTranslation/mizDictionaryParser';

/**
 * @summary dictionary ダウンロード時に使用する既定ファイル名を表す。
 */
const DICTIONARY_DOWNLOAD_FILE_NAME = 'dictionary';

/**
 * @summary dictionary ダウンロード payload に付与する MIME type を表す。
 */
const DICTIONARY_DOWNLOAD_MIME_TYPE = 'text/plain;charset=utf-8';

/**
 * @summary MIZ から抽出した dictionary ソースを返す。
 * @param mizFile 読込対象の MIZ データを指定する。
 * @returns `l10n/DEFAULT/dictionary` の文字列と入力ファイル名を返す。
 */
export const readMizDictionarySource = async (mizFile: Blob | File | ArrayBuffer): Promise<MizArchiveDictionarySource> => {
  return readMizArchiveDictionarySource(mizFile);
};

/**
 * @summary MIZ から dictionary の編集データ一式を読み込む。
 * @param mizFile 読込対象の MIZ データを指定する。
 * @returns 編集用エントリー、元ソース、入力ファイル名、再構築用文書を返す。
 */
export const readMizDictionaryEntries = async (mizFile: Blob | File | ArrayBuffer): Promise<MizDictionaryEntriesResult> => {
  const { source, fileName } = await readMizDictionarySource(mizFile);
  const document = parseMizDictionaryDocument(source);
  const entries = parseMizDictionaryEntries(source);

  return {
    entries,
    source,
    fileName,
    document,
  };
};

/**
 * @summary dictionary 文字列からダウンロード用 payload を構築する。
 * @param content ダウンロード対象の dictionary 文字列を指定する。
 * @returns 保存用 Blob とファイル名、MIME type を返す。
 */
export const buildDictionaryDownloadPayload = (content: string): MizDictionaryDownloadPayload => {
  return {
    blob: new Blob([content], { type: DICTIONARY_DOWNLOAD_MIME_TYPE }),
    fileName: DICTIONARY_DOWNLOAD_FILE_NAME,
    mimeType: DICTIONARY_DOWNLOAD_MIME_TYPE,
  };
};

/**
 * @summary dictionary エントリー一覧からダウンロード用 payload を構築する。
 * @param entries 出力対象の dictionary エントリー一覧を指定する。
 * @returns serializer 済みの保存用 Blob とファイル名、MIME type を返す。
 */
export const buildDictionaryDownloadPayloadFromEntries = (
  entries: ReadonlyArray<Pick<MizDictionaryEntry, 'key' | 'translatedText'>>,
): MizDictionaryDownloadPayload => {
  return buildDictionaryDownloadPayload(serializeMizDictionary(entries));
};
