/**
 * @summary MizTranslation が受け付けるファイル拡張子一覧を表す。
 */
export const MIZ_TRANSLATION_FILE_EXTENSIONS = ['.miz', '.trk'] as const;

/**
 * @summary MIZ ファイル選択検証失敗を表す。
 */
export class MizFileSelectionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MizFileSelectionError';
  }
}

/**
 * @summary 指定ファイル名が MizTranslation 対象拡張子を持つか判定する。
 * @param fileName 判定対象ファイル名を指定する。
 * @returns `.miz` または `.trk` 拡張子であれば true を返す。
 */
export const isMizFileName = (fileName: string): boolean => {
  const normalizedFileName = fileName.toLowerCase();
  return MIZ_TRANSLATION_FILE_EXTENSIONS.some((extension) => normalizedFileName.endsWith(extension));
};

/**
 * @summary file input や drop で受け取った値を File 配列へ正規化する。
 * @param value 正規化対象の入力値を指定する。
 * @returns File 配列を返す。
 */
export const normalizeMizFileSelection = (value: File | ReadonlyArray<File> | null | undefined): File[] => {
  if (value === null || value === undefined) {
    return [];
  }

  if (value instanceof File) {
    return [value];
  }

  return [...value];
};

/**
 * @summary 選択された MizTranslation 対象ファイル一覧から単一の有効ファイルを検証して返す。
 * @param files 検証対象のファイル一覧を指定する。
 * @returns 単一の有効な `.miz` または `.trk` ファイルを返す。
 * @throws MizFileSelectionError 検証に失敗した場合に送出する。
 */
export const validateSelectedMizFile = (files: ReadonlyArray<File>): File => {
  if (files.length === 0) {
    throw new MizFileSelectionError('.miz または .trk ファイルを選択してください。');
  }

  if (files.length > 1) {
    throw new MizFileSelectionError('.miz または .trk ファイルは 1 件だけ選択してください。');
  }

  const [file] = files;
  if (file === undefined || !isMizFileName(file.name)) {
    throw new MizFileSelectionError('拡張子が .miz または .trk のファイルを選択してください。');
  }

  return file;
};
