import type { RegexRule } from './types';

/** convert.py RULES preset — applied as factory defaults */
export const RULE_COUNT = 6;

const LEFT_QUOTE = '\u201C'; // "
const RIGHT_QUOTE = '\u201D'; // "

export function createConvertPresetRules(): RegexRule[] {
  return [
    {
      id: 1,
      enabled: true,
      // 줄바꿈(빈 줄 포함) + 주변 공백 → 공백 1개
      pattern: String.raw`[ \t]*\r?\n+[ \t]*`,
      replacement: ' ',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 2,
      enabled: true,
      // '다.' 뒤 공백 → 줄바꿈 (직전 문장 10자 미만이면 붙임)
      pattern: `(?<=[^${LEFT_QUOTE}.\\n]{10}다\\.) +`,
      replacement: '\n',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 3,
      enabled: true,
      // 여는 따옴표 앞에서 줄바꿈
      pattern: ` *${LEFT_QUOTE}`,
      replacement: `\n${LEFT_QUOTE}`,
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 4,
      enabled: true,
      // 닫는 따옴표 뒤에서 줄바꿈
      pattern: `${RIGHT_QUOTE} *`,
      replacement: `${RIGHT_QUOTE}\n`,
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 5,
      enabled: true,
      // 줄 끝 공백 제거
      pattern: String.raw`[ \t]+$`,
      replacement: '',
      flags: { g: true, i: false, m: true, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 6,
      enabled: true,
      // 문서 앞뒤 공백 정리
      pattern: String.raw`^\s+|\s+$`,
      replacement: '',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
  ];
}

export function createEmptyRules(): RegexRule[] {
  return Array.from({ length: RULE_COUNT }, (_, i) => ({
    id: i + 1,
    enabled: true,
    pattern: '',
    replacement: '',
    flags: { g: true, i: false, m: false, s: false },
    matchCount: null,
    error: null,
  }));
}
