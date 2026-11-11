import { DEFAULT_RAW_TEXT_BY_PATH, defaultTreeItems } from '../fixtures/appApiFixtures';
import type { AppApiMockOptions, CapturedRequest } from '../models/appApiMockTypes';

export type JsonMockResponse = {
  status: number;
  contentType: 'application/json' | 'application/problem+json';
  body: Record<string, unknown>;
};

export type RawContentMockResponse = {
  status: number;
  contentType: string;
  body: string | Uint8Array;
};

const problem = (detail: string, status: number): JsonMockResponse => ({
  status,
  contentType: 'application/problem+json',
  body: { type: 'about:blank', title: 'API request failed', status, detail, instance: '/v2', code: 'INTERNAL_ERROR' },
});

export const createCapturedRequest = (url: string, method: string, bodyText: string | null): CapturedRequest => ({
  url,
  method,
  bodyText,
});

export const createHealthResponse = (options: AppApiMockOptions): JsonMockResponse =>
  options.healthOk === false
    ? problem('Health check failed', 500)
    : {
        status: 200,
        contentType: 'application/json',
        body: { status: 'ok', timestamp: '2026-05-15T00:00:00.000Z' },
      };

export const createTreeResponse = (options: AppApiMockOptions): JsonMockResponse => ({
  status: 200,
  contentType: 'application/json',
  body: {
    commitSha: 'a'.repeat(40),
    generatedAt: '2026-05-15T00:00:00.000Z',
    items: (options.treeItems ?? defaultTreeItems).map((item) => ({
      ...item,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    })),
    page: { nextCursor: null },
  },
});

export const createIssueListResponse = (options: AppApiMockOptions, state = 'all'): JsonMockResponse => ({
  status: 200,
  contentType: 'application/json',
  body: {
    items: (options.issues ?? []).filter((issue) => state === 'all' || issue.state === state),
    page: { nextCursor: null },
  },
});

export const createIssueCreateResponse = (options: AppApiMockOptions): JsonMockResponse => {
  if (options.createIssueErrorMessage != null) return problem(options.createIssueErrorMessage, 500);
  return {
    status: 201,
    contentType: 'application/json',
    body: options.createIssueResponse ?? {
      number: 123,
      url: 'https://example.test/issues/123',
      title: 'Created Issue',
      body: null,
      state: 'open',
      createdAt: '2026-05-15T00:00:00.000Z',
      updatedAt: '2026-05-15T00:00:00.000Z',
      closedAt: null,
    },
  };
};

export const createPrCreateResponse = (options: AppApiMockOptions): JsonMockResponse => {
  if (options.createPrErrorMessage != null) return problem(options.createPrErrorMessage, 500);
  return {
    status: 200,
    contentType: 'application/json',
    body: options.createPrResponse
      ? { ...options.createPrResponse }
      : {
          number: 456,
          url: 'https://example.test/pr/456',
          branchName: 'feature/User-Campaign/Sample-Campaign/AddFile--20260516-120000JST',
          commitSha: 'a'.repeat(40),
          reused: false,
        },
  };
};

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
