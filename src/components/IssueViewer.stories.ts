import { createStorybookMswBeforeEach } from '../../.storybook/msw';
import preview from '../../.storybook/preview';
import type { MockIssue } from '../../tests/shared/msw/models/appApiMockTypes';
import IssueViewer from './IssueViewer.vue';

const createIssue = (overrides?: Partial<MockIssue>): MockIssue => {
  return {
    body: '既定の Issue 本文です。',
    closedAt: null,
    createdAt: '2026-04-01T00:00:00Z',
    number: 1,
    url: 'https://example.test/issues/1',
    state: 'open',
    title: 'Storybook Issue',
    updatedAt: '2026-04-02T00:00:00Z',
    ...overrides,
  };
};

/**
 * @summary IssueViewer 用の MSW フックを生成する。
 * @param issues Storybook 上で表示する Issue 一覧を指定する。
 * @returns Storybook の beforeEach へ渡すフックを返す。
 */
const createIssueViewerMswBeforeEach = (issues: MockIssue[]): ReturnType<typeof createStorybookMswBeforeEach> => {
  return createStorybookMswBeforeEach({
    issues,
  });
};

const meta = preview.meta({
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
});

export const ZeroIssue = meta.story({
  beforeEach: createIssueViewerMswBeforeEach([]),
});

export const Default = meta.story({
  beforeEach: createIssueViewerMswBeforeEach([
    createIssue({
      title: 'Storybook Issue',
      body: 'Storybook 用の既定 Issue 本文です。',
    }),
  ]),
});

export const LongText = meta.story({
  beforeEach: createIssueViewerMswBeforeEach([
    createIssue({
      title: 'とても長いタイトル '.repeat(8).trim(),
      body: `${'長い本文です。'.repeat(30)}\n\n- 箇条書き 1\n- 箇条書き 2`,
    }),
  ]),
});

export const NullBody = meta.story({
  beforeEach: createIssueViewerMswBeforeEach([
    createIssue({
      title: '本文未設定の Issue',
      body: null,
    }),
  ]),
});

export const Linkify = meta.story({
  beforeEach: createIssueViewerMswBeforeEach([
    createIssue({
      title: 'リンク付き Issue',
      body: '詳細は [GitHub](https://github.com/dcs-translation-japanese/translations) を参照してください。',
    }),
  ]),
});

export const XssSanitized = meta.story({
  beforeEach: createIssueViewerMswBeforeEach([
    createIssue({
      title: '危険な HTML を含む Issue',
      body: '<script>alert("xss")</script><img src=x onerror=alert(1) />安全な本文です。',
    }),
  ]),
});

export const ManyIssues = meta.story({
  beforeEach: createIssueViewerMswBeforeEach(
    Array.from(
      { length: 7 },
      (_value, index): MockIssue =>
        createIssue({
          number: index + 1,
          url: `https://example.test/issues/${index + 1}`,
          title: `Issue ${index + 1}`,
          body: `Issue ${index + 1} の本文です。`,
        }),
    ),
  ),
});
