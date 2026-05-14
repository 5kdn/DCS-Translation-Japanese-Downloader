import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import type { MizDictionaryDocument } from '@/features/mizTranslation/mizDictionaryParser';

/**
 * @summary MIZ アーカイブから抽出した dictionary ソースを表す。
 */
export type MizArchiveDictionarySource = {
  source: string;
  fileName: string;
};

/**
 * @summary dictionary ダウンロードに必要な payload を表す。
 */
export type MizDictionaryDownloadPayload = {
  blob: Blob;
  fileName: string;
  mimeType: string;
};

/**
 * @summary MIZ から読込済みの dictionary 編集データ一式を表す。
 */
export type MizDictionaryEntriesResult = {
  entries: MizDictionaryEntry[];
  source: string;
  fileName: string;
  document: MizDictionaryDocument;
};
