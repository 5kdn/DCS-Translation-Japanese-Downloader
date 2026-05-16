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

  it('空原文の翻訳対象行は初期状態で未チェックになる', async () => {
    const mizFile = await createMizFile([
      {
        path: 'l10n/DEFAULT/dictionary',
        content: 'dictionary = {\n  ["DictKey_6"] = "",\n  ["DictKey_7"] = "   ",\n  ["DictKey_8"] = "Alpha",\n}',
      },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);

    expect(state.entries.value).toEqual([
      {
        key: 'DictKey_6',
        sourceText: '',
        translatedText: '',
        enabled: false,
        isDictionaryKey: true,
        isTranslatable: true,
      },
      {
        key: 'DictKey_7',
        sourceText: '   ',
        translatedText: '',
        enabled: false,
        isDictionaryKey: true,
        isTranslatable: true,
      },
      {
        key: 'DictKey_8',
        sourceText: 'Alpha',
        translatedText: '',
        enabled: true,
        isDictionaryKey: true,
        isTranslatable: true,
      },
    ]);
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

  it('dirty なしで requestClose すると即 close される', async () => {
    const mizFile = await createMizFile([
      { path: 'l10n/DEFAULT/dictionary', content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}' },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);
    state.requestClose();

    expect(state.isCloseConfirmDialogOpen.value).toBe(false);
    expect(state.isDialogOpen.value).toBe(false);
    expect(state.entries.value).toEqual([]);
  });

  it('dirty ありで requestClose すると確認ダイアログだけを開く', async () => {
    const mizFile = await createMizFile([
      { path: 'l10n/DEFAULT/dictionary', content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}' },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);
    state.setEntryTranslatedText('DictKey_1', '翻訳');
    state.requestClose();

    expect(state.isCloseConfirmDialogOpen.value).toBe(true);
    expect(state.isDialogOpen.value).toBe(true);
    expect(state.entries.value).toHaveLength(1);
  });

  it('cancelClose で編集状態を維持したまま確認ダイアログだけを閉じる', async () => {
    const mizFile = await createMizFile([
      { path: 'l10n/DEFAULT/dictionary', content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}' },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);
    state.setEntryTranslatedText('DictKey_1', '翻訳');
    state.requestClose();
    state.cancelClose();

    expect(state.isCloseConfirmDialogOpen.value).toBe(false);
    expect(state.isDialogOpen.value).toBe(true);
    expect(state.entries.value[0]?.translatedText).toBe('翻訳');
  });

  it('confirmClose で状態を初期化して閉じる', async () => {
    const mizFile = await createMizFile([
      { path: 'l10n/DEFAULT/dictionary', content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}' },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);
    state.setEntryTranslatedText('DictKey_1', '翻訳');
    state.requestClose();
    state.confirmClose();

    expect(state.isCloseConfirmDialogOpen.value).toBe(false);
    expect(state.isDialogOpen.value).toBe(false);
    expect(state.entries.value).toEqual([]);
    expect(state.hasUnsavedChanges.value).toBe(false);
  });

  it('loadMizResult は再読込時に close 確認ダイアログ状態も初期化する', async () => {
    const firstMizFile = await createMizFile([
      { path: 'l10n/DEFAULT/dictionary', content: 'dictionary = {\n  ["DictKey_1"] = "Alpha",\n}' },
    ]);
    const secondMizFile = await createMizFile(
      [{ path: 'l10n/DEFAULT/dictionary', content: 'dictionary = {\n  ["DictKey_2"] = "Bravo",\n}' }],
      'second.miz',
    );
    const firstResult = await readMizDictionaryEntries(firstMizFile);
    const secondResult = await readMizDictionaryEntries(secondMizFile);
    const state = useMizTranslationState();

    state.loadMizResult(firstResult);
    state.setEntryTranslatedText('DictKey_1', '翻訳');
    state.requestClose();

    expect(state.isCloseConfirmDialogOpen.value).toBe(true);

    state.loadMizResult(secondResult);

    expect(state.isCloseConfirmDialogOpen.value).toBe(false);
    expect(state.loadedFileName.value).toBe('second.miz');
    expect(state.entries.value).toEqual([
      {
        key: 'DictKey_2',
        sourceText: 'Bravo',
        translatedText: '',
        enabled: true,
        isDictionaryKey: true,
        isTranslatable: true,
      },
    ]);
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

  it('exportEntries は現在のソート状態に追従する', async () => {
    const mizFile = await createMizFile([
      {
        path: 'l10n/DEFAULT/dictionary',
        content: `dictionary = {
  ["DictKey_1"] = "Bravo",
  ["DictKey_2"] = "Alpha",
}`,
      },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);
    expect(state.exportEntries.value.map((entry) => entry.key)).toEqual(['DictKey_1', 'DictKey_2']);

    state.setExportSort({
      sortKey: 'sourceText',
      sortOrder: 'asc',
    });

    expect(state.exportEntries.value.map((entry) => entry.key)).toEqual(['DictKey_2', 'DictKey_1']);
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

  it('dictionary import 後は dirty を維持し、download 成功後に解消する', async () => {
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
    expect(state.hasUnsavedChanges.value).toBe(false);

    state.replaceTranslationsFromDictionary(
      new Map([
        ['DictKey_1', '翻訳1'],
        ['DictKey_3', 'ignored'],
      ]),
    );

    expect(state.entries.value).toEqual([
      {
        key: 'DictKey_1',
        sourceText: 'Alpha',
        translatedText: '翻訳1',
        enabled: true,
        isDictionaryKey: true,
        isTranslatable: true,
      },
      {
        key: 'DictKey_2',
        sourceText: 'Bravo',
        translatedText: '',
        enabled: true,
        isDictionaryKey: true,
        isTranslatable: true,
      },
    ]);
    expect(state.hasUnsavedChanges.value).toBe(true);

    state.markDownloadSucceeded();

    expect(state.hasUnsavedChanges.value).toBe(false);
  });

  it('download 成功後は requestClose が確認なしで閉じる', async () => {
    const mizFile = await createMizFile([
      {
        path: 'l10n/DEFAULT/dictionary',
        content: `dictionary = {
  ["DictKey_1"] = "Alpha",
}`,
      },
    ]);
    const result = await readMizDictionaryEntries(mizFile);
    const state = useMizTranslationState();

    state.loadMizResult(result);
    state.setEntryTranslatedText('DictKey_1', '翻訳');
    state.markDownloadSucceeded();
    state.requestClose();

    expect(state.isCloseConfirmDialogOpen.value).toBe(false);
    expect(state.isDialogOpen.value).toBe(false);
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
