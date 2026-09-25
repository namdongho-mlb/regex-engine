import { createConvertPresetRules, createEmptyRules } from './defaultRules';
import type { TextEncodingId } from './utils/textEncoding';

export interface RegexFlags {
  g: boolean;
  i: boolean;
  m: boolean;
  s: boolean;
}

export interface RegexRule {
  id: number; // 1..6
  enabled: boolean;
  pattern: string;
  replacement: string;
  flags: RegexFlags;
  matchCount: number | null;
  error: string | null;
}

export interface PipelineResult {
  output: string;
  totalReplacements: number;
  appliedRuleCount: number;
  elapsedMs: number;
}

export interface FileMeta {
  name: string;
  size: number;
  lineCount: number;
  encoding: TextEncodingId;
}

export type FlagKey = keyof RegexFlags;

export interface WorkerRulePayload {
  id: number;
  enabled: boolean;
  pattern: string;
  replacement: string;
  flags: string;
}

export type WorkerRequest = {
  type: 'run';
  text: string;
  rules: WorkerRulePayload[];
};

export type WorkerResponse =
  | {
      type: 'done';
      output: string;
      matchCounts: Record<number, number>;
      totalReplacements: number;
      appliedRuleCount: number;
      elapsedMs: number;
      timedOutRuleId?: number;
    }
  | {
      type: 'error';
      ruleId: number;
      message: string;
    }
  | {
      type: 'timeout';
      ruleId: number;
    };

export function createEmptyRule(id: number): RegexRule {
  return createEmptyRules().find((r) => r.id === id) ?? {
    id,
    enabled: true,
    pattern: '',
    replacement: '',
    flags: { g: true, i: false, m: false, s: false },
    matchCount: null,
    error: null,
  };
}

/** convert.py RULES 기본 프리셋 */
export function createDefaultRules(): RegexRule[] {
  return createConvertPresetRules();
}

export function flagsToString(flags: RegexFlags): string {
  let result = '';
  if (flags.g) result += 'g';
  if (flags.i) result += 'i';
  if (flags.m) result += 'm';
  if (flags.s) result += 's';
  return result;
}

/** 패턴이 비어 있는지 확인 (선·후행 공백만 있는 경우 포함). trim 하지 않는다. */
export function isPatternEmpty(pattern: string): boolean {
  return /^\s*$/.test(pattern);
}

export function validatePattern(pattern: string): string | null {
  if (isPatternEmpty(pattern)) return null;
  try {
    // 선·후행 공백은 패턴의 일부일 수 있음 (예: r' *"' → 공백 + * + 따옴표)
    // eslint-disable-next-line no-new
    new RegExp(pattern);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : 'Invalid regular expression';
  }
}
