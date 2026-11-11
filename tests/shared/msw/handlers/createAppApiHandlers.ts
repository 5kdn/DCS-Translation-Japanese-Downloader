import { HttpResponse, http } from 'msw';
import { extractRepositoryPathFromRawUrl } from '../../extractRepositoryPathFromRawUrl';
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

  return [
    http.get(`${apiBaseUrl}/v2/health`, () => {
      const response = createHealthResponse(options);
      return HttpResponse.json(response.body, { status: response.status, headers: { 'Content-Type': response.contentType } });
    }),

    http.get(`${apiBaseUrl}/v2/tree`, () => {
      const response = createTreeResponse(options);
      return HttpResponse.json(response.body, { status: response.status, headers: { 'Content-Type': response.contentType } });
    }),

    http.get(`${apiBaseUrl}/v2/issues`, ({ request }) => {
      const response = createIssueListResponse(options, new URL(request.url).searchParams.get('state') ?? 'open');
      return HttpResponse.json(response.body, { status: response.status });
    }),

    http.post(`${apiBaseUrl}/v2/issues`, async ({ request }) => {
      const bodyText = request.method === 'GET' || request.method === 'HEAD' ? null : await request.clone().text();
      options.issueRequests?.push(createCapturedRequest(request.url, request.method, bodyText));

      const response = createIssueCreateResponse(options);
      return HttpResponse.json(response.body, { status: response.status, headers: { 'Content-Type': response.contentType } });
    }),

    http.post(`${apiBaseUrl}/v2/prs`, async ({ request }) => {
      const bodyText = request.method === 'GET' || request.method === 'HEAD' ? null : await request.clone().text();
      options.createPrRequests?.push(createCapturedRequest(request.url, request.method, bodyText));

      const response = createPrCreateResponse(options);
      return HttpResponse.json(response.body, { status: response.status, headers: { 'Content-Type': response.contentType } });
    }),

    http.get('https://raw.githubusercontent.com/*', ({ request }) => {
      const path = extractRepositoryPathFromRawUrl(request.url);
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
