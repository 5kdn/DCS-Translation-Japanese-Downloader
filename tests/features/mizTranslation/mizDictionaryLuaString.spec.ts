import { describe, expect, it } from 'vitest';
import { decodeLuaStringLiteral, encodeLuaStringLiteral } from '@/features/mizTranslation/mizDictionaryLuaString';

describe('mizDictionaryLuaString', () => {
  it('Lua エスケープをデコードできる', () => {
    expect(decodeLuaStringLiteral('"line1\\nline2\\t\\\\\\"quote\\""')).toBe('line1\nline2\t\\"quote"');
  });

  it('10進数・16進数・Unicode の Lua エスケープをデコードできる', () => {
    expect(decodeLuaStringLiteral('"\\65\\x42\\u{43}"')).toBe('ABC');
  });

  it('改行を含む値を Lua 文字列へ再エスケープできる', () => {
    expect(encodeLuaStringLiteral('line1\nline2\t\\"quote"')).toBe('"line1\\nline2\\t\\\\\\"quote\\""');
  });
});
