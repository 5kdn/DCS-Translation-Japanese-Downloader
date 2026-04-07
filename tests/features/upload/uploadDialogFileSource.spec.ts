import { describe, expect, it } from 'vitest';
import { UploadDialogError } from '@/features/upload/uploadDialogDomain';
import { collectFilesFromDroppedFolder } from '@/features/upload/uploadDialogFileSource';

describe('uploadDialogFileSource', () => {
  it('webkitGetAsEntry が null の場合はブラウザ非対応エラーにする', async () => {
    const dataTransfer = {
      items: [
        {
          kind: 'file',
          webkitGetAsEntry: () => null,
        },
      ],
    } as unknown as DataTransfer;

    await expect(collectFilesFromDroppedFolder(dataTransfer)).rejects.toThrowError(UploadDialogError);
    await expect(collectFilesFromDroppedFolder(dataTransfer)).rejects.toThrow(/ドラッグ&ドロップに対応していません/);
  });

  it('ルート複数ドロップ時はエラーにする', async () => {
    const dataTransfer = {
      items: [
        {
          kind: 'file',
          webkitGetAsEntry: () => ({ isDirectory: true, isFile: false, name: 'A' }),
        },
        {
          kind: 'file',
          webkitGetAsEntry: () => ({ isDirectory: true, isFile: false, name: 'B' }),
        },
      ],
    } as unknown as DataTransfer;

    await expect(collectFilesFromDroppedFolder(dataTransfer)).rejects.toThrow(/ルートフォルダーは 1 つだけです/);
  });

  it('許可されていないルートフォルダー名はエラーにする', async () => {
    const dataTransfer = {
      items: [
        {
          kind: 'file',
          webkitGetAsEntry: () => ({ isDirectory: true, isFile: false, name: 'sample-root' }),
        },
      ],
    } as unknown as DataTransfer;

    await expect(collectFilesFromDroppedFolder(dataTransfer)).rejects.toThrow(/"DCSWorld" または "UserMissions" のみです/);
  });

  it('ファイル直接ドロップ時はファイル選択エラーにする', async () => {
    const dataTransfer = {
      items: [
        {
          kind: 'file',
          webkitGetAsEntry: () => ({ isDirectory: false, isFile: true, name: 'briefing.txt' }),
        },
      ],
    } as unknown as DataTransfer;

    await expect(collectFilesFromDroppedFolder(dataTransfer)).rejects.toThrow(/ファイルを直接選択することはできません/);
  });
});
