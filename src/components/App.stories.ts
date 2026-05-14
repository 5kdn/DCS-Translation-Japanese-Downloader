import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import { onUnmounted } from 'vue';
import App from '@/App.vue';
import type { TreeItem } from '@/types/type';
import { createJsonResponse, installFetchMock } from '../../.storybook/fetchMock';

const createTreeItem = (path: string, updatedAt: string): TreeItem => {
  return {
    path,
    type: 'blob',
    mode: '100644',
    url: `https://example.test/${encodeURIComponent(path)}`,
    sha: path,
    size: 1,
    updatedAt: new Date(updatedAt),
  };
};

const defaultTreeItems: TreeItem[] = [
  createTreeItem('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/Cold Start.miz/l10n/JP/dictionary', '2026-05-10T00:00:00Z'),
  createTreeItem('UserMissions/Campaigns/Operation Black Knight/README_Translation.md', '2026-05-12T00:00:00Z'),
];

type AppStoryOptions = {
  healthOk?: boolean;
  treeItems?: TreeItem[];
};

/**
 * @summary App 用の HTTP モックを設定した render 定義を生成する。
 * @param options Storybook 表示向けの固定応答を指定する。
 * @returns Storybook render 関数を返す。
 */
const createAppRender = (options?: AppStoryOptions) => {
  return () => ({
    components: { App },
    setup: () => {
      const installed = installFetchMock({
        match: (request): boolean => {
          return request.url.startsWith(import.meta.env.VITE_API_BASE_URL);
        },
        handle: async (request): Promise<Response> => {
          if (request.method === 'GET' && request.url.endsWith('/health')) {
            return createJsonResponse(
              {
                status: options?.healthOk === false ? 'ng' : 'ok',
                timestamp: '2026-05-15T00:00:00.000Z',
              },
              { status: 200 },
            );
          }

          if (request.method === 'GET' && request.url.endsWith('/tree')) {
            return createJsonResponse(
              {
                success: true,
                message: 'ok',
                data: (options?.treeItems ?? defaultTreeItems).map((item) => {
                  return {
                    path: item.path,
                    type: item.type,
                    mode: item.mode,
                    url: item.url,
                    sha: item.sha,
                    size: item.size,
                    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
                  };
                }),
              },
              { status: 200 },
            );
          }

          if (request.method === 'POST' && request.url.includes('/issue/list')) {
            return createJsonResponse(
              {
                success: true,
                message: 'ok',
                data: [],
              },
              { status: 200 },
            );
          }

          return new Response('Not Found', { status: 404, statusText: 'Not Found' });
        },
      });

      onUnmounted((): void => {
        installed.restore();
      });

      return {};
    },
    template: '<App />',
  });
};

const meta = {
  title: 'App/App',
  component: App,
  tags: ['autodocs'],
  render: createAppRender(),
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole('heading', { name: 'DCS Translation Japanese' })).toBeInTheDocument();
    await expect(await canvas.findByText('F-16C')).toBeInTheDocument();
    await expect(
      await canvas.findByText('翻訳データをmizファイルに追加までを自動化するWindowsデスクトップアプリがダウンロード可能です。'),
    ).toBeInTheDocument();
    await expect(canvas.queryByText('API サーバーが稼働していません')).toBeNull();
  },
};

export const Empty: Story = {
  render: createAppRender({ treeItems: [] }),
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole('heading', { name: 'DCS Translation Japanese' })).toBeInTheDocument();
    await expect(await canvas.findByText('表示できる項目がありません。')).toBeInTheDocument();
  },
};
