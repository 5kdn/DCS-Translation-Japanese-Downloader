import { describe, expect, it } from 'vitest';
import {
  createIssueCreateResponse,
  createPrCreateResponse,
  createRawFileResponse,
  createTreeResponse,
} from '../../shared/msw/services/appApiMockResponses';

describe('appApiMockResponses', () => {
  it('tree 応答で Date の updatedAt を ISO 文字列へ正規化する', () => {
    const response = createTreeResponse({
      apiBaseUrl: 'https://api.example.test',
      treeItems: [
        {
          path: 'UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary',
          type: 'blob',
          updatedAt: new Date('2026-05-09T00:00:00.000Z'),
        },
      ],
    });

    expect(response).toMatchObject({
      status: 200,
      body: {
        success: true,
        message: 'ok',
        data: [
          {
            path: 'UserMissions/Sample/Mission_01.miz/l10n/JP/dictionary',
            updatedAt: '2026-05-09T00:00:00.000Z',
          },
        ],
      },
    });
  });

  it('issue/create の失敗応答を共通生成する', () => {
    const response = createIssueCreateResponse({
      apiBaseUrl: 'https://api.example.test',
      createIssueErrorMessage: 'issue create failed',
    });

    expect(response).toEqual({
      status: 500,
      body: {
        success: false,
        message: 'issue create failed',
      },
    });
  });

  it('create-pr の失敗応答を共通生成する', () => {
    const response = createPrCreateResponse({
      apiBaseUrl: 'https://api.example.test',
      createPrErrorMessage: 'create pr failed',
    });

    expect(response).toEqual({
      status: 500,
      body: {
        success: false,
        message: 'create pr failed',
      },
    });
  });

  it('raw file 応答でバイナリとエラーを切り替える', () => {
    const binaryResponse = createRawFileResponse(
      {
        apiBaseUrl: 'https://api.example.test',
        rawBinaryByPath: {
          'UserMissions/Sample/file.bin': [1, 2, 3],
        },
      },
      'UserMissions/Sample/file.bin',
    );

    const errorResponse = createRawFileResponse(
      {
        apiBaseUrl: 'https://api.example.test',
        rawErrorPaths: ['UserMissions/Sample/error.txt'],
      },
      'UserMissions/Sample/error.txt',
    );

    expect(binaryResponse).toMatchObject({
      status: 200,
      contentType: 'application/octet-stream',
    });
    expect(binaryResponse.body).toEqual(Uint8Array.from([1, 2, 3]));
    expect(errorResponse).toEqual({
      status: 500,
      contentType: 'text/plain; charset=utf-8',
      body: 'failed',
    });
  });
});
