export const DownloadListCategoryKey = {
  Aircrafts: 'aircrafts',
  DlcCampaigns: 'dlcCampaigns',
  UserCampaigns: 'userCampaigns',
  UserMissions: 'userMissions',
} as const;

export type DownloadListCategoryKey = (typeof DownloadListCategoryKey)[keyof typeof DownloadListCategoryKey];

export type DownloadListCategoryDefinition = {
  key: DownloadListCategoryKey;
  label: string;
  prefix: string;
  ignorePatterns: string[];
};

export const DOWNLOAD_LIST_CATEGORIES: readonly DownloadListCategoryDefinition[] = [
  {
    key: DownloadListCategoryKey.Aircrafts,
    label: 'Aircrafts',
    prefix: 'DCSWorld/Mods/aircraft/',
    ignorePatterns: [],
  },
  {
    key: DownloadListCategoryKey.DlcCampaigns,
    label: 'DLC Campaigns',
    prefix: 'DCSWorld/Mods/campaigns/',
    ignorePatterns: [],
  },
  {
    key: DownloadListCategoryKey.UserCampaigns,
    label: 'User Campaigns',
    prefix: 'UserMissions/Campaigns/',
    ignorePatterns: [],
  },
  {
    key: DownloadListCategoryKey.UserMissions,
    label: 'User Missions',
    prefix: 'UserMissions/',
    ignorePatterns: ['UserMissions/Campaigns/'],
  },
] as const;
