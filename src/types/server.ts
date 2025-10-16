import type { Hono } from 'hono';

/** 共通レスポンスラッパ */
export type ApiEnvelope<TData> = {
  success: boolean;
  data: TData | null;
  message?: string;
};

/** GET /health 200 */
export type HealthResponse = {
  status: 'ok';
  /** ISO 8601 (date-time) */
  timestamp: string;
};

/** GET /tree 200 */
export type TreeItem = {
  path: string;
  sha: string;
  size?: number;
  url?: string;
};
export type TreeResponse = ApiEnvelope<TreeItem[]>;

/** POST /create-pr リクエスト */
export type CreatePrUpsertFile = {
  path: string;
  content: string;
  /** 省略時はサーバ側で upsert と扱われる前提 */
  operation?: 'upsert';
};
export type CreatePrDeleteFile = {
  path: string;
  operation: 'delete';
};
export type CreatePrRequest = {
  prTitle: string;
  branchName: string;
  files: Array<CreatePrUpsertFile | CreatePrDeleteFile>;
  prBody?: string;
  commitMessage?: string;
};

/** POST /create-pr 200 */
export type CreatedPr = {
  prNumber: number;
  prUrl: string;
  branchName: string;
  commitSha: string;
  note?: string;
};
export type CreatePrResponse = ApiEnvelope<CreatedPr[]>;

/** POST /download-zip リクエスト */
export type DownloadZipRequest = {
  path: string;
};

/** POST /download-zip 200 */
export type DownloadZipData = {
  /** ZIPファイルのBase64エンコード文字列 */
  base64: string;
  /** ZIPファイルのサイズ（バイト単位） */
  size: number;
};
export type DownloadZipResponse = ApiEnvelope<DownloadZipData>;

/** 500 共通（data は常に null 想定） */
export type ErrorResponse = ApiEnvelope<null>;

/** ルート定義（用途：パスのリテラル管理） */
export const ApiRoutes = {
  health: '/health',
  tree: '/tree',
  createPr: '/create-pr',
  downloadZip: '/download-zip',
} as const;

type TypedResponse<T> = Response & {
  json: () => Promise<T>;
};

type ApiClientResponse<T> = Promise<TypedResponse<T>>;

export type ClientContract = {
  health: {
    $get: () => ApiClientResponse<HealthResponse>;
  };
  tree: {
    $get: () => ApiClientResponse<TreeResponse>;
  };
  'download-zip': {
    $post: (options: { json: DownloadZipRequest }) => ApiClientResponse<DownloadZipResponse>;
  };
};

// hc<T> の制約を満たすための型（バックエンドの typeof app 代替）
// 実体は不要。型解決のみで使用するため .d.ts ではなくここに宣言。

declare const app: Hono;
export type AppType = typeof app;
