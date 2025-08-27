import type { AuthenticationProvider } from '@microsoft/kiota-abstractions';
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';
import { createApiClient } from './http/apiClient/apiClient';
import { DownloadFilesRequestBuilderRequestsMetadata } from './http/apiClient/downloadFiles/index.js';

/** プロバイダを作成する。 */
const createAnonymousProvider = (): AuthenticationProvider => ({
  authenticateRequest: async () => {},
});

/**
 * Kiota用のAPIクライアントを初期化する。
 */
const provider = createAnonymousProvider();
const adapter = new FetchRequestAdapter(provider);
const baseUrl = import.meta.env.VITE_API_BASE_URL;
if (baseUrl) adapter.baseUrl = baseUrl;
export const apiClient = createApiClient(adapter);

/** download-files エンドポイントからZIPバイナリを取得する。 */
export const downloadFilesAsArrayBuffer = async (paths: string[]): Promise<ArrayBuffer> => {
  if (paths.length === 0) {
    throw new Error('取得対象が指定されていません。');
  }
  const requestInfo = apiClient.downloadFiles.toPostRequestInformation({ paths });
  const metadata = DownloadFilesRequestBuilderRequestsMetadata.post;
  if (!metadata) {
    throw new Error('download-files メタデータを取得できませんでした。');
  }
  const buffer = await adapter.sendPrimitive<ArrayBuffer>(requestInfo, 'ArrayBuffer', metadata.errorMappings);
  if (!buffer) {
    throw new Error('レスポンスが空でした。');
  }
  return buffer;
};
