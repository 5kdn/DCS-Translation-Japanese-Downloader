import { describe, expect, it } from 'vitest';
import { useUploadDialogState } from '@/composables/useUploadDialogState';
import type { UploadDialogEntry } from '@/features/upload/uploadDialogDomain';

describe('useUploadDialogState', () => {
  it('生成READMEを差し替えたときにフォルダーサイズを再計算する', () => {
    const state = useUploadDialogState();
    const existingEntry: UploadDialogEntry = {
      path: 'UserMissions/Campaigns/Sample Campaign/mission_01.miz/l10n/JP/dictionary',
      isDirectory: false,
    };
    const existingFile = new File(['dictionary'], 'dictionary', { type: 'text/plain' });

    state.applySelectedUpload({
      folderName: 'UserMissions',
      totalSize: existingFile.size,
      entries: [existingEntry],
      fileEntries: [existingEntry],
      selectedFiles: [{ path: existingEntry.path, file: existingFile }],
      fileCount: 1,
      targetType: 'User Campaign',
      targetName: 'Sample Campaign',
    });

    const readmePath = 'UserMissions/Campaigns/Sample Campaign/README_Translation.md';
    const firstContent = 'first readme';
    const secondContent = 'second readme content is longer';

    state.appendGeneratedReadmeFile(readmePath, firstContent);
    const firstReadmeSize = new File([firstContent], 'README_Translation.md', { type: 'text/markdown' }).size;
    expect(state.selectedFolderSize.value).toBe(existingFile.size + firstReadmeSize);

    state.appendGeneratedReadmeFile(readmePath, secondContent);
    const secondReadmeSize = new File([secondContent], 'README_Translation.md', { type: 'text/markdown' }).size;
    expect(state.selectedFolderSize.value).toBe(existingFile.size + secondReadmeSize);

    state.removeGeneratedReadmeFile(readmePath);
    expect(state.selectedFolderSize.value).toBe(existingFile.size);
  });
});
