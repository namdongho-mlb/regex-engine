import type { RegexRule } from './types';

/** 화면에 표시되지 않는 내장 기본 규칙 (항상 적용) */
export function createCoreBuiltinRules(): RegexRule[] {
  return [
    {
      id: 9101,
      enabled: true,
      pattern: ' {2,}',
      replacement: ' ',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 9102,
      enabled: true,
      pattern: String.raw`\]\s*`,
      replacement: ']\n',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 9103,
      enabled: true,
      pattern: String.raw`([^\w\s])\1+`,
      replacement: '$1',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
  ];
}

export const BUILTIN_RULE_LABELS: Record<number, string> = {
  9101: '연속 공백 → 1칸',
  9102: '"]" 뒤 줄바꿈',
  9103: '동일 기호 반복 축소',
};

export function builtinRuleLabel(ruleId: number, pattern: string): string {
  return BUILTIN_RULE_LABELS[ruleId] ?? `내장 규칙 (${pattern.slice(0, 24)})`;
}

export function isHiddenRuleId(id: number): boolean {
  return id >= 9000;
}
