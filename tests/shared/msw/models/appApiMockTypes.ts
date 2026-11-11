import type { Issue, PullRequestCreation, TreeItem } from '@/lib/http/apiClient/models';

export type MockIssue = Omit<Issue, 'createdAt' | 'updatedAt' | 'closedAt'> & {
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string | null;
};

export type MockTreeItem = Omit<TreeItem, 'updatedAt'> & {
  updatedAt?: string | Date | null;
};

export type CapturedRequest = {
  url: string;
  method: string;
  bodyText: string | null;
};

export type AppApiMockOptions = {
  apiBaseUrl?: string;
  healthOk?: boolean;
  treeItems?: MockTreeItem[];
  issues?: MockIssue[];
  createIssueResponse?: MockIssue;
  createIssueErrorMessage?: string | null;
  createPrResponse?: PullRequestCreation;
  createPrErrorMessage?: string | null;
  rawTextByPath?: Record<string, string>;
  rawBinaryByPath?: Record<string, number[]>;
  rawErrorPaths?: string[];
  issueRequests?: CapturedRequest[];
  createPrRequests?: CapturedRequest[];
};
