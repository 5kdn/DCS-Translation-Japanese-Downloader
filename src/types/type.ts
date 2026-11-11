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
  body: string | null;
  number: number | undefined;
  state: 'open' | 'closed' | undefined;
  url: string | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  closedAt?: Date | null;
};

export interface DownloadItemRequirement {
  name: string;
  items: TreeItem[];
}
