import {
  ClientError,
  type ClientErrorCategory,
  ClientErrorCategoryObject,
  getClientErrorCategoryLabel,
} from '@/errors/clientErrors';

/**
 * @summary 値がRecord型であるか判定する。
 * @param value 判定対象の値を指定する。
 * @returns Record型であればtrueを返す。
 */
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/**
 * @summary 値がネットワークエラー相当であるか判定する。
 * @param value 判定対象の値を指定する。
 * @returns ネットワークエラー相当であればtrueを返す。
 */
const isNetworkErrorLike = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  const name = typeof value.name === 'string' ? value.name : '';
  const message = typeof value.message === 'string' ? value.message : '';

  if (name === 'TypeError' && /fetch|network/i.test(message)) return true;
  if ('code' in value && typeof value.code === 'string')
    return ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNRESET'].includes(value.code);
  return false;
};

/**
 * @summary 値からレスポンスヘッダー情報を抽出する。
 * @param value 抽出対象の値を指定する。
 * @returns レスポンスヘッダーを返す。存在しない場合はundefinedを返す。
 */
const getResponseHeaders = (value: unknown): Record<string, string[]> | undefined => {
  if (!isRecord(value)) return undefined;
  const headers = value.responseHeaders;
  if (!isRecord(headers)) return undefined;
  return headers as Record<string, string[]>;
};

/**
 * @summary 指定したヘッダーキーが存在するか判定する。
 * @param headers 判定対象のヘッダーを指定する。
 * @param key ヘッダーキーを指定する。
 * @returns ヘッダーキーが存在すればtrueを返す。
 */
const hasHeader = (headers: Record<string, string[]> | undefined, key: string): boolean => {
  if (!headers) return false;
  const target = key.toLowerCase();
  return Object.keys(headers).some((k) => k.toLowerCase() === target);
};

/**
 * @summary ステータスコードとヘッダーからエラーカテゴリを推定する。
 * @param statusCode ステータスコードを指定する。
 * @param headers レスポンスヘッダーを指定する。
 * @returns 推定したエラーカテゴリを返す。
 */
const categorizeFromStatusCode = (statusCode: number, headers: Record<string, string[]> | undefined): ClientErrorCategory => {
  if (statusCode === 429) return ClientErrorCategoryObject.Throttling;
  if (hasHeader(headers, 'retry-after')) return ClientErrorCategoryObject.Throttling;
  if (statusCode >= 500) return ClientErrorCategoryObject.InternalError;
  if (statusCode >= 400) return ClientErrorCategoryObject.InvalidRequest;
  return ClientErrorCategoryObject.Other;
};

/**
 * @summary 例外オブジェクトから画面表示向けのエラーカテゴリ表示名を生成する。
 * @param error 例外オブジェクトを指定する。
 * @returns 表示用のエラーカテゴリ表示名を返す。
 */
export const toErrorMessageForDisplay = (error: unknown): string => {
  if (error instanceof ClientError) return getClientErrorCategoryLabel(error.category);
  if (isNetworkErrorLike(error)) return getClientErrorCategoryLabel(ClientErrorCategoryObject.Network);

  if (isRecord(error)) {
    const statusCode = typeof error.responseStatusCode === 'number' ? error.responseStatusCode : undefined;
    if (statusCode !== undefined) {
      const category = categorizeFromStatusCode(statusCode, getResponseHeaders(error));
      return getClientErrorCategoryLabel(category);
    }
  }

  return getClientErrorCategoryLabel(ClientErrorCategoryObject.Other);
};
