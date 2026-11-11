// @vitest-environment jsdom

import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientErrorCategoryObject } from '@/errors/clientErrors';
import { type CreatePrRequest, fetchCreateIssue, fetchCreatePr, fetchIssues, fetchTree, healthCheck } from '@/lib/client';
import { defaultTreeItems } from '../../shared/msw/fixtures/appApiFixtures';
import { createAppApiHandlers } from '../../shared/msw/handlers/createAppApiHandlers';
import type { CapturedRequest } from '../../shared/msw/models/appApiMockTypes';
import { mswServer } from '../support/mswServer';

const base = 'https://api.example.test';
const issue = {
  number: 321,
  title: 'Translation',
  body: null,
  state: 'open',
  url: 'https://example.test/issues/321',
  createdAt: '2026-05-10T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  closedAt: null,
};
const snapshot = { commitSha: 'a'.repeat(40), generatedAt: '2026-05-15T00:00:00.000Z' };
const prRequest = (): CreatePrRequest => ({
  title: 'Translation',
  description: 'Update',
  targetType: 'Aircraft',
  targetName: 'C130J',
  selectedChangeTypes: ['ファイルの追加'],
  selectedFiles: [{ path: 'DCSWorld/Mods/aircraft/C130J/briefing.txt', file: new File(['briefing'], 'briefing.txt') }],
});
const problem = (status: number, detail = 'Request failed') =>
  HttpResponse.json(
    {
      type: 'about:blank',
      title: 'API error',
      status,
      detail,
      instance: '/v2/prs',
      code: status === 409 ? 'BRANCH_CONFLICT' : 'VALIDATION_ERROR',
    },
    { status, headers: { 'Content-Type': 'application/problem+json', ...(status === 429 ? { 'Retry-After': '60' } : {}) } },
  );

describe('v2 client integration', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', base);
    mswServer.use(...createAppApiHandlers({ apiBaseUrl: base }));
  });

  it('uses /v2/health and deserializes tree dates', async () => {
    await expect(healthCheck()).resolves.toBe(true);
    const tree = await fetchTree();
    expect(tree).toHaveLength(defaultTreeItems.length);
    expect(tree[0]?.updatedAt).toBeInstanceOf(Date);
  });

  it('fetches every tree page with a fixed limit and snapshot', async () => {
    const queries: URLSearchParams[] = [];
    mswServer.use(
      http.get(`${base}/v2/tree`, ({ request }) => {
        const query = new URL(request.url).searchParams;
        queries.push(query);
        return HttpResponse.json({
          ...snapshot,
          items: [defaultTreeItems[query.has('cursor') ? 1 : 0]],
          page: { nextCursor: query.has('cursor') ? null : 'opaque/+cursor=' },
        });
      }),
    );
    const tree = await fetchTree();
    expect(tree.map((item) => item.path)).toEqual(defaultTreeItems.slice(0, 2).map((item) => item.path));
    expect(queries.map((query) => query.get('limit'))).toEqual(['10000', '10000']);
    expect(queries.map((query) => query.get('cursor'))).toEqual([null, 'opaque/+cursor=']);
  });

  it.each(['failure', 'changed snapshot', 'repeated cursor', 'missing cursor'])('rejects incomplete tree: %s', async (mode) => {
    let calls = 0;
    mswServer.use(
      http.get(`${base}/v2/tree`, () => {
        calls++;
        if (calls === 1) return HttpResponse.json({ ...snapshot, items: [], page: { nextCursor: 'next' } });
        if (mode === 'failure') return problem(400, 'Cursor expired');
        return HttpResponse.json({
          ...snapshot,
          commitSha: mode === 'changed snapshot' ? 'b'.repeat(40) : snapshot.commitSha,
          items: [],
          page: mode === 'missing cursor' ? {} : { nextCursor: mode === 'repeated cursor' ? 'next' : null },
        });
      }),
    );
    await expect(fetchTree()).rejects.toThrow();
    expect(calls).toBe(2);
  });

  it.each(['open', 'closed', 'all'] as const)(
    'gets all Issue pages for state=%s with nullable body and dates',
    async (state) => {
      const cursors: (string | null)[] = [];
      mswServer.use(
        http.get(`${base}/v2/issues`, ({ request }) => {
          const query = new URL(request.url).searchParams;
          expect(query.get('state')).toBe(state);
          expect(query.get('limit')).toBe('100');
          cursors.push(query.get('cursor'));
          return HttpResponse.json({
            items: [{ ...issue, number: query.has('cursor') ? 322 : 321 }],
            page: { nextCursor: query.has('cursor') ? null : 'next' },
          });
        }),
      );
      const issues = await fetchIssues({ state });
      expect(issues.map((item) => item.number)).toEqual([321, 322]);
      expect(issues[0]).toMatchObject({
        body: null,
        closedAt: null,
        createdAt: new Date(issue.createdAt),
        updatedAt: new Date(issue.updatedAt),
      });
      expect(issues[0]).not.toHaveProperty('labels');
      expect(cursors).toEqual([null, 'next']);
    },
  );

  it.each(['failure', 'repeated cursor', 'missing cursor'])('rejects incomplete Issue list: %s', async (mode) => {
    let calls = 0;
    mswServer.use(
      http.get(`${base}/v2/issues`, () => {
        calls++;
        if (calls === 1) return HttpResponse.json({ items: [issue], page: { nextCursor: 'next' } });
        if (mode === 'failure') return problem(400, 'Cursor expired');
        return HttpResponse.json({ items: [], page: mode === 'missing cursor' ? {} : { nextCursor: 'next' } });
      }),
    );
    await expect(fetchIssues({ state: 'all' })).rejects.toThrow();
    expect(calls).toBe(2);
  });

  it('terminates empty lists at a null cursor', async () => {
    await expect(fetchIssues({ state: 'all' })).resolves.toEqual([]);
    mswServer.use(http.get(`${base}/v2/tree`, () => HttpResponse.json({ ...snapshot, items: [], page: { nextCursor: null } })));
    await expect(fetchTree()).resolves.toEqual([]);
  });

  it('accepts a single Issue with HTTP 201 and preserves labels in the request', async () => {
    const issueRequests: CapturedRequest[] = [];
    mswServer.use(
      ...createAppApiHandlers({ apiBaseUrl: base, issueRequests, createIssueResponse: { ...issue, state: 'open' } }),
    );
    const result = await fetchCreateIssue({ title: 'Translation', body: 'Fix', labels: ['translation'], assignees: undefined });
    expect(result).toMatchObject({ number: 321, url: issue.url, body: null, closedAt: null });
    expect(issueRequests).toHaveLength(1);
    expect(issueRequests[0]).toMatchObject({ method: 'POST', url: `${base}/v2/issues` });
    expect(JSON.parse(issueRequests[0]?.bodyText ?? '{}')).toEqual({
      title: 'Translation',
      body: 'Fix',
      labels: ['translation'],
    });
  });

  it('accepts a single PR with HTTP 200 and serializes additions, updates and deletes', async () => {
    const createPrRequests: CapturedRequest[] = [];
    mswServer.use(...createAppApiHandlers({ apiBaseUrl: base, createPrRequests }));
    const request = prRequest();
    request.selectedFiles.push(
      { path: 'UserMissions/update.lua', file: new File(['updated'], 'update.lua') },
      { path: 'UserMissions/delete.lua', operation: 'delete' },
    );
    await expect(fetchCreatePr(request)).resolves.toMatchObject({
      number: 456,
      url: 'https://example.test/pr/456',
      reused: false,
    });
    expect(createPrRequests).toHaveLength(1);
    expect(createPrRequests[0]).toMatchObject({ method: 'POST', url: `${base}/v2/prs` });
    expect(JSON.parse(createPrRequests[0]?.bodyText ?? '{}').files).toEqual([
      { path: request.selectedFiles[0]?.path, content: 'briefing', operation: 'upsert' },
      { path: 'UserMissions/update.lua', content: 'updated', operation: 'upsert' },
      { path: 'UserMissions/delete.lua', operation: 'delete' },
    ]);
  });

  it.each([409, 422, 429, 500])('surfaces Problem Details for %s without retrying writes', async (status) => {
    let calls = 0;
    mswServer.use(
      http.post(`${base}/v2/prs`, () => {
        calls++;
        return problem(status, 'Action required');
      }),
    );
    await expect(fetchCreatePr(prRequest())).rejects.toMatchObject({
      status,
      detail: 'Action required',
      retryAfter: status === 429 ? '60' : undefined,
      category:
        status === 429
          ? ClientErrorCategoryObject.Throttling
          : status >= 500
            ? ClientErrorCategoryObject.InternalError
            : ClientErrorCategoryObject.InvalidRequest,
    });
    expect(calls).toBe(1);
  });

  it('does not retry Issue creation on 429', async () => {
    let calls = 0;
    mswServer.use(
      http.post(`${base}/v2/issues`, () => {
        calls++;
        return problem(429);
      }),
    );
    await expect(fetchCreateIssue({ title: 'Translation', body: '' })).rejects.toMatchObject({ status: 429, retryAfter: '60' });
    expect(calls).toBe(1);
  });

  it('classifies a network failure', async () => {
    mswServer.use(http.get(`${base}/v2/issues`, () => HttpResponse.error()));
    await expect(fetchIssues({ state: 'open' })).rejects.toMatchObject({ category: ClientErrorCategoryObject.Network });
  });

  it.each(['https://api.example.test/v2', 'https://api.example.test/path', ''])(
    'rejects invalid base URL: %s',
    async (baseUrl) => {
      vi.stubEnv('VITE_API_BASE_URL', baseUrl);
      await expect(healthCheck()).rejects.toThrow();
    },
  );

  it('accepts a trailing slash without duplicating /v2', async () => {
    vi.stubEnv('VITE_API_BASE_URL', `${base}/`);
    await expect(healthCheck()).resolves.toBe(true);
  });
});
