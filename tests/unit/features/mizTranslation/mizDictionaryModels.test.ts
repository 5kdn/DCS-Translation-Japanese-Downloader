import { describe, expect, expectTypeOf, it } from 'vitest';
import type { MizDictionaryFilter } from '@/features/mizTranslation/mizDictionaryModels';

describe('mizDictionaryModels', () => {
  it('MizDictionaryFilter を指示書どおりの 5 条件で構築できる', () => {
    const filter: MizDictionaryFilter = {
      showEnabled: true,
      showDisabled: true,
      showOnlyUntranslated: false,
      hideNonTranslatable: true,
      hideEmptySourceText: true,
    };

    expect(filter).toEqual({
      showEnabled: true,
      showDisabled: true,
      showOnlyUntranslated: false,
      hideNonTranslatable: true,
      hideEmptySourceText: true,
    });
  });

  it('MizDictionaryFilter が仕様上のプロパティだけを持つ', () => {
    expectTypeOf<MizDictionaryFilter>().toEqualTypeOf<{
      showEnabled: boolean;
      showDisabled: boolean;
      showOnlyUntranslated: boolean;
      hideNonTranslatable: boolean;
      hideEmptySourceText: boolean;
    }>();
  });
});
