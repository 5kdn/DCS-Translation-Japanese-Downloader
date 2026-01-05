import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, spyOn, userEvent, within } from 'storybook/test';
import { ref } from 'vue';
import CreateIssueDialog from './CreateIssueDialog.vue';

const meta = {
  title: 'Issue/CreateIssueDialog',
  component: CreateIssueDialog,
  tags: ['autodocs'],
  argTypes: {
    'onUpdate:modelValue': { action: 'update:modelValue' },
    onSubmit: { action: 'submit' },
    onClose: { action: 'close' },
    onError: { action: 'error' },
  },
  args: {
    onSubmit: fn(),
    onClose: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof CreateIssueDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
};

export const Closed: Story = {
  args: {
    modelValue: false,
    path: 'UserMissions/sample.miz',
  },
};

export const LongPath: Story = {
  args: {
    modelValue: true,
    path: `${Array(12).fill('VeryLongFolderName').join('/')}/Mission Name (Night).miz`,
  },
};

export const SpecialCharsPath: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/日本語/スペース あり/[test](a)_b-c.miz',
  },
};

export const TypoFilled: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(dialog.getByRole('tab', { name: '誤字・脱字' }));
    const lineHint = canvasElement.ownerDocument.body.querySelector(
      '[name="issue-typo-line-hint"]',
    ) as HTMLTextAreaElement | null;
    const expectText = canvasElement.ownerDocument.body.querySelector(
      '[name="issue-typo-expect"]',
    ) as HTMLTextAreaElement | null;
    if (lineHint === null || expectText === null) {
      throw new Error('入力欄の取得に失敗した。');
    }

    await user.type(lineHint, 'Briefing 2行目（"Welcom" の綴り）');
    await user.type(expectText, 'Welcome');

    const submit = dialog.getByRole('button', { name: '送信' });
    await expect(submit).not.toHaveAttribute('disabled');
  },
};

export const BugFilled: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(dialog.getByRole('tab', { name: '不具合' }));

    const expectText = canvasElement.ownerDocument.body.querySelector(
      '[name="issue-bug-expect"]',
    ) as HTMLTextAreaElement | null;
    const actualText = canvasElement.ownerDocument.body.querySelector(
      '[name="issue-bug-actual"]',
    ) as HTMLTextAreaElement | null;
    const environmentText = canvasElement.ownerDocument.body.querySelector(
      '[name="issue-bug-environment"]',
    ) as HTMLTextAreaElement | null;
    if (expectText === null || actualText === null || environmentText === null) {
      throw new Error('入力欄の取得に失敗した。');
    }

    await user.type(expectText, '翻訳済みテキストが表示される');
    await user.type(actualText, '原文のまま表示される');
    await user.type(environmentText, 'Windows 11 / Chrome 131 / DCS 2.9');

    const submit = dialog.getByRole('button', { name: '送信' });
    await expect(submit).not.toHaveAttribute('disabled');
  },
};

export const OtherFilled: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(dialog.getByRole('tab', { name: 'その他' }));

    const messageText = canvasElement.ownerDocument.body.querySelector(
      '[name="issue-other-message"]',
    ) as HTMLTextAreaElement | null;
    if (messageText === null) {
      throw new Error('入力欄の取得に失敗した。');
    }

    await user.type(messageText, '要望: ダウンロード対象の検索機能が欲しいです。');

    const submit = dialog.getByRole('button', { name: '送信' });
    await expect(submit).not.toHaveAttribute('disabled');
  },
};

export const TypoRequiredEmpty: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(dialog.getByRole('tab', { name: '誤字・脱字' }));
    const submit = dialog.getByRole('button', { name: '送信' });
    await expect(submit).toHaveAttribute('disabled');
  },
};

export const BugRequiredEmpty: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(dialog.getByRole('tab', { name: '不具合' }));
    const submit = dialog.getByRole('button', { name: '送信' });
    await expect(submit).toHaveAttribute('disabled');
  },
};

export const OtherRequiredEmpty: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(dialog.getByRole('tab', { name: 'その他' }));
    const submit = dialog.getByRole('button', { name: '送信' });
    await expect(submit).toHaveAttribute('disabled');
  },
};

export const LoadingWhileSubmitting: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const restoreFetch = overrideFetch(createPendingFetch());
    try {
      const dialog = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(dialog.getByRole('tab', { name: '誤字・脱字' }));
      const lineHint = canvasElement.ownerDocument.body.querySelector(
        '[name="issue-typo-line-hint"]',
      ) as HTMLTextAreaElement | null;
      const expectText = canvasElement.ownerDocument.body.querySelector(
        '[name="issue-typo-expect"]',
      ) as HTMLTextAreaElement | null;
      if (lineHint === null || expectText === null) {
        throw new Error('入力欄の取得に失敗した。');
      }

      await user.type(lineHint, 'Briefing 2行目（"Welcom" の綴り）');
      await user.type(expectText, 'Welcome');

      const submit = dialog.getByRole('button', { name: '送信' });
      const close = dialog.getByRole('button', { name: '閉じる' });

      await user.click(submit);

      await expect(submit).toBeDisabled();
      await expect(close).toBeDisabled();
    } finally {
      restoreFetch();
    }
  },
};

export const SubmitErrorEmits: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
  play: async ({ canvasElement, args }): Promise<void> => {
    const restoreFetch = overrideFetch(createRejectFetch(new Error('request failed')));
    let consoleError: ReturnType<typeof spyOn> | null = null;
    try {
      const dialog = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      consoleError = spyOn(console, 'error').mockImplementation(() => {});
      await user.click(dialog.getByRole('tab', { name: '誤字・脱字' }));
      const lineHint = canvasElement.ownerDocument.body.querySelector(
        '[name="issue-typo-line-hint"]',
      ) as HTMLTextAreaElement | null;
      const expectText = canvasElement.ownerDocument.body.querySelector(
        '[name="issue-typo-expect"]',
      ) as HTMLTextAreaElement | null;
      if (lineHint === null || expectText === null) {
        throw new Error('入力欄の取得に失敗した。');
      }
      const onError = args.onError as unknown as ReturnType<typeof fn>;
      onError.mockClear();

      await user.type(lineHint, 'Briefing 2行目（"Welcom" の綴り）');
      await user.type(expectText, 'Welcome');
      await user.click(dialog.getByRole('button', { name: '送信' }));

      await expect(onError).toHaveBeenCalledTimes(1);
    } finally {
      consoleError?.mockRestore();
      restoreFetch();
    }
  },
};

export const SubmitSuccessEmits: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
    onSubmit: fn(),
    onClose: fn(),
    'onUpdate:modelValue': fn(),
  },
  play: async ({ canvasElement, args }): Promise<void> => {
    const restoreFetch = overrideFetch(
      createResolveFetch({
        success: true,
        data: [{ issueNumber: 123, issueUrl: 'https://example.test/issues/123' }],
      }),
    );
    try {
      const dialog = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(dialog.getByRole('tab', { name: '誤字・脱字' }));

      const lineHint = canvasElement.ownerDocument.body.querySelector(
        '[name="issue-typo-line-hint"]',
      ) as HTMLTextAreaElement | null;
      const expectText = canvasElement.ownerDocument.body.querySelector(
        '[name="issue-typo-expect"]',
      ) as HTMLTextAreaElement | null;
      if (lineHint === null || expectText === null) {
        throw new Error('入力欄の取得に失敗した。');
      }

      const onSubmit = args.onSubmit as unknown as ReturnType<typeof fn>;
      const onClose = args.onClose as unknown as ReturnType<typeof fn>;
      const onUpdate = args['onUpdate:modelValue'] as unknown as ReturnType<typeof fn>;
      onSubmit.mockClear();
      onClose.mockClear();
      onUpdate.mockClear();

      await user.type(lineHint, 'Briefing 2行目（"Welcom" の綴り）');
      await user.type(expectText, 'Welcome');
      await user.click(dialog.getByRole('button', { name: '送信' }));

      await expect(onSubmit).toHaveBeenCalledTimes(1);
      await expect(onClose).toHaveBeenCalled();
      await expect(onUpdate).toHaveBeenCalledWith(false);
    } finally {
      restoreFetch();
    }
  },
};

export const SubmitRequestPayload: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
  },
  play: async ({ canvasElement }): Promise<void> => {
    const capture = createCaptureFetch({
      success: true,
      data: [{ issueNumber: 123, issueUrl: 'https://example.test/issues/123' }],
    });
    const restoreFetch = overrideFetch(capture.fetch);
    try {
      const dialog = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(dialog.getByRole('tab', { name: '誤字・脱字' }));
      const lineHint = canvasElement.ownerDocument.body.querySelector(
        '[name="issue-typo-line-hint"]',
      ) as HTMLTextAreaElement | null;
      const expectText = canvasElement.ownerDocument.body.querySelector(
        '[name="issue-typo-expect"]',
      ) as HTMLTextAreaElement | null;
      if (lineHint === null || expectText === null) {
        throw new Error('入力欄の取得に失敗した。');
      }

      await user.type(lineHint, 'Briefing 2行目（"Welcom" の綴り）');
      await user.type(expectText, 'Welcome');
      await user.click(dialog.getByRole('button', { name: '送信' }));

      const captured = await capture.captured;
      await expect(captured.method).toBe('POST');
      await expect(captured.url).toContain('/issue/create');
      if (captured.bodyText === null) {
        throw new Error('送信ボディの取得に失敗した。');
      }
      const body = JSON.parse(captured.bodyText) as { title?: string; body?: string; labels?: string[] };
      await expect(body.title).toBe('[typo] UserMissions/sample.miz');
      await expect(body.labels).toEqual(['translation', 'typo']);
      await expect(body.body).toContain('## 修正場所が分かる情報');
      await expect(body.body).toContain('Briefing 2行目（"Welcom" の綴り）');
      await expect(body.body).toContain('## 期待するテキスト');
      await expect(body.body).toContain('Welcome');
    } finally {
      restoreFetch();
    }
  },
};

export const CloseEmits: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/sample.miz',
    onClose: fn(),
    'onUpdate:modelValue': fn(),
  },
  play: async ({ canvasElement, args }): Promise<void> => {
    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onClose = args.onClose as unknown as ReturnType<typeof fn>;
    const onUpdate = args['onUpdate:modelValue'] as unknown as ReturnType<typeof fn>;
    onClose.mockClear();
    onUpdate.mockClear();

    await user.click(dialog.getByRole('button', { name: '閉じる' }));

    await expect(onClose).toHaveBeenCalled();
    await expect(onUpdate).toHaveBeenCalledWith(false);
  },
};

export const PathChangesTitle: Story = {
  args: {
    modelValue: true,
    path: 'UserMissions/first.miz',
  },
  render: (args) => ({
    components: { CreateIssueDialog },
    setup() {
      const path = ref(args.path);
      const swapPath = (): void => {
        path.value = 'UserMissions/second.miz';
      };
      return { args, path, swapPath };
    },
    template: `
      <div>
        <button type="button" @click="swapPath">変更</button>
        <CreateIssueDialog v-bind="args" :path="path" />
      </div>
    `,
  }),
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    const dialog = within(canvasElement.ownerDocument.body);
    const title = dialog.getByLabelText('タイトル') as HTMLInputElement;
    await expect(title.value).toBe('[typo] UserMissions/first.miz');

    await userEvent.click(canvas.getByRole('button', { name: '変更' }));
    await expect(title.value).toBe('[typo] UserMissions/second.miz');
  },
};

const overrideFetch = (nextFetch: typeof fetch): (() => void) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = nextFetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
};

const createPendingFetch = (): typeof fetch => {
  return (() => new Promise<Response>(() => {})) as typeof fetch;
};

const createRejectFetch = (error: Error): typeof fetch => {
  return (() => Promise.reject(error)) as typeof fetch;
};

const createResolveFetch = (payload: object): typeof fetch => {
  return (() =>
    Promise.resolve(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )) as typeof fetch;
};

const createCaptureFetch = (
  payload: object,
): {
  fetch: typeof fetch;
  captured: Promise<{ url: string; method: string; bodyText: string | null }>;
} => {
  let resolved = false;
  let resolveCapture: (value: { url: string; method: string; bodyText: string | null }) => void;
  const captured = new Promise<{ url: string; method: string; bodyText: string | null }>((resolve) => {
    resolveCapture = resolve;
  });
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const capturedRequest = await readRequestInfo(input, init);
    if (!resolved) {
      resolved = true;
      resolveCapture(capturedRequest);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return { fetch: fetchFn, captured };
};

const readRequestInfo = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ url: string; method: string; bodyText: string | null }> => {
  if (input instanceof Request) {
    return { url: input.url, method: input.method, bodyText: await input.clone().text() };
  }
  return {
    url: input.toString(),
    method: init?.method ?? 'GET',
    bodyText: await resolveBodyText(init?.body),
  };
};

const resolveBodyText = async (body: BodyInit | null | undefined): Promise<string | null> => {
  if (body == null) return null;
  if (typeof body === 'string') return body;
  try {
    return await new Response(body).text();
  } catch {
    return null;
  }
};
