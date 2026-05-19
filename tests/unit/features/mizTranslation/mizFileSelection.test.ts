import { describe, expect, it } from 'vitest';
import {
  isMizFileName,
  MIZ_TRANSLATION_FILE_EXTENSIONS,
  MizFileSelectionError,
  normalizeMizFileSelection,
  validateSelectedMizFile,
} from '@/features/mizTranslation/mizFileSelection';

describe('mizFileSelection', () => {
  it('MizTranslation 対象拡張子を大文字小文字を区別せず判定する', () => {
    expect(MIZ_TRANSLATION_FILE_EXTENSIONS).toEqual(['.miz', '.trk']);
    expect(isMizFileName('mission.miz')).toBe(true);
    expect(isMizFileName('MISSION.MIZ')).toBe(true);
    expect(isMizFileName('track.trk')).toBe(true);
    expect(isMizFileName('TRACK.TRK')).toBe(true);
    expect(isMizFileName('mission.zip')).toBe(false);
  });

  it('単一 File と配列入力を File 配列へ正規化する', () => {
    const file = new File(['data'], 'mission.miz', { type: 'application/zip' });

    expect(normalizeMizFileSelection(file)).toEqual([file]);
    expect(normalizeMizFileSelection([file])).toEqual([file]);
    expect(normalizeMizFileSelection(null)).toEqual([]);
  });

  it('単一の .miz または .trk ファイルだけを受け付ける', () => {
    const mizFile = new File(['data'], 'mission.miz', { type: 'application/zip' });
    const trkFile = new File(['data'], 'track.TRK', { type: 'application/zip' });

    expect(validateSelectedMizFile([mizFile])).toBe(mizFile);
    expect(validateSelectedMizFile([trkFile])).toBe(trkFile);
    expect(() => validateSelectedMizFile([])).toThrowError(MizFileSelectionError);
    expect(() => validateSelectedMizFile([mizFile, trkFile])).toThrowError(MizFileSelectionError);
    expect(() => validateSelectedMizFile([new File(['data'], 'mission.zip', { type: 'application/zip' })])).toThrowError(
      MizFileSelectionError,
    );
  });
});
