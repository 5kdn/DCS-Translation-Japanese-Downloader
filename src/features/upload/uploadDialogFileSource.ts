import {
  buildFileSelectionErrorMessage,
  buildFolderSelectionErrorMessage,
  normalizePath,
  UploadDialogError,
} from '@/features/upload/uploadDialogDomain';

type FileSystemEntryWithWebkit = FileSystemEntry & {
  readonly fullPath?: string;
};

type FileSystemFileEntryWithWebkit = FileSystemFileEntry & {
  readonly fullPath?: string;
};

type FileSystemDirectoryEntryWithWebkit = FileSystemDirectoryEntry & {
  readonly fullPath?: string;
};

type DataTransferItemWithWebkitEntry = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntryWithWebkit | null;
};

export type DroppedFolderFiles = {
  folderName: string;
  files: File[];
  totalSize: number;
};

const ALLOWED_ROOT_DIRECTORY_NAMES = ['DCSWorld', 'UserMissions'] as const;

/**
 * @summary FileSystemFileEntry から File を取得する。
 * @param fileEntry 対象ファイルエントリを指定する。
 * @returns Promise<File> を返す。
 */
export const readFileFromEntry = async (fileEntry: FileSystemFileEntryWithWebkit): Promise<File> => {
  return await new Promise<File>((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
};

/**
 * @summary DataTransfer のディレクトリエントリを再帰走査してファイル一覧を収集する。
 * @param directoryEntry 走査対象ディレクトリエントリを指定する。
 * @param rootName ルートフォルダー名を指定する。
 * @param rootPath ルートフォルダーのフルパスを指定する。
 * @returns Promise<File[]> を返す。
 */
export const collectFilesFromDirectoryEntry = async (
  directoryEntry: FileSystemDirectoryEntryWithWebkit,
  rootName: string,
  rootPath: string,
): Promise<File[]> => {
  const reader = directoryEntry.createReader();
  const childEntries: FileSystemEntryWithWebkit[] = [];

  while (true) {
    const entriesChunk = await new Promise<FileSystemEntryWithWebkit[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (entriesChunk.length === 0) break;
    childEntries.push(...entriesChunk);
  }

  const files = await Promise.all(
    childEntries.map(async (entry: FileSystemEntryWithWebkit): Promise<File[]> => {
      if (entry.isFile) {
        const file = await readFileFromEntry(entry as FileSystemFileEntryWithWebkit);
        const normalizedFullPath = normalizePath(entry.fullPath ?? file.name);
        const relativePath = normalizedFullPath.startsWith(`${rootPath}/`)
          ? normalizedFullPath.slice(rootPath.length + 1)
          : file.name;
        return [new File([file], file.name, { type: file.type, lastModified: file.lastModified })].map((nextFile: File) => {
          Object.defineProperty(nextFile, 'webkitRelativePath', {
            configurable: true,
            value: `${rootName}/${relativePath}`,
          });
          return nextFile;
        });
      }
      return await collectFilesFromDirectoryEntry(entry as FileSystemDirectoryEntryWithWebkit, rootName, rootPath);
    }),
  );

  return files.flat();
};

/**
 * @summary ドロップされたフォルダーからファイル一覧を収集する。
 * @param dataTransfer ドロップイベントの DataTransfer を指定する。
 * @returns Promise<DroppedFolderFiles> を返す。
 */
export const collectFilesFromDroppedFolder = async (dataTransfer: DataTransfer | null): Promise<DroppedFolderFiles> => {
  if (dataTransfer === null) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'ドロップされたデータを読み取れませんでした。',
        'フォルダーをもう一度ドラッグ&ドロップしてください。',
      ),
      'unsupported_drop',
    );
  }

  const entryItems = Array.from(dataTransfer.items)
    .filter((item: DataTransferItem): boolean => item.kind === 'file')
    .map((item: DataTransferItem): FileSystemEntryWithWebkit | null => {
      const webkitItem = item as DataTransferItemWithWebkitEntry;
      return webkitItem.webkitGetAsEntry?.() ?? null;
    });

  if (entryItems.length === 0) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'ドロップされたフォルダーを読み取れませんでした。',
        '翻訳ファイルを含むフォルダーをドラッグ&ドロップしてください。',
      ),
      'unsupported_drop',
    );
  }

  if (entryItems.some((entry: FileSystemEntryWithWebkit | null): boolean => entry === null)) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'このブラウザではフォルダーのドラッグ&ドロップに対応していません。',
        '「フォルダーを選択」ボタンからフォルダーを選び直してください。',
      ),
      'unsupported_drop',
    );
  }

  const rootEntries = entryItems.filter((entry): entry is FileSystemEntryWithWebkit => entry !== null);
  if (rootEntries.some((entry: FileSystemEntryWithWebkit): boolean => entry.isFile)) {
    throw new UploadDialogError(
      buildFileSelectionErrorMessage('翻訳ファイルを含むフォルダーを選択してください。'),
      'file_selected',
    );
  }

  const rootDirectories = rootEntries as FileSystemDirectoryEntryWithWebkit[];
  if (rootDirectories.length !== 1) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'ドラッグ&ドロップで指定できるルートフォルダーは 1 つだけです。',
        'フォルダーを 1 つだけドラッグ&ドロップしてください。',
      ),
      'invalid_entry_path',
    );
  }

  const rootDirectory = rootDirectories[0];
  if (rootDirectory === undefined) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'ドロップされたフォルダーを読み取れませんでした。',
        'フォルダーを 1 つだけドラッグ&ドロップしてください。',
      ),
      'unsupported_drop',
    );
  }
  if (!ALLOWED_ROOT_DIRECTORY_NAMES.includes(rootDirectory.name as (typeof ALLOWED_ROOT_DIRECTORY_NAMES)[number])) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        `ドラッグ&ドロップできるルートフォルダーは "DCSWorld" または "UserMissions" のみです（${rootDirectory.name}）。`,
        '"DCSWorld" または "UserMissions" フォルダー自体をドラッグ&ドロップしてください。',
      ),
      'invalid_entry_path',
    );
  }

  const rootPath = normalizePath(rootDirectory.fullPath ?? `/${rootDirectory.name}`).replace(/\/$/, '');
  const files = await collectFilesFromDirectoryEntry(rootDirectory, rootDirectory.name, rootPath);

  return {
    folderName: rootDirectory.name,
    files,
    totalSize: files.reduce((sum: number, file: File): number => sum + file.size, 0),
  };
};
