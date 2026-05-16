import { HttpResponse, http } from 'msw';
import { RAW_GITHUB_PREFIX } from '../fixtures/appApiFixtures';
import type { AppApiMockOptions } from '../models/appApiMockTypes';
import {
  createCapturedRequest,
  createHealthResponse,
  createIssueCreateResponse,
  createIssueListResponse,
  createPrCreateResponse,
  createRawFileResponse,
  createTreeResponse,
} from '../services/appApiMockResponses';

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @summary アプリ向け API モックハンドラ群を生成する。
 * @param options 応答内容と記録先を指定する。
 * @returns MSW ハンドラ一覧を返す。
 */
export const createAppApiHandlers = (options: AppApiMockOptions) => {
  if (options.apiBaseUrl === undefined) {
    throw new Error('apiBaseUrl is required to create MSW handlers.');
  }

  const apiBaseUrl = options.apiBaseUrl.replace(/\/$/, '');
  const rawGithubPattern = new RegExp(`^${escapeRegExp(RAW_GITHUB_PREFIX)}(.+)$`);

  return [
    http.get(`${apiBaseUrl}/health`, () => {
      const response = createHealthResponse(options);
      return HttpResponse.json(response.body, { status: response.status });
    }),

    http.get(`${apiBaseUrl}/tree`, () => {
      const response = createTreeResponse(options);
      return HttpResponse.json(response.body, { status: response.status });
    }),

    http.post(`${apiBaseUrl}/issue/list`, () => {
      const response = createIssueListResponse(options);
      return HttpResponse.json(response.body, { status: response.status });
    }),

    http.post(`${apiBaseUrl}/issue/create`, async ({ request }) => {
      const bodyText = request.method === 'GET' || request.method === 'HEAD' ? null : await request.clone().text();
      options.issueRequests?.push(createCapturedRequest(request.url, request.method, bodyText));

      const response = createIssueCreateResponse(options);
      return HttpResponse.json(response.body, { status: response.status });
    }),

    http.post(`${apiBaseUrl}/create-pr`, async ({ request }) => {
      const bodyText = request.method === 'GET' || request.method === 'HEAD' ? null : await request.clone().text();
      options.createPrRequests?.push(createCapturedRequest(request.url, request.method, bodyText));

      const response = createPrCreateResponse(options);
      return HttpResponse.json(response.body, { status: response.status });
    }),

    http.get(rawGithubPattern, ({ request }) => {
      const matchedPath = request.url.match(rawGithubPattern)?.[1];
      const path = matchedPath === undefined ? '' : decodeURIComponent(matchedPath);
      const response = createRawFileResponse(options, path);

      return new HttpResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.contentType,
        },
      });
    }),
  ];
};
