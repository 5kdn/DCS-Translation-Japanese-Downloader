export type UploadDialogEntry = {
  path: string;
  isDirectory: boolean;
};

export type UploadDialogSelectedFile = {
  path: string;
  file: File;
};

export type UploadTargetType = 'Aircraft' | 'DLC Campaigns' | 'User Mission' | 'User Campaign';
export type UploadChangeType = 'ファイルの追加' | 'ファイルの削除' | 'バグ修正' | '誤字の修正' | 'その他の修正';
export type UploadDialogErrorKind =
  | 'blocked_file_type'
  | 'empty_folder'
  | 'file_selected'
  | 'invalid_entry_path'
  | 'unsupported_drop';

export class UploadDialogError extends Error {
  public readonly kind: UploadDialogErrorKind;

  public constructor(message: string, kind: UploadDialogErrorKind) {
    super(message);
    this.kind = kind;
    this.name = 'UploadDialogError';
  }
}

export type ParsedUploadSelection = {
  entries: UploadDialogEntry[];
  fileEntries: UploadDialogEntry[];
  selectedFiles: UploadDialogSelectedFile[];
  fileCount: number;
  targetType: UploadTargetType;
  targetName: string;
  folderName: string;
  totalSize: number;
};

const ALLOWED_ENTRY_PREFIXES = ['DCSWorld/Mods/aircraft/', 'DCSWorld/Mods/campaigns/', 'UserMissions/'] as const;
const PATH_ROOT_SEGMENTS = ['DCSWorld', 'UserMissions'] as const;
const BLOCKED_FILE_EXTENSIONS = [
  '.aac',
  '.avi',
  '.avif',
  '.bmp',
  '.flac',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.m4a',
  '.m4v',
  '.mkv',
  '.mov',
  '.mp3',
  '.mp4',
  '.mpeg',
  '.mpg',
  '.ogg',
  '.opus',
  '.pdf',
  '.png',
  '.svg',
  '.tif',
  '.tiff',
  '.wav',
  '.webm',
  '.webp',
  '.wmv',
  '.wma',
] as const;
const FOLDER_SELECTION_GUIDANCE = '以下のフォルダー構成を満たすように見直してから再度選択してください。';
const FOLDER_STRUCTURE_EXAMPLES = [
  '- 機体の場合: DCSWorld/Mods/aircraft/',
  '- DLCキャンペーンの場合: DCSWorld/Mods/campaigns/',
  '- ユーザーミッションの場合: UserMissions/<ミッション名>/<ミッションファイル>.miz/l10n/JP/dictionary',
  '- ユーザーキャンペーンの場合: UserMissions/Campaigns/<キャンペーン名>/...',
].join('\n');

export const UPLOAD_CHANGE_TYPES = ['ファイルの追加', 'ファイルの削除', 'バグ修正', '誤字の修正', 'その他の修正'] as const;
export const DEFAULT_CHANGE_DETAILS = `<!-- 具体的な変更内容を記載してください -->
- miz/trkファイル単位で箇条書きで記載してください
- 機体やキャンペーン全体に関連する場合、機体やキャンペーンごとの記載でも大丈夫です`;
export const DEFAULT_NOTES = `<!-- このPRを使用するうえで注意すべきことをリストアップしてください -->
<!-- 必要がなければ N/A としてください -->
N/A`;
export const FOLDER_STRUCTURE_GUIDANCE = [
  '"DCSWorld" または "UserMissions" という名称のフォルダーを選択してください。',
  '',
  FOLDER_SELECTION_GUIDANCE,
  FOLDER_STRUCTURE_EXAMPLES,
].join('\n');

/**
 * @summary フォルダー選択時の詳細メッセージを組み立てる。
 * @param cause 原因説明を指定する。
 * @param proposal 解決提案を指定する。
 * @param details 補足情報を指定する。
 * @returns 画面表示用メッセージを返す。
 */
export const buildFolderSelectionErrorMessage = (cause: string, proposal: string, details?: string): string => {
  const sections = ['選択されたフォルダーは適切な構造ではありません。', `${cause}`, '', `${proposal}`];
  if (details !== undefined && details.trim() !== '') {
    sections.push(details);
  }
  return sections.join('\n');
};

/**
 * @summary ファイル直接選択時の詳細メッセージを組み立てる。
 * @param proposal 解決提案を指定する。
 * @returns 画面表示用メッセージを返す。
 */
export const buildFileSelectionErrorMessage = (proposal: string): string => {
  return ['ファイルを直接選択することはできません。', `${proposal}`, '', FOLDER_STRUCTURE_GUIDANCE].join('\n');
};

/**
 * @summary 禁止ファイル種別エラーメッセージを組み立てる。
 * @param blockedKind 禁止ファイル種別を指定する。
 * @param path 禁止ファイルのパスを指定する。
 * @returns 画面表示用メッセージを返す。
 */
export const buildBlockedFileTypeErrorMessage = (blockedKind: 'pdf' | 'image' | 'audio' | 'video', path: string): string => {
  if (blockedKind === 'pdf') {
    return [
      '現在PDFはアップロードすることができません。',
      `PDF、画像、音声、映像ファイルはアップロードできません。(${path})`,
      '',
      'PDFを削除して再度アップロードを実行してください。',
    ].join('\n');
  }

  if (blockedKind === 'audio') {
    return [
      '現在音声ファイルはアップロードすることができません。',
      `PDF、画像、音声、映像ファイルはアップロードできません。(${path})`,
      '',
      '音声ファイルを削除して再度アップロードを実行してください。',
    ].join('\n');
  }

  if (blockedKind === 'video') {
    return [
      '現在映像ファイルはアップロードすることができません。',
      `PDF、画像、音声、映像ファイルはアップロードできません。(${path})`,
      '',
      '映像ファイルを削除して再度アップロードを実行してください。',
    ].join('\n');
  }

  return [
    '現在画像ファイルはアップロードすることができません。',
    `PDF、画像、音声、映像ファイルはアップロードできません。(${path})`,
    '',
    '画像ファイルを削除して再度アップロードを実行してください。',
  ].join('\n');
};

/**
 * @summary パス区切りを正規化する。
 * @param path 正規化対象パスを指定する。
 * @returns スラッシュ区切りへ正規化したパスを返す。
 */
export const normalizePath = (path: string): string => path.replaceAll('\\', '/');

/**
 * @summary エントリ一覧をソートする。
 * @param targetEntries ソート対象のエントリ一覧を指定する。
 * @returns ソート済みのエントリ一覧を返す。
 */
export const sortEntries = (targetEntries: UploadDialogEntry[]): UploadDialogEntry[] => {
  return [...targetEntries].sort((left: UploadDialogEntry, right: UploadDialogEntry): number =>
    left.path.localeCompare(right.path, undefined, { numeric: true }),
  );
};

/**
 * @summary フォルダー選択時の相対パスを自動補正する。
 * @param path フォルダー配下の相対パスを指定する。
 * @returns 検証用に補正した相対パスを返す。
 */
export const normalizeFolderRelativePath = (path: string): string => {
  return normalizePath(path)
    .split('/')
    .filter((segment: string): boolean => segment.length > 0)
    .join('/');
};

/**
 * @summary フォルダー選択結果からエントリ一覧を生成する。
 * @param files フォルダー選択結果のファイル一覧を指定する。
 * @returns 画面表示用のファイルエントリ一覧を返す。
 */
export const extractEntriesFromFolder = (files: File[]): UploadDialogEntry[] => {
  return sortEntries(
    files.map(
      (file: File): UploadDialogEntry => ({
        path: normalizeFolderRelativePath(file.webkitRelativePath || file.name),
        isDirectory: false,
      }),
    ),
  );
};

/**
 * @summary フォルダー選択結果から送信用のファイル一覧を生成する。
 * @param files フォルダー選択結果のファイル一覧を指定する。
 * @returns 送信用のファイル一覧を返す。
 */
export const extractSelectedFilesFromFolder = (files: File[]): UploadDialogSelectedFile[] => {
  return [...files]
    .map(
      (file: File): UploadDialogSelectedFile => ({
        path: normalizeFolderRelativePath(file.webkitRelativePath || file.name),
        file,
      }),
    )
    .sort((left: UploadDialogSelectedFile, right: UploadDialogSelectedFile): number =>
      left.path.localeCompare(right.path, undefined, { numeric: true }),
    );
};

/**
 * @summary 単独ファイル選択かどうかを判定する。
 * @param files 判定対象のファイル一覧を指定する。
 * @returns 単独ファイル選択であれば true を返す。
 */
export const isSingleFileSelection = (files: File[]): boolean => {
  return files.length > 0 && files.some((file: File): boolean => (file.webkitRelativePath ?? '').trim() === '');
};

/**
 * @summary ファイル名から禁止ファイル種別を判定する。
 * @param fileName 判定対象のファイル名を指定する。
 * @returns 禁止ファイル種別を返す。
 */
export const inferBlockedFileKindFromName = (fileName: string): 'pdf' | 'image' | 'audio' | 'video' | null => {
  const normalizedFileName = fileName.trim().toLowerCase();
  if (normalizedFileName.endsWith('.pdf')) return 'pdf';
  if (
    BLOCKED_FILE_EXTENSIONS.some(
      (extension: string): boolean =>
        ['.avif', '.bmp', '.gif', '.ico', '.jpeg', '.jpg', '.png', '.svg', '.tif', '.tiff', '.webp'].includes(extension) &&
        normalizedFileName.endsWith(extension),
    )
  ) {
    return 'image';
  }
  if (
    BLOCKED_FILE_EXTENSIONS.some(
      (extension: string): boolean =>
        ['.aac', '.flac', '.m4a', '.mp3', '.ogg', '.opus', '.wav', '.wma'].includes(extension) &&
        normalizedFileName.endsWith(extension),
    )
  ) {
    return 'audio';
  }
  if (
    BLOCKED_FILE_EXTENSIONS.some(
      (extension: string): boolean =>
        ['.avi', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.webm', '.wmv'].includes(extension) &&
        normalizedFileName.endsWith(extension),
    )
  ) {
    return 'video';
  }
  return null;
};

/**
 * @summary MIME type から禁止ファイル種別を判定する。
 * @param mimeType 判定対象の MIME type を指定する。
 * @returns 禁止ファイル種別を返す。
 */
export const inferBlockedFileKindFromMimeType = (mimeType: string): 'pdf' | 'image' | 'audio' | 'video' | null => {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  if (normalizedMimeType === 'application/pdf') return 'pdf';
  if (normalizedMimeType.startsWith('image/')) return 'image';
  if (normalizedMimeType.startsWith('audio/')) return 'audio';
  if (normalizedMimeType.startsWith('video/')) return 'video';
  return null;
};

/**
 * @summary 禁止ファイル種別を判定する。
 * @param file 判定対象のファイルを指定する。
 * @returns 禁止ファイル種別を返す。
 */
export const inferBlockedFileKind = (file: File): 'pdf' | 'image' | 'audio' | 'video' | null => {
  return inferBlockedFileKindFromMimeType(file.type) ?? inferBlockedFileKindFromName(file.name);
};

/**
 * @summary 禁止ファイル種別が含まれていないか検証する。
 * @param files 検証対象のファイル一覧を指定する。
 */
export const validateBlockedFiles = (files: File[]): void => {
  const blockedFile = files.find((file: File): boolean => inferBlockedFileKind(file) !== null);
  if (blockedFile === undefined) return;

  const blockedKind = inferBlockedFileKind(blockedFile);
  if (blockedKind === null) return;

  const blockedPath = normalizeFolderRelativePath(blockedFile.webkitRelativePath || blockedFile.name);
  throw new UploadDialogError(buildBlockedFileTypeErrorMessage(blockedKind, blockedPath), 'blocked_file_type');
};

/**
 * @summary エントリ一覧から対象種別を推測する。
 * @param targetEntries 推測対象のエントリ一覧を指定する。
 * @returns 推測した対象種別を返す。
 */
export const inferUploadTargetType = (targetEntries: UploadDialogEntry[]): UploadTargetType | null => {
  const fileEntries = targetEntries.filter((entry: UploadDialogEntry): boolean => !entry.isDirectory);
  if (fileEntries.length === 0) return null;
  if (fileEntries.every((entry: UploadDialogEntry): boolean => entry.path.startsWith('DCSWorld/Mods/aircraft/'))) {
    return 'Aircraft';
  }
  if (fileEntries.every((entry: UploadDialogEntry): boolean => entry.path.startsWith('DCSWorld/Mods/campaigns/'))) {
    return 'DLC Campaigns';
  }
  if (fileEntries.every((entry: UploadDialogEntry): boolean => entry.path.startsWith('UserMissions/Campaigns/'))) {
    return 'User Campaign';
  }
  if (
    fileEntries.every((entry: UploadDialogEntry): boolean => entry.path.startsWith('UserMissions/')) &&
    fileEntries.every((entry: UploadDialogEntry): boolean => !entry.path.startsWith('UserMissions/Campaigns/'))
  ) {
    return 'User Mission';
  }
  return null;
};

/**
 * @summary エントリ一覧から対象名を推測する。
 * @param targetEntries 推測対象のエントリ一覧を指定する。
 * @returns 推測した対象名を返す。
 */
export const inferTargetName = (targetEntries: UploadDialogEntry[]): string => {
  const fileEntries = targetEntries.filter((entry: UploadDialogEntry): boolean => !entry.isDirectory);
  if (fileEntries.length === 0) return '';

  const getNameFromPrefix = (prefix: string): string => {
    const firstPath = fileEntries[0]?.path;
    if (firstPath === undefined || !firstPath.startsWith(prefix)) return '';
    return firstPath.slice(prefix.length).split('/')[0] ?? '';
  };

  switch (inferUploadTargetType(targetEntries)) {
    case 'Aircraft':
      return getNameFromPrefix('DCSWorld/Mods/aircraft/');
    case 'DLC Campaigns':
      return getNameFromPrefix('DCSWorld/Mods/campaigns/');
    case 'User Campaign':
      return getNameFromPrefix('UserMissions/Campaigns/');
    case 'User Mission':
      return getNameFromPrefix('UserMissions/');
    default:
      return '';
  }
};

/**
 * @summary エントリ一覧からファイルだけを取得する。
 * @param targetEntries 取得対象のエントリ一覧を指定する。
 * @returns ファイルエントリ一覧を返す。
 */
export const extractFileEntries = (targetEntries: UploadDialogEntry[]): UploadDialogEntry[] => {
  return targetEntries.filter((entry: UploadDialogEntry): boolean => !entry.isDirectory);
};

/**
 * @summary エントリのルートフォルダー名を検証する。
 * @param targetEntries 検証対象のエントリ一覧を指定する。
 */
export const validateRootDirectoryNames = (targetEntries: UploadDialogEntry[]): void => {
  const invalidEntry = targetEntries.find((entry: UploadDialogEntry): boolean => {
    const rootSegment = entry.path.split('/')[0];
    return !PATH_ROOT_SEGMENTS.includes(rootSegment as (typeof PATH_ROOT_SEGMENTS)[number]);
  });
  if (invalidEntry === undefined) return;

  throw new UploadDialogError(
    buildFolderSelectionErrorMessage(
      `選択されたルートフォルダーが許可されていません（${invalidEntry.path}）。`,
      '"DCSWorld" または "UserMissions" フォルダー自体を選択してください。',
      FOLDER_STRUCTURE_EXAMPLES,
    ),
    'invalid_entry_path',
  );
};

/**
 * @summary エントリのパスが許可接頭辞に一致するか検証する。
 * @param targetEntries 検証対象のエントリ一覧を指定する。
 */
export const validateEntryPaths = (targetEntries: UploadDialogEntry[]): void => {
  const fileEntries = extractFileEntries(targetEntries);
  const validationTargets = fileEntries.length > 0 ? fileEntries : targetEntries;
  const invalidEntry = validationTargets.find(
    (entry: UploadDialogEntry): boolean =>
      !ALLOWED_ENTRY_PREFIXES.some((prefix: string): boolean => entry.path.startsWith(prefix)),
  );
  if (invalidEntry === undefined) return;

  throw new UploadDialogError(
    buildFolderSelectionErrorMessage(
      `フォルダー内に許可されていないパスが含まれています（${invalidEntry.path}）。`,
      FOLDER_SELECTION_GUIDANCE,
      FOLDER_STRUCTURE_EXAMPLES,
    ),
    'invalid_entry_path',
  );
};

/**
 * @summary 指定プレフィックス直下の構成を検証する。
 * @param fileEntries 検証対象のファイルエントリ一覧を指定する。
 * @param prefix 検証対象プレフィックスを指定する。
 * @param label 画面表示用ラベルを指定する。
 */
export const validateSingleTargetDirectory = (
  fileEntries: UploadDialogEntry[],
  prefix: 'DCSWorld/Mods/aircraft/' | 'DCSWorld/Mods/campaigns/' | 'UserMissions/' | 'UserMissions/Campaigns/',
  label: 'DCSWorld/Mods/aircraft' | 'DCSWorld/Mods/campaigns' | 'UserMissions' | 'UserMissions/Campaigns',
): void => {
  const entriesUnderPrefix = fileEntries.filter((entry: UploadDialogEntry): boolean => entry.path.startsWith(prefix));
  if (entriesUnderPrefix.length === 0) return;

  const targetDirectories = new Set<string>();
  entriesUnderPrefix.forEach((entry: UploadDialogEntry): void => {
    const targetDirectory = entry.path.slice(prefix.length).split('/')[0];
    if (targetDirectory !== undefined && targetDirectory !== '') {
      targetDirectories.add(targetDirectory);
    }
  });

  if (targetDirectories.size === 1) return;

  throw new UploadDialogError(
    buildFolderSelectionErrorMessage(
      `${label} 直下の対象フォルダー数は 1 つだけにしてください。現在は ${targetDirectories.size} 個あります。`,
      `${label}/<名前>/... の構成で、1回のアップロードに含める対象を 1 つだけにしてください。`,
      Array.from(targetDirectories)
        .sort((left: string, right: string): number => left.localeCompare(right, undefined, { numeric: true }))
        .map((name: string): string => `- ${name}`)
        .join('\n'),
    ),
    'invalid_entry_path',
  );
};

/**
 * @summary アップロード対象のフォルダー構成を検証する。
 * @param targetEntries 検証対象のエントリ一覧を指定する。
 */
export const validateUploadStructure = (targetEntries: UploadDialogEntry[]): void => {
  const fileEntries = extractFileEntries(targetEntries);
  const hasAircraft = fileEntries.some((entry: UploadDialogEntry): boolean => entry.path.startsWith('DCSWorld/Mods/aircraft/'));
  const hasCampaigns = fileEntries.some((entry: UploadDialogEntry): boolean =>
    entry.path.startsWith('DCSWorld/Mods/campaigns/'),
  );

  if (hasAircraft && hasCampaigns) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'フォルダー内に DCSWorld/Mods/aircraft と DCSWorld/Mods/campaigns を同時に含めることはできません。',
        '1回のアップロードでは、機体または DLC キャンペーンのどちらか 1 つだけを含めてください。',
      ),
      'invalid_entry_path',
    );
  }

  validateSingleTargetDirectory(fileEntries, 'DCSWorld/Mods/aircraft/', 'DCSWorld/Mods/aircraft');
  validateSingleTargetDirectory(fileEntries, 'DCSWorld/Mods/campaigns/', 'DCSWorld/Mods/campaigns');
  validateSingleTargetDirectory(fileEntries, 'UserMissions/', 'UserMissions');
  validateSingleTargetDirectory(fileEntries, 'UserMissions/Campaigns/', 'UserMissions/Campaigns');
};

/**
 * @summary エントリ一覧から対象種別を判定できるか検証する。
 * @param targetEntries 検証対象のエントリ一覧を指定する。
 */
export const validateUploadTargetType = (targetEntries: UploadDialogEntry[]): UploadTargetType => {
  const fileEntries = extractFileEntries(targetEntries);
  if (fileEntries.length === 0) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'フォルダー内に対象ファイルが存在しません。',
        'DCSWorld/... または UserMissions/... を含むフォルダーを選び直してください。',
      ),
      'empty_folder',
    );
  }

  const targetType = inferUploadTargetType(targetEntries);
  if (targetType !== null) return targetType;

  throw new UploadDialogError(
    buildFolderSelectionErrorMessage(
      'アップロード対象の種類を判定できませんでした。',
      '1回のアップロードでは、機体、DLCキャンペーン、ユーザーミッション、ユーザーキャンペーンのいずれか 1 種類だけを含めてください。',
    ),
    'invalid_entry_path',
  );
};

/**
 * @summary エントリ一覧から対象名を判定できるか検証する。
 * @param targetEntries 検証対象のエントリ一覧を指定する。
 * @returns 判定した対象名を返す。
 */
export const validateTargetName = (targetEntries: UploadDialogEntry[]): string => {
  const fileEntries = extractFileEntries(targetEntries);
  if (fileEntries.length === 0) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'フォルダー内に対象ファイルが存在しません。',
        'DCSWorld/... または UserMissions/... を含むフォルダーを選び直してください。',
      ),
      'empty_folder',
    );
  }

  const targetName = inferTargetName(targetEntries);
  if (targetName.trim() !== '') return targetName;

  throw new UploadDialogError(
    buildFolderSelectionErrorMessage(
      '対象名を判定できませんでした。',
      '対象フォルダー名を含む構成で、1回のアップロードに 1 つの対象だけを含めてください。',
    ),
    'invalid_entry_path',
  );
};

/**
 * @summary エントリ一覧を検証して解析結果を返す。
 * @param targetEntries 検証対象のエントリ一覧を指定する。
 * @param folderName 選択されたフォルダー名を指定する。
 * @param totalSize 合計サイズを指定する。
 * @returns 解析済みの選択結果を返す。
 */
export const validateSelectedEntries = (
  targetEntries: UploadDialogEntry[],
  selectedFiles: UploadDialogSelectedFile[],
  folderName: string,
  totalSize: number,
): ParsedUploadSelection => {
  if (targetEntries.length === 0) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'フォルダー内に対象ファイルが存在しません。',
        'DCSWorld/... または UserMissions/... を含むフォルダーを選び直してください。',
      ),
      'empty_folder',
    );
  }

  validateRootDirectoryNames(targetEntries);
  validateEntryPaths(targetEntries);
  validateUploadStructure(targetEntries);
  const targetType = validateUploadTargetType(targetEntries);
  const targetName = validateTargetName(targetEntries);
  const fileEntries = extractFileEntries(targetEntries);

  return {
    entries: targetEntries,
    fileEntries,
    selectedFiles,
    fileCount: fileEntries.length,
    targetType,
    targetName,
    folderName,
    totalSize,
  };
};

/**
 * @summary 入力ファイル一覧を解析済みの選択結果へ変換する。
 * @param files 解析対象のファイル一覧を指定する。
 * @returns 解析済みの選択結果を返す。
 */
export const parseSelectedFolder = (files: File[]): ParsedUploadSelection => {
  if (files.length === 0) {
    throw new UploadDialogError(
      buildFolderSelectionErrorMessage(
        'フォルダー内に対象ファイルが存在しません。',
        'DCSWorld/... または UserMissions/... を含むフォルダーを選び直してください。',
      ),
      'empty_folder',
    );
  }

  if (isSingleFileSelection(files)) {
    throw new UploadDialogError(
      buildFileSelectionErrorMessage('翻訳ファイルを含むフォルダーを選択してください。'),
      'file_selected',
    );
  }

  validateBlockedFiles(files);

  const entries = extractEntriesFromFolder(files);
  const selectedFiles = extractSelectedFilesFromFolder(files);
  const relativePath = files[0]?.webkitRelativePath ?? '';
  const folderName = relativePath.split('/')[0] || '選択フォルダー';
  const totalSize = files.reduce((sum: number, file: File): number => sum + file.size, 0);
  return validateSelectedEntries(entries, selectedFiles, folderName, totalSize);
};
