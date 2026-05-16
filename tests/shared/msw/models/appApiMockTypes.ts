import type { CreatePrPostResponse_data } from '@/lib/http/apiClient/createPr';
import type { CreatePostResponse_data } from '@/lib/http/apiClient/issue/create';
import type { ListPostResponse_data } from '@/lib/http/apiClient/issue/list';
import type { TreeGetResponse_data } from '@/lib/http/apiClient/tree';

export type MockTreeItem = Omit<TreeGetResponse_data, 'updatedAt'> & {
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
  issues?: ListPostResponse_data[];
  createIssueResponse?: CreatePostResponse_data[];
  createIssueErrorMessage?: string | null;
  createPrResponse?: CreatePrPostResponse_data[];
  createPrErrorMessage?: string | null;
  rawTextByPath?: Record<string, string>;
  rawBinaryByPath?: Record<string, number[]>;
  rawErrorPaths?: string[];
  issueRequests?: CapturedRequest[];
  createPrRequests?: CapturedRequest[];
};
