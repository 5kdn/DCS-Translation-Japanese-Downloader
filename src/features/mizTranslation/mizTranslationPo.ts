import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import type { MizTranslationImportEntry } from '@/features/mizTranslation/mizTranslationImportModels';
import { parseMizTranslationImportPo } from '@/features/mizTranslation/mizTranslationImportPo';

/**
 * @summary PO ヘッダー生成に必要なメタデータを表す。
 */
export type MizTranslationPoMetadata = {
  revisionDate: Date;
  generatorName: string;
  generatorVersion: string;
};

/**
 * @summary dictionary エントリー一覧を PO 文字列へ変換する。
 * @param entries 出力対象のエントリー一覧を指定する。
 * @param metadata ヘッダー生成に必要なメタデータを指定する。
 * @returns PO 形式の文字列を返す。
 */
export const buildMizTranslationPoContent = (
  entries: ReadonlyArray<MizDictionaryEntry>,
  metadata: MizTranslationPoMetadata,
): string => {
  return [buildPoHeaderBlock(metadata), ...entries.map(buildPoEntryBlock)].join('\n\n');
};

/**
 * @summary MIZ 翻訳 PO 文字列を import 用エントリー一覧へ変換する。
 * @param source 読込対象の PO 文字列を指定する。
 * @returns `key`、`sourceText`、`translatedText` を含む import 用エントリー一覧を返す。
 */
export const parseMizTranslationPoContent = (source: string): MizTranslationImportEntry[] => {
  return parseMizTranslationImportPo(source);
};

/**
 * @summary PO ヘッダーブロックを構築する。
 * @param metadata ヘッダー生成に必要なメタデータを指定する。
 * @returns PO ヘッダーブロックを返す。
 */
const buildPoHeaderBlock = (metadata: MizTranslationPoMetadata): string => {
  return [
    'msgid ""',
    'msgstr ""',
    ...buildPoHeaderValueLines([
      `Project-Id-Version: Digital Combat Simulator World\n`,
      `PO-Revision-Date: ${formatJstPoRevisionDate(metadata.revisionDate)}\n`,
      'Language: ja_JP\n',
      'MIME-Version: 1.0\n',
      'Content-Type: text/plain; charset=UTF-8\n',
      'Content-Transfer-Encoding: 8bit\n',
      `X-Generator: ${metadata.generatorName} ${metadata.generatorVersion}\n`,
    ]),
  ].join('\n');
};

/**
 * @summary 1 件分の PO エントリーブロックを構築する。
 * @param entry 出力対象エントリーを指定する。
 * @returns PO エントリーブロックを返す。
 */
const buildPoEntryBlock = (entry: MizDictionaryEntry): string => {
  const lines = ['#, no-wrap', ...buildPoFieldLines('msgctxt', entry.key), ...buildPoFieldLines('msgid', entry.sourceText)];

  lines.push(...buildPoFieldLines('msgstr', entry.translatedText));

  if (!entry.enabled) {
    return lines.map((line) => `#~ ${line}`).join('\n');
  }

  return lines.join('\n');
};

/**
 * @summary 指定値を PO フィールド行一覧へ変換する。
 * @param fieldName フィールド名を指定する。
 * @param value 変換対象文字列を指定する。
 * @returns PO フィールド行一覧を返す。
 */
const buildPoFieldLines = (fieldName: 'msgctxt' | 'msgid' | 'msgstr', value: string): string[] => {
  const normalizedValue = normalizePoLineEndings(value);
  if (!normalizedValue.includes('\n')) {
    return [`${fieldName} "${escapePoText(normalizedValue)}"`];
  }

  const segments = normalizedValue.split('\n');
  return [
    `${fieldName} ""`,
    ...segments.map((segment, index) => {
      const escapedSegment = escapePoText(segment);
      const hasTrailingNewline = index < segments.length - 1;
      return `"${escapedSegment}${hasTrailingNewline ? '\\n' : ''}"`;
    }),
  ];
};

/**
 * @summary PO ヘッダー value 行一覧を構築する。
 * @param values 出力対象値一覧を指定する。
 * @returns クォート済みヘッダー value 行一覧を返す。
 */
const buildPoHeaderValueLines = (values: ReadonlyArray<string>): string[] => {
  return values.map((value) => `"${escapePoText(value)}"`);
};

/**
 * @summary PO 出力向けに改行コードを LF へ正規化する。
 * @param value 正規化対象文字列を指定する。
 * @returns LF 正規化後の文字列を返す。
 */
const normalizePoLineEndings = (value: string): string => {
  return value.replace(/\r\n?/gu, '\n');
};

/**
 * @summary PO 文字列リテラル向けに特殊文字をエスケープする。
 * @param value エスケープ対象文字列を指定する。
 * @returns エスケープ後の文字列を返す。
 */
const escapePoText = (value: string): string => {
  return value.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"').replace(/\t/gu, '\\t').replace(/\n/gu, '\\n');
};

/**
 * @summary JST 固定の PO-Revision-Date 文字列を生成する。
 * @param value 変換対象日時を指定する。
 * @returns `YYYY-MM-DD HH:MM:SS+0900` 形式の文字列を返す。
 */
const formatJstPoRevisionDate = (value: Date): string => {
  const jstValue = new Date(value.getTime() + 9 * 60 * 60 * 1000);

  return [
    `${jstValue.getUTCFullYear()}-${padDatePart(jstValue.getUTCMonth() + 1)}-${padDatePart(jstValue.getUTCDate())}`,
    `${padDatePart(jstValue.getUTCHours())}:${padDatePart(jstValue.getUTCMinutes())}:${padDatePart(jstValue.getUTCSeconds())}+0900`,
  ].join(' ');
};

/**
 * @summary 日付要素を 2 桁ゼロ埋め文字列へ変換する。
 * @param value 変換対象数値を指定する。
 * @returns 2 桁ゼロ埋め文字列を返す。
 */
const padDatePart = (value: number): string => {
  return String(value).padStart(2, '0');
};
