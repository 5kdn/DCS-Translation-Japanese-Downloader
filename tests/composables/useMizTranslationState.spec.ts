import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { useMizTranslationState } from '@/composables/useMizTranslationState';
import { readMizDictionaryEntries } from '@/features/mizTranslation/mizTranslationService';

/**
 * @summary 指定エントリーを含む MIZ 相当ファイルを生成する。
 * @param entries ZIP に含めるパスと内容の一覧を指定する。
 * @param fileName 生成するファイル名を指定する。
 * @returns MIZ 相当の File を返す。
 */
const createMizFile = async (
  entries: ReadonlyArray<{ path: string; content: string }>,
  fileName = 'sample.miz',
): Promise<File> => {
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.path, entry.content);
  }

  const buffer = await zip.generateAsync({ type: 'arraybuffer' });
  return new File([buffer], fileName, { type: 'application/zip' });
};

describe('useMizTranslationState', () => {
  it('readMizDictionaryEntries の結果を loadMizResult へ渡すと状態を初期化する', async () => {
    const mizFile = await createMizFile([
      {
        path: 'l10n/DEFAULT/dictionary',
        content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n  ["DictKey_WptName_2"] = "",\n}',
      },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.setShowEnabled(false);
    state.loadMizResult(result);

    expect(state.isDialogOpen.value).toBe(true);
    expect(state.loadedFileName.value).toBe('sample.miz');
    expect(state.entries.value).toHaveLength(2);
    expect(state.filteredEntries.value.map((entry) => entry.key)).toEqual(['DictKey_1']);
    expect(state.visibleEntryCount.value).toBe(1);
    expect(state.totalEntryCount.value).toBe(2);
    expect(state.filter.value).toEqual({
      showEnabled: true,
      showDisabled: true,
      showOnlyUntranslated: false,
      hideNonTranslatable: true,
      hideEmptySourceText: true,
    });
  });

  it('needsCloseConfirmation はダイアログ open かつ dirty のときだけ true になる', async () => {
    const mizFile = await createMizFile([
      { path: 'l10n/DEFAULT/dictionary', content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}' },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);
    expect(state.needsCloseConfirmation.value).toBe(false);

    state.setEntryTranslatedText('DictKey_1', '翻訳');
    expect(state.needsCloseConfirmation.value).toBe(true);
    expect(state.canCloseWithoutConfirm.value).toBe(false);

    state.markDownloadSucceeded();
    expect(state.needsCloseConfirmation.value).toBe(false);
    expect(state.canCloseWithoutConfirm.value).toBe(true);
  });

  it('loadMizResult 後の filteredEntries は固定先頭 5 グループ優先順を維持する', async () => {
    const mizFile = await createMizFile([
      {
        path: 'l10n/DEFAULT/dictionary',
        content: `dictionary = {
  ["DictKey_20"] = "Zulu",
  ["DictKey_descriptionText_3"] = "Description",
  ["DictKey_sortie_2"] = "Sortie",
  ["DictKey_10"] = "Alpha",
}`,
      },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);

    expect(state.filteredEntries.value.map((entry) => entry.key)).toEqual([
      'DictKey_sortie_2',
      'DictKey_descriptionText_3',
      'DictKey_10',
      'DictKey_20',
    ]);
  });

  it('visibleEntryCount はフィルター変更に追従する', async () => {
    const mizFile = await createMizFile([
      {
        path: 'l10n/DEFAULT/dictionary',
        content: `dictionary = {
  ["DictKey_1"] = "Alpha",
  ["DictKey_2"] = "Bravo",
}`,
      },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);
    state.setEntryTranslatedText('DictKey_2', '翻訳済み');

    expect(state.totalEntryCount.value).toBe(2);
    expect(state.visibleEntryCount.value).toBe(2);

    state.setShowOnlyUntranslated(true);

    expect(state.filteredEntries.value.map((entry) => entry.key)).toEqual(['DictKey_1']);
    expect(state.visibleEntryCount.value).toBe(1);
    expect(state.totalEntryCount.value).toBe(2);
  });

  it('resetAll で state を初期値へ戻す', async () => {
    const mizFile = await createMizFile([
      { path: 'l10n/DEFAULT/dictionary', content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}' },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);
    state.setEntryTranslatedText('DictKey_1', '翻訳');
    state.setShowOnlyUntranslated(true);
    state.setErrorMessage('error');
    state.setLoading(true);

    state.resetAll();

    expect(state.isDialogOpen.value).toBe(false);
    expect(state.isLoading.value).toBe(false);
    expect(state.errorMessage.value).toBeNull();
    expect(state.loadedFileName.value).toBe('');
    expect(state.entries.value).toEqual([]);
    expect(state.hasUnsavedChanges.value).toBe(false);
    expect(state.visibleEntryCount.value).toBe(0);
    expect(state.totalEntryCount.value).toBe(0);
    expect(state.filter.value).toEqual({
      showEnabled: true,
      showDisabled: true,
      showOnlyUntranslated: false,
      hideNonTranslatable: true,
      hideEmptySourceText: true,
    });
  });
});
