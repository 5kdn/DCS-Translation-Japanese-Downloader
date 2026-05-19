import { DEFAULT_RAW_TEXT_BY_PATH, defaultTreeItems } from '../fixtures/appApiFixtures';
import type { AppApiMockOptions, CapturedRequest, MockTreeItem } from '../models/appApiMockTypes';

export type JsonMockResponse = {
  status: number;
  body: Record<string, unknown>;
};

export type RawContentMockResponse = {
  status: number;
  contentType: string;
  body: string | Uint8Array;
};

/**
 * @summary 記録用リクエスト情報を生成する。
 * @param url リクエスト URL を指定する。
 * @param method HTTP メソッドを指定する。
 * @param bodyText リクエスト本文文字列を指定する。
 * @returns 共通形式のリクエスト記録を返す。
 */
export const createCapturedRequest = (url: string, method: string, bodyText: string | null): CapturedRequest => {
  return {
    url,
    method,
    bodyText,
  };
};

/**
 * @summary health API のモック応答を生成する。
 * @param options モック設定を指定する。
 * @returns health API 用 JSON 応答を返す。
 */
export const createHealthResponse = (options: AppApiMockOptions): JsonMockResponse => {
  return {
    status: 200,
    body: {
      status: options.healthOk === false ? 'ng' : 'ok',
      timestamp: '2026-05-15T00:00:00.000Z',
    },
  };
};

const normalizeTreeItems = (treeItems: MockTreeItem[]): MockTreeItem[] => {
  return treeItems.map((item: MockTreeItem) => {
    return {
      ...item,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    };
  });
};

/**
 * @summary tree API のモック応答を生成する。
 * @param options モック設定を指定する。
 * @returns tree API 用 JSON 応答を返す。
 */
export const createTreeResponse = (options: AppApiMockOptions): JsonMockResponse => {
  return {
    status: 200,
    body: {
      success: true,
      message: 'ok',
      data: normalizeTreeItems(options.treeItems ?? defaultTreeItems),
    },
  };
};

/**
 * @summary issue/list API のモック応答を生成する。
 * @param options モック設定を指定する。
 * @returns issue/list API 用 JSON 応答を返す。
 */
export const createIssueListResponse = (options: AppApiMockOptions): JsonMockResponse => {
  return {
    status: 200,
    body: {
      success: true,
      data: options.issues ?? [],
    },
  };
};

/**
 * @summary issue/create API のモック応答を生成する。
 * @param options モック設定を指定する。
 * @returns issue/create API 用 JSON 応答を返す。
 */
export const createIssueCreateResponse = (options: AppApiMockOptions): JsonMockResponse => {
  if (options.createIssueErrorMessage !== null && options.createIssueErrorMessage !== undefined) {
    return {
      status: 500,
      body: {
        success: false,
        message: options.createIssueErrorMessage,
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      data: options.createIssueResponse ?? [{ issueNumber: 123, issueUrl: 'https://example.test/issues/123' }],
    },
  };
};

/**
 * @summary create-pr API のモック応答を生成する。
 * @param options モック設定を指定する。
 * @returns create-pr API 用 JSON 応答を返す。
 */
export const createPrCreateResponse = (options: AppApiMockOptions): JsonMockResponse => {
  if (options.createPrErrorMessage !== null && options.createPrErrorMessage !== undefined) {
    return {
      status: 500,
      body: {
        success: false,
        message: options.createPrErrorMessage,
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      data: options.createPrResponse ?? [
        {
          prNumber: 456,
          prUrl: 'https://example.test/pr/456',
          branchName: 'feature/User-Campaign/Sample-Campaign/AddFile--20260516-120000JST',
          commitSha: 'abc123',
          note: 'created',
        },
      ],
    },
  };
};

/**
 * @summary raw GitHub ファイル取得のモック応答を生成する。
 * @param options モック設定を指定する。
 * @param path 取得対象パスを指定する。
 * @returns raw file 用応答を返す。
 */
export const createRawFileResponse = (options: AppApiMockOptions, path: string): RawContentMockResponse => {
  const rawTextByPath = { ...DEFAULT_RAW_TEXT_BY_PATH, ...options.rawTextByPath };
  const rawErrorPathSet = new Set(options.rawErrorPaths ?? []);

  if (rawErrorPathSet.has(path)) {
    return {
      status: 500,
      contentType: 'text/plain; charset=utf-8',
      body: 'failed',
    };
  }

  const binary = options.rawBinaryByPath?.[path];
  if (binary !== undefined) {
    return {
      status: 200,
      contentType: 'application/octet-stream',
      body: Uint8Array.from(binary),
    };
  }

  return {
    status: 200,
    contentType: 'text/plain; charset=utf-8',
    body: rawTextByPath[path] ?? 'dictionary = {}',
  };
};
