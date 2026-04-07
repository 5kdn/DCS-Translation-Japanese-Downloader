import { AnonymousAuthenticationProvider } from '@microsoft/kiota-abstractions';
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';
import {
  ClientError,
  ClientErrorCategoryObject,
  ClientResponseError,
  logClientError,
  requestWithContext,
  toClientError,
} from '@/errors/clientErrors';
import type { UploadChangeType, UploadDialogSelectedFile, UploadTargetType } from '@/features/upload/uploadDialogDomain';
import { parseDate, parseNullableDate } from '@/helpers/parser';
import { createApiClient } from '@/lib/http/apiClient/apiClient';
import {
  type CreatePrPostRequestBody,
  CreatePrPostRequestBody_filesMember1_operationObject,
} from '@/lib/http/apiClient/createPr';
import { HealthGetResponse_statusObject } from '@/lib/http/apiClient/health';
import type { CreatePostRequestBody } from '@/lib/http/apiClient/issue/create';
import { PostStateQueryParameterTypeObject } from '@/lib/http/apiClient/issue/list';
import type { IssueItem, TreeItem } from '@/types/type';

/**
 * @summary APIクライアントを生成する。
 * @returns APIクライアントを返却する。
 */
const resolveBaseUrl = (): string => {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw !== 'string') {
    throw new Error('VITE_API_BASE_URL が未設定です。');
  }
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(/^['"]|['"]$/g, '');
  if (unquoted.length === 0) {
    throw new Error('VITE_API_BASE_URL が空です。');
  }
  return unquoted;
};

const createClient = (): ReturnType<typeof createApiClient> => {
  const requestAdapter = new FetchRequestAdapter(new AnonymousAuthenticationProvider());
  requestAdapter.baseUrl = resolveBaseUrl();
  return createApiClient(requestAdapter);
};

const UPLOAD_CHANGE_TYPE_TOKEN_MAP: Record<UploadChangeType, string> = {
  ファイルの追加: 'AddFile',
  ファイルの削除: 'DeleteFile',
  バグ修正: 'FixBug',
  誤字の修正: 'FixTypo',
  その他の修正: 'OtherChange',
};

// biome-ignore lint/complexity/useRegexLiterals: 制御文字を含む禁止文字集合を文字列で保持して noControlCharactersInRegex を回避する。
const GIT_REF_FORBIDDEN_CHARACTER_PATTERN = new RegExp('[\\u0000-\\u001f\\u007f ~^:?*[\\\\\\]]', 'g');

export type CreatePrRequest = {
  title: string;
  description: string;
  targetType: UploadTargetType;
  targetName: string;
  selectedChangeTypes: UploadChangeType[];
  selectedFiles: UploadDialogSelectedFile[];
};

export type CreatePrResponseItem = {
  branchName?: string | null;
  commitSha?: string | null;
  note?: string | null;
  prNumber?: number | null;
  prUrl?: string | null;
};

export type CreatePrResponse = CreatePrResponseItem[];

/**
 * @summary 変更種別一覧をブランチ名用トークンへ変換する。
 * @param selectedChangeTypes 変更種別一覧を指定する。
 * @returns ブランチ名用トークンを返す。
 */
const buildUploadChangeToken = (selectedChangeTypes: UploadChangeType[]): string => {
  return selectedChangeTypes.map((changeType: UploadChangeType): string => UPLOAD_CHANGE_TYPE_TOKEN_MAP[changeType]).join('-');
};

/**
 * @summary ブランチ名に使う日時文字列を JST 形式で生成する。
 * @param date 変換対象日時を指定する。
 * @returns ブランチ名用の日時文字列を返す。
 */
const formatBranchTimestamp = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);

  /**
   * @summary 指定 part の値を取得する。
   * @param type part 種別を指定する。
   * @returns part の値を返す。
   */
  const pick = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part: Intl.DateTimeFormatPart): boolean => part.type === type)?.value ?? '';

  return `${pick('year')}${pick('month')}${pick('day')}-${pick('hour')}${pick('minute')}${pick('second')}JST`;
};

/**
 * @summary ブランチ名セグメントを Git ref 互換の slug へ正規化する。
 * @param value 正規化対象の文字列を指定する。
 * @returns Git ref 互換のセグメントを返す。
 */
export const sanitizeBranchNameSegment = (value: string): string => {
  const normalized = value
    .normalize('NFKC')
    .replaceAll('/', '-')
    .replaceAll('..', '-')
    .replace(GIT_REF_FORBIDDEN_CHARACTER_PATTERN, '-')
    .replace(/\.+/g, '.')
    .replace(/-+/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/\.lock$/i, '-lock');

  if (normalized === '') return 'unknown';

  const trimmed = normalized.replace(/^\.+|\.+$/g, '').replace(/^-+|-+$/g, '');
  return trimmed === '' ? 'unknown' : trimmed;
};

/**
 * @summary アップロード用ブランチ名を生成する。
 * @param request PR 作成リクエストを指定する。
 * @param now 現在時刻を指定する。
 * @returns ブランチ名を返す。
 */
export const buildUploadBranchName = (
  request: Pick<CreatePrRequest, 'targetType' | 'targetName' | 'selectedChangeTypes'>,
  now: Date,
): string => {
  const sanitizedTargetType = sanitizeBranchNameSegment(request.targetType);
  const sanitizedTargetName = sanitizeBranchNameSegment(request.targetName);
  const sanitizedChangeToken = sanitizeBranchNameSegment(buildUploadChangeToken(request.selectedChangeTypes));
  return `feature/${sanitizedTargetType}/${sanitizedTargetName}/${sanitizedChangeToken}--${formatBranchTimestamp(now)}`;
};

/**
 * @summary アップロード用コミットメッセージを生成する。
 * @param title PR タイトルを指定する。
 * @returns コミットメッセージを返す。
 */
const buildUploadCommitMessage = (title: string): string => {
  return `feat: ${title}`;
};

/**
 * @summary selectedFiles を create-pr API 用配列へ変換する。
 * @param selectedFiles 送信対象ファイル一覧を指定する。
 * @returns API 用ファイル配列を返す。
 */
const buildCreatePrFiles = async (
  selectedFiles: UploadDialogSelectedFile[],
): Promise<NonNullable<CreatePrPostRequestBody['files']>> => {
  return Promise.all(
    selectedFiles.map(async (selectedFile: UploadDialogSelectedFile) => {
      return {
        path: selectedFile.path,
        content: await selectedFile.file.text(),
        operation: CreatePrPostRequestBody_filesMember1_operationObject.Upsert,
      };
    }),
  );
};

// **********************************************
// Tree 関連
// **********************************************

/**
 * @summary GitHub からファイル一覧を取得する。
 * @returns ファイル一覧を返却する。
 * @throws 通信失敗、または応答形式不正の場合に例外を送出する。
 */
export const fetchTree = async (): Promise<TreeItem[]> => {
  const context = 'fetchTree';
  const operation = 'tree.get';
  try {
    const apiClient = createClient();

    const response = await requestWithContext(
      context,
      operation,
      (): ReturnType<typeof apiClient.tree.get> => apiClient.tree.get(),
    );
    if (response === undefined)
      throw new ClientResponseError({ context, operation, reason: 'undefined_response', problem: '応答が undefined である。' });
    if (response.success === false)
      throw new ClientResponseError({
        context,
        operation,
        reason: 'success_false',
        problem: `success=false message=${response.message ?? 'なし'}`,
      });

    const data = response.data;
    if (data == null)
      throw new ClientResponseError({
        context,
        operation,
        reason: 'missing_field',
        problem: 'response.data が null/undefined である。',
        cause: response,
      });

    return data.map((d: (typeof data)[number]): TreeItem => {
      return {
        path: d.path ?? undefined,
        type: d.type ?? undefined,
        mode: d.mode ?? undefined,
        url: d.url ?? undefined,
        sha: d.sha ?? undefined,
        size: d.size ?? undefined,
        updatedAt: d.updatedAt ?? undefined,
      } as TreeItem;
    });
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError, { function: context, operation });
    throw clientError;
  }
};

// **********************************************
// Issues 関連
// **********************************************

export type ListIssueRequest = {
  state: 'open' | 'closed' | 'all';
};

/**
 * @summary Issue 一覧を取得して返却する。
 * @param request 絞り込み条件を指定する。
 * @returns Issue 一覧を返却する。
 * @throws 通信失敗、または応答が失敗（success=false）の場合に例外を送出する。
 */
export const fetchIssues = async (request: ListIssueRequest): Promise<IssueItem[]> => {
  const context = 'fetchIssues';
  const operation = 'issue.list.post';
  try {
    const apiClient = createClient();

    const queryParameters = {
      state:
        request.state === 'all'
          ? PostStateQueryParameterTypeObject.All
          : request.state === 'closed'
            ? PostStateQueryParameterTypeObject.Closed
            : PostStateQueryParameterTypeObject.Open,
    };

    const response = await requestWithContext(
      context,
      operation,
      (): ReturnType<typeof apiClient.issue.list.post> => apiClient.issue.list.post({ queryParameters }),
    );
    if (response === undefined)
      throw new ClientResponseError({
        context,
        operation,
        reason: 'undefined_response',
        problem: `応答が undefined である。state=${request.state}`,
      });
    if (response.success === false)
      throw new ClientResponseError({
        context,
        operation,
        reason: 'success_false',
        problem: `success=false state=${request.state} message=${response.message ?? 'なし'}`,
        cause: response,
      });

    const data = response.data;
    if (data == null)
      throw new ClientResponseError({
        context,
        operation,
        reason: 'missing_field',
        problem: `response.data が null/undefined である。state=${request.state}`,
        cause: response,
      });

    return data.map((d: (typeof data)[number]): IssueItem => {
      return {
        title: d.title ?? undefined,
        body: d.body ?? undefined,
        issueNumber: d.issueNumber ?? undefined,
        state: d.state ?? undefined,
        issueUrl: d.issueUrl ?? undefined,
        labels: d.labels ?? undefined,
        createdAt: parseDate(d.createdAt),
        updatedAt: parseDate(d.updatedAt),
        closedAt: parseNullableDate(d.closedAt),
        assignees: d.assignees ?? undefined,
      };
    });
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError, { function: context, operation, request });
    throw clientError;
  }
};

export type CreateIssueRequest = {
  title: string;
  body: string;
  labels?: string[] | null;
  assignees?: string[] | null;
};

export type CreateIssueItem = {
  issueUrl?: string | null;
  issueNumber?: number | null;
};

export type CreateIssueResponse = CreateIssueItem[];

/**
 * @summary Issue を作成して返却する。
 * @param request 作成内容を指定する。
 * @returns 作成結果の一覧を返却する。通常は 1 件であるが、API の仕様により複数件となる場合がある。
 * @throws 通信失敗、または応答が失敗（success=false）の場合に例外を送出する。
 */
export const fetchCreateIssue = async (request: CreateIssueRequest): Promise<CreateIssueResponse> => {
  const context = 'fetchCreateIssue';
  const operation = 'issue.create.post';
  try {
    if (request.title.trim() === '') {
      throw new ClientError({
        category: ClientErrorCategoryObject.InvalidRequest,
        context,
        operation,
        message: `${context}: ${operation} のリクエストが不正である。title が空である。`,
        cause: request,
      });
    }

    const apiClient = createClient();

    const body: CreatePostRequestBody = {
      title: request.title,
      body: request.body,
      labels: request.labels,
      assignees: request.assignees,
    };

    const response = await requestWithContext(
      context,
      operation,
      (): ReturnType<typeof apiClient.issue.create.post> => apiClient.issue.create.post(body),
    );
    if (response === undefined)
      throw new ClientResponseError({ context, operation, reason: 'undefined_response', problem: '応答が undefined である。' });
    if (response.success === false)
      throw new ClientResponseError({
        context,
        operation,
        reason: 'success_false',
        problem: `success=false message=${response.message ?? 'なし'}`,
        cause: response,
      });

    const data = response.data;
    if (data == null)
      throw new ClientResponseError({
        context,
        operation,
        reason: 'missing_field',
        problem: 'response.data が null/undefined である。',
        cause: response,
      });

    return data.map((d: (typeof data)[number]): CreateIssueItem => {
      return {
        issueNumber: d.issueNumber,
        issueUrl: d.issueUrl,
      } as CreateIssueItem;
    });
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError, {
      function: context,
      operation,
      request: {
        titleLength: request.title.length,
        bodyLength: request.body.length,
        labelsCount: request.labels?.length ?? 0,
        assigneesCount: request.assignees?.length ?? 0,
      },
    });
    throw clientError;
  }
};

// **********************************************
// Pull Request 関連
// **********************************************

/**
 * @summary Pull Request を作成して返却する。
 * @param request 作成内容を指定する。
 * @returns 作成結果の一覧を返却する。
 * @throws 通信失敗、または応答が失敗（success=false）の場合に例外を送出する。
 */
export const fetchCreatePr = async (request: CreatePrRequest): Promise<CreatePrResponse> => {
  const context = 'fetchCreatePr';
  const operation = 'createPr.post';
  try {
    if (request.title.trim() === '') {
      throw new ClientError({
        category: ClientErrorCategoryObject.InvalidRequest,
        context,
        operation,
        message: `${context}: ${operation} のリクエストが不正である。title が空である。`,
        cause: request,
      });
    }
    if (request.selectedFiles.length === 0) {
      throw new ClientError({
        category: ClientErrorCategoryObject.InvalidRequest,
        context,
        operation,
        message: `${context}: ${operation} のリクエストが不正である。selectedFiles が空である。`,
        cause: request,
      });
    }

    const apiClient = createClient();
    const body: CreatePrPostRequestBody = {
      prTitle: request.title,
      prBody: request.description,
      commitMessage: buildUploadCommitMessage(request.title),
      branchName: buildUploadBranchName(request, new Date()),
      files: await buildCreatePrFiles(request.selectedFiles),
    };

    const response = await requestWithContext(
      context,
      operation,
      (): ReturnType<typeof apiClient.createPr.post> => apiClient.createPr.post(body),
    );
    if (response === undefined) {
      throw new ClientResponseError({ context, operation, reason: 'undefined_response', problem: '応答が undefined である。' });
    }
    if (response.success === false) {
      throw new ClientResponseError({
        context,
        operation,
        reason: 'success_false',
        problem: `success=false message=${response.message ?? 'なし'}`,
        cause: response,
      });
    }

    const data = response.data;
    if (data == null) {
      throw new ClientResponseError({
        context,
        operation,
        reason: 'missing_field',
        problem: 'response.data が null/undefined である。',
        cause: response,
      });
    }

    return data.map((item: (typeof data)[number]): CreatePrResponseItem => {
      return {
        branchName: item.branchName,
        commitSha: item.commitSha,
        note: item.note,
        prNumber: item.prNumber,
        prUrl: item.prUrl,
      };
    });
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError, {
      function: context,
      operation,
      request: {
        titleLength: request.title.length,
        descriptionLength: request.description.length,
        targetType: request.targetType,
        targetName: request.targetName,
        selectedChangeTypes: request.selectedChangeTypes,
        selectedFilesCount: request.selectedFiles.length,
      },
    });
    throw clientError;
  }
};

// **********************************************
// Health 関連
// **********************************************

/**
 * @summary APIサーバーの死活監視を行う。
 * @returns APIサーバーの死活状態。
 * @throws API 呼び出しに失敗した場合は例外を送出する。
 */
export const healthCheck = async (): Promise<boolean> => {
  const context = 'healthCheck';
  const operation = 'health.get';
  try {
    const apiClient = createClient();
    const response = await requestWithContext(
      context,
      operation,
      (): ReturnType<typeof apiClient.health.get> => apiClient.health.get(),
    );
    return response?.status === HealthGetResponse_statusObject.Ok;
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError, { function: context, operation });
    throw clientError;
  }
};
