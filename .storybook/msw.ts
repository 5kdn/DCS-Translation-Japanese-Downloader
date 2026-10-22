import type { UnhandledFrameHandle } from 'msw';
import { setupWorker } from 'msw/browser';
import addonMsw, { type MswApi } from 'msw-storybook-addon';
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

export const storybookMswAddon = addonMsw(async () => {
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

/**
 * @summary Story ごとに API モック設定を適用するフックを生成する。
 * @param options Story ごとに差し替える API モック設定を指定する。
 * @returns Storybook の beforeEach へ渡すフックを返す。
 */
export const createStorybookMswBeforeEach = (
  options: Omit<AppApiMockOptions, 'apiBaseUrl'> = {},
): ((context: { msw: MswApi }) => void) => {
  return ({ msw }): void => {
    msw.use(
      ...createAppApiHandlers({
        apiBaseUrl: STORYBOOK_API_BASE_URL,
        ...STORYBOOK_DEFAULT_API_OPTIONS,
        ...options,
      }),
    );
  };
};
