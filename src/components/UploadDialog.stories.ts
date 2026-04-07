import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { CreatePrResponse } from '@/lib/client';
import UploadDialog from './UploadDialog.vue';

const meta = {
  title: 'Upload/UploadDialog',
  component: UploadDialog,
  tags: ['autodocs'],
  args: {
    onSubmit: async (): Promise<CreatePrResponse> => {
      return [];
    },
  },
  render: (args) => ({
    components: { UploadDialog },
    setup: () => ({ args }),
    template: '<UploadDialog v-bind="args" />',
  }),
} satisfies Meta<typeof UploadDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('フォルダーをドロップする')).toBeInTheDocument();
    await expect(await canvas.findByRole('button', { name: 'フォルダーを選択' })).toBeInTheDocument();
  },
};

export const FolderSelected: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createAircraftFolderFiles());

    const dialog = within(canvasElement.ownerDocument.body);
    await expect(await dialog.findByText('対象の種類: Aircraft')).toBeInTheDocument();
  },
};

export const FileSelectedFromInput: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, [new File(['briefing'], 'briefing.txt', { type: 'text/plain' })], {
      expectsError: true,
    });

    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/ファイルを直接選択することはできません。/)).toBeInTheDocument();
    await expect(canvas.getByText(/翻訳ファイルを含むフォルダーを選択してください。/)).toBeInTheDocument();
    await expect(canvas.getByText(/以下のフォルダー構成を満たすように見直してから再度選択してください。/)).toBeInTheDocument();
    await expect(canvas.getByText(/- 機体の場合: DCSWorld\/Mods\/aircraft\//)).toBeInTheDocument();
  },
};

export const InvalidRootFolder: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createAircraftFolderFiles('sample-root/'), { expectsError: true });

    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/選択されたルートフォルダーが許可されていません/)).toBeInTheDocument();
  },
};

export const PdfFileIncluded: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(
      canvasElement,
      [
        ...createAircraftFolderFiles(),
        createRelativeFile('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/manual.pdf', 'pdf', 'application/pdf'),
      ],
      { expectsError: true },
    );

    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.textContent).toContain('現在PDFはアップロードすることができません。');
    await expect(alert.textContent).toContain(
      'PDF、画像、音声、映像ファイルはアップロードできません。(DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/manual.pdf)',
    );
    await expect(alert.textContent).toContain('PDFを削除して再度アップロードを実行してください。');
  },
};

export const ImageFileIncluded: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(
      canvasElement,
      [...createUserMissionFolderFiles(), createRelativeFile('UserMissions/Sample/assets/preview.jpg', 'image', 'image/jpeg')],
      { expectsError: true },
    );

    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.textContent).toContain('現在画像ファイルはアップロードすることができません。');
    await expect(alert.textContent).toContain(
      'PDF、画像、音声、映像ファイルはアップロードできません。(UserMissions/Sample/assets/preview.jpg)',
    );
    await expect(alert.textContent).toContain('画像ファイルを削除して再度アップロードを実行してください。');
  },
};

export const AudioFileIncluded: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(
      canvasElement,
      [...createUserMissionFolderFiles(), createRelativeFile('UserMissions/Sample/assets/voice.mp3', 'audio', 'audio/mpeg')],
      { expectsError: true },
    );

    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.textContent).toContain('現在音声ファイルはアップロードすることができません。');
    await expect(alert.textContent).toContain(
      'PDF、画像、音声、映像ファイルはアップロードできません。(UserMissions/Sample/assets/voice.mp3)',
    );
    await expect(alert.textContent).toContain('音声ファイルを削除して再度アップロードを実行してください。');
  },
};

export const VideoFileIncluded: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(
      canvasElement,
      [...createUserMissionFolderFiles(), createRelativeFile('UserMissions/Sample/assets/movie.mp4', 'video', 'video/mp4')],
      { expectsError: true },
    );

    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.textContent).toContain('現在映像ファイルはアップロードすることができません。');
    await expect(alert.textContent).toContain(
      'PDF、画像、音声、映像ファイルはアップロードできません。(UserMissions/Sample/assets/movie.mp4)',
    );
    await expect(alert.textContent).toContain('映像ファイルを削除して再度アップロードを実行してください。');
  },
};

export const ConfirmStep: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createAircraftFolderFiles());

    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const overviewInput = canvasElement.ownerDocument.body.querySelector('[name="upload-overview"]') as HTMLInputElement | null;
    const changeDetailsInput = canvasElement.ownerDocument.body.querySelector(
      '[name="upload-change-details"]',
    ) as HTMLTextAreaElement | null;
    const notesInput = canvasElement.ownerDocument.body.querySelector('[name="upload-notes"]') as HTMLTextAreaElement | null;
    if (overviewInput === null || changeDetailsInput === null || notesInput === null) {
      throw new Error('説明入力欄の取得に失敗した。');
    }

    await user.click(dialog.getByLabelText('ファイルの追加'));
    await user.type(overviewInput, 'アップロード確認用の概要です。');
    await user.clear(changeDetailsInput);
    await user.type(changeDetailsInput, '- briefing.txt を更新');
    await user.clear(notesInput);
    await user.type(notesInput, 'N/A');
    await user.click(dialog.getByLabelText('アップロードするファイルに個人情報は含まれていません'));
    await user.click(dialog.getByLabelText(/流通制御ポリシー/));
    await user.click(dialog.getByRole('button', { name: '確認する' }));

    await expect(await dialog.findByText('ファイル一覧')).toBeInTheDocument();
    await expect(dialog.getByText('アップロード内容')).toBeInTheDocument();
    await expect(dialog.getAllByText('対象名: F-16C')[0]).toBeInTheDocument();
    await expect(dialog.getByText('[Aircraft][F-16C]ファイルの追加')).toBeInTheDocument();
    await expect(dialog.getByText('アップロード確認用の概要です。')).toBeInTheDocument();
    await expect(dialog.getByText('- briefing.txt を更新')).toBeInTheDocument();
    await expect(dialog.getByText('N/A')).toBeInTheDocument();
    await expect(dialog.getByText('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt')).toBeInTheDocument();
    await expect(dialog.queryByText('DCSWorld/Mods/aircraft/')).not.toBeInTheDocument();
  },
};

export const AutoDetectedTargetNameForAircraft: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createAircraftFolderFiles());

    const dialog = within(canvasElement.ownerDocument.body);
    await expect(dialog.getByText('対象の種類: Aircraft')).toBeInTheDocument();
    await expect(dialog.getByText('対象名: F-16C')).toBeInTheDocument();
    await expect(canvasElement.ownerDocument.body.querySelector('[name="upload-target-name"]')).toBeNull();
  },
};

export const AutoDetectedTargetNameForDlcCampaign: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createDlcCampaignFolderFiles());

    const dialog = within(canvasElement.ownerDocument.body);
    await expect(dialog.getByText('対象の種類: DLC Campaigns')).toBeInTheDocument();
    await expect(dialog.getByText('対象名: The Enemy Within')).toBeInTheDocument();
    await expect(canvasElement.ownerDocument.body.querySelector('[name="upload-target-name"]')).toBeNull();
  },
};

export const AutoDetectedTargetNameForUserMission: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createUserMissionFolderFiles());

    const dialog = within(canvasElement.ownerDocument.body);
    await expect(dialog.getByText('対象の種類: User Mission')).toBeInTheDocument();
    await expect(dialog.getByText('対象名: Sample')).toBeInTheDocument();
    await expect(canvasElement.ownerDocument.body.querySelector('[name="upload-target-name"]')).toBeNull();
  },
};

export const AutoDetectedTargetNameForUserCampaign: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createUserCampaignFolderFiles());

    const dialog = within(canvasElement.ownerDocument.body);
    await expect(dialog.getByText('対象の種類: User Campaign')).toBeInTheDocument();
    await expect(dialog.getByText('対象名: Sample Campaign')).toBeInTheDocument();
    await expect(canvasElement.ownerDocument.body.querySelector('[name="upload-target-name"]')).toBeNull();
  },
};

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
  play: async ({ canvasElement }): Promise<void> => {
    await moveToConfirmStep(canvasElement);

    const body = canvasElement.ownerDocument.body;
    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(dialog.getByRole('button', { name: 'アップロード' }));

    await expect(await dialog.findByRole('button', { name: '閉じる' })).toBeInTheDocument();
    await expect(body.textContent).toContain('PR #123 を作成しました。');
  },
};

export const ResultStepFailure: Story = {
  args: {
    onSubmit: async (): Promise<CreatePrResponse> => {
      throw new Error('API呼び出しに失敗しました。');
    },
  },
  play: async ({ canvasElement }): Promise<void> => {
    await moveToConfirmStep(canvasElement);

    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(dialog.getByRole('button', { name: 'アップロード' }));

    await expect(await dialog.findByRole('button', { name: '閉じる' })).toBeInTheDocument();
    const errorMessages = await dialog.findAllByText('エラーが発生しました。');
    await expect(errorMessages.length).toBeGreaterThan(0);
    await expect(await dialog.findByText('ステータス: 失敗')).toBeInTheDocument();
  },
};

export const InvalidFolderStructure: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createAircraftFolderFiles('sample-root/foo/'));

    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/選択されたフォルダーは適切な構造ではありません。/)).toBeInTheDocument();
    await expect(
      canvas.getByText(
        /選択されたルートフォルダーが許可されていません（sample-root\/foo\/DCSWorld\/Mods\/aircraft\/F-16C\/Missions\/QuickStart\/briefing.txt）。/,
      ),
    ).toBeInTheDocument();
  },
};

const uploadFolder = async (canvasElement: HTMLElement, files: File[], options?: { expectsError?: boolean }): Promise<void> => {
  const dialog = within(canvasElement.ownerDocument.body);
  const input = canvasElement.querySelector('input[webkitdirectory]') as HTMLInputElement | null;
  if (input === null) {
    throw new Error('フォルダー入力欄の取得に失敗した。');
  }

  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.upload(input, files);
  if (options?.expectsError === true) return;
  if (files[0]?.webkitRelativePath.startsWith('sample-root/foo/')) return;
  await expect(await dialog.findByText(/対象の種類:/)).toBeInTheDocument();
};

const moveToConfirmStep = async (canvasElement: HTMLElement): Promise<void> => {
  await uploadFolder(canvasElement, createAircraftFolderFiles());

  const dialog = within(canvasElement.ownerDocument.body);
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const overviewInput = canvasElement.ownerDocument.body.querySelector('[name="upload-overview"]') as HTMLInputElement | null;
  const changeDetailsInput = canvasElement.ownerDocument.body.querySelector(
    '[name="upload-change-details"]',
  ) as HTMLTextAreaElement | null;
  const notesInput = canvasElement.ownerDocument.body.querySelector('[name="upload-notes"]') as HTMLTextAreaElement | null;
  if (overviewInput === null || changeDetailsInput === null || notesInput === null) {
    throw new Error('説明入力欄の取得に失敗した。');
  }

  await user.click(dialog.getByLabelText('ファイルの追加'));
  await user.type(overviewInput, 'アップロード確認用の概要です。');
  await user.clear(changeDetailsInput);
  await user.type(changeDetailsInput, '- briefing.txt を更新');
  await user.clear(notesInput);
  await user.type(notesInput, 'N/A');
  await user.click(dialog.getByLabelText('アップロードするファイルに個人情報は含まれていません'));
  await user.click(dialog.getByLabelText(/流通制御ポリシー/));
  await user.click(dialog.getByRole('button', { name: '確認する' }));

  await expect(await dialog.findByText('ファイル一覧')).toBeInTheDocument();
};

const createAircraftFolderFiles = (prefix = ''): File[] => {
  return [createRelativeFile(`${prefix}DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt`, 'briefing')];
};

const createDlcCampaignFolderFiles = (prefix = ''): File[] => {
  return [
    createRelativeFile(`${prefix}DCSWorld/Mods/campaigns/The Enemy Within/mission_01.miz/l10n/JP/dictionary`, 'dictionary'),
  ];
};

const createUserMissionFolderFiles = (prefix = ''): File[] => {
  return [createRelativeFile(`${prefix}UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary`, 'dictionary')];
};

const createUserCampaignFolderFiles = (prefix = ''): File[] => {
  return [
    createRelativeFile(`${prefix}UserMissions/Campaigns/Sample Campaign/mission_01.miz/l10n/JP/dictionary`, 'dictionary'),
  ];
};

const createRelativeFile = (relativePath: string, content: string, type = 'text/plain'): File => {
  const fileName = relativePath.split('/').at(-1) ?? 'file.txt';
  const file = new File([content], fileName, { type });
  Object.defineProperty(file, 'webkitRelativePath', {
    configurable: true,
    value: relativePath,
  });
  return file;
};
