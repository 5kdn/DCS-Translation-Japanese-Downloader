import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { CreatePrResponse } from '@/lib/client';
import type { TreeItem } from '@/types/type';
import { installFetchMock } from '../../.storybook/fetchMock';
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
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await expect(await canvas.findByText('フォルダーをドロップする')).toBeInTheDocument();
    await expect(await canvas.findByRole('button', { name: 'フォルダーを選択' })).toBeInTheDocument();
    await expect(canvas.getByText('各項目をクリックすると構成例を表示します。')).toBeInTheDocument();
    const aircraftChipLabel = canvas.getByText('機体');
    await expect(aircraftChipLabel).toBeInTheDocument();

    await user.click(aircraftChipLabel);

    const dialog = within(canvasElement.ownerDocument.body);
    const tree = await dialog.findByRole('tree');
    const treeContent = within(tree);
    await expect(treeContent.getByText('DCSWorld')).toBeInTheDocument();
    await expect(treeContent.getByText('Mods')).toBeInTheDocument();
    await expect(treeContent.getByText('aircraft')).toBeInTheDocument();
    await expect(treeContent.getByText('Su-25T')).toBeInTheDocument();
  },
};

export const FolderSelected: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createAircraftFolderFiles());

    const dialog = within(canvasElement.ownerDocument.body);
    await expect(await dialog.findByText('対象の種類: Aircraft')).toBeInTheDocument();
    await expect(dialog.queryByRole('button', { name: '戻る' })).toBeNull();
    expectStepperState(canvasElement.ownerDocument.body, ['説明入力', '確認', '送信結果'], '説明入力');
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
    await expect(dialog.getByRole('button', { name: '戻る' })).toBeInTheDocument();
    await expect(dialog.getByText('アップロード内容')).toBeInTheDocument();
    expectStepperState(canvasElement.ownerDocument.body, ['説明入力', '確認', '送信結果'], '確認');
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
    await uploadFolder(canvasElement, createUserMissionFolderFiles({ includeReadme: true }));

    const dialog = within(canvasElement.ownerDocument.body);
    await expect(dialog.getByText('対象の種類: User Mission')).toBeInTheDocument();
    await expect(dialog.getByText('対象名: Sample')).toBeInTheDocument();
    await expect(canvasElement.ownerDocument.body.querySelector('[name="upload-target-name"]')).toBeNull();
  },
};

export const AutoDetectedTargetNameForUserCampaign: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createUserCampaignFolderFiles({ includeReadme: true }));

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
    await expect(dialog.queryByRole('button', { name: '戻る' })).toBeNull();
    await expect(body.textContent).toContain('PR #123 を作成しました。');
    expectStepperState(body, ['説明入力', '確認', '送信結果'], '送信結果');
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

export const ExistingReadmeForUserCampaign: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md')],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const fetchMock = mockReadmeFetch('# Existing README\n\nCurrent content.');
    try {
      await uploadFolder(canvasElement, createUserCampaignFolderFiles(), { waitForTargetText: false });
      const dialog = within(canvasElement.ownerDocument.body);
      await expect(await dialog.findByText('README確認', { selector: '.font-weight-medium' })).toBeInTheDocument();
      await expect(dialog.queryByRole('button', { name: '戻る' })).toBeNull();
      await expect(dialog.getByRole('button', { name: '修正する' })).toBeInTheDocument();
      await expect(dialog.getByRole('button', { name: '変更無し' })).toBeInTheDocument();
      expectStepperState(canvasElement.ownerDocument.body, ['README確認', '説明入力', '確認', '送信結果'], 'README確認');
    } finally {
      fetchMock.restore();
    }
  },
};

export const ExistingReadmeFetchFailureFallback: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md')],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const fetchMock = mockReadmeFetchFailure();
    try {
      await uploadFolder(canvasElement, createUserCampaignFolderFiles(), { waitForTargetText: false });
      const dialog = within(canvasElement.ownerDocument.body);
      await expect(await dialog.findByRole('textbox', { name: 'README_Translation.md' })).toBeInTheDocument();
      await expect(
        dialog.getByText('README_Translation.md の取得に失敗したため、テンプレートを表示しています。'),
      ).toBeInTheDocument();
      await expect(dialog.getByText('テンプレートを編集し、README_Translation.md を作成してください。')).toBeInTheDocument();
      await expect(dialog.queryByRole('button', { name: '変更無し' })).toBeNull();
      expectStepperState(canvasElement.ownerDocument.body, ['README確認', '説明入力', '確認', '送信結果'], 'README確認');
    } finally {
      fetchMock.restore();
    }
  },
};

export const CreateReadmeForUserCampaign: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createUserCampaignFolderFiles(), { waitForTargetText: false });
    const dialog = within(canvasElement.ownerDocument.body);
    await expect(await dialog.findByRole('textbox', { name: 'README_Translation.md' })).toBeInTheDocument();
    await expect(dialog.getByText('テンプレートを編集し、README_Translation.md を作成してください。')).toBeInTheDocument();
    const resetButton = dialog.getByRole('button', { name: 'リセット' });
    const helperActions = resetButton.parentElement;
    if (helperActions === null) {
      throw new Error('README 補助操作領域の取得に失敗した。');
    }
    await expect(within(helperActions).queryByRole('button', { name: '次へ' })).toBeNull();
    await expect(dialog.getByRole('button', { name: '次へ' })).toBeDisabled();
  },
};

export const ExistingReadmeToCreateFlow: Story = {
  args: {
    treeItems: [createTreeItem('UserMissions/Campaigns/Sample Campaign/README_Translation.md')],
  },
  play: async ({ canvasElement }): Promise<void> => {
    const fetchMock = mockReadmeFetch('# Existing README\n\nCurrent content.');
    try {
      await uploadFolder(canvasElement, createUserCampaignFolderFiles(), { waitForTargetText: false });
      const dialog = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(await dialog.findByRole('button', { name: '修正する' }));
      const readmeInput = await dialog.findByRole('textbox', { name: 'README_Translation.md' });
      await expect(readmeInput).toHaveValue('# Existing README\n\nCurrent content.');
      await expect(dialog.getByText('既存の README_Translation.md を必要に応じて修正してください。')).toBeInTheDocument();
      await expect(dialog.getByRole('button', { name: '次へ' })).toBeEnabled();
      await expect(dialog.queryByRole('button', { name: '戻る' })).toBeNull();
      await user.click(dialog.getByRole('button', { name: '次へ' }));
      await expect(await dialog.findByText('対象の種類: User Campaign')).toBeInTheDocument();
      expectStepperState(canvasElement.ownerDocument.body, ['README確認', '説明入力', '確認', '送信結果'], '説明入力');
      await expect(dialog.getByRole('button', { name: '戻る' })).toBeInTheDocument();
      await user.click(dialog.getByRole('button', { name: '戻る' }));
      await expect(await dialog.findByText('README確認', { selector: '.font-weight-medium' })).toBeInTheDocument();
      expectStepperState(canvasElement.ownerDocument.body, ['README確認', '説明入力', '確認', '送信結果'], 'README確認');
    } finally {
      fetchMock.restore();
    }
  },
};

export const SkipReadmeStepWhenUploaded: Story = {
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createUserCampaignFolderFiles({ includeReadme: true }));
    const dialog = within(canvasElement.ownerDocument.body);
    await expect(await dialog.findByText('対象の種類: User Campaign')).toBeInTheDocument();
    await expect(dialog.queryByText('README確認')).toBeNull();
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
  play: async ({ canvasElement }): Promise<void> => {
    await uploadFolder(canvasElement, createUserCampaignFolderFiles(), { waitForTargetText: false });

    const dialog = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const readmeInput = await dialog.findByRole('textbox', { name: 'README_Translation.md' });
    await user.type(
      readmeInput,
      '\nOriginal source: Example mission pack.\nTranslator notes: This is long enough for validation.',
    );
    const { overviewInput, changeDetailsInput, notesInput } = await moveToDescriptionStepFromReadme(dialog, user);

    await user.click(dialog.getByLabelText('ファイルの追加'));
    await user.type(overviewInput, 'README 生成付きのアップロードです。');
    await user.clear(changeDetailsInput);
    await user.type(changeDetailsInput, '- README_Translation.md を追加');
    await user.clear(notesInput);
    await user.type(notesInput, 'N/A');
    await user.click(dialog.getByLabelText('アップロードするファイルに個人情報は含まれていません'));
    await user.click(dialog.getByLabelText(/流通制御ポリシー/));
    await user.click(dialog.getByRole('button', { name: '確認する' }));
    await user.click(await dialog.findByRole('button', { name: 'アップロード' }));

    const successMessages = await dialog.findAllByText('PR #456 を作成しました。');
    await expect(successMessages.length).toBeGreaterThan(0);
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
  play: async ({ canvasElement }): Promise<void> => {
    const fetchMock = mockReadmeFetch('# Existing README\n\nCurrent content.');
    try {
      await uploadFolder(canvasElement, createUserCampaignFolderFiles(), { waitForTargetText: false });

      const dialog = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(await dialog.findByRole('button', { name: '修正する' }));
      const { overviewInput, changeDetailsInput, notesInput } = await moveToDescriptionStepFromReadme(dialog, user);

      await user.click(dialog.getByLabelText('ファイルの追加'));
      await user.type(overviewInput, '既存 README を未変更のまま送信するケースです。');
      await user.clear(changeDetailsInput);
      await user.type(changeDetailsInput, '- dictionary を更新');
      await user.clear(notesInput);
      await user.type(notesInput, 'N/A');
      await user.click(dialog.getByLabelText('アップロードするファイルに個人情報は含まれていません'));
      await user.click(dialog.getByLabelText(/流通制御ポリシー/));
      await user.click(dialog.getByRole('button', { name: '確認する' }));
      await expect(dialog.queryByText('UserMissions/Campaigns/Sample Campaign/README_Translation.md')).toBeNull();
      await user.click(await dialog.findByRole('button', { name: 'アップロード' }));

      const successMessages = await dialog.findAllByText('PR #457 を作成しました。');
      await expect(successMessages.length).toBeGreaterThan(0);
    } finally {
      fetchMock.restore();
    }
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
  play: async ({ canvasElement }): Promise<void> => {
    const fetchMock = mockReadmeFetch('# Existing README\n\nCurrent content.');
    try {
      await uploadFolder(canvasElement, createUserCampaignFolderFiles(), { waitForTargetText: false });

      const dialog = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(await dialog.findByRole('button', { name: '変更無し' }));
      const { overviewInput, changeDetailsInput, notesInput } = await waitForDescriptionStep(dialog);

      await user.click(dialog.getByLabelText('ファイルの追加'));
      await user.type(overviewInput, '既存 README の変更無し導線を確認するケースです。');
      await user.clear(changeDetailsInput);
      await user.type(changeDetailsInput, '- dictionary を更新');
      await user.clear(notesInput);
      await user.type(notesInput, 'N/A');
      await user.click(dialog.getByLabelText('アップロードするファイルに個人情報は含まれていません'));
      await user.click(dialog.getByLabelText(/流通制御ポリシー/));
      await user.click(dialog.getByRole('button', { name: '確認する' }));
      await expect(dialog.queryByText('UserMissions/Campaigns/Sample Campaign/README_Translation.md')).toBeNull();
      await user.click(await dialog.findByRole('button', { name: 'アップロード' }));

      const successMessages = await dialog.findAllByText('PR #460 を作成しました。');
      await expect(successMessages.length).toBeGreaterThan(0);
    } finally {
      fetchMock.restore();
    }
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
  play: async ({ canvasElement }): Promise<void> => {
    const fetchMock = mockReadmeFetch('# Existing README\n\nCurrent content.');
    try {
      await uploadFolder(canvasElement, createUserCampaignFolderFiles(), { waitForTargetText: false });

      const dialog = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(await dialog.findByRole('button', { name: '修正する' }));
      const readmeInput = await dialog.findByRole('textbox', { name: 'README_Translation.md' });
      await user.type(readmeInput, ' \n');
      const { overviewInput, changeDetailsInput, notesInput } = await moveToDescriptionStepFromReadme(dialog, user);

      await user.click(dialog.getByLabelText('ファイルの追加'));
      await user.type(overviewInput, '既存 README に空白差分だけを加えたケースです。');
      await user.clear(changeDetailsInput);
      await user.type(changeDetailsInput, '- dictionary を更新');
      await user.clear(notesInput);
      await user.type(notesInput, 'N/A');
      await user.click(dialog.getByLabelText('アップロードするファイルに個人情報は含まれていません'));
      await user.click(dialog.getByLabelText(/流通制御ポリシー/));
      await user.click(dialog.getByRole('button', { name: '確認する' }));
      await expect(dialog.queryByText('UserMissions/Campaigns/Sample Campaign/README_Translation.md')).toBeNull();
      await user.click(await dialog.findByRole('button', { name: 'アップロード' }));

      const successMessages = await dialog.findAllByText('PR #458 を作成しました。');
      await expect(successMessages.length).toBeGreaterThan(0);
    } finally {
      fetchMock.restore();
    }
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
  play: async ({ canvasElement }): Promise<void> => {
    const fetchMock = mockReadmeFetch('# Existing README\n\nCurrent content.');
    try {
      await uploadFolder(canvasElement, createUserCampaignFolderFiles(), { waitForTargetText: false });

      const dialog = within(canvasElement.ownerDocument.body);
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(await dialog.findByRole('button', { name: '修正する' }));
      const readmeInput = await dialog.findByRole('textbox', { name: 'README_Translation.md' });
      await user.type(readmeInput, '\nTranslator note: updated.');
      const { overviewInput, changeDetailsInput, notesInput } = await moveToDescriptionStepFromReadme(dialog, user);

      await user.click(dialog.getByLabelText('ファイルの追加'));
      await user.type(overviewInput, '既存 README を修正して送信するケースです。');
      await user.clear(changeDetailsInput);
      await user.type(changeDetailsInput, '- README_Translation.md を更新');
      await user.clear(notesInput);
      await user.type(notesInput, 'N/A');
      await user.click(dialog.getByLabelText('アップロードするファイルに個人情報は含まれていません'));
      await user.click(dialog.getByLabelText(/流通制御ポリシー/));
      await user.click(dialog.getByRole('button', { name: '確認する' }));
      await expect(await dialog.findByText('UserMissions/Campaigns/Sample Campaign/README_Translation.md')).toBeInTheDocument();
      await user.click(await dialog.findByRole('button', { name: 'アップロード' }));

      const successMessages = await dialog.findAllByText('PR #459 を作成しました。');
      await expect(successMessages.length).toBeGreaterThan(0);
    } finally {
      fetchMock.restore();
    }
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
  play: async ({ canvasElement }): Promise<void> => {
    const fetchMock = mockReadmeFetch('# Existing Mission README\n\nCurrent mission content.');
    try {
      await uploadFolder(canvasElement, createUserMissionFolderFiles(), { waitForTargetText: false });

      const dialog = within(canvasElement.ownerDocument.body);
      await expect(await dialog.findByText('リポジトリに既存の README_Translation.md があります。')).toBeInTheDocument();

      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(await dialog.findByRole('button', { name: '修正する' }));
      const readmeInput = await dialog.findByRole('textbox', { name: 'README_Translation.md' });
      await expect(readmeInput).toHaveValue('# Existing Mission README\n\nCurrent mission content.');
      await user.type(readmeInput, '\nTranslator note: mission updated.');
      const { overviewInput, changeDetailsInput, notesInput } = await moveToDescriptionStepFromReadme(dialog, user);

      await user.click(dialog.getByLabelText('ファイルの追加'));
      await user.type(overviewInput, 'User Mission の既存 README を修正して送信するケースです。');
      await user.clear(changeDetailsInput);
      await user.type(changeDetailsInput, '- README_Translation.md を更新');
      await user.clear(notesInput);
      await user.type(notesInput, 'N/A');
      await user.click(dialog.getByLabelText('アップロードするファイルに個人情報は含まれていません'));
      await user.click(dialog.getByLabelText(/流通制御ポリシー/));
      await user.click(dialog.getByRole('button', { name: '確認する' }));
      await expect(await dialog.findByText('UserMissions/Sample/README_Translation.md')).toBeInTheDocument();
      await user.click(await dialog.findByRole('button', { name: 'アップロード' }));

      const successMessages = await dialog.findAllByText('PR #461 を作成しました。');
      await expect(successMessages.length).toBeGreaterThan(0);
    } finally {
      fetchMock.restore();
    }
  },
};

const uploadFolder = async (
  canvasElement: HTMLElement,
  files: File[],
  options?: { expectsError?: boolean; waitForTargetText?: boolean },
): Promise<void> => {
  const dialog = within(canvasElement.ownerDocument.body);
  const input = canvasElement.querySelector('input[webkitdirectory]') as HTMLInputElement | null;
  if (input === null) {
    throw new Error('フォルダー入力欄の取得に失敗した。');
  }

  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.upload(input, files);
  if (options?.expectsError === true) return;
  if (files[0]?.webkitRelativePath.startsWith('sample-root/foo/')) return;
  if (options?.waitForTargetText === false) return;
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

const moveToDescriptionStepFromReadme = async (
  dialog: ReturnType<typeof within>,
  user: ReturnType<typeof userEvent.setup>,
  body: HTMLElement = document.body,
): Promise<{
  overviewInput: HTMLInputElement;
  changeDetailsInput: HTMLTextAreaElement;
  notesInput: HTMLTextAreaElement;
}> => {
  await user.click(dialog.getByRole('button', { name: '次へ' }));
  return waitForDescriptionStep(dialog, body);
};

const waitForDescriptionStep = async (
  dialog: ReturnType<typeof within>,
  body: HTMLElement = document.body,
): Promise<{
  overviewInput: HTMLInputElement;
  changeDetailsInput: HTMLTextAreaElement;
  notesInput: HTMLTextAreaElement;
}> => {
  await expect(await dialog.findByText(/対象の種類:/)).toBeInTheDocument();
  const overviewInput = body.querySelector('[name="upload-overview"]');
  const changeDetailsInput = body.querySelector('[name="upload-change-details"]');
  const notesInput = body.querySelector('[name="upload-notes"]');

  if (
    !(overviewInput instanceof HTMLInputElement) ||
    !(changeDetailsInput instanceof HTMLTextAreaElement) ||
    !(notesInput instanceof HTMLTextAreaElement)
  ) {
    throw new Error('説明入力欄の取得に失敗した。');
  }

  return { overviewInput, changeDetailsInput, notesInput };
};

const expectStepperState = (root: HTMLElement, expectedLabels: string[], currentLabel: string): void => {
  const stepper = root.querySelector('.v-stepper');
  if (!(stepper instanceof HTMLElement)) {
    throw new Error('進捗表示の取得に失敗した。');
  }

  const stepTitles = Array.from(stepper.querySelectorAll('.v-stepper-item__title')).map(
    (element) => element.textContent?.trim() ?? '',
  );
  expect(stepTitles).toEqual(expectedLabels);

  const selectedStep =
    stepper.querySelector('[aria-current="step"] .v-stepper-item__title') ??
    stepper.querySelector('.v-stepper-item--selected .v-stepper-item__title') ??
    stepper.querySelector('.v-stepper-item--active .v-stepper-item__title');
  if (!(selectedStep instanceof HTMLElement)) {
    throw new Error('現在の進捗ステップの取得に失敗した。');
  }
  expect(selectedStep.textContent?.trim()).toBe(currentLabel);
};

const createAircraftFolderFiles = (prefix = ''): File[] => {
  return [createRelativeFile(`${prefix}DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt`, 'briefing')];
};

const createDlcCampaignFolderFiles = (prefix = ''): File[] => {
  return [
    createRelativeFile(`${prefix}DCSWorld/Mods/campaigns/The Enemy Within/mission_01.miz/l10n/JP/dictionary`, 'dictionary'),
  ];
};

const createUserMissionFolderFiles = (options?: { prefix?: string; includeReadme?: boolean }): File[] => {
  const prefix = options?.prefix ?? '';
  const files = [createRelativeFile(`${prefix}UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary`, 'dictionary')];
  if (options?.includeReadme === true) {
    files.push(createRelativeFile(`${prefix}UserMissions/Sample/README_Translation.md`, '# README'));
  }
  return files;
};

const createUserCampaignFolderFiles = (options?: { prefix?: string; includeReadme?: boolean }): File[] => {
  const prefix = options?.prefix ?? '';
  const files = [
    createRelativeFile(`${prefix}UserMissions/Campaigns/Sample Campaign/mission_01.miz/l10n/JP/dictionary`, 'dictionary'),
  ];
  if (options?.includeReadme === true) {
    files.push(createRelativeFile(`${prefix}UserMissions/Campaigns/Sample Campaign/README_Translation.md`, '# README'));
  }
  return files;
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

const mockReadmeFetch = (body: string): { restore: () => void } => {
  return installFetchMock({
    match: (request): boolean =>
      request.method === 'GET' &&
      request.url.includes('README_Translation.md') &&
      request.url.includes('raw.githubusercontent.com/'),
    handle: async (): Promise<Response> => new Response(body, { status: 200 }),
  });
};

const mockReadmeFetchFailure = (): { restore: () => void } => {
  return installFetchMock({
    match: (request): boolean =>
      request.method === 'GET' &&
      request.url.includes('README_Translation.md') &&
      request.url.includes('raw.githubusercontent.com/'),
    handle: async (): Promise<Response> => new Response('failed', { status: 500, statusText: 'Internal Server Error' }),
  });
};
