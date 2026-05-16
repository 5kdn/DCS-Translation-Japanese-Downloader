import { describe, expect, it } from 'vitest';
import {
  inferUploadTargetType,
  normalizeFolderRelativePath,
  parseSelectedFolder,
  UploadDialogError,
  validateSelectedEntries,
} from '@/features/upload/uploadDialogDomain';

const createRelativeFile = (relativePath: string, content: string): File => {
  const fileName = relativePath.split('/').at(-1) ?? 'file.txt';
  const file = new File([content], fileName, { type: 'text/plain' });
  Object.defineProperty(file, 'webkitRelativePath', {
    configurable: true,
    value: relativePath,
  });
  return file;
};

const createTypedRelativeFile = (relativePath: string, content: string, type: string): File => {
  const fileName = relativePath.split('/').at(-1) ?? 'file.txt';
  const file = new File([content], fileName, { type });
  Object.defineProperty(file, 'webkitRelativePath', {
    configurable: true,
    value: relativePath,
  });
  return file;
};

describe('uploadDialogDomain', () => {
  it('DCSWorld/Mods/aircraft 配下を Aircraft と判定する', () => {
    const files = [createRelativeFile('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt', 'briefing')];

    const result = parseSelectedFolder(files);

    expect(result.targetType).toBe('Aircraft');
    expect(result.targetName).toBe('F-16C');
    expect(inferUploadTargetType(result.entries)).toBe('Aircraft');
  });

  it('UserMissions/Campaigns 配下を User Campaign と判定する', () => {
    const files = [
      createRelativeFile('UserMissions/Campaigns/Sample Campaign/mission_01.miz/l10n/JP/dictionary', 'dictionary'),
    ];

    const result = parseSelectedFolder(files);

    expect(result.targetType).toBe('User Campaign');
    expect(result.targetName).toBe('Sample Campaign');
  });

  it('先頭フォルダーを自動補正する', () => {
    expect(normalizeFolderRelativePath('DCSWorld\\Mods\\aircraft\\F-16C\\Missions\\QuickStart\\briefing.txt')).toBe(
      'DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt',
    );
  });

  it('許可されない prefix を含む場合はエラーにする', () => {
    expect(() => {
      validateSelectedEntries([{ path: 'foo/bar.txt', isDirectory: false }], 'foo', 1);
    }).toThrowError(UploadDialogError);
  });

  it('親フォルダー付きのパスはエラーにする', () => {
    const files = [createRelativeFile('sample-root/DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt', 'briefing')];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(/ルートフォルダーが許可されていません/);
  });

  it('UserMissions 配下を User Mission と判定する', () => {
    const files = [createRelativeFile('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', 'dictionary')];

    const result = parseSelectedFolder(files);

    expect(result.targetType).toBe('User Mission');
    expect(result.targetName).toBe('Sample');
  });

  it('複数トップレベル対象を同時に含む場合はエラーにする', () => {
    const files = [
      createRelativeFile('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt', 'briefing'),
      createRelativeFile('DCSWorld/Mods/campaigns/The Enemy Within/mission_01.miz/l10n/JP/dictionary', 'dictionary'),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(/同時に含めることはできません/);
  });

  it('PDF を含む場合は専用エラーにする', () => {
    const files = [
      createRelativeFile('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt', 'briefing'),
      createTypedRelativeFile('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/manual.pdf', 'pdf', 'application/pdf'),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(
      [
        '現在PDFはアップロードすることができません。',
        'PDF、画像、音声、映像ファイルはアップロードできません。(DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/manual.pdf)',
        '',
        'PDFを削除して再度アップロードを実行してください。',
      ].join('\n'),
    );
  });

  it('画像ファイルを含む場合は専用エラーにする', () => {
    const files = [
      createRelativeFile('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', 'dictionary'),
      createTypedRelativeFile('UserMissions/Sample/briefing/image.jpg', 'image', 'image/jpeg'),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(
      [
        '現在画像ファイルはアップロードすることができません。',
        'PDF、画像、音声、映像ファイルはアップロードできません。(UserMissions/Sample/briefing/image.jpg)',
        '',
        '画像ファイルを削除して再度アップロードを実行してください。',
      ].join('\n'),
    );
  });

  it('音声ファイルを含む場合は専用エラーにする', () => {
    const files = [
      createRelativeFile('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', 'dictionary'),
      createTypedRelativeFile('UserMissions/Sample/briefing/voice.mp3', 'audio', 'audio/mpeg'),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(
      [
        '現在音声ファイルはアップロードすることができません。',
        'PDF、画像、音声、映像ファイルはアップロードできません。(UserMissions/Sample/briefing/voice.mp3)',
        '',
        '音声ファイルを削除して再度アップロードを実行してください。',
      ].join('\n'),
    );
  });

  it('映像ファイルを含む場合は専用エラーにする', () => {
    const files = [
      createRelativeFile('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', 'dictionary'),
      createTypedRelativeFile('UserMissions/Sample/briefing/movie.mp4', 'video', 'video/mp4'),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(
      [
        '現在映像ファイルはアップロードすることができません。',
        'PDF、画像、音声、映像ファイルはアップロードできません。(UserMissions/Sample/briefing/movie.mp4)',
        '',
        '映像ファイルを削除して再度アップロードを実行してください。',
      ].join('\n'),
    );
  });

  it('MIME が空でも pdf 拡張子ならエラーにする', () => {
    const files = [
      createRelativeFile('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt', 'briefing'),
      createTypedRelativeFile('DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/manual.pdf', 'pdf', ''),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(/manual\.pdf/);
  });

  it('拡張子が通常でも image MIME ならエラーにする', () => {
    const files = [
      createRelativeFile('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', 'dictionary'),
      createTypedRelativeFile('UserMissions/Sample/assets/preview.dat', 'image', 'image/png'),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(/preview\.dat/);
  });

  it('MIME が空でも音声拡張子ならエラーにする', () => {
    const files = [
      createRelativeFile('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', 'dictionary'),
      createTypedRelativeFile('UserMissions/Sample/briefing/voice.mp3', 'audio', ''),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(/voice\.mp3/);
  });

  it('拡張子が通常でも audio MIME ならエラーにする', () => {
    const files = [
      createRelativeFile('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', 'dictionary'),
      createTypedRelativeFile('UserMissions/Sample/assets/voice.dat', 'audio', 'audio/ogg'),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(/voice\.dat/);
  });

  it('MIME が空でも映像拡張子ならエラーにする', () => {
    const files = [
      createRelativeFile('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', 'dictionary'),
      createTypedRelativeFile('UserMissions/Sample/briefing/movie.mp4', 'video', ''),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(/movie\.mp4/);
  });

  it('拡張子が通常でも video MIME ならエラーにする', () => {
    const files = [
      createRelativeFile('UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary', 'dictionary'),
      createTypedRelativeFile('UserMissions/Sample/assets/movie.dat', 'video', 'video/webm'),
    ];

    expect(() => {
      parseSelectedFolder(files);
    }).toThrow(/movie\.dat/);
  });
});
