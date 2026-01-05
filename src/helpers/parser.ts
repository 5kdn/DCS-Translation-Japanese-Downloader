/**
 * @summary 日付文字列を Date に変換する。
 * @param value ISO8601 形式の文字列を指定する。
 * @returns 変換後の Date を返却する。変換に失敗した場合は undefined を返却する。
 */
export const parseDate = (value: string | null | undefined): Date | undefined => {
  if (value == null || value.trim() === '') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/**
 * @summary null 許容の日付文字列を Date に変換する。
 * @param value ISO8601 形式の文字列または null を指定する。
 * @returns null の場合は null を返却する。文字列の場合は Date へ変換して返却する。変換に失敗した場合は undefined を返却する。
 */
export const parseNullableDate = (value: string | null | undefined): Date | null | undefined => {
  if (value === null) return null;
  return parseDate(value);
};
