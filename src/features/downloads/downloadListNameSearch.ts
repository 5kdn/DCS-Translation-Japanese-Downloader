/**
 * @summary 名称検索用に文字列を正規化する。
 * @param value 正規化対象の文字列を指定する。
 * @returns 区切り文字と大文字小文字差を吸収した文字列を返す。
 */
export const normalizeDownloadListNameSearchText = (value: string): string => {
  return value.toLocaleLowerCase().replaceAll(/[\s\-_]+/g, '');
};

/**
 * @summary 検索文字列が候補文字列の部分列として一致するか判定する。
 * @param candidate 候補文字列を指定する。
 * @param searchText 検索文字列を指定する。
 * @returns 検索文字列の文字順を保って含まれる場合に true を返す。
 */
export const isDownloadListNameSubsequenceMatch = (candidate: string, searchText: string): boolean => {
  if (searchText.length === 0) return true;

  let searchIndex = 0;
  for (const character of candidate) {
    if (character !== searchText[searchIndex]) continue;

    searchIndex += 1;
    if (searchIndex >= searchText.length) {
      return true;
    }
  }

  return false;
};

/**
 * @summary 検索文字列が候補名称へ一致するか判定する。
 * @param candidate 候補名称を指定する。
 * @param searchText 検索文字列を指定する。
 * @returns 部分一致または部分列一致する場合に true を返す。
 */
export const matchesDownloadListNameSearch = (candidate: string, searchText: string): boolean => {
  const normalizedCandidate = normalizeDownloadListNameSearchText(candidate);
  const normalizedSearchText = normalizeDownloadListNameSearchText(searchText.trim());
  if (normalizedSearchText.length === 0) return true;

  if (normalizedCandidate.includes(normalizedSearchText)) {
    return true;
  }

  return isDownloadListNameSubsequenceMatch(normalizedCandidate, normalizedSearchText);
};

/**
 * @summary 名称候補一覧から検索条件に一致する候補だけを抽出する。
 * @param candidates 候補名称一覧を指定する。
 * @param searchText 検索文字列を指定する。
 * @returns 検索条件に一致する候補一覧を返す。
 */
export const filterDownloadListNameCandidates = (candidates: readonly string[], searchText: string): string[] => {
  return candidates.filter((candidate: string): boolean => {
    return matchesDownloadListNameSearch(candidate, searchText);
  });
};
