import { describe, expect, it } from 'vitest';
import {
  getInitialEnabledState,
  isBlankDictionarySourceText,
  isDictionaryKey,
  isTranslatableDictionaryKey,
} from '@/features/mizTranslation/mizDictionaryKey';

describe('mizDictionaryKey', () => {
  it.each([
    'DictKey_123',
    'DictKey_sortie_123',
    'DictKey_descriptionText_123',
    'DictKey_descriptionBlueTask_123',
    'DictKey_descriptionNeutralsTask_123',
    'DictKey_descriptionRedTask_123',
    'DictKey_subtitle_123',
    'DictKey_ActionText_123',
    'DictKey_ActionRadioText_123',
    'DictKey_ActionComment_123',
    'DictKey_WptName_123',
    'DictKey_GroupName_123',
    'DictKey_UnitName_123',
  ])('許可された dictionary key を受け入れる: %s', (key) => {
    expect(isDictionaryKey(key)).toBe(true);
  });

  it.each([
    'DictKey_123',
    'DictKey_sortie_123',
    'DictKey_descriptionText_123',
    'DictKey_descriptionBlueTask_123',
    'DictKey_descriptionNeutralsTask_123',
    'DictKey_descriptionRedTask_123',
    'DictKey_subtitle_123',
  ])('翻訳対象 key を判定できる: %s', (key) => {
    expect(isTranslatableDictionaryKey(key)).toBe(true);
  });

  it.each([
    'DictKey_ActionText_123',
    'DictKey_ActionRadioText_123',
    'DictKey_ActionComment_123',
    'DictKey_WptName_123',
    'DictKey_GroupName_123',
    'DictKey_UnitName_123',
  ])('翻訳対象外 key を判定できる: %s', (key) => {
    expect(isDictionaryKey(key)).toBe(true);
    expect(isTranslatableDictionaryKey(key)).toBe(false);
  });

  it.each([
    'DictKey__123',
    'DictKey_sortie_abc',
    'DictKey_description_123',
    'DictKey_unknown_123',
    'OtherKey_123',
  ])('不正な dictionary key を拒否する: %s', (key) => {
    expect(isDictionaryKey(key)).toBe(false);
    expect(isTranslatableDictionaryKey(key)).toBe(false);
  });

  it.each([
    'DictKey_123',
    'DictKey_sortie_123',
    'DictKey_descriptionText_123',
    'DictKey_descriptionBlueTask_123',
    'DictKey_descriptionNeutralsTask_123',
    'DictKey_descriptionRedTask_123',
    'DictKey_subtitle_123',
  ])('翻訳対象 key の初期有効状態を true にする: %s', (key) => {
    expect(getInitialEnabledState(key, 'Alpha')).toBe(true);
  });

  it.each([
    ['DictKey_123', ''],
    ['DictKey_123', '   '],
    ['DictKey_123', '\n\t'],
  ])('翻訳対象 key でも原文が空欄なら初期有効状態を false にする: %s', (key, sourceText) => {
    expect(getInitialEnabledState(key, sourceText)).toBe(false);
  });

  it.each([
    'DictKey_ActionText_123',
    'DictKey_ActionRadioText_123',
    'DictKey_ActionComment_123',
    'DictKey_WptName_123',
    'DictKey_GroupName_123',
    'DictKey_UnitName_123',
    'DictKey_unknown_123',
    'OtherKey_123',
  ])('翻訳対象外または不正な key の初期有効状態を false にする: %s', (key) => {
    expect(getInitialEnabledState(key, 'Alpha')).toBe(false);
  });

  it.each([
    ['', true],
    ['   ', true],
    ['\n\t', true],
    ['Alpha', false],
  ])('原文空欄判定を行う: %s', (sourceText, expected) => {
    expect(isBlankDictionarySourceText(sourceText)).toBe(expected);
  });
});
