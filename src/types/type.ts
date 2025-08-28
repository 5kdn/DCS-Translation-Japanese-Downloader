export interface TreeItem {
  path: string;
  sha: string;
  size?: number;
  url?: string;
}

/**
 * /download-zip エントリのリクエストペイロードを表現する。
 */
export type DownloadZipRequest = {
  path: string; // ダウンロード対象のパス
};

/**
 * エントリ返却の共通構造を定義する。
 */
export interface ApiResponseBase<T> {
  success: boolean; // 成否
  data?: T; // 実データ
  message?: string; // 任意のメッセージ
}

/**
 * /tree エントリの返却型を表現する。
 */
export type TreeResponse = ApiResponseBase<TreeItem[]>;

/**
 * /download-zip エントリの失敗レスポンスを表現する。
 */
export type DownloadZipFailureResponse = ApiResponseBase<undefined>;

export interface Category {
  name: string;
  paths: string[];
}
