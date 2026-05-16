import { describe, expect, it } from 'vitest';
import {
  buildExpectedReadmePath,
  hasMeaningfulReadmeChange,
  isReadmeTextValid,
  normalizeReadmeForValidation,
} from '@/features/upload/uploadDialogReadme';

describe('uploadDialogReadme', () => {
  it('User Mission の README パスを生成する', () => {
    expect(buildExpectedReadmePath('User Mission', 'Sample')).toBe('UserMissions/Sample/README_Translation.md');
  });

  it('User Campaign の README パスを生成する', () => {
    expect(buildExpectedReadmePath('User Campaign', 'Sample Campaign')).toBe(
      'UserMissions/Campaigns/Sample Campaign/README_Translation.md',
    );
  });

  it('空白文字を除外して比較する', () => {
    expect(normalizeReadmeForValidation('a b\nc\t d')).toBe('abcd');
  });

  it('空白以外の差分が無い場合は無効にする', () => {
    expect(isReadmeTextValid('template', 'abc\n def', 'a b c d e f')).toBe(false);
  });

  it('45文字以上で差分がある場合は有効にする', () => {
    expect(
      isReadmeTextValid(
        'template',
        '# template',
        '# template\nOriginal source: Example package.\nTranslator notes: Enough content for validation.',
      ),
    ).toBe(true);
  });

  it('リポジトリ起点では初期値のままでも有効にする', () => {
    expect(isReadmeTextValid('repository', '# Existing README', '# Existing README')).toBe(true);
  });

  it('リポジトリ起点でも空文字は無効にする', () => {
    expect(isReadmeTextValid('repository', '# Existing README', ' \n\t ')).toBe(false);
  });

  it('空白だけの差分は未変更扱いにする', () => {
    expect(hasMeaningfulReadmeChange('# Existing README\nCurrent content.', '# Existing README \n\n Current content.')).toBe(
      false,
    );
  });

  it('本文差分がある場合は変更ありと判定する', () => {
    expect(hasMeaningfulReadmeChange('# Existing README\nCurrent content.', '# Existing README\nUpdated content.')).toBe(true);
  });
});
