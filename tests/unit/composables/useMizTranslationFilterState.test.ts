import { describe, expect, it } from 'vitest';
import { useMizTranslationFilterState } from '@/composables/useMizTranslationFilterState';

describe('useMizTranslationFilterState', () => {
  it('フィルター初期値を仕様どおりに保持する', () => {
    const state = useMizTranslationFilterState();

    expect(state.filter.value).toEqual({
      showEnabled: true,
      showDisabled: true,
      showOnlyUntranslated: false,
      hideNonTranslatable: true,
      hideEmptySourceText: true,
    });
  });

  it('フィルターを更新して初期値へ戻せる', () => {
    const state = useMizTranslationFilterState();

    state.setShowEnabled(false);
    state.setShowDisabled(false);
    state.setShowOnlyUntranslated(true);
    state.setHideNonTranslatable(false);
    state.setHideEmptySourceText(false);

    expect(state.filter.value).toEqual({
      showEnabled: false,
      showDisabled: false,
      showOnlyUntranslated: true,
      hideNonTranslatable: false,
      hideEmptySourceText: false,
    });

    state.resetFilter();

    expect(state.filter.value).toEqual({
      showEnabled: true,
      showDisabled: true,
      showOnlyUntranslated: false,
      hideNonTranslatable: true,
      hideEmptySourceText: true,
    });
  });
});
