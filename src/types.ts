import { createConvertPresetRules, createEmptyRules } from './defaultRules';

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

export function validatePattern(pattern: string): string | null {
  const trimmed = pattern.trim();
  if (!trimmed) return null;
  try {
    // eslint-disable-next-line no-new
    new RegExp(trimmed);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : 'Invalid regular expression';
  }
}
