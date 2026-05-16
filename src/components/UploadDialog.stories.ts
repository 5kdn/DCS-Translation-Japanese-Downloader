import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { CreatePrResponse } from '@/lib/client';
import type { TreeItem } from '@/types/type';
import UploadDialog from './UploadDialog.vue';

const meta = {
  title: 'Upload/UploadDialog',
  component: UploadDialog,
  tags: ['autodocs'],
  args: {
    onSubmit: async (): Promise<CreatePrResponse> => {
      return [];
    },
    treeItems: [] as TreeItem[],
  },
} satisfies Meta<typeof UploadDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ResultStepSuccess: Story = {
  args: {
    onSubmit: async (): Promise<CreatePrResponse> => {
      return [
        {
          prNumber: 123,
          prUrl: 'https://example.test/pr/123',
          branchName: 'feature/Aircraft/F-16C/AddFile--20260223-161501JST',
          commitSha: 'abc123',
          note: 'created',
        },
      ];
    },
  },
};

export const ResultStepFailure: Story = {
  args: {
    onSubmit: async (): Promise<CreatePrResponse> => {
      throw new Error('API呼び出しに失敗しました。');
    },
  },
};

export const ExistingReadmeForUserCampaign: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md')],
  },
};

export const ExistingReadmeToCreateFlow: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md')],
  },
};

export const GeneratedReadmeIsSubmitted: Story = {
  args: {
    onSubmit: async (payload): Promise<CreatePrResponse> => {
      const hasReadme = payload.selectedFiles.some(
        (selectedFile): boolean => selectedFile.path === 'UserMissions/Campaigns/Sample Campaign/README_Translation.md',
      );
      if (!hasReadme) {
        throw new Error('README_Translation.md が送信対象に含まれていません。');
      }
      return [{ prNumber: 456 }];
    },
  },
};

export const ExistingReadmeWithoutChangesIsNotSubmitted: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md')],
    onSubmit: async (payload): Promise<CreatePrResponse> => {
      const hasReadme = payload.selectedFiles.some(
        (selectedFile): boolean => selectedFile.path === 'UserMissions/Campaigns/Sample Campaign/README_Translation.md',
      );
      if (hasReadme) {
        throw new Error('未変更の README_Translation.md が送信対象に含まれています。');
      }
      return [{ prNumber: 457 }];
    },
  },
};

export const ExistingReadmeContinueWithoutChangesIsNotSubmitted: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md')],
    onSubmit: async (payload): Promise<CreatePrResponse> => {
      const hasReadme = payload.selectedFiles.some(
        (selectedFile): boolean => selectedFile.path === 'UserMissions/Campaigns/Sample Campaign/README_Translation.md',
      );
      if (hasReadme) {
        throw new Error('変更無し導線で README_Translation.md が送信対象に含まれています。');
      }
      return [{ prNumber: 460 }];
    },
  },
};

export const ExistingReadmeWhitespaceOnlyChangeIsNotSubmitted: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md')],
    onSubmit: async (payload): Promise<CreatePrResponse> => {
      const hasReadme = payload.selectedFiles.some(
        (selectedFile): boolean => selectedFile.path === 'UserMissions/Campaigns/Sample Campaign/README_Translation.md',
      );
      if (hasReadme) {
        throw new Error('空白差分だけの README_Translation.md が送信対象に含まれています。');
      }
      return [{ prNumber: 458 }];
    },
  },
};

export const ExistingReadmeWithChangesIsSubmitted: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md')],
    onSubmit: async (payload): Promise<CreatePrResponse> => {
      const hasReadme = payload.selectedFiles.some(
        (selectedFile): boolean => selectedFile.path === 'UserMissions/Campaigns/Sample Campaign/README_Translation.md',
      );
      if (!hasReadme) {
        throw new Error('変更済みの README_Translation.md が送信対象に含まれていません。');
      }
      return [{ prNumber: 459 }];
    },
  },
};

export const ExistingReadmeForUserMission: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Sample/README_Translation.md')],
    onSubmit: async (payload): Promise<CreatePrResponse> => {
      const hasReadme = payload.selectedFiles.some(
        (selectedFile): boolean => selectedFile.path === 'UserMissions/Sample/README_Translation.md',
      );
      if (!hasReadme) {
        throw new Error('User Mission の README_Translation.md が送信対象に含まれていません。');
      }
      return [{ prNumber: 461 }];
    },
  },
};

function createTreeItem(path: string): TreeItem {
  return {
    path,
    type: 'blob',
    mode: undefined,
    url: undefined,
    sha: undefined,
    size: undefined,
    updatedAt: undefined,
  };
}
