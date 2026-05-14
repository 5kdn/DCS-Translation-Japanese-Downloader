import { computed, ref } from 'vue';
import type { MizDictionaryEntriesResult } from '@/features/mizTranslation/mizArchiveModels';
import type { MizDictionaryEntry } from '@/features/mizTranslation/mizDictionaryModels';
import type { MizDictionaryDocument } from '@/features/mizTranslation/mizDictionaryParser';
import { buildDictionaryDownloadPayloadFromEntries } from '@/features/mizTranslation/mizTranslationService';

/**
 * @summary MIZ dictionary の編集状態を管理する。
 * @returns 編集状態と操作関数を返す。
 */
export const useMizTranslationEditorState = () => {
  const entries = ref<MizDictionaryEntry[]>([]);
  const source = ref('');
  const fileName = ref('');
  const document = ref<MizDictionaryDocument | null>(null);

  const exportableEntries = computed((): Pick<MizDictionaryEntry, 'key' | 'translatedText'>[] => {
    return entries.value
      .filter((entry: MizDictionaryEntry): boolean => {
        return entry.enabled && entry.isTranslatable && entry.translatedText !== '';
      })
      .map((entry: MizDictionaryEntry) => {
        return {
          key: entry.key,
          translatedText: entry.translatedText,
        };
      });
  });

  /**
   * @summary 指定 key の有効状態を更新する。
   * @param key 更新対象 key を指定する。
   * @param value 設定する有効状態を指定する。
   */
  const setEntryEnabled = (key: string, value: boolean): void => {
    entries.value = entries.value.map((entry: MizDictionaryEntry): MizDictionaryEntry => {
      if (entry.key !== key) return entry;
      return {
        ...entry,
        enabled: value,
      };
    });
  };

  /**
   * @summary 指定 key の翻訳文を更新する。
   * @param key 更新対象 key を指定する。
   * @param value 設定する翻訳文を指定する。
   */
  const setEntryTranslatedText = (key: string, value: string): void => {
    entries.value = entries.value.map((entry: MizDictionaryEntry): MizDictionaryEntry => {
      if (entry.key !== key) return entry;
      return {
        ...entry,
        translatedText: value,
      };
    });
  };

  /**
   * @summary key 一致する翻訳文だけを既存 dictionary 読込結果で置き換える。
   * @param values 読込済み dictionary の key/value 一覧を指定する。
   */
  const replaceTranslationsFromDictionary = (values: ReadonlyMap<string, string>): void => {
    entries.value = entries.value.map((entry: MizDictionaryEntry): MizDictionaryEntry => {
      const translatedText = values.get(entry.key);
      if (translatedText === undefined) return entry;
      return {
        ...entry,
        translatedText,
      };
    });
  };

  /**
   * @summary 読込済み dictionary 一式を編集状態へ置き換える。
   * @param result 読込済み dictionary 結果を指定する。
   */
  const replaceEntries = (result: MizDictionaryEntriesResult): void => {
    entries.value = cloneEntries(result.entries);
    source.value = result.source;
    fileName.value = result.fileName;
    document.value = result.document;
  };

  /**
   * @summary 現在の編集内容からダウンロード用 payload を構築する。
   * @returns 出力対象行だけを含むダウンロード用 payload を返す。
   */
  const buildDownloadPayload = () => {
    return buildDictionaryDownloadPayloadFromEntries(exportableEntries.value);
  };

  /**
   * @summary 編集状態を初期化する。
   */
  const resetEntries = (): void => {
    entries.value = [];
    source.value = '';
    fileName.value = '';
    document.value = null;
  };

  return {
    entries,
    source,
    fileName,
    document,
    exportableEntries,
    setEntryEnabled,
    setEntryTranslatedText,
    replaceTranslationsFromDictionary,
    replaceEntries,
    buildDownloadPayload,
    resetEntries,
  };
};

/**
 * @summary dictionary エントリー一覧を編集用に複製する。
 * @param entries 複製対象のエントリー一覧を指定する。
 * @returns 複製したエントリー一覧を返す。
 */
const cloneEntries = (entries: ReadonlyArray<MizDictionaryEntry>): MizDictionaryEntry[] => {
  return entries.map((entry: MizDictionaryEntry): MizDictionaryEntry => {
    return {
      ...entry,
    };
  });
};
