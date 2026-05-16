import type { MizTranslationImportEntry } from '@/features/mizTranslation/mizTranslationImportModels';

type PoEntryCandidate = {
  msgctxt?: string;
  msgid?: string;
  msgstr?: string;
};

/**
 * @summary MIZ 翻訳 PO 文字列を import 用エントリー一覧へ変換する。
 * @param source 読込対象の PO 文字列を指定する。
 * @returns `key`、`sourceText`、`translatedText` を含む import 用エントリー一覧を返す。
 */
export const parseMizTranslationImportPo = (source: string): MizTranslationImportEntry[] => {
  const blocks = normalizePoLineEndings(source)
    .split(/\n{2,}/u)
    .map((block) => block.trim())
    .filter((block) => block !== '');

  return blocks.map(parsePoEntryBlock).filter((entry): entry is MizTranslationImportEntry => {
    return entry !== null;
  });
};

/**
 * @summary 1 ブロック分の PO エントリーを解釈する。
 * @param block 解釈対象ブロックを指定する。
 * @returns import 用エントリー、または無視対象時は `null` を返す。
 */
const parsePoEntryBlock = (block: string): MizTranslationImportEntry | null => {
  const entry = parsePoEntryCandidate(block);

  if (entry.msgid === undefined || entry.msgid === '') {
    return null;
  }

  if (entry.msgctxt === undefined || entry.msgstr === undefined) {
    return null;
  }

  return {
    key: entry.msgctxt,
    sourceText: entry.msgid,
    translatedText: entry.msgstr,
  };
};

/**
 * @summary PO ブロックを候補フィールドへ変換する。
 * @param block 解釈対象ブロックを指定する。
 * @returns 抽出したフィールド群を返す。
 */
const parsePoEntryCandidate = (block: string): PoEntryCandidate => {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  const entry: PoEntryCandidate = {};
  let currentField: keyof PoEntryCandidate | null = null;
  let currentValueLines: string[] = [];

  const commitCurrentField = (): void => {
    if (currentField === null) {
      return;
    }

    entry[currentField] = currentValueLines.map(unquotePoString).join('');
    currentField = null;
    currentValueLines = [];
  };

  for (const originalLine of lines) {
    const line = originalLine.startsWith('#~ ') ? originalLine.slice(3) : originalLine;

    if (line.startsWith('#')) {
      continue;
    }

    const fieldMatch = line.match(/^(msgctxt|msgid|msgstr)\s+(".*")$/u);
    if (fieldMatch !== null) {
      commitCurrentField();
      const [, fieldName, value] = fieldMatch;
      currentField = fieldName as keyof PoEntryCandidate;
      currentValueLines = [value];
      continue;
    }

    if (line.startsWith('"')) {
      if (currentField === null) {
        throw new Error(`PO の継続行が不正です: ${line}`);
      }

      currentValueLines.push(line);
    }
  }

  commitCurrentField();
  return entry;
};

/**
 * @summary PO 文字列リテラルを通常文字列へ変換する。
 * @param value 変換対象文字列を指定する。
 * @returns アンエスケープ後の文字列を返す。
 */
const unquotePoString = (value: string): string => {
  if (!value.startsWith('"') || !value.endsWith('"')) {
    throw new Error(`PO 文字列が不正です: ${value}`);
  }

  let result = '';
  for (let index = 1; index < value.length - 1; index += 1) {
    const char = value[index];
    if (char !== '\\') {
      result += char;
      continue;
    }

    const nextChar = value[index + 1];
    if (nextChar === undefined) {
      throw new Error('PO のエスケープシーケンスが不正です。');
    }

    switch (nextChar) {
      case 'n':
        result += '\n';
        break;
      case 't':
        result += '\t';
        break;
      case '\\':
        result += '\\';
        break;
      case '"':
        result += '"';
        break;
      default:
        result += nextChar;
        break;
    }

    index += 1;
  }

  return result;
};

/**
 * @summary PO 入力向けに改行コードを LF へ正規化する。
 * @param value 正規化対象文字列を指定する。
 * @returns LF 正規化後の文字列を返す。
 */
const normalizePoLineEndings = (value: string): string => {
  return value.replace(/\r\n?/gu, '\n');
};
