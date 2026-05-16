/**
 * @summary MIZ 翻訳 import で取り扱う 1 行分の翻訳データを表す。
 */
export type MizTranslationImportEntry = {
  key: string;
  sourceText: string;
  translatedText: string;
};
