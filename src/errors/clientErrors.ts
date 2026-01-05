export type ClientOperationErrorParams = {
  context: string;
  operation: string;
  cause?: unknown;
  message?: string;
};

export const ClientErrorCategoryObject = {
  InternalError: 1,
  Throttling: 2,
  Network: 3,
  InvalidRequest: 4,
  Other: 5,
} as const;

export type ClientErrorCategory = (typeof ClientErrorCategoryObject)[keyof typeof ClientErrorCategoryObject];

/**
 * @summary エラーカテゴリの表示名を返却する。
 * @param category エラーカテゴリを指定する。
 * @returns 表示名を返却する。
 */
export const getClientErrorCategoryLabel = (category: ClientErrorCategory): string => {
  switch (category) {
    case ClientErrorCategoryObject.InternalError:
      return 'サーバー側のInternal Errorに起因するエラーが発生しました。';
    case ClientErrorCategoryObject.Throttling:
      return 'APIのレートリミット/スロットリングに起因するエラーが発生しました。';
    case ClientErrorCategoryObject.Network:
      return 'ネットワークに起因するエラーが発生しました。';
    case ClientErrorCategoryObject.InvalidRequest:
      return '不正なリクエストに起因するエラーが発生しました。';
    case ClientErrorCategoryObject.Other:
      return 'エラーが発生しました。';
  }
};

export type ClientErrorParams = {
  category: ClientErrorCategory;
  context: string;
  operation?: string;
  message?: string;
  cause?: unknown;
};

/**
 * @summary クライアントが上流へ渡す分類済みエラーを表現する。
 */
export class ClientError extends Error {
  readonly category: ClientErrorCategory;
  readonly context: string;
  readonly operation?: string;

  /**
   * @summary 分類済みエラーを生成する。
   * @param params 生成パラメータを指定する。
   * @param params.category エラーカテゴリを指定する。
   * @param params.context コンテキストを指定する。
   * @param params.operation 操作名を指定する。
   * @param params.message メッセージを指定する。
   * @param params.cause 原因例外を指定する。
   */
  constructor({ category, context, operation, message, cause }: ClientErrorParams) {
    super(message ?? `${context}: ${getClientErrorCategoryLabel(category)}`, { cause });
    this.name = 'ClientError';
    this.category = category;
    this.context = context;
    this.operation = operation;
  }
}

/**
 * @summary API呼び出しの失敗を表現する。
 */
export class ClientOperationError extends Error {
  readonly context: string;
  readonly operation: string;

  /**
   * @summary API呼び出し失敗の例外を生成する。
   * @param params 生成パラメータを指定する。
   * @param params.context コンテキストを指定する。
   * @param params.operation 操作名を指定する。
   * @param params.cause 原因例外を指定する。
   * @param params.message メッセージを指定する。
   * @returns 返却しない。
   */
  constructor({ context, operation, cause, message }: ClientOperationErrorParams) {
    super(message ?? `${context}: ${operation} に失敗する。`, { cause });
    this.name = 'ClientOperationError';
    this.context = context;
    this.operation = operation;
  }
}

export type ClientResponseErrorParams = {
  context: string;
  operation: string;
  reason?: 'undefined_response' | 'missing_field' | 'success_false' | 'unexpected';
  problem: string;
  cause?: unknown;
};

/**
 * @summary API応答の形式不正や失敗応答を表現する。
 */
export class ClientResponseError extends Error {
  readonly context: string;
  readonly operation: string;
  readonly reason: NonNullable<ClientResponseErrorParams['reason']>;
  readonly problem: string;

  /**
   * @summary API応答不正の例外を生成する。
   * @param params 生成パラメータを指定する。
   * @param params.context コンテキストを指定する。
   * @param params.operation 操作名を指定する。
   * @param params.reason 不正理由を指定する。
   * @param params.problem 問題内容を指定する。
   * @param params.cause 原因例外を指定する。
   */
  constructor({ context, operation, reason, problem, cause }: ClientResponseErrorParams) {
    super(`${context}: ${operation} の応答が不正である。${problem}`, { cause });
    this.name = 'ClientResponseError';
    this.context = context;
    this.operation = operation;
    this.reason = reason ?? 'unexpected';
    this.problem = problem;
  }
}

/**
 * @summary 値がRecord型であるか判定する。
 * @param value 判定対象の値を指定する。
 * @returns Record型であればtrueを返す。
 */
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/**
 * @summary 値がAPIエラー相当であるか判定する。
 * @param value 判定対象の値を指定する。
 * @returns APIエラー相当であればtrueを返す。
 */
const isApiErrorLike = (value: unknown): value is { responseStatusCode?: unknown; responseHeaders?: unknown } =>
  isRecord(value) && 'responseStatusCode' in value;

/**
 * @summary 値からレスポンスのステータスコードを抽出する。
 * @param value 抽出対象の値を指定する。
 * @returns ステータスコードを返す。抽出できない場合はundefinedを返す。
 */
const getResponseStatusCode = (value: unknown): number | undefined => {
  if (!isApiErrorLike(value)) return undefined;
  const status = value.responseStatusCode;
  return typeof status === 'number' ? status : undefined;
};

/**
 * @summary 値からレスポンスヘッダー情報を抽出する。
 * @param value 抽出対象の値を指定する。
 * @returns レスポンスヘッダーを返す。抽出できない場合はundefinedを返す。
 */
const getResponseHeaders = (value: unknown): Record<string, string[]> | undefined => {
  if (!isApiErrorLike(value)) return undefined;
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
 * @summary 応答不正理由からエラーカテゴリを推定する。
 * @param reason 応答不正理由を指定する。
 * @returns 推定したエラーカテゴリを返す。
 */
const categorizeFromResponseReason = (reason: ClientResponseError['reason']): ClientErrorCategory => {
  switch (reason) {
    case 'success_false':
      return ClientErrorCategoryObject.InvalidRequest;
    case 'undefined_response':
    case 'missing_field':
      return ClientErrorCategoryObject.InternalError;
    case 'unexpected':
      return ClientErrorCategoryObject.Other;
  }
};

/**
 * @summary 例外からログ出力向けのオブジェクトへ変換する。
 * @param error 例外を指定する。
 * @returns ログ出力向けのオブジェクトを返す。
 */
const toLogObject = (error: unknown): unknown => {
  if (error instanceof ClientError) {
    return {
      name: error.name,
      message: error.message,
      category: error.category,
      categoryLabel: getClientErrorCategoryLabel(error.category),
      context: error.context,
      operation: error.operation,
      cause: toLogObject(error.cause),
    };
  }
  if (error instanceof ClientOperationError) {
    return {
      name: error.name,
      message: error.message,
      context: error.context,
      operation: error.operation,
      cause: toLogObject(error.cause),
    };
  }
  if (error instanceof ClientResponseError) {
    return {
      name: error.name,
      message: error.message,
      context: error.context,
      operation: error.operation,
      reason: error.reason,
      problem: error.problem,
      cause: toLogObject(error.cause),
    };
  }
  if (error instanceof Error) {
    const statusCode = getResponseStatusCode(error);
    const headers = getResponseHeaders(error);
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      responseStatusCode: statusCode,
      responseHeaders: headers,
    };
  }
  return error;
};

/**
 * @summary 例外を分類済みエラーへ正規化する。
 * @param context コンテキストを指定する。
 * @param error 例外を指定する。
 * @returns 分類済みエラーを返却する。
 */
export const toClientError = (context: string, error: unknown): ClientError => {
  if (error instanceof ClientError) return error;

  if (error instanceof ClientResponseError) {
    return new ClientError({
      category: categorizeFromResponseReason(error.reason),
      context: error.context ?? context,
      operation: error.operation,
      message: error.message,
      cause: error.cause,
    });
  }

  if (error instanceof ClientOperationError) {
    const statusCode = getResponseStatusCode(error.cause);
    const headers = getResponseHeaders(error.cause);
    const category =
      statusCode !== undefined
        ? categorizeFromStatusCode(statusCode, headers)
        : isNetworkErrorLike(error.cause)
          ? ClientErrorCategoryObject.Network
          : ClientErrorCategoryObject.Other;

    const statusInfo = statusCode !== undefined ? ` status=${statusCode}` : '';
    return new ClientError({
      category,
      context: error.context ?? context,
      operation: error.operation,
      message: `${error.context}: ${getClientErrorCategoryLabel(category)}${error.operation}${statusInfo}`,
      cause: error.cause,
    });
  }

  if (isNetworkErrorLike(error)) {
    return new ClientError({
      category: ClientErrorCategoryObject.Network,
      context,
      message: `${context}: ${getClientErrorCategoryLabel(ClientErrorCategoryObject.Network)}`,
      cause: error,
    });
  }

  const statusCode = getResponseStatusCode(error);
  if (statusCode !== undefined) {
    return new ClientError({
      category: categorizeFromStatusCode(statusCode, getResponseHeaders(error)),
      context,
      message: `${context}: ${getClientErrorCategoryLabel(categorizeFromStatusCode(statusCode, getResponseHeaders(error)))}status=${statusCode}`,
      cause: error,
    });
  }

  return new ClientError({
    category: ClientErrorCategoryObject.Other,
    context,
    message: `${context}: ${getClientErrorCategoryLabel(ClientErrorCategoryObject.Other)}`,
    cause: error,
  });
};

/**
 * @summary 分類済みエラーの詳細をログへ出力する。
 * @param error 分類済みエラーを指定する。
 * @param meta 付加情報を指定する。
 * @returns 返却しない。
 */
export const logClientError = (error: ClientError, meta?: Record<string, unknown>): void => {
  console.error('[client]', {
    category: error.category,
    categoryLabel: getClientErrorCategoryLabel(error.category),
    context: error.context,
    operation: error.operation,
    message: error.message,
    meta,
    detail: toLogObject(error),
  });
};

/**
 * @summary API呼び出しを実行し、失敗時に文脈付きの例外へ変換する。
 * @typeParam T 返却値の型を指定する。
 * @param context 例外メッセージに含める呼び出し元コンテキストを指定する。
 * @param operation 実行する操作名（例: `tree.get`）を指定する。
 * @param fn 実行する非同期処理を指定する。
 * @returns 実行結果を返却する。
 * @throws 実行処理が失敗した場合に例外を送出する。
 */
export const requestWithContext = async <T>(context: string, operation: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error: unknown) {
    throw new ClientOperationError({ context, operation, cause: error });
  }
};
