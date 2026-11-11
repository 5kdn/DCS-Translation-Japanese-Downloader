import { AnonymousAuthenticationProvider } from '@microsoft/kiota-abstractions';
import { FetchRequestAdapter, RetryHandlerOptions } from '@microsoft/kiota-http-fetchlibrary';
import {
  ClientError,
  ClientErrorCategoryObject,
  ClientResponseError,
  logClientError,
  requestWithContext,
  toClientError,
} from '@/errors/clientErrors';
import type { UploadChangeType, UploadDialogSelectedFile, UploadTargetType } from '@/features/upload/uploadDialogDomain';
import { createApiClient } from '@/lib/http/apiClient/apiClient';
import type { Issue, IssueCreate, Page, PullRequestCreate, PullRequestCreation } from '@/lib/http/apiClient/models';
import type { IssueItem, TreeItem } from '@/types/type';

const resolveBaseUrl = (): string => {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw !== 'string') throw new Error('VITE_API_BASE_URL が未設定です。');
  const value = raw
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/+$/, '');
  const url = new URL(value);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error('VITE_API_BASE_URL は /v2 を含まない API のオリジンを指定してください。');
  }
  return url.origin;
};

const createClient = () => {
  const adapter = new FetchRequestAdapter(new AnonymousAuthenticationProvider());
  adapter.baseUrl = resolveBaseUrl();
  return createApiClient(adapter).v2;
};

export type CreatePrRequest = {
  title: string;
  description: string;
  targetType: UploadTargetType;
  targetName: string;
  selectedChangeTypes: UploadChangeType[];
  selectedFiles: (UploadDialogSelectedFile | { path: string; operation: 'delete' })[];
};
export type CreatePrResponse = PullRequestCreation;
export type CreateIssueRequest = {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
};
export type CreateIssueResponse = IssueItem;
export type ListIssueRequest = { state: 'open' | 'closed' | 'all' };

const UPLOAD_CHANGE_TYPE_TOKEN_MAP: Record<UploadChangeType, string> = {
  ファイルの追加: 'AddFile',
  ファイルの削除: 'DeleteFile',
  バグ修正: 'FixBug',
  誤字の修正: 'FixTypo',
  その他の修正: 'OtherChange',
};

// biome-ignore lint/complexity/useRegexLiterals: 制御文字を含む禁止文字集合を文字列で保持して noControlCharactersInRegex を回避する。
const GIT_REF_FORBIDDEN_CHARACTER_PATTERN = new RegExp('[\\u0000-\\u001f\\u007f ~^:?*[\\\\\\]]', 'g');

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
    .replaceAll('@{', '-')
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

const invalidRequest = (context: string, problem: string): never => {
  throw new ClientError({ category: ClientErrorCategoryObject.InvalidRequest, context, message: problem });
};

const invalidResponse = (context: string, problem: string): never => {
  throw new ClientResponseError({ context, operation: context, reason: 'missing_field', problem });
};

const buildCreatePrFiles = async (
  selectedFiles: CreatePrRequest['selectedFiles'],
): Promise<NonNullable<PullRequestCreate['files']>> => {
  const paths = new Set<string>();
  if (selectedFiles.length < 1 || selectedFiles.length > 100)
    invalidRequest('fetchCreatePr', 'ファイルは1〜100件指定してください。');
  return Promise.all(
    selectedFiles.map(async (selectedFile) => {
      const path = selectedFile.path;
      if (
        !/^(DCSWorld|UserMissions)\//.test(path) ||
        new TextEncoder().encode(path).length > 4096 ||
        /[\\\\\p{Cc}]/u.test(path) ||
        path.split('/').some((segment) => !segment || segment === '.' || segment === '..' || segment.startsWith('.git')) ||
        paths.has(path)
      ) {
        invalidRequest('fetchCreatePr', 'ファイルパスが不正、または重複しています。');
      }
      paths.add(path);
      if ('operation' in selectedFile && selectedFile.operation === 'delete') return { path, operation: 'delete' };
      if (!('file' in selectedFile)) return invalidRequest('fetchCreatePr', 'ファイルの内容が必要です。');
      const content = await selectedFile.file.text();
      if (content.length > 1048576) invalidRequest('fetchCreatePr', 'ファイルの内容は1,048,576文字以内にしてください。');
      return { path, content, operation: 'upsert' };
    }),
  );
};

const getNextCursor = (context: string, page: Page | null | undefined, seen: Set<string>): string | undefined => {
  if (!page || !('nextCursor' in page)) return invalidResponse(context, 'ページ情報がありません。');
  // Kiota は JSON null を undefined に変換するため、キーの有無と値を別々に確認する。
  if (page.nextCursor == null) return undefined;
  if (page.nextCursor === '' || seen.has(page.nextCursor)) return invalidResponse(context, '継続カーソルが不正です。');
  seen.add(page.nextCursor);
  return page.nextCursor;
};

const toIssueItem = (issue: Issue): IssueItem => ({
  title: issue.title ?? undefined,
  body: issue.body ?? null,
  number: issue.number ?? undefined,
  state: issue.state ?? undefined,
  url: issue.url ?? undefined,
  createdAt: issue.createdAt ?? undefined,
  updatedAt: issue.updatedAt ?? undefined,
  closedAt: issue.closedAt ?? null,
});

export const fetchTree = async (): Promise<TreeItem[]> => {
  const context = 'fetchTree';
  try {
    const client = createClient();
    const items: TreeItem[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    let commitSha: string | undefined;
    let generatedAt: number | undefined;
    do {
      const response = await requestWithContext(context, 'v2.tree.get', () =>
        client.tree.get({ queryParameters: { limit: 10000, cursor } }),
      );
      if (!response?.items || !response.commitSha || !response.generatedAt)
        return invalidResponse(context, 'ツリーのスナップショットが不正です。');
      if (commitSha !== undefined && (response.commitSha !== commitSha || response.generatedAt.getTime() !== generatedAt)) {
        return invalidResponse(context, '取得途中でスナップショットが変わりました。');
      }
      commitSha = response.commitSha;
      generatedAt = response.generatedAt.getTime();
      items.push(
        ...response.items.map((item) => ({
          path: item.path ?? undefined,
          type: item.type ?? undefined,
          mode: item.mode ?? undefined,
          url: item.url ?? undefined,
          sha: item.sha ?? undefined,
          size: item.size ?? undefined,
          updatedAt: item.updatedAt ?? undefined,
        })),
      );
      cursor = getNextCursor(context, response.page, seen);
    } while (cursor !== undefined);
    return items;
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError);
    throw clientError;
  }
};

export const fetchIssues = async (request: ListIssueRequest): Promise<IssueItem[]> => {
  const context = 'fetchIssues';
  try {
    const client = createClient();
    const items: IssueItem[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    do {
      const response = await requestWithContext(context, 'v2.issues.get', () =>
        client.issues.get({ queryParameters: { state: request.state, limit: 100, cursor } }),
      );
      if (!response?.items) return invalidResponse(context, 'Issue一覧がありません。');
      items.push(...response.items.map(toIssueItem));
      cursor = getNextCursor(context, response.page, seen);
    } while (cursor !== undefined);
    return items;
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError);
    throw clientError;
  }
};

export const fetchCreateIssue = async (request: CreateIssueRequest): Promise<CreateIssueResponse> => {
  const context = 'fetchCreateIssue';
  try {
    if (!request.title.trim() || request.title.length > 256 || request.body.length > 65536)
      invalidRequest(context, 'Issueのタイトルまたは本文が不正です。');
    const body: IssueCreate = {
      title: request.title,
      body: request.body,
      labels: request.labels,
      assignees: request.assignees,
    };
    const client = createClient();
    const response = await requestWithContext(context, 'v2.issues.post', () =>
      client.issues.post(body, { options: [new RetryHandlerOptions({ maxRetries: 0 })] }),
    );
    if (!response?.number || !response.url) return invalidResponse(context, 'Issue作成結果が不正です。');
    return toIssueItem(response);
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError);
    throw clientError;
  }
};

export const fetchCreatePr = async (request: CreatePrRequest): Promise<CreatePrResponse> => {
  const context = 'fetchCreatePr';
  try {
    const branchName = buildUploadBranchName(request, new Date());
    if (!request.title.trim() || request.title.length > 256 || request.description.length > 65536 || branchName.length > 255)
      invalidRequest(context, 'PRのタイトル、本文またはブランチ名が不正です。');
    const body: PullRequestCreate = {
      prTitle: request.title,
      prBody: request.description,
      branchName,
      commitMessage: buildUploadCommitMessage(request.title),
      files: await buildCreatePrFiles(request.selectedFiles),
    };
    const client = createClient();
    const response = await requestWithContext(context, 'v2.prs.post', () =>
      client.prs.post(body, { options: [new RetryHandlerOptions({ maxRetries: 0 })] }),
    );
    if (!response?.number || !response.url) return invalidResponse(context, 'PR作成結果が不正です。');
    return response;
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError);
    throw clientError;
  }
};

export const healthCheck = async (): Promise<boolean> => {
  const context = 'healthCheck';
  try {
    const client = createClient();
    const response = await requestWithContext(context, 'v2.health.get', () => client.health.get());
    return response?.status === 'ok' && response.timestamp instanceof Date && !Number.isNaN(response.timestamp.getTime());
  } catch (error: unknown) {
    const clientError = toClientError(context, error);
    logClientError(clientError);
    throw clientError;
  }
};
