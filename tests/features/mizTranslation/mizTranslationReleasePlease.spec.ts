import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('mizTranslation release-please integration', () => {
  it('release-please config に generator version ファイルを extra-files として登録する', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), '.release-please-config.json'), 'utf-8')) as {
      packages?: Record<string, { 'extra-files'?: Array<{ type: string; path: string }> }>;
    };

    expect(config.packages?.['.']?.['extra-files']).toContainEqual({
      type: 'generic',
      path: 'src/features/mizTranslation/mizTranslationGeneratorVersion.ts',
    });
  });

  it('generator version ファイルに release-please 注釈を含める', () => {
    const content = readFileSync(
      resolve(process.cwd(), 'src/features/mizTranslation/mizTranslationGeneratorVersion.ts'),
      'utf-8',
    );

    expect(content).toContain('<!-- x-release-please-version -->');
  });
});
