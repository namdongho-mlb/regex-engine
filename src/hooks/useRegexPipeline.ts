import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { builtinRuleLabel, isHiddenRuleId } from '../builtInRules';
import {
  flagsToString,
  isPatternEmpty,
  validatePattern,
  type PipelineResult,
  type RegexRule,
  type WorkerRulePayload,
} from '../types';
import RegexWorker from '../workers/regexWorker.ts?worker';

const TIMEOUT_MS = 3000;

type DoneOneMessage = {
  type: 'doneOne';
  ruleId: number;
  output: string;
  count: number;
  skipped: boolean;
  elapsedMs: number;
};

type ErrorMessage = {
  type: 'error';
  ruleId: number;
  message: string;
};

function toPayload(rule: RegexRule): WorkerRulePayload {
  return {
    id: rule.id,
    enabled: rule.enabled,
    pattern: rule.pattern,
    replacement: rule.replacement,
    flags: flagsToString(rule.flags),
  };
}

function hasRunnableRules(rules: RegexRule[]): boolean {
  return rules.some((r) => r.enabled && !isPatternEmpty(r.pattern));
}

function ruleDisplayName(rule: RegexRule): string {
  if (isHiddenRuleId(rule.id)) {
    return builtinRuleLabel(rule.id, rule.pattern);
  }
  return `규칙 ${rule.id}번`;
}

export function useRegexPipeline(
  hiddenRules: RegexRule[],
  rules: RegexRule[],
  updateRule: (id: number, patch: Partial<Omit<RegexRule, 'id'>>) => void,
  setMatchCounts: (counts: Record<number, number | null>) => void,
  clearMatchCounts: () => void,
) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [hasExecuted, setHasExecuted] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const runIdRef = useRef(0);

  const pipelineRules = useMemo(
    () => [...hiddenRules, ...rules],
    [hiddenRules, rules],
  );

  const createWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = new RegexWorker();
    return workerRef.current;
  }, []);

  useEffect(() => {
    createWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [createWorker]);

  useEffect(() => {
    for (const rule of rules) {
      if (!rule.enabled || isPatternEmpty(rule.pattern)) {
        if (rule.error) updateRule(rule.id, { error: null });
        continue;
      }
      const err = validatePattern(rule.pattern);
      if (err !== rule.error) {
        updateRule(rule.id, { error: err });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rules.map((r) => `${r.id}:${r.enabled}:${r.pattern}`).join('|'),
    updateRule,
  ]);

  const canRun = useMemo(() => {
    const hasInvalidVisible = rules.some(
      (r) => r.enabled && !isPatternEmpty(r.pattern) && r.error,
    );
    return !hasInvalidVisible && !isRunning;
  }, [rules, isRunning]);

  const runOneInWorker = useCallback(
    (text: string, rule: RegexRule): Promise<DoneOneMessage> => {
      return new Promise((resolve, reject) => {
        const worker = workerRef.current ?? createWorker();
        let settled = false;

        const cleanup = () => {
          worker.removeEventListener('message', onMessage);
          worker.removeEventListener('error', onError);
          clearTimeout(timer);
        };

        const timer = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          worker.terminate();
          createWorker();
          reject(new Error(`TIMEOUT:${rule.id}`));
        }, TIMEOUT_MS);

        const onMessage = (event: MessageEvent<DoneOneMessage | ErrorMessage>) => {
          if (settled) return;
          const data = event.data;
          if (data.type === 'error' && data.ruleId === rule.id) {
            settled = true;
            cleanup();
            reject(new Error(data.message));
            return;
          }
          if (data.type === 'doneOne' && data.ruleId === rule.id) {
            settled = true;
            cleanup();
            resolve(data);
          }
        };

        const onError = () => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error('Worker 오류가 발생했습니다.'));
        };

        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);
        worker.postMessage({
          type: 'runOne',
          text,
          rule: toPayload(rule),
        });
      });
    },
    [createWorker],
  );

  const run = useCallback(
    async (source: string) => {
      if (!hasRunnableRules(pipelineRules)) {
        setRunError('실행할 규칙이 없습니다');
        setResult(null);
        setHasExecuted(false);
        return;
      }

      const hasInvalidVisible = rules.some(
        (r) => r.enabled && !isPatternEmpty(r.pattern) && r.error,
      );
      if (hasInvalidVisible) return;

      const runId = ++runIdRef.current;
      setIsRunning(true);
      setRunError(null);
      clearMatchCounts();

      const started = performance.now();
      let text = source;
      const counts = Object.fromEntries(
        rules.map((rule) => [rule.id, null]),
      ) as Record<number, number | null>;
      let totalReplacements = 0;
      let appliedRuleCount = 0;
      let hiddenAppliedCount = 0;
      let userAppliedCount = 0;

      try {
        for (const rule of pipelineRules) {
          if (runId !== runIdRef.current) return;
          if (!rule.enabled || isPatternEmpty(rule.pattern)) continue;

          try {
            const response = await runOneInWorker(text, rule);
            if (runId !== runIdRef.current) return;
            text = response.output;
            totalReplacements += response.count;
            appliedRuleCount += 1;
            if (isHiddenRuleId(rule.id)) {
              hiddenAppliedCount += 1;
            } else {
              userAppliedCount += 1;
              counts[rule.id] = response.count;
            }
          } catch (err) {
            if (runId !== runIdRef.current) return;
            const message = err instanceof Error ? err.message : String(err);
            const name = ruleDisplayName(rule);
            if (message.startsWith('TIMEOUT:')) {
              setRunError(`${name} 처리 시간 초과 — 패턴을 확인하세요`);
              setMatchCounts(counts);
              setResult(null);
              setHasExecuted(true);
              return;
            }
            if (!isHiddenRuleId(rule.id)) {
              updateRule(rule.id, { error: message });
            }
            setRunError(`${name} 오류: ${message}`);
            setMatchCounts(counts);
            setResult(null);
            setHasExecuted(true);
            return;
          }
        }

        if (runId !== runIdRef.current) return;
        setMatchCounts(counts);
        setResult({
          output: text,
          totalReplacements,
          appliedRuleCount,
          hiddenAppliedCount,
          userAppliedCount,
          elapsedMs: Math.round(performance.now() - started),
        });
        setHasExecuted(true);
      } finally {
        if (runId === runIdRef.current) {
          setIsRunning(false);
        }
      }
    },
    [pipelineRules, rules, clearMatchCounts, runOneInWorker, setMatchCounts, updateRule],
  );

  return {
    isRunning,
    canRun,
    result,
    runError,
    hasExecuted,
    run,
    setRunError,
  };
}
