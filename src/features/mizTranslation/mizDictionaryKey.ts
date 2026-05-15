/**
 * @summary dictionary ファイルで許可する key 全体の判定パターンを表す。
 */
const DICTIONARY_KEY_PATTERN =
  /^DictKey(?:_(?:sortie|description(?:Text|(?:(?:Blue|Neutrals|Red)Task))|subtitle|Action(?:(?:Radio)?Text|Comment)|(?:Wpt|Group|Unit)Name))?_\d+$/;

/**
 * @summary 翻訳対象として有効化可能な key の判定パターンを表す。
 */
const TRANSLATABLE_DICTIONARY_KEY_PATTERN =
  /^DictKey(?:_(?:sortie|description(?:Text|(?:(?:Blue|Neutrals|Red)Task))|subtitle))?_\d+$/;

/**
 * @summary dictionary key として妥当か判定する。
 * @param key 判定対象の key を指定する。
 * @returns dictionary key として妥当な場合は true を返す。
 */
export const isDictionaryKey = (key: string): boolean => {
  return DICTIONARY_KEY_PATTERN.test(key);
};

/**
 * @summary 翻訳対象の dictionary key か判定する。
 * @param key 判定対象の key を指定する。
 * @returns 翻訳対象の dictionary key の場合は true を返す。
 */
export const isTranslatableDictionaryKey = (key: string): boolean => {
  return TRANSLATABLE_DICTIONARY_KEY_PATTERN.test(key);
};

/**
 * @summary dictionary entry の初期有効状態を判定する。
 * @param key 判定対象の key を指定する。
 * @param sourceText 判定対象の原文文字列を指定する。
 * @returns 翻訳対象 key かつ原文が空欄でない場合のみ true を返す。
 */
export const getInitialEnabledState = (key: string, sourceText: string): boolean => {
  return isTranslatableDictionaryKey(key) && !isBlankDictionarySourceText(sourceText);
};

/**
 * @summary dictionary 原文が空欄か判定する。
 * @param sourceText 判定対象の原文文字列を指定する。
 * @returns 空文字または空白文字だけの場合は true を返す。
 */
export const isBlankDictionarySourceText = (sourceText: string): boolean => {
  return sourceText.trim().length === 0;
};
