import type { Page, Route } from '@playwright/test';
import { extractRepositoryPathFromRawUrl } from '../../shared/extractRepositoryPathFromRawUrl';
import { DEFAULT_RAW_TEXT_BY_PATH } from '../../shared/msw/fixtures/appApiFixtures';
import type { AppApiMockOptions, CapturedRequest } from '../../shared/msw/models/appApiMockTypes';
import {
  createCapturedRequest,
  createHealthResponse,
  createIssueCreateResponse,
  createIssueListResponse,
  createPrCreateResponse,
  createTreeResponse,
} from '../../shared/msw/services/appApiMockResponses';

export type { AppApiMockOptions, CapturedRequest };

export const installAppApiMocks = async (page: Page, options: AppApiMockOptions = {}): Promise<void> => {
  const rawTextByPath = { ...DEFAULT_RAW_TEXT_BY_PATH, ...options.rawTextByPath };
  const rawErrorPathSet = new Set(options.rawErrorPaths ?? []);
  const fulfill = async (route: Route, response: ReturnType<typeof createHealthResponse>): Promise<void> => {
    await route.fulfill({ status: response.status, contentType: response.contentType, body: JSON.stringify(response.body) });
  };

  await page.route('**/v2/health', (route) => fulfill(route, createHealthResponse(options)));
  await page.route('**/v2/tree?*', (route) => fulfill(route, createTreeResponse(options)));
  await page.route(/\/v2\/issues(?:\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await fulfill(
        route,
        createIssueListResponse(options, new URL(route.request().url()).searchParams.get('state') ?? 'open'),
      );
    } else if (method === 'POST') {
      options.issueRequests?.push(createCapturedRequest(route.request().url(), method, route.request().postData()));
      await fulfill(route, createIssueCreateResponse(options));
    } else {
      await route.fulfill({ status: 405 });
    }
  });
  await page.route('**/v2/prs', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fulfill({ status: 405 });
      return;
    }
    options.createPrRequests?.push(
      createCapturedRequest(route.request().url(), route.request().method(), route.request().postData()),
    );
    await fulfill(route, createPrCreateResponse(options));
  });

  await page.route('https://raw.githubusercontent.com/**', async (route: Route): Promise<void> => {
    const url = route.request().url();
    let path: string;
    try {
      path = extractRepositoryPathFromRawUrl(url);
    } catch {
      await route.fallback();
      return;
    }

    if (rawErrorPathSet.has(path)) {
      await route.fulfill({ status: 500, body: 'failed' });
      return;
    }

    const binary = options.rawBinaryByPath?.[path];
    if (binary !== undefined) {
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        body: Buffer.from(binary),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'text/plain; charset=utf-8',
      body: rawTextByPath[path] ?? 'dictionary = {}',
    });
  });
};
