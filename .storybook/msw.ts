import type { UnhandledFrameHandle } from 'msw';
import { setupWorker } from 'msw/browser';
import { mswLoader } from 'msw-storybook-addon/csf3';
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
 * @param frame 対象ネットワークフレームを指定する。
 */
const handleUnhandledFrame: UnhandledFrameHandle = ({ frame }): void => {
  if (frame.protocol !== 'http' || !frame.data || typeof frame.data !== 'object' || !('request' in frame.data)) return;
  const { request } = frame.data;
  if (!(request instanceof Request)) return;
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/storybook-api')) return;
  console.error(`[msw] Unhandled ${request.method} request to ${url.toString()}.`);
};

const storybookMswLoader = mswLoader(async () => {
  const worker = setupWorker(
    ...createAppApiHandlers({
      apiBaseUrl: STORYBOOK_API_BASE_URL,
      ...STORYBOOK_DEFAULT_API_OPTIONS,
    }),
  );

  await worker.start({
    onUnhandledFrame: handleUnhandledFrame,
    quiet: true,
  });

  return worker;
});

export { storybookMswLoader };

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
