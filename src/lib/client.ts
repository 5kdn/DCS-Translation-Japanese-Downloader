import type { AuthenticationProvider } from '@microsoft/kiota-abstractions';
import { FetchRequestAdapter, HttpClient } from '@microsoft/kiota-http-fetchlibrary';
import { createApiClient } from './http/apiClient/apiClient';
import {
  createDownloadFilePathsPostResponseFromDiscriminatorValue,
  type DownloadFilePathsPostResponse,
  type DownloadFilePathsPostResponse_files,
  DownloadFilePathsRequestBuilderRequestsMetadata,
} from './http/apiClient/downloadFilePaths/index.js';

const API_TIMEOUT_MS = 300_000;

const combineSignals = (signals: AbortSignal[]): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();
  const onAbort = (event: Event) => {
    const reason = (event.target as AbortSignal).reason;
    if (!controller.signal.aborted) controller.abort(reason);
  };
  for (const signal of signals) {
    if (signal.aborted && !controller.signal.aborted) {
      controller.abort(signal.reason);
      continue;
    }
    signal.addEventListener('abort', onAbort);
  }
  const cleanup = () => {
    signals.forEach((signal) => {
      signal.removeEventListener('abort', onAbort);
    });
  };
  return { signal: controller.signal, cleanup };
};

const createRequestInitWithTimeout = (init: RequestInit = {}): { initWithSignal: RequestInit; cleanup: () => void } => {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(new Error('リクエストがタイムアウトしました。')), API_TIMEOUT_MS);
  const cleanupTimeout = () => clearTimeout(timeoutId);
  if (!init.signal) {
    return { initWithSignal: { ...init, signal: timeoutController.signal }, cleanup: cleanupTimeout };
  }
  const { signal, cleanup: cleanupSignals } = combineSignals([init.signal, timeoutController.signal]);
  const cleanup = () => {
    cleanupTimeout();
    cleanupSignals();
  };
  return { initWithSignal: { ...init, signal }, cleanup };
};

/** fetch にタイムアウトを付与する。 */
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const { initWithSignal, cleanup } = createRequestInitWithTimeout(init);
  try {
    return await fetch(input, initWithSignal);
  } finally {
    cleanup();
  }
};

/** プロバイダを作成する。 */
const createAnonymousProvider = (): AuthenticationProvider => ({
  authenticateRequest: async () => {},
});

/**
 * Kiota用のAPIクライアントを初期化する。
 */
const provider = createAnonymousProvider();
const httpClient = new HttpClient(fetchWithTimeout);
const adapter = new FetchRequestAdapter(provider, undefined, undefined, httpClient);
const baseUrl = import.meta.env.VITE_API_BASE_URL;
if (baseUrl) adapter.baseUrl = baseUrl;
export const apiClient = createApiClient(adapter);

export type DownloadFileTarget = { path: string; url: string };

/** download-file-paths エンドポイントからRAW URL一覧を取得する。 */
export const fetchDownloadFileUrls = async (paths: string[]): Promise<DownloadFileTarget[]> => {
  if (paths.length === 0) {
    throw new Error('取得対象が指定されていません。');
  }
  const requestInfo = apiClient.downloadFilePaths.toPostRequestInformation({ paths });
  const metadata = DownloadFilePathsRequestBuilderRequestsMetadata.post;
  if (!metadata) {
    throw new Error('download-file-paths メタデータを取得できませんでした。');
  }
  const response = await adapter.send<DownloadFilePathsPostResponse>(
    requestInfo,
    createDownloadFilePathsPostResponseFromDiscriminatorValue,
    metadata.errorMappings,
  );
  const files = response?.files?.filter(
    (file: DownloadFilePathsPostResponse_files | undefined | null): file is DownloadFilePathsPostResponse_files =>
      !!file?.path && !!file?.url,
  );
  if (!files?.length) {
    throw new Error('ダウンロード対象URLを取得できませんでした。');
  }
  return files.map((file) => ({ path: file.path as string, url: file.url as string }));
};

/** RAW URLからバイナリを取得する。 */
export const fetchArrayBufferWithTimeout = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`ファイル取得に失敗しました（HTTP ${response.status}）`);
  }
  return response.arrayBuffer();
};
