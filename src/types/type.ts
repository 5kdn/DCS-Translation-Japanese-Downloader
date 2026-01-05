/**
 * @summary GitHub上に存在するファイル情報を示す。
 */
export type TreeItem = {
  path: string | undefined;
  type: 'blob' | undefined;
  mode: string | undefined;
  url: string | undefined;
  sha: string | undefined;
  size: number | undefined;
  updatedAt: Date | undefined;
};

/**
 * @summary GitHub上に存在するIssueを示す。
 */
export type IssueItem = {
  title: string | undefined;
  body: string | undefined;
  issueNumber: number | undefined;
  state: 'open' | 'closed' | undefined;
  issueUrl: string | undefined;
  labels: string[] | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  closedAt?: Date | null;
  assignees: string[] | undefined;
};

// ----------------------------------------------

/**
 * エントリ返却の共通構造を定義する。
 */
export interface ApiResponseBase<T> {
  success: boolean; // 成否
  data?: T; // 実データ
  message?: string; // 任意のメッセージ
}

export interface DownloadItemRequirement {
  name: string;
  items: TreeItem[];
}
