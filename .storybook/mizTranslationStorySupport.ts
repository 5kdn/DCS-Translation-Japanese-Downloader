import JSZip from 'jszip';

const MIZ_DICTIONARY_LINES = [
  'dictionary = {',
  '  ["DictKey_sortie_10"] = "Sortie text",',
  '  ["DictKey_descriptionText_20"] = "Description text",',
  '  ["DictKey_descriptionBlueTask_30"] = "Blue task text",',
  '  ["DictKey_descriptionRedTask_40"] = "Red task text",',
  '  ["DictKey_descriptionNeutralsTask_50"] = "Neutral task text",',
  '  ["DictKey_60"] = "Alpha source",',
  '  ["DictKey_WptName_70"] = "Waypoint source",',
  '}',
] as const;

const IMPORTED_DICTIONARY_LINES = [
  'dictionary = {',
  '  ["DictKey_60"] = "Imported translation",',
  '  ["DictKey_999"] = "Ignored translation",',
  '}',
] as const;

/**
 * @summary Storybook 用サンプル MIZ に埋め込む dictionary 文字列を返す。
 * @returns `l10n/DEFAULT/dictionary` のサンプル文字列を返す。
 */
export const buildSampleMizDictionarySource = (): string => {
  return MIZ_DICTIONARY_LINES.join('\n');
};

/**
 * @summary Storybook 用サンプル import dictionary 文字列を返す。
 * @returns import 用 dictionary 文字列を返す。
 */
export const buildImportedDictionarySource = (): string => {
  return IMPORTED_DICTIONARY_LINES.join('\n');
};

/**
 * @summary Storybook で投入するサンプル MIZ ファイルを生成する。
 * @returns `l10n/DEFAULT/dictionary` を含む `.miz` ファイルを返す。
 */
export const createSampleMizFile = async (): Promise<File> => {
  const archive = new JSZip();
  archive.file('l10n/DEFAULT/dictionary', buildSampleMizDictionarySource());
  const blob = await archive.generateAsync({ type: 'blob' });
  return new File([blob], 'storybook-sample.miz', { type: 'application/zip' });
};

/**
 * @summary Storybook で投入する import dictionary ファイルを生成する。
 * @returns import 用 dictionary ファイルを返す。
 */
export const createImportedDictionaryFile = (): File => {
  return new File([buildImportedDictionarySource()], 'dictionary', { type: 'text/plain' });
};

export type MizTranslationBrowserHarnessState = {
  anchorClickCount: number;
  downloadedFileName: string | null;
  downloadedBlob: Blob | null;
};

/**
 * @summary Storybook 総合シナリオ用のブラウザ API モック状態を生成する。
 * @returns 初期化済みモック状態を返す。
 */
export const createMizTranslationBrowserHarnessState = (): MizTranslationBrowserHarnessState => {
  return {
    anchorClickCount: 0,
    downloadedFileName: null,
    downloadedBlob: null,
  };
};
