import type { AuthenticationProvider } from '@microsoft/kiota-abstractions';
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';
import { createApiClient } from './apiClient/apiClient';

/** プロバイダを作成する。 */
const createAnonymousProvider = (): AuthenticationProvider => ({
  authenticateRequest: async () => {},
});

/**
 * Kiota用のAPIクライアントを初期化する。
 */
export const apiClient = (() => {
  const provider = createAnonymousProvider();
  const adapter = new FetchRequestAdapter(provider);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (baseUrl) adapter.baseUrl = baseUrl;
  return createApiClient(adapter);
})();
