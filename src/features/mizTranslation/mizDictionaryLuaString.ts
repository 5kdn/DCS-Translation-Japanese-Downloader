/**
 * @summary Lua の文字列リテラルをデコードする。
 * @param literal ダブルクォートまたはシングルクォートを含む Lua 文字列リテラルを指定する。
 * @returns デコード後の文字列を返す。
 */
export const decodeLuaStringLiteral = (literal: string): string => {
  if (literal.length < 2) {
    throw new Error('Lua 文字列リテラルが不正です。');
  }

  const quote = literal[0];
  if ((quote !== '"' && quote !== "'") || literal.at(-1) !== quote) {
    throw new Error('Lua 文字列リテラルが不正です。');
  }

  let index = 1;
  let decoded = '';

  while (index < literal.length - 1) {
    const char = literal[index];
    if (char !== '\\') {
      decoded += char;
      index += 1;
      continue;
    }

    const next = literal[index + 1];
    if (next === undefined) {
      throw new Error('Lua エスケープシーケンスが不正です。');
    }

    if (next === '\r') {
      decoded += '\n';
      index += literal[index + 2] === '\n' ? 3 : 2;
      continue;
    }

    if (next === '\n') {
      decoded += '\n';
      index += 2;
      continue;
    }

    const escaped = LUA_ESCAPE_SEQUENCES[next];
    if (escaped !== undefined) {
      decoded += escaped;
      index += 2;
      continue;
    }

    if (next === 'z') {
      index += 2;
      while (index < literal.length - 1) {
        const whitespace = literal[index];
        if (
          whitespace !== ' ' &&
          whitespace !== '\t' &&
          whitespace !== '\n' &&
          whitespace !== '\r' &&
          whitespace !== '\f' &&
          whitespace !== '\v'
        ) {
          break;
        }

        index += 1;
      }
      continue;
    }

    if (/[0-9]/.test(next)) {
      const decimalDigits = literal.slice(index + 1, index + 4).match(/^\d{1,3}/)?.[0];
      if (decimalDigits === undefined) {
        throw new Error('Lua エスケープシーケンスが不正です。');
      }

      decoded += String.fromCodePoint(Number.parseInt(decimalDigits, 10));
      index += 1 + decimalDigits.length;
      continue;
    }

    if (next === 'x') {
      const hexDigits = literal.slice(index + 2, index + 4);
      if (!/^[0-9A-Fa-f]{2}$/.test(hexDigits)) {
        throw new Error('Lua エスケープシーケンスが不正です。');
      }

      decoded += String.fromCodePoint(Number.parseInt(hexDigits, 16));
      index += 4;
      continue;
    }

    if (next === 'u') {
      if (literal[index + 2] !== '{') {
        throw new Error('Lua エスケープシーケンスが不正です。');
      }

      const closeIndex = literal.indexOf('}', index + 3);
      if (closeIndex === -1) {
        throw new Error('Lua エスケープシーケンスが不正です。');
      }

      const codePointHex = literal.slice(index + 3, closeIndex);
      if (!/^[0-9A-Fa-f]+$/.test(codePointHex)) {
        throw new Error('Lua エスケープシーケンスが不正です。');
      }

      decoded += String.fromCodePoint(Number.parseInt(codePointHex, 16));
      index = closeIndex + 1;
      continue;
    }

    throw new Error(`未対応の Lua エスケープシーケンスです。(\\${next})`);
  }

  return decoded;
};

/**
 * @summary 任意文字列を Lua のダブルクォート文字列としてエンコードする。
 * @param value エンコード対象の文字列を指定する。
 * @returns Lua のダブルクォート文字列リテラルを返す。
 */
export const encodeLuaStringLiteral = (value: string): string => {
  let encoded = '"';

  for (const char of value) {
    if (LUA_REVERSE_ESCAPE_SEQUENCES[char] !== undefined) {
      encoded += LUA_REVERSE_ESCAPE_SEQUENCES[char];
      continue;
    }

    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined && (codePoint < 0x20 || codePoint === 0x7f)) {
      encoded += `\\x${codePoint.toString(16).padStart(2, '0')}`;
      continue;
    }

    encoded += char;
  }

  encoded += '"';
  return encoded;
};

const LUA_ESCAPE_SEQUENCES: Record<string, string> = {
  a: '\u0007',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
  '\\': '\\',
  '"': '"',
  "'": "'",
};

const LUA_REVERSE_ESCAPE_SEQUENCES: Record<string, string> = {
  '\u0007': '\\a',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\v': '\\v',
  '\\': '\\\\',
  '"': '\\"',
};
