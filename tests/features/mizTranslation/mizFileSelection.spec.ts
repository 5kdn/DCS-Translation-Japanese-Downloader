import { describe, expect, it } from 'vitest';
import {
  isMizFileName,
  MizFileSelectionError,
  normalizeMizFileSelection,
  validateSelectedMizFile,
} from '@/features/mizTranslation/mizFileSelection';

describe('mizFileSelection', () => {
  it('.miz 拡張子を大文字小文字を区別せず判定する', () => {
    expect(isMizFileName('mission.miz')).toBe(true);
    expect(isMizFileName('MISSION.MIZ')).toBe(true);
    expect(isMizFileName('mission.zip')).toBe(false);
  });

  it('単一 File と配列入力を File 配列へ正規化する', () => {
    const file = new File(['data'], 'mission.miz', { type: 'application/zip' });

    expect(normalizeMizFileSelection(file)).toEqual([file]);
    expect(normalizeMizFileSelection([file])).toEqual([file]);
    expect(normalizeMizFileSelection(null)).toEqual([]);
  });

  it('単一の .miz ファイルだけを受け付ける', () => {
    const file = new File(['data'], 'mission.miz', { type: 'application/zip' });

    expect(validateSelectedMizFile([file])).toBe(file);
    expect(() => validateSelectedMizFile([])).toThrowError(MizFileSelectionError);
    expect(() => validateSelectedMizFile([file, file])).toThrowError(MizFileSelectionError);
    expect(() => validateSelectedMizFile([new File(['data'], 'mission.zip', { type: 'application/zip' })])).toThrowError(
      MizFileSelectionError,
    );
  });
});
