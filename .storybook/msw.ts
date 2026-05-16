import { initialize, mswLoader } from 'msw-storybook-addon';
import { createAppApiHandlers } from '../tests/shared/msw/handlers/createAppApiHandlers';
import type { AppApiMockOptions } from '../tests/shared/msw/models/appApiMockTypes';

const STORYBOOK_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

initialize({ onUnhandledRequest: 'bypass', quiet: true });

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
        ...options,
      }),
    },
  };
};
