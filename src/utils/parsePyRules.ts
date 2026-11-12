import type { RegexFlags, RegexRule } from '../types';

export const DEFAULT_PY_PATH = '/convert.py';

function decodePythonEscape(ch: string): string {
  switch (ch) {
    case 'n':
      return '\n';
    case 't':
      return '\t';
    case 'r':
      return '\r';
    case '\\':
      return '\\';
    case "'":
      return "'";
    case '"':
      return '"';
    default:
      return ch;
  }
}

function skipWhitespace(input: string, pos: number): number {
  while (pos < input.length && /\s/.test(input[pos]!)) pos += 1;
  return pos;
}

function readPythonString(
  input: string,
  pos: number,
): { value: string; end: number } | null {
  pos = skipWhitespace(input, pos);
  let raw = false;
  if (input.startsWith('r', pos)) {
    const next = input[pos + 1];
    if (next === "'" || next === '"') {
      raw = true;
      pos += 1;
    }
  }
  const quote = input[pos];
  if (quote !== "'" && quote !== '"') return null;
  pos += 1;

  let value = '';
  while (pos < input.length) {
    const ch = input[pos]!;
    if (!raw && ch === '\\') {
      pos += 1;
      if (pos >= input.length) break;
      value += decodePythonEscape(input[pos]!);
      pos += 1;
      continue;
    }
    if (ch === quote) {
      return { value, end: pos + 1 };
    }
    value += ch;
    pos += 1;
  }
  return null;
}

function parsePyFlags(expr: string): RegexFlags {
  const flags: RegexFlags = { g: true, i: false, m: false, s: false };
  const normalized = expr.trim();
  if (normalized === '0') return flags;
  if (/re\.M|MULTILINE/.test(normalized)) flags.m = true;
  if (/re\.I|IGNORECASE/.test(normalized)) flags.i = true;
  if (/re\.S|DOTALL/.test(normalized)) flags.s = true;
  return flags;
}

function parseTuple(
  input: string,
  start: number,
): { pattern: string; replacement: string; flags: RegexFlags; end: number } | null {
  let pos = start;
  if (input[pos] !== '(') return null;
  pos += 1;

  const patternPart = readPythonString(input, pos);
  if (!patternPart) return null;
  pos = skipWhitespace(input, patternPart.end);
  if (input[pos] !== ',') return null;
  pos += 1;

  const replacementPart = readPythonString(input, pos);
  if (!replacementPart) return null;
  pos = skipWhitespace(input, replacementPart.end);
  if (input[pos] !== ',') return null;
  pos += 1;

  pos = skipWhitespace(input, pos);
  const flagsStart = pos;
  while (pos < input.length && input[pos] !== ')') pos += 1;
  if (input[pos] !== ')') return null;
  const flagsExpr = input.slice(flagsStart, pos);
  pos += 1;

  return {
    pattern: patternPart.value,
    replacement: replacementPart.value,
    flags: parsePyFlags(flagsExpr),
    end: pos,
  };
}

function extractRulesBlock(content: string): string {
  const rulesIdx = content.indexOf('RULES');
  if (rulesIdx < 0) {
    throw new Error('RULES 목록을 찾을 수 없습니다.');
  }
  const openBracket = content.indexOf('[', rulesIdx);
  if (openBracket < 0) {
    throw new Error('RULES = [ ... ] 형식이 아닙니다.');
  }

  let depth = 0;
  for (let i = openBracket; i < content.length; i += 1) {
    const ch = content[i]!;
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(openBracket + 1, i);
      }
    }
  }
  throw new Error('RULES 배열이 닫히지 않았습니다.');
}

export function parsePyRules(content: string): RegexRule[] {
  const block = extractRulesBlock(content);
  const rules: RegexRule[] = [];
  let pos = 0;

  while (pos < block.length) {
    pos = skipWhitespace(block, pos);
    if (pos >= block.length) break;
    if (block[pos] === '#') {
      const nextLine = block.indexOf('\n', pos);
      pos = nextLine < 0 ? block.length : nextLine + 1;
      continue;
    }
    if (block[pos] !== '(') {
      pos += 1;
      continue;
    }

    const tuple = parseTuple(block, pos);
    if (!tuple) {
      pos += 1;
      continue;
    }

    rules.push({
      id: rules.length + 1,
      enabled: true,
      pattern: tuple.pattern,
      replacement: tuple.replacement,
      flags: tuple.flags,
      matchCount: null,
      error: null,
    });
    pos = tuple.end;
    if (block[pos] === ',') pos += 1;
  }

  if (rules.length === 0) {
    throw new Error('파싱된 규칙이 없습니다.');
  }

  return rules;
}

export function mergePyRulesWithStored(
  pyRules: RegexRule[],
  stored: Pick<RegexRule, 'id' | 'enabled'>[] | null,
): RegexRule[] {
  if (!stored?.length) return pyRules;
  return pyRules.map((rule, index) => {
    const saved = stored.find((item) => item.id === rule.id) ?? stored[index];
    if (!saved) return rule;
    return { ...rule, enabled: saved.enabled };
  });
}
