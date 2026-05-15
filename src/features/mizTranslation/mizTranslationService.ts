import type {
  MizArchiveDictionarySource,
  MizDictionaryDownloadPayload,
  MizDictionaryEntriesResult,
} from '@/features/mizTranslation/mizArchiveModels';
import { readMizArchiveDictionarySource } from '@/features/mizTranslation/mizArchiveReader';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import {
  type MizDictionaryDocument,
  parseMizDictionaryDocument,
  parseMizDictionaryEntries,
  parseMizDictionaryValues,
  rebuildMizDictionary,
  serializeMizDictionary,
} from '@/features/mizTranslation/mizDictionaryParser';

/**
 * @summary dictionary ダウンロード時に使用する既定ファイル名を表す。
 */
const DICTIONARY_DOWNLOAD_FILE_NAME = 'dictionary';

/**
 * @summary dictionary ダウンロード payload に付与する MIME type を表す。
 */
const DICTIONARY_DOWNLOAD_MIME_TYPE = 'application/octet-stream';

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

/**
 * @summary dictionary 文字列を既存翻訳 import 用の key/value 一覧へ変換する。
 * @param source 読込対象の dictionary 文字列を指定する。
 * @returns key 重複時に後勝ちを適用した value 一覧を返す。
 */
export const parseImportedDictionaryValues = (source: string): Map<string, string> => {
  return parseMizDictionaryValues(source);
};

/**
 * @summary 編集状態から `l10n/JP/dictionary` 用の再構築文字列を生成する。
 * @param document 元 `l10n/DEFAULT/dictionary` の文書表現を指定する。
 * @param entries 現在の編集状態を指定する。
 * @returns コメントと並び順を維持した dictionary 文字列を返す。
 */
export const buildMizTranslatedDictionaryContent = (
  document: MizDictionaryDocument,
  entries: ReadonlyArray<MizDictionaryEntry>,
): string => {
  const replacements = new Map<string, string>();

  for (const entry of entries) {
    if (!entry.enabled || !entry.isTranslatable || entry.translatedText === '') {
      continue;
    }

    replacements.set(entry.key, entry.translatedText);
  }

  return rebuildMizDictionary(document, replacements);
};

/**
 * @summary 編集状態から再構築済み dictionary のダウンロード payload を構築する。
 * @param document 元 `l10n/DEFAULT/dictionary` の文書表現を指定する。
 * @param entries 現在の編集状態を指定する。
 * @returns 保存用 Blob とファイル名、MIME type を返す。
 */
export const buildDictionaryDownloadPayloadFromDocument = (
  document: MizDictionaryDocument,
  entries: ReadonlyArray<MizDictionaryEntry>,
): MizDictionaryDownloadPayload => {
  return buildDictionaryDownloadPayload(buildMizTranslatedDictionaryContent(document, entries));
};
