/**
 * @summary MIZ dictionary の 1 行分の編集状態を表す。
 */
export type MizDictionaryEntry = {
  key: string;
  sourceText: string;
  translatedText: string;
  enabled: boolean;
  isDictionaryKey: boolean;
  isTranslatable: boolean;
};

/**
 * @summary MIZ dictionary 一覧の絞り込み条件を表す。
 */
export type MizDictionaryFilter = {
  showEnabled: boolean;
  showDisabled: boolean;
  showOnlyUntranslated: boolean;
  hideNonTranslatable: boolean;
  hideEmptySourceText: boolean;
};

/**
 * @summary MIZ dictionary の変換結果を表す。
 */
export type MizDictionaryTransformResult = {
  entries: MizDictionaryEntry[];
  totalEntryCount: number;
  translatableEntryCount: number;
  enabledEntryCount: number;
};
