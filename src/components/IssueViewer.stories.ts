import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onUnmounted } from 'vue';
import { createJsonResponse, installFetchMock } from '../../.storybook/fetchMock';
import IssueViewer from './IssueViewer.vue';

type IssueListResponse = {
  issueListResponse: {
    success: boolean;
    message: string;
    data: IssueListItem[];
  };
};

type IssueListItem = {
  assignees: string[];
  body?: string | undefined;
  closedAt?: string | null;
  createdAt: string;
  issueNumber: number;
  issueUrl: string;
  labels: string[];
  state: 'open' | 'closed';
  title: string;
  updatedAt: string;
};

const createIssue = (overrides?: Partial<IssueListItem>): IssueListItem => {
  return {
    assignees: ['maintainer'],
    body: '既定の Issue 本文です。',
    closedAt: null,
    createdAt: '2026-04-01T00:00:00Z',
    issueNumber: 1,
    issueUrl: 'https://example.test/issues/1',
    labels: ['storybook'],
    state: 'open',
    title: 'Storybook Issue',
    updatedAt: '2026-04-02T00:00:00Z',
    ...overrides,
  };
};

const createIssueListResponse = (data: IssueListItem[]): IssueListResponse['issueListResponse'] => {
  return {
    success: true,
    message: 'ok',
    data,
  };
};

const createIssueViewerRender = (issueListResponse: IssueListResponse['issueListResponse']) => {
  return () => ({
    components: { IssueViewer },
    setup: () => {
      const installed = installFetchMock({
        match: (request): boolean => request.method === 'POST' && request.url.includes('/issue/list'),
        handle: async (): Promise<Response> => createJsonResponse(issueListResponse, { status: 200 }),
      });
      onUnmounted((): void => {
        installed.restore();
      });

      return {};
    },
    template: `
      <IssueViewer v-slot="{ toggle, isLoading }">
        <v-btn
          icon="mdi-message-alert-outline"
          aria-label="Issues"
          :disabled="isLoading"
          @click="toggle"
        />
      </IssueViewer>
    `,
  });
};

const meta = {
  title: 'Issue/IssueViewer',
  component: IssueViewer,
  tags: ['autodocs'],
} satisfies Meta<typeof IssueViewer>;

export default meta;
type MetaStory = StoryObj<typeof meta>;

export const ZeroIssue: MetaStory = {
  render: createIssueViewerRender(createIssueListResponse([])),
};

export const Default: MetaStory = {
  render: createIssueViewerRender(
    createIssueListResponse([
      createIssue({
        title: 'Storybook Issue',
        body: 'Storybook 用の既定 Issue 本文です。',
      }),
    ]),
  ),
};

export const LongText: MetaStory = {
  render: createIssueViewerRender(
    createIssueListResponse([
      createIssue({
        title: 'とても長いタイトル '.repeat(8).trim(),
        body: `${'長い本文です。'.repeat(30)}\n\n- 箇条書き 1\n- 箇条書き 2`,
      }),
    ]),
  ),
};

export const UndefinedBody: MetaStory = {
  render: createIssueViewerRender(
    createIssueListResponse([
      createIssue({
        title: '本文未設定の Issue',
        body: undefined,
      }),
    ]),
  ),
};

export const Linkify: MetaStory = {
  render: createIssueViewerRender(
    createIssueListResponse([
      createIssue({
        title: 'リンク付き Issue',
        body: '詳細は [GitHub](https://github.com/5kdn/DCS-Translation-Japanese) を参照してください。',
      }),
    ]),
  ),
};

export const XssSanitized: MetaStory = {
  render: createIssueViewerRender(
    createIssueListResponse([
      createIssue({
        title: '危険な HTML を含む Issue',
        body: '<script>alert("xss")</script><img src=x onerror=alert(1) />安全な本文です。',
      }),
    ]),
  ),
};

export const ManyIssues: MetaStory = {
  render: createIssueViewerRender(
    createIssueListResponse(
      Array.from(
        { length: 7 },
        (_value, index): IssueListItem =>
          createIssue({
            issueNumber: index + 1,
            issueUrl: `https://example.test/issues/${index + 1}`,
            title: `Issue ${index + 1}`,
            body: `Issue ${index + 1} の本文です。`,
          }),
      ),
    ),
  ),
};
