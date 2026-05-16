import type { MizTranslationImportEntry } from '@/features/mizTranslation/mizTranslationImportModels';

const CSV_HEADER = ['有効', 'key', '原文', '翻訳'] as const;

/**
 * @summary MIZ 翻訳 CSV 文字列を import 用エントリー一覧へ変換する。
 * @param source 読込対象の CSV 文字列を指定する。
 * @returns `key`、`sourceText`、`translatedText` を含む import 用エントリー一覧を返す。
 */
export const parseMizTranslationImportCsv = (source: string): MizTranslationImportEntry[] => {
  const rows = parseCsvRows(stripUtf8Bom(source));

  if (rows.length === 0) {
    return [];
  }

  assertCsvHeader(rows[0]);

  return rows
    .slice(1)
    .filter((row) => row.length > 0)
    .map((row): MizTranslationImportEntry => {
      if (row.length !== CSV_HEADER.length) {
        throw new Error(`CSV の列数が不正です: ${row.length}`);
      }

      return {
        key: row[1] ?? '',
        sourceText: normalizeCellLineEndings(row[2] ?? ''),
        translatedText: normalizeCellLineEndings(row[3] ?? ''),
      };
    });
};

/**
 * @summary UTF-8 BOM を除去する。
 * @param source 変換対象文字列を指定する。
 * @returns BOM 除去後の文字列を返す。
 */
const stripUtf8Bom = (source: string): string => {
  return source.startsWith('\uFEFF') ? source.slice(1) : source;
};

/**
 * @summary CSV ヘッダー行の妥当性を検証する。
 * @param row 検証対象ヘッダー行を指定する。
 */
const assertCsvHeader = (row: string[]): void => {
  const actualHeader = row.join(',');
  const expectedHeader = [...CSV_HEADER].join(',');
  if (actualHeader !== expectedHeader) {
    throw new Error(`CSV ヘッダーが不正です: ${actualHeader}`);
  }
};

/**
 * @summary RFC 4180 準拠の単純な CSV 文字列を行一覧へ分解する。
 * @param source 解析対象文字列を指定する。
 * @returns セル値の二次元配列を返す。
 */
const parseCsvRows = (source: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let index = 0;
  let isInsideQuotes = false;

  while (index < source.length) {
    const char = source[index];

    if (char === undefined) {
      break;
    }

    if (isInsideQuotes) {
      if (char === '"') {
        const nextChar = source[index + 1];
        if (nextChar === '"') {
          currentCell += '"';
          index += 2;
          continue;
        }

        isInsideQuotes = false;
        index += 1;
        continue;
      }

      currentCell += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      isInsideQuotes = true;
      index += 1;
      continue;
    }

    if (char === ',') {
      currentRow.push(currentCell);
      currentCell = '';
      index += 1;
      continue;
    }

    if (char === '\r' || char === '\n') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      index += char === '\r' && source[index + 1] === '\n' ? 2 : 1;
      continue;
    }

    currentCell += char;
    index += 1;
  }

  if (isInsideQuotes) {
    throw new Error('CSV のクォートが閉じられていません。');
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
};

/**
 * @summary CSV セル内改行を LF へ正規化する。
 * @param value 正規化対象文字列を指定する。
 * @returns LF 正規化後の文字列を返す。
 */
const normalizeCellLineEndings = (value: string): string => {
  return value.replace(/\r\n?/gu, '\n');
};
