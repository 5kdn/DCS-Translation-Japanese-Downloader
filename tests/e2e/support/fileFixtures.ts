import JSZip from 'jszip';

export type BrowserFilePayload = {
  name: string;
  type: string;
  bytes: number[];
  relativePath?: string;
};

const textFile = (relativePath: string, content: string, type = 'text/plain'): BrowserFilePayload => {
  const segments = relativePath.split('/');
  return {
    name: segments[segments.length - 1] ?? 'file.txt',
    type,
    bytes: [...Buffer.from(content, 'utf8')],
    relativePath,
  };
};

const MIZ_DICTIONARY_LINES = [
  'dictionary = {',
  '  ["DictKey_sortie_10"] = "Sortie text",',
  '  ["DictKey_descriptionText_20"] = "Description text",',
  '  ["DictKey_descriptionBlueTask_30"] = "Blue task text",',
  '  ["DictKey_descriptionRedTask_40"] = "Red task text",',
  '  ["DictKey_descriptionNeutralsTask_50"] = "Neutral task text",',
  '  ["DictKey_60"] = "Alpha source",',
  '  ["DictKey_WptName_70"] = "Waypoint source",',
  '}',
] as const;

/**
 * @summary サンプル MIZ を生成する。
 * @returns MIZ ファイル payload を返す。
 */
export const createSampleMizFilePayload = async (): Promise<BrowserFilePayload> => {
  const archive = new JSZip();
  archive.file('l10n/DEFAULT/dictionary', MIZ_DICTIONARY_LINES.join('\n'));
  const buffer = await archive.generateAsync({ type: 'uint8array' });
  return {
    name: 'storybook-sample.miz',
    type: 'application/zip',
    bytes: [...buffer],
  };
};

/**
 * @summary import 用 dictionary ファイル payload を返す。
 * @returns dictionary payload を返す。
 */
export const createImportedDictionaryPayload = (): BrowserFilePayload => {
  return {
    name: 'dictionary',
    type: 'text/plain',
    bytes: [
      ...Buffer.from(
        'dictionary = {\n  ["DictKey_60"] = "Imported translation",\n  ["DictKey_999"] = "Ignored translation",\n}',
        'utf8',
      ),
    ],
  };
};

export const createAircraftFolderFiles = (prefix = ''): BrowserFilePayload[] => {
  return [textFile(`${prefix}DCSWorld/Mods/aircraft/F-16C/Missions/QuickStart/briefing.txt`, 'briefing')];
};

export const createDlcCampaignFolderFiles = (prefix = ''): BrowserFilePayload[] => {
  return [textFile(`${prefix}DCSWorld/Mods/campaigns/The Enemy Within/mission_01.miz/l10n/JP/dictionary`, 'dictionary')];
};

export const createUserMissionFolderFiles = (options?: { prefix?: string; includeReadme?: boolean }): BrowserFilePayload[] => {
  const prefix = options?.prefix ?? '';
  const files = [textFile(`${prefix}UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary`, 'dictionary')];
  if (options?.includeReadme === true) {
    files.push(textFile(`${prefix}UserMissions/Sample/README_Translation.md`, '# README'));
  }
  return files;
};

export const createUserCampaignFolderFiles = (options?: { prefix?: string; includeReadme?: boolean }): BrowserFilePayload[] => {
  const prefix = options?.prefix ?? '';
  const files = [textFile(`${prefix}UserMissions/Campaigns/Sample Campaign/mission_01.miz/l10n/JP/dictionary`, 'dictionary')];
  if (options?.includeReadme === true) {
    files.push(textFile(`${prefix}UserMissions/Campaigns/Sample Campaign/README_Translation.md`, '# README'));
  }
  return files;
};

export const createRelativeFile = textFile;
