import type { Page, Route } from '@playwright/test';
import { CreatePrRequestBuilderUriTemplate } from '@/lib/http/apiClient/createPr';
import { HealthRequestBuilderUriTemplate } from '@/lib/http/apiClient/health';
import { CreateRequestBuilderUriTemplate } from '@/lib/http/apiClient/issue/create';
import { ListRequestBuilderUriTemplate } from '@/lib/http/apiClient/issue/list';
import { TreeRequestBuilderUriTemplate } from '@/lib/http/apiClient/tree';
import { DEFAULT_RAW_TEXT_BY_PATH, RAW_GITHUB_PREFIX } from '../../shared/msw/fixtures/appApiFixtures';
import type { AppApiMockOptions, CapturedRequest } from '../../shared/msw/models/appApiMockTypes';
import {
  createCapturedRequest,
  createHealthResponse,
  createIssueCreateResponse,
  createIssueListResponse,
  createPrCreateResponse,
  createTreeResponse,
} from '../../shared/msw/services/appApiMockResponses';

/**
 * @summary Kiota の URI template から Playwright route 用 glob を生成する。
 * @param uriTemplate Kiota 生成の URI template を指定する。
 * @returns Playwright の route で利用する glob を返す。
 */
const toRoutePattern = (uriTemplate: string): string => {
  const pathWithQuery = uriTemplate.replace('{+baseurl}', '').replace('{?state*}', '*');
  return `**${pathWithQuery}`;
};

const HEALTH_ROUTE_PATTERN = toRoutePattern(HealthRequestBuilderUriTemplate);
const TREE_ROUTE_PATTERN = toRoutePattern(TreeRequestBuilderUriTemplate);
const ISSUE_LIST_ROUTE_PATTERN = toRoutePattern(ListRequestBuilderUriTemplate);
const ISSUE_CREATE_ROUTE_PATTERN = toRoutePattern(CreateRequestBuilderUriTemplate);
const CREATE_PR_ROUTE_PATTERN = toRoutePattern(CreatePrRequestBuilderUriTemplate);

export type { AppApiMockOptions, CapturedRequest };

/**
 * @summary API 応答モックを初期化する。
 * @param page 対象ページを指定する。
 * @param options 応答内容や記録先を指定する。
 * @returns Promise<void> を返す。
 */
export const installAppApiMocks = async (page: Page, options: AppApiMockOptions = {}): Promise<void> => {
  const rawTextByPath = { ...DEFAULT_RAW_TEXT_BY_PATH, ...options.rawTextByPath };
  const rawErrorPathSet = new Set(options.rawErrorPaths ?? []);

  await page.route(HEALTH_ROUTE_PATTERN, async (route: Route): Promise<void> => {
    const response = createHealthResponse(options);
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });

  await page.route(TREE_ROUTE_PATTERN, async (route: Route): Promise<void> => {
    const response = createTreeResponse(options);
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });

  await page.route(ISSUE_LIST_ROUTE_PATTERN, async (route: Route): Promise<void> => {
    const response = createIssueListResponse(options);
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });

  await page.route(ISSUE_CREATE_ROUTE_PATTERN, async (route: Route): Promise<void> => {
    options.issueRequests?.push(
      createCapturedRequest(route.request().url(), route.request().method(), route.request().postData()),
    );
    const response = createIssueCreateResponse(options);

    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });

  await page.route(CREATE_PR_ROUTE_PATTERN, async (route: Route): Promise<void> => {
    options.createPrRequests?.push(
      createCapturedRequest(route.request().url(), route.request().method(), route.request().postData()),
    );
    const response = createPrCreateResponse(options);

    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });

  await page.route(`${RAW_GITHUB_PREFIX}*`, async (route: Route): Promise<void> => {
    const url = route.request().url();
    const path = decodeURIComponent(url.slice(RAW_GITHUB_PREFIX.length));

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
