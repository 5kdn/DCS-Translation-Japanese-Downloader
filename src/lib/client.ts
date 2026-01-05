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
import { parseDate, parseNullableDate } from '@/helpers/parser';
import { createApiClient } from '@/lib/http/apiClient/apiClient';
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
