import type { UploadDialogEntry, UploadTargetType } from '@/features/upload/uploadDialogDomain';
import { buildGitHubRawUrl } from '@/lib/githubUrl';
import type { TreeItem } from '@/types/type';

export type UploadReadmeMode = 'skip' | 'existing' | 'create';
export type UploadReadmeSource = 'template' | 'repository';

/**
 * @summary README_Translation.md の期待パスを返す。
 * @param targetType アップロード対象種別を指定する。
 * @param targetName アップロード対象名を指定する。
 * @returns README_Translation.md の期待パスを返す。
 */
export const buildExpectedReadmePath = (targetType: UploadTargetType, targetName: string): string | null => {
  const normalizedTargetName = targetName.trim();
  if (normalizedTargetName === '') return null;
  if (targetType === 'User Campaign') return `UserMissions/Campaigns/${normalizedTargetName}/README_Translation.md`;
  if (targetType === 'User Mission') return `UserMissions/${normalizedTargetName}/README_Translation.md`;
  return null;
};

/**
 * @summary アップロード一覧に README_Translation.md が含まれるか判定する。
 * @param fileEntries 判定対象のファイル一覧を指定する。
 * @param readmePath README_Translation.md の期待パスを指定する。
 * @returns README_Translation.md が含まれる場合は true を返す。
 */
export const hasUploadedReadme = (fileEntries: UploadDialogEntry[], readmePath: string): boolean => {
  return fileEntries.some((entry: UploadDialogEntry): boolean => entry.path === readmePath);
};

/**
 * @summary リポジトリツリーから対応する README_Translation.md を検索する。
 * @param treeItems リポジトリツリー一覧を指定する。
 * @param readmePath README_Translation.md の期待パスを指定する。
 * @returns 対応する TreeItem を返す。存在しない場合は null を返す。
 */
export const findRepoReadme = (treeItems: TreeItem[], readmePath: string): TreeItem | null => {
  return treeItems.find((item: TreeItem): boolean => item.type === 'blob' && item.path === readmePath) ?? null;
};

/**
 * @summary READMEバリデーション用に空白文字を除去した文字列を返す。
 * @param value 変換対象文字列を指定する。
 * @returns 空白文字を除去した文字列を返す。
 */
export const normalizeReadmeForValidation = (value: string): string => {
  return value.replace(/\s+/g, '');
};

/**
 * @summary README入力値が有効か判定する。
 * @param source README初期値の取得元を指定する。
 * @param initialText 初期値を指定する。
 * @param editedText 編集後文字列を指定する。
 * @returns 有効な場合は true を返す。
 */
export const isReadmeTextValid = (source: UploadReadmeSource, initialText: string, editedText: string): boolean => {
  const normalizedInitialText = normalizeReadmeForValidation(initialText);
  const normalizedEditedText = normalizeReadmeForValidation(editedText);
  if (source === 'repository') return normalizedEditedText.length > 0;
  return normalizedInitialText !== normalizedEditedText && normalizedEditedText.length >= 45;
};

/**
 * @summary README本文に実質的な変更があるか判定する。
 * @param initialText 初期値を指定する。
 * @param editedText 編集後文字列を指定する。
 * @returns 実質的な変更がある場合は true を返す。
 */
export const hasMeaningfulReadmeChange = (initialText: string, editedText: string): boolean => {
  return normalizeReadmeForValidation(initialText) !== normalizeReadmeForValidation(editedText);
};

/**
 * @summary GitHub raw URL を生成する。
 * @param path リポジトリ内パスを指定する。
 * @returns GitHub raw URL を返す。
 */
export const buildReadmeRawUrl = (path: string): string => {
  return buildGitHubRawUrl(path);
};
