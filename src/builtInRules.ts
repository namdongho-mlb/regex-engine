import type { RegexRule } from './types';

/** convert.py 전에 적용 — 괄호 생각문 정리 */
export function createPreConvertBuiltinRules(): RegexRule[] {
  return [
    {
      id: 9110,
      enabled: true,
      pattern: '__builtin_join_paren_close__',
      replacement: '',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
  ];
}

/** convert.py 직후 — 괄호 생각문 줄 단위 배치 */
export function createPostConvertBuiltinRules(): RegexRule[] {
  return [
    {
      id: 9111,
      enabled: true,
      pattern: '__builtin_paren_thought_layout__',
      replacement: '',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
  ];
}

/** 화면에 표시되지 않는 내장 기본 규칙 (항상 적용) */
export function createCoreBuiltinRules(): RegexRule[] {
  return [
    {
      id: 9109,
      enabled: true,
      // 괄호 안 한자 주석 삭제: 해외(海外) → 해외
      pattern: String.raw`(?:\(|[\uFF08])[^)\uFF09\r\n]*[\u4E00-\u9FFF\u3400-\u4DBF][^)\uFF09\r\n]*(?:\)|[\uFF09])`,
      replacement: '',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
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
    {
      id: 9104,
      enabled: true,
      pattern: '__builtin_dialogue_corner__',
      replacement: '',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 9106,
      enabled: true,
      // 큰따옴표(") 대사 블록이 연속될 때 서로 다른 대사 사이 줄바꿈
      pattern: String.raw`(?<=[\u201D"])\s+(?=[\u201C"])`,
      replacement: '\n',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 9107,
      enabled: true,
      pattern: '__builtin_quote_narration__',
      replacement: '',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 9105,
      enabled: true,
      pattern: '__builtin_wrap_80__',
      replacement: '',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
    {
      id: 9108,
      enabled: true,
      pattern: '__builtin_paragraph_spacing__',
      replacement: '',
      flags: { g: true, i: false, m: false, s: false },
      matchCount: null,
      error: null,
    },
  ];
}

export const BUILTIN_RULE_LABELS: Record<number, string> = {
  9109: '괄호 안 한자 삭제',
  9110: '괄호 생각 ?) 합치기',
  9111: '괄호 생각문 줄 배치',
  9101: '연속 공백 → 1칸',
  9102: '"]" 뒤 줄바꿈',
  9103: '동일 기호 반복 축소',
  9104: '「」 대사 줄바꿈',
  9105: '80자 초과 문장 줄바꿈',
  9106: '"…" 대사 구간 줄바꿈',
  9107: '대사·지문 줄 분리',
  9108: '5~7문장 단락 빈 줄',
};

export function builtinRuleLabel(ruleId: number, pattern: string): string {
  return BUILTIN_RULE_LABELS[ruleId] ?? `내장 규칙 (${pattern.slice(0, 24)})`;
}

export function isHiddenRuleId(id: number): boolean {
  return id >= 9000;
}
