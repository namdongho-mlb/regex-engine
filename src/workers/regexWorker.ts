/// <reference lib="webworker" />

export {};

interface WorkerRulePayload {
  id: number;
  enabled: boolean;
  pattern: string;
  replacement: string;
  flags: string;
}

type WorkerRequest =
  | {
      type: 'run';
      text: string;
      rules: WorkerRulePayload[];
    }
  | {
      type: 'runOne';
      text: string;
      rule: WorkerRulePayload;
    };

function countAndReplace(
  text: string,
  pattern: string,
  flags: string,
  replacement: string,
): { next: string; count: number } {
  let count = 0;

  if (flags.includes('g')) {
    count = [...text.matchAll(new RegExp(pattern, flags))].length;
  } else {
    count = new RegExp(pattern, flags).test(text) ? 1 : 0;
  }

  const next = text.replace(new RegExp(pattern, flags), replacement);
  return { next, count };
}

function isPatternEmpty(pattern: string): boolean {
  return /^\s*$/.test(pattern);
}

function applyRule(text: string, rule: WorkerRulePayload) {
  if (!rule.enabled || isPatternEmpty(rule.pattern)) {
    return { next: text, count: 0, skipped: true as const };
  }

  try {
    const { next, count } = countAndReplace(
      text,
      rule.pattern,
      rule.flags,
      rule.replacement,
    );
    return { next, count, skipped: false as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Invalid regular expression';
    return { error: message as string };
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'runOne') {
    const started = performance.now();
    const result = applyRule(data.text, data.rule);
    if ('error' in result && result.error) {
      self.postMessage({
        type: 'error',
        ruleId: data.rule.id,
        message: result.error,
      });
      return;
    }
    self.postMessage({
      type: 'doneOne',
      ruleId: data.rule.id,
      output: result.next!,
      count: result.count ?? 0,
      skipped: result.skipped ?? false,
      elapsedMs: Math.round(performance.now() - started),
    });
    return;
  }

  if (data.type !== 'run') return;

  const started = performance.now();
  let text = data.text;
  const matchCounts: Record<number, number> = {};
  let totalReplacements = 0;
  let appliedRuleCount = 0;

  for (const rule of data.rules) {
    const result = applyRule(text, rule);
    if ('error' in result && result.error) {
      self.postMessage({
        type: 'error',
        ruleId: rule.id,
        message: result.error,
      });
      return;
    }
    if (result.skipped) continue;
    text = result.next!;
    matchCounts[rule.id] = result.count ?? 0;
    totalReplacements += result.count ?? 0;
    appliedRuleCount += 1;
  }

  self.postMessage({
    type: 'done',
    output: text,
    matchCounts,
    totalReplacements,
    appliedRuleCount,
    elapsedMs: Math.round(performance.now() - started),
  });
};
