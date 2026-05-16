import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import { parseMizTranslationImportCsv } from '@/features/mizTranslation/mizTranslationImportCsv';
import type { MizTranslationImportEntry } from '@/features/mizTranslation/mizTranslationImportModels';

const CSV_BOM = '\uFEFF';
const CSV_LINE_BREAK = '\r\n';

/**
 * @summary dictionary エントリー一覧を Excel 表示向け CSV 文字列へ変換する。
 * @param entries 出力対象のエントリー一覧を指定する。
 * @returns BOM 付き UTF-8 CSV 文字列を返す。
 */
export const buildMizTranslationCsvContent = (entries: ReadonlyArray<MizDictionaryEntry>): string => {
  const rows = [
    ['有効', 'key', '原文', '翻訳'],
    ...entries.map((entry): string[] => {
      return [entry.enabled ? 'TRUE' : 'FALSE', entry.key, entry.sourceText, entry.translatedText];
    }),
  ];

  return `${CSV_BOM}${rows.map((row) => row.map(escapeCsvCell).join(',')).join(CSV_LINE_BREAK)}`;
};

/**
 * @summary MIZ 翻訳 CSV 文字列を import 用エントリー一覧へ変換する。
 * @param source 読込対象の CSV 文字列を指定する。
 * @returns `key`、`sourceText`、`translatedText` を含む import 用エントリー一覧を返す。
 */
export const parseMizTranslationCsvContent = (source: string): MizTranslationImportEntry[] => {
  return parseMizTranslationImportCsv(source);
};

/**
 * @summary CSV セル値をクォート付き表現へ変換する。
 * @param value 変換対象文字列を指定する。
 * @returns CSV へ出力可能なセル文字列を返す。
 */
const escapeCsvCell = (value: string): string => {
  const normalizedValue = value.replace(/\r\n|\r|\n/gu, CSV_LINE_BREAK);
  return `"${normalizedValue.replace(/"/gu, '""')}"`;
};
