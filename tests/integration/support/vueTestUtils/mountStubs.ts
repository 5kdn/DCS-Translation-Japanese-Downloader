import type { MountingOptions } from '@vue/test-utils';

type GlobalMountOptions = NonNullable<MountingOptions<unknown>['global']>;
type MountStubs = NonNullable<GlobalMountOptions['stubs']>;

/**
 * mount 用の stub 定義を浅く複製する。
 * @param stubs mount 時に利用する stub 定義を指定する。
 * @returns 複製した stub 定義を返す。
 */
export const cloneMountStubs = (stubs?: MountStubs): MountStubs => {
  return { ...(stubs ?? {}) };
};

/**
 * 既定の stub 定義とテスト固有の stub 定義を結合する。
 * @param base 既定の stub 定義を指定する。
 * @param overrides テスト固有の stub 定義を指定する。
 * @returns 結合した stub 定義を返す。
 */
export const mergeMountStubs = (base?: MountStubs, overrides?: MountStubs): MountStubs => {
  return {
    ...cloneMountStubs(base),
    ...cloneMountStubs(overrides),
  };
};
