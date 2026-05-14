import {
  getInitialEnabledState,
  isDictionaryKey,
  isTranslatableDictionaryKey,
} from '@/features/mizTranslation/mizDictionaryKey';
import { decodeLuaStringLiteral, encodeLuaStringLiteral } from '@/features/mizTranslation/mizDictionaryLuaString';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';

/**
 * @summary dictionary 再構築に必要な value 位置情報を保持する内部エントリーを表す。
 */
type ParsedDictionaryEntry = {
  /** dictionary key を表す。 */
  key: string;
  /** デコード済みの value を表す。 */
  value: string;
  /** 元ソース中の value 文字列リテラル開始位置を表す。 */
  valueLiteralStart: number;
  /** 元ソース中の value 文字列リテラル終端直後の位置を表す。 */
  valueLiteralEnd: number;
};

/**
 * @summary 元 dictionary 文字列と抽出済みエントリー一覧を保持する再構築用文書を表す。
 */
export type MizDictionaryDocument = {
  /** UTF-8 BOM を除去した元の dictionary 文字列を表す。 */
  source: string;
  /** 元文字列から抽出した再構築対象エントリー一覧を表す。 */
  entries: ParsedDictionaryEntry[];
};

/**
 * @summary dictionary 解析失敗を表す。
 */
export class MizDictionaryParseError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MizDictionaryParseError';
  }
}

/**
 * @summary dictionary ソース文字列を編集用エントリーへ変換する。
 * @param source `l10n/DEFAULT/dictionary` 相当の文字列を指定する。
 * @returns key 重複時に後勝ちを適用した編集用エントリー一覧を返す。
 */
export const parseMizDictionaryEntries = (source: string): MizDictionaryEntry[] => {
  const document = parseMizDictionaryDocument(source);
  const entryMap = new Map<string, MizDictionaryEntry>();

  for (const entry of document.entries) {
    entryMap.set(entry.key, {
      key: entry.key,
      sourceText: entry.value,
      translatedText: '',
      enabled: getInitialEnabledState(entry.key),
      isDictionaryKey: isDictionaryKey(entry.key),
      isTranslatable: isTranslatableDictionaryKey(entry.key),
    });
  }

  return [...entryMap.values()];
};

/**
 * @summary dictionary ソース文字列を key/value マップへ変換する。
 * @param source dictionary 文字列を指定する。
 * @returns key 重複時に後勝ちを適用した value マップを返す。
 */
export const parseMizDictionaryValues = (source: string): Map<string, string> => {
  const document = parseMizDictionaryDocument(source);
  const entryMap = new Map<string, string>();

  for (const entry of document.entries) {
    entryMap.set(entry.key, entry.value);
  }

  return entryMap;
};

/**
 * @summary dictionary ソース文字列を再構築可能な文書表現へ変換する。
 * @param source dictionary 文字列を指定する。
 * @returns 元文字列と value 範囲を保持した文書表現を返す。
 */
export const parseMizDictionaryDocument = (source: string): MizDictionaryDocument => {
  const normalizedSource = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const tableStart = findDictionaryTableStart(normalizedSource);
  const tableCloseIndex = findDictionaryTableEnd(normalizedSource, tableStart);
  const entries = parseDictionaryEntriesInTable(normalizedSource, tableStart + 1, tableCloseIndex);

  return {
    source: normalizedSource,
    entries,
  };
};

/**
 * @summary エントリー一覧から `l10n/JP/dictionary` 文字列を生成する。
 * @param entries 出力対象の key/value 一覧を指定する。
 * @returns UTF-8 BOM を含まない dictionary 文字列を返す。
 */
export const serializeMizDictionary = (entries: ReadonlyArray<Pick<MizDictionaryEntry, 'key' | 'translatedText'>>): string => {
  const lines = entries.map((entry) => {
    return `  [${encodeLuaStringLiteral(entry.key)}] = ${encodeLuaStringLiteral(entry.translatedText)},`;
  });

  return ['dictionary = {', ...lines, '}'].join('\n');
};

/**
 * @summary 元の dictionary 文字列をコメントと並び順を維持したまま再構築する。
 * @param document 元 dictionary の解析結果を指定する。
 * @param replacements key ごとの差し替え値を指定する。
 * @returns value だけを書き換えた dictionary 文字列を返す。
 */
export const rebuildMizDictionary = (document: MizDictionaryDocument, replacements: ReadonlyMap<string, string>): string => {
  let rebuilt = document.source;

  for (const entry of [...document.entries].reverse()) {
    const replacement = replacements.get(entry.key);
    if (replacement === undefined) continue;

    rebuilt =
      rebuilt.slice(0, entry.valueLiteralStart) + encodeLuaStringLiteral(replacement) + rebuilt.slice(entry.valueLiteralEnd);
  }

  return rebuilt;
};

/**
 * @summary コメントや文字列を除外しながら dictionary テーブル開始位置を検出する。
 * @param source 解析対象の Lua 文字列を指定する。
 * @returns `dictionary = {` における `{` の位置を返す。
 */
const findDictionaryTableStart = (source: string): number => {
  let index = 0;

  while (index < source.length) {
    if (isBlockCommentStart(source, index)) {
      index = skipBlockComment(source, index);
      continue;
    }

    if (source.startsWith('--', index)) {
      index = skipLineComment(source, index);
      continue;
    }

    const char = source[index];
    if (char === '"' || char === "'") {
      index = skipStringLiteral(source, index);
      continue;
    }

    if (isLongBracketStart(source, index)) {
      index = skipLongBracketLiteral(source, index);
      continue;
    }

    if (isIdentifierStart(char)) {
      const identifierEnd = readIdentifierEnd(source, index);
      const identifier = source.slice(index, identifierEnd);
      if (identifier === 'dictionary') {
        let cursor = skipTrivia(source, identifierEnd);
        if (source[cursor] !== '=') {
          index = identifierEnd;
          continue;
        }

        cursor = skipTrivia(source, cursor + 1);
        if (source[cursor] !== '{') {
          index = identifierEnd;
          continue;
        }

        return cursor;
      }

      index = identifierEnd;
      continue;
    }

    index += 1;
  }

  throw new MizDictionaryParseError('dictionary テーブルが見つかりません。');
};

/**
 * @summary dictionary テーブル終端の `}` 位置を検出する。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param tableStart dictionary テーブル開始位置を指定する。
 * @returns テーブル終端の `}` 位置を返す。
 */
const findDictionaryTableEnd = (source: string, tableStart: number): number => {
  let index = tableStart + 1;

  while (index < source.length) {
    if (isBlockCommentStart(source, index)) {
      index = skipBlockComment(source, index);
      continue;
    }

    if (source.startsWith('--', index)) {
      index = skipLineComment(source, index);
      continue;
    }

    const char = source[index];
    if (char === '"' || char === "'") {
      index = skipStringLiteral(source, index);
      continue;
    }

    if (isLongBracketStart(source, index)) {
      index = skipLongBracketLiteral(source, index);
      continue;
    }

    if (char === '}') {
      return index;
    }

    index += 1;
  }

  throw new MizDictionaryParseError('dictionary テーブルの終端が見つかりません。');
};

/**
 * @summary dictionary テーブル本体から key/value エントリーを抽出する。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param tableContentStart テーブル内容開始位置を指定する。
 * @param tableCloseIndex テーブル終端位置を指定する。
 * @returns value リテラル範囲を保持した抽出結果一覧を返す。
 */
const parseDictionaryEntriesInTable = (
  source: string,
  tableContentStart: number,
  tableCloseIndex: number,
): ParsedDictionaryEntry[] => {
  const entries: ParsedDictionaryEntry[] = [];
  let index = tableContentStart;

  while (index < tableCloseIndex) {
    index = skipTrivia(source, index);
    if (index >= tableCloseIndex) break;

    if (source[index] !== '[') {
      throw new MizDictionaryParseError(`dictionary エントリーの開始位置が不正です。(${index})`);
    }

    index += 1;
    index = skipTrivia(source, index);

    const keyLiteral = readStringLiteral(source, index);
    const key = decodeLuaStringLiteral(keyLiteral.value);
    index = keyLiteral.end;
    index = skipTrivia(source, index);

    if (source[index] !== ']') {
      throw new MizDictionaryParseError(`dictionary key の終端が不正です。(${index})`);
    }

    index = skipTrivia(source, index + 1);
    if (source[index] !== '=') {
      throw new MizDictionaryParseError(`dictionary key/value 区切りが不正です。(${index})`);
    }

    index = skipTrivia(source, index + 1);
    const valueLiteral = readLuaValue(source, index, tableCloseIndex);

    entries.push({
      key,
      value: valueLiteral.value,
      valueLiteralStart: valueLiteral.start,
      valueLiteralEnd: valueLiteral.end,
    });

    index = skipTrivia(source, valueLiteral.end);
    if (source[index] === ',') {
      index += 1;
    }
  }

  return entries;
};

/**
 * @summary 指定位置から Lua 文字列リテラルを 1 つ読み取る。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start 読み取り開始位置を指定する。
 * @returns 開始位置と終了位置を含む文字列リテラル情報を返す。
 */
const readStringLiteral = (source: string, start: number): { start: number; end: number; value: string } => {
  const quote = source[start];
  if (quote !== '"' && quote !== "'") {
    throw new MizDictionaryParseError(`文字列リテラルの開始位置が不正です。(${start})`);
  }

  let index = start + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      index += 1;
      if (index < source.length) index += 1;
      continue;
    }

    if (char === quote) {
      return {
        start,
        end: index + 1,
        value: source.slice(start, index + 1),
      };
    }

    index += 1;
  }

  throw new MizDictionaryParseError(`文字列リテラルが閉じていません。(${start})`);
};

/**
 * @summary 指定位置から Lua の長括弧文字列を 1 つ読み取る。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start 読み取り開始位置を指定する。
 * @returns 開始位置と終了位置を含む長括弧文字列情報を返す。
 */
const readLongBracketLiteral = (source: string, start: number): { start: number; end: number; value: string } => {
  const separatorLength = getLongBracketSeparatorLength(source, start);
  if (separatorLength === null) {
    throw new MizDictionaryParseError(`長括弧文字列の開始位置が不正です。(${start})`);
  }

  const openDelimiterLength = separatorLength + 2;
  const closeDelimiter = `]${'='.repeat(separatorLength)}]`;
  const contentStart = start + openDelimiterLength;
  const closeIndex = source.indexOf(closeDelimiter, contentStart);
  if (closeIndex === -1) {
    throw new MizDictionaryParseError(`長括弧文字列が閉じていません。(${start})`);
  }

  return {
    start,
    end: closeIndex + closeDelimiter.length,
    value: source.slice(contentStart, closeIndex),
  };
};

/**
 * @summary 指定位置から Lua value を 1 つ読み取る。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start 読み取り開始位置を指定する。
 * @param tableCloseIndex dictionary テーブル終端位置を指定する。
 * @returns 開始位置と終了位置を含む value 情報を返す。
 */
const readLuaValue = (
  source: string,
  start: number,
  tableCloseIndex: number,
): { start: number; end: number; value: string } => {
  const firstChar = source[start];
  if (firstChar === '"' || firstChar === "'") {
    const literal = readStringLiteral(source, start);
    return {
      start: literal.start,
      end: literal.end,
      value: decodeLuaStringLiteral(literal.value),
    };
  }

  if (isLongBracketStart(source, start)) {
    return readLongBracketLiteral(source, start);
  }

  let index = start;
  let parenthesisDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let lastNonWhitespaceEnd = start;

  while (index < tableCloseIndex) {
    if (isBlockCommentStart(source, index)) {
      if (parenthesisDepth === 0 && braceDepth === 0 && bracketDepth === 0 && lastNonWhitespaceEnd > start) {
        return {
          start,
          end: lastNonWhitespaceEnd,
          value: source.slice(start, lastNonWhitespaceEnd).trimEnd(),
        };
      }

      index = skipBlockComment(source, index);
      continue;
    }

    if (source.startsWith('--', index)) {
      if (parenthesisDepth === 0 && braceDepth === 0 && bracketDepth === 0 && lastNonWhitespaceEnd > start) {
        return {
          start,
          end: lastNonWhitespaceEnd,
          value: source.slice(start, lastNonWhitespaceEnd).trimEnd(),
        };
      }

      index = skipLineComment(source, index);
      continue;
    }

    const char = source[index];
    if (char === '"' || char === "'") {
      const literal = readStringLiteral(source, index);
      index = literal.end;
      lastNonWhitespaceEnd = index;
      continue;
    }

    if (isLongBracketStart(source, index)) {
      const literal = readLongBracketLiteral(source, index);
      index = literal.end;
      lastNonWhitespaceEnd = index;
      continue;
    }

    if (char === '(') {
      parenthesisDepth += 1;
      index += 1;
      lastNonWhitespaceEnd = index;
      continue;
    }

    if (char === ')') {
      parenthesisDepth -= 1;
      index += 1;
      lastNonWhitespaceEnd = index;
      continue;
    }

    if (char === '{') {
      braceDepth += 1;
      index += 1;
      lastNonWhitespaceEnd = index;
      continue;
    }

    if (char === '}') {
      if (parenthesisDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
        return {
          start,
          end: lastNonWhitespaceEnd,
          value: source.slice(start, lastNonWhitespaceEnd).trimEnd(),
        };
      }

      braceDepth -= 1;
      index += 1;
      lastNonWhitespaceEnd = index;
      continue;
    }

    if (char === '[') {
      bracketDepth += 1;
      index += 1;
      lastNonWhitespaceEnd = index;
      continue;
    }

    if (char === ']') {
      bracketDepth -= 1;
      index += 1;
      lastNonWhitespaceEnd = index;
      continue;
    }

    if (char === ',' && parenthesisDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      return {
        start,
        end: lastNonWhitespaceEnd,
        value: source.slice(start, lastNonWhitespaceEnd).trimEnd(),
      };
    }

    index += 1;
    if (char !== ' ' && char !== '\t' && char !== '\n' && char !== '\r') {
      lastNonWhitespaceEnd = index;
    }
  }

  return {
    start,
    end: lastNonWhitespaceEnd,
    value: source.slice(start, lastNonWhitespaceEnd).trimEnd(),
  };
};

/**
 * @summary 指定位置の Lua 文字列リテラルを読み飛ばす。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start 読み飛ばし開始位置を指定する。
 * @returns 読み飛ばし後の位置を返す。
 */
const skipStringLiteral = (source: string, start: number): number => {
  return readStringLiteral(source, start).end;
};

/**
 * @summary 指定位置の Lua 長括弧文字列を読み飛ばす。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start 読み飛ばし開始位置を指定する。
 * @returns 読み飛ばし後の位置を返す。
 */
const skipLongBracketLiteral = (source: string, start: number): number => {
  return readLongBracketLiteral(source, start).end;
};

/**
 * @summary 空白とコメントをまとめて読み飛ばす。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start 読み飛ばし開始位置を指定する。
 * @returns 次に意味のあるトークンが現れる位置を返す。
 */
const skipTrivia = (source: string, start: number): number => {
  let index = start;

  while (index < source.length) {
    const char = source[index];
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      index += 1;
      continue;
    }

    if (isBlockCommentStart(source, index)) {
      index = skipBlockComment(source, index);
      continue;
    }

    if (source.startsWith('--', index)) {
      index = skipLineComment(source, index);
      continue;
    }

    break;
  }

  return index;
};

/**
 * @summary Lua ブロックコメントを読み飛ばす。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start `--[[` 開始位置を指定する。
 * @returns コメント終端直後の位置を返す。
 */
const skipBlockComment = (source: string, start: number): number => {
  const separatorLength = getLongBracketSeparatorLength(source, start + 2);
  if (separatorLength === null) {
    throw new MizDictionaryParseError('Lua ブロックコメントの開始位置が不正です。');
  }

  const closeDelimiter = `]${'='.repeat(separatorLength)}]`;
  const contentStart = start + 4 + separatorLength;
  const closeIndex = source.indexOf(closeDelimiter, contentStart);
  if (closeIndex === -1) {
    throw new MizDictionaryParseError('Lua ブロックコメントが閉じていません。');
  }

  return closeIndex + closeDelimiter.length;
};

/**
 * @summary Lua 行コメントを読み飛ばす。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start `--` 開始位置を指定する。
 * @returns 行末直後の位置を返す。
 */
const skipLineComment = (source: string, start: number): number => {
  const nextLineBreak = source.indexOf('\n', start + 2);
  return nextLineBreak === -1 ? source.length : nextLineBreak + 1;
};

/**
 * @summary Lua 識別子の先頭文字として有効か判定する。
 * @param char 判定対象の文字を指定する。
 * @returns 識別子の先頭に使える場合は true を返す。
 */
const isIdentifierStart = (char: string | undefined): boolean => {
  return char !== undefined && /[A-Za-z_]/.test(char);
};

/**
 * @summary 指定位置から Lua 識別子の終端位置を求める。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start 識別子開始位置を指定する。
 * @returns 識別子終端直後の位置を返す。
 */
const readIdentifierEnd = (source: string, start: number): number => {
  let index = start;
  while (index < source.length && /[A-Za-z0-9_]/.test(source[index] ?? '')) {
    index += 1;
  }

  return index;
};

/**
 * @summary 指定位置が Lua 長括弧文字列の開始か判定する。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start 判定開始位置を指定する。
 * @returns 長括弧文字列の開始であれば true を返す。
 */
const isLongBracketStart = (source: string, start: number): boolean => {
  return getLongBracketSeparatorLength(source, start) !== null;
};

/**
 * @summary 指定位置が Lua ブロックコメント開始か判定する。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start 判定開始位置を指定する。
 * @returns Lua ブロックコメント開始であれば true を返す。
 */
const isBlockCommentStart = (source: string, start: number): boolean => {
  return source.startsWith('--', start) && getLongBracketSeparatorLength(source, start + 2) !== null;
};

/**
 * @summary Lua 長括弧の `=` 個数を取得する。
 * @param source 解析対象の Lua 文字列を指定する。
 * @param start `[` の位置を指定する。
 * @returns 長括弧として有効な場合は `=` 個数を返し、それ以外は null を返す。
 */
const getLongBracketSeparatorLength = (source: string, start: number): number | null => {
  if (source[start] !== '[') {
    return null;
  }

  let index = start + 1;
  while (source[index] === '=') {
    index += 1;
  }

  return source[index] === '[' ? index - start - 1 : null;
};
