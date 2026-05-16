import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { ListPostResponse_data } from '@/lib/http/apiClient/issue/list';
import { createStorybookMswParameters } from '../../.storybook/msw';
import IssueViewer from './IssueViewer.vue';

const createIssue = (overrides?: Partial<ListPostResponse_data>): ListPostResponse_data => {
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

/**
 * @summary IssueViewer 用の MSW parameters を生成する。
 * @param issues Storybook 上で表示する Issue 一覧を指定する。
 * @returns Storybook parameters を返す。
 */
const createIssueViewerMswParameters = (issues: ListPostResponse_data[]) => {
  return createStorybookMswParameters({
    issues,
  });
};

const meta = {
  title: 'Issue/IssueViewer',
  component: IssueViewer,
  tags: ['autodocs'],
  render: () => ({
    components: { IssueViewer },
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
  }),
} satisfies Meta<typeof IssueViewer>;

export default meta;
type MetaStory = StoryObj<typeof meta>;

export const ZeroIssue: MetaStory = {
  parameters: createIssueViewerMswParameters([]),
};

export const Default: MetaStory = {
  parameters: createIssueViewerMswParameters([
    createIssue({
      title: 'Storybook Issue',
      body: 'Storybook 用の既定 Issue 本文です。',
    }),
  ]),
};

export const LongText: MetaStory = {
  parameters: createIssueViewerMswParameters([
    createIssue({
      title: 'とても長いタイトル '.repeat(8).trim(),
      body: `${'長い本文です。'.repeat(30)}\n\n- 箇条書き 1\n- 箇条書き 2`,
    }),
  ]),
};

export const UndefinedBody: MetaStory = {
  parameters: createIssueViewerMswParameters([
    createIssue({
      title: '本文未設定の Issue',
      body: undefined,
    }),
  ]),
};

export const Linkify: MetaStory = {
  parameters: createIssueViewerMswParameters([
    createIssue({
      title: 'リンク付き Issue',
      body: '詳細は [GitHub](https://github.com/5kdn/DCS-Translation-Japanese) を参照してください。',
    }),
  ]),
};

export const XssSanitized: MetaStory = {
  parameters: createIssueViewerMswParameters([
    createIssue({
      title: '危険な HTML を含む Issue',
      body: '<script>alert("xss")</script><img src=x onerror=alert(1) />安全な本文です。',
    }),
  ]),
};

export const ManyIssues: MetaStory = {
  parameters: createIssueViewerMswParameters(
    Array.from(
      { length: 7 },
      (_value, index): ListPostResponse_data =>
        createIssue({
          issueNumber: index + 1,
          issueUrl: `https://example.test/issues/${index + 1}`,
          title: `Issue ${index + 1}`,
          body: `Issue ${index + 1} の本文です。`,
        }),
    ),
  ),
};
