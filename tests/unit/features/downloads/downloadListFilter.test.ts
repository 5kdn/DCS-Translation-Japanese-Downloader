import { describe, expect, it } from 'vitest';
import {
  applyDownloadListFilter,
  filterDownloadListRowsByName,
  filterDownloadListRowsByUpdatedAfter,
  sortDownloadListRowsByNameAsc,
} from '@/features/downloads/downloadListFilter';
import type { DownloadListFilter, DownloadListRow } from '@/features/downloads/downloadListModels';

const createRow = (name: string, updatedAt: string | null): DownloadListRow => {
  return {
    name,
    items: [],
    latestUpdatedAt: updatedAt === null ? null : new Date(updatedAt),
    directoryPath: name,
  };
};

describe('downloadListFilter', () => {
  it('名称フィルターをファジーマッチで適用する', () => {
    const rows = [
      createRow('F-16C', '2026-05-11T00:00:00Z'),
      createRow('FA-18C', '2026-05-10T00:00:00Z'),
      createRow('Operation Black Knight', '2026-05-09T00:00:00Z'),
    ];

    expect(filterDownloadListRowsByName(rows, 'f16')).toEqual([rows[0]]);
    expect(filterDownloadListRowsByName(rows, 'blkngt')).toEqual([rows[2]]);
  });

  it('日付フィルターで指定日以降のみ残す', () => {
    const rows = [
      createRow('Old', '2026-05-09T23:59:59Z'),
      createRow('Boundary', '2026-05-10T00:00:00Z'),
      createRow('New', '2026-05-11T00:00:00Z'),
      createRow('NoDate', null),
    ];

    expect(filterDownloadListRowsByUpdatedAfter(rows, new Date('2026-05-10T00:00:00Z'))).toEqual([rows[1], rows[2]]);
  });

  it('名称と日付のフィルターを同時適用する', () => {
    const rows = [
      createRow('F-16C', '2026-05-11T00:00:00Z'),
      createRow('F-14B', '2026-05-09T00:00:00Z'),
      createRow('MiG-29', '2026-05-11T00:00:00Z'),
    ];
    const filter: DownloadListFilter = {
      searchText: 'f-',
      updatedAfter: new Date('2026-05-10T00:00:00Z'),
    };

    expect(applyDownloadListFilter(rows, filter)).toEqual([rows[0]]);
  });

  it('名称の昇順で並べる', () => {
    const rows = [
      createRow('Zulu', '2026-05-10T00:00:00Z'),
      createRow('Alpha', '2026-05-10T00:00:00Z'),
      createRow('NoDate', null),
      createRow('Latest', '2026-05-11T00:00:00Z'),
    ];

    expect(sortDownloadListRowsByNameAsc(rows).map((row) => row.name)).toEqual(['Alpha', 'Latest', 'NoDate', 'Zulu']);
  });
});
