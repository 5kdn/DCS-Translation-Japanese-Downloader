import { initialize, mswLoader } from 'msw-storybook-addon';
import { defaultTreeItems } from '../tests/shared/msw/fixtures/appApiFixtures';
import { createAppApiHandlers } from '../tests/shared/msw/handlers/createAppApiHandlers';
import type { AppApiMockOptions } from '../tests/shared/msw/models/appApiMockTypes';

const STORYBOOK_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const STORYBOOK_DEFAULT_API_OPTIONS: Omit<AppApiMockOptions, 'apiBaseUrl'> = {
  healthOk: true,
  treeItems: defaultTreeItems,
  issues: [],
};

/**
 * @summary Storybook API 向け未捕捉リクエスト時のみ明示ログを出力する。
 * @param request 対象リクエストを指定する。
 */
const handleUnhandledRequest = (request: Request): void => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/storybook-api')) return;
  console.error(`[msw] Unhandled ${request.method} request to ${url.toString()}.`);
};

initialize(
  {
    onUnhandledRequest: handleUnhandledRequest,
    quiet: true,
  },
  createAppApiHandlers({
    apiBaseUrl: STORYBOOK_API_BASE_URL,
    ...STORYBOOK_DEFAULT_API_OPTIONS,
  }),
);

export { mswLoader };

/**
 * @summary Storybook 用 MSW パラメータを生成する。
 * @param options Story ごとに差し替える API モック設定を指定する。
 * @returns Storybook parameters へ渡す MSW 設定を返す。
 */
export const createStorybookMswParameters = (
  options: Omit<AppApiMockOptions, 'apiBaseUrl'> = {},
): {
  msw: {
    handlers: ReturnType<typeof createAppApiHandlers>;
  };
} => {
  return {
    msw: {
      handlers: createAppApiHandlers({
        apiBaseUrl: STORYBOOK_API_BASE_URL,
        ...STORYBOOK_DEFAULT_API_OPTIONS,
        ...options,
      }),
    },
  };
};
