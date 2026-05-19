import type { Meta, StoryObj } from '@storybook/vue3-vite';
import JSZip from 'jszip';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { createStorybookMswParameters } from '../.storybook/msw';
import { defaultTreeItems } from '../tests/shared/msw/fixtures/appApiFixtures';
import type { MockTreeItem } from '../tests/shared/msw/models/appApiMockTypes';
import App from './App.vue';

type AppStoryOptions = {
  healthOk?: boolean;
  treeItems?: MockTreeItem[];
};

/**
 * @summary App 用の MSW parameters を生成する。
 * @param options Storybook 表示向けの固定応答を指定する。
 * @returns Storybook parameters を返す。
 */
const createAppMswParameters = (options?: AppStoryOptions) => {
  return createStorybookMswParameters({
    healthOk: options?.healthOk,
    treeItems: options?.treeItems ?? defaultTreeItems,
    issues: [],
  });
};

/**
 * @summary Storybook 用のサンプル MIZ ファイルを生成する。
 * @returns dictionary を含む MIZ ファイルを返す。
 */
const createSampleMizFile = async (): Promise<File> => {
  const lines = ['dictionary = {', '  ["DictKey_1"] = "Alpha source",', '  ["DictKey_2"] = "Bravo source",', '}'].join('\n');
  const archive = new JSZip();
  archive.file('l10n/DEFAULT/dictionary', lines);
  const buffer = await archive.generateAsync({ type: 'arraybuffer' });
  return new File([buffer], 'storybook-sample.miz', { type: 'application/zip' });
};

/**
 * @summary Storybook 用の壊れた MIZ ファイルを生成する。
 * @returns zip として読めない MIZ ファイルを返す。
 */
const createBrokenMizFile = (): File => {
  return new File(['not a zip'], 'storybook-broken.miz', { type: 'application/octet-stream' });
};

/**
 * @summary MIZ ファイル入力へ指定ファイルを投入する。
 * @param canvasElement Storybook canvas 要素を指定する。
 * @param file 投入する MIZ ファイルを指定する。
 */
const uploadMizFile = async (canvasElement: HTMLElement, file: File): Promise<void> => {
  const canvas = within(canvasElement);
  const input = await canvas.findByTestId('miz-file-input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('MIZ/TRK file input の取得に失敗した。');
  }

  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.upload(input, file);
};

/**
 * @summary MIZ ダイアログが開き、読込結果が表示されることを検証する。
 * @param canvasElement Storybook canvas 要素を指定する。
 * @param fileName 読み込んだファイル名を指定する。
 */
const expectMizDialogOpened = async (canvasElement: HTMLElement, fileName: string): Promise<void> => {
  const dialogScope = within(canvasElement.ownerDocument.body);

  await expect(await dialogScope.findByText('MIZ 翻訳')).toBeInTheDocument();
  await waitFor(async (): Promise<void> => {
    await expect(await dialogScope.findByTestId('miz-dialog-file-name')).toHaveTextContent(fileName);
  });
  await expect(await dialogScope.findByTestId('miz-dialog-information')).toBeInTheDocument();
  await expect(await dialogScope.findByTestId('miz-filter-count')).toHaveTextContent('表示 2 / 2 件');
};

/**
 * @summary MIZ 読込失敗時のエラー表示を検証する。
 * @param canvasElement Storybook canvas 要素を指定する。
 */
const expectMizLoadError = async (canvasElement: HTMLElement): Promise<void> => {
  const canvas = within(canvasElement);
  const dialogScope = within(canvasElement.ownerDocument.body);

  await expect(await canvas.findByTestId('miz-entry-error')).toHaveTextContent('エラーが発生しました。');
  await waitFor((): void => {
    expect(dialogScope.queryByText('MIZ 翻訳')).toBeNull();
  });
};

/**
 * @summary App の正常系初期表示を検証する。
 * @param canvasElement Storybook canvas 要素を指定する。
 */
const expectDefaultAppState = async (canvasElement: HTMLElement): Promise<void> => {
  const documentBody = canvasElement.ownerDocument.body;

  await waitFor((): void => {
    expect(documentBody.querySelector('#upload-area')).not.toBeNull();
    expect(documentBody.querySelector('#download-area')).not.toBeNull();
    expect(documentBody.textContent).toContain('DCS Translation Japanese');
    expect(documentBody.textContent).toContain('Download');
  });
};

/**
 * @summary App の空一覧状態を検証する。
 * @param canvasElement Storybook canvas 要素を指定する。
 */
const expectEmptyAppState = async (canvasElement: HTMLElement): Promise<void> => {
  const canvas = within(canvasElement);

  await waitFor(
    async (): Promise<void> => {
      await expect(await canvas.findByText('Download')).toBeInTheDocument();
      await expect(await canvas.findByText('表示できる項目がありません。')).toBeInTheDocument();
    },
    { timeout: 5_000 },
  );
};

const meta = {
  title: 'App/App',
  component: App,
  tags: ['autodocs'],
  parameters: createAppMswParameters(),
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await expectDefaultAppState(canvasElement);
  },
};

export const Empty: Story = {
  parameters: createAppMswParameters({ treeItems: [] }),
  play: async ({ canvasElement }): Promise<void> => {
    await expectEmptyAppState(canvasElement);
  },
};

export const MizTranslationFlow: Story = {
  parameters: createAppMswParameters(),
  play: async ({ canvasElement }): Promise<void> => {
    const mizFile = await createSampleMizFile();
    await uploadMizFile(canvasElement, mizFile);
    await expectMizDialogOpened(canvasElement, mizFile.name);
  },
};

export const MizTranslationLoadError: Story = {
  parameters: createAppMswParameters(),
  play: async ({ canvasElement }): Promise<void> => {
    await uploadMizFile(canvasElement, createBrokenMizFile());
    await expectMizLoadError(canvasElement);
  },
};

export const ApiUnavailable: Story = {
  parameters: createAppMswParameters({ healthOk: false }),
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText('エラーが発生しました。')).toBeInTheDocument();
    expect(canvas.queryByText('F-16C')).toBeNull();
  },
};
