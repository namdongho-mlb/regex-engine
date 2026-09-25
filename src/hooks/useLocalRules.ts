import { useCallback, useEffect, useState } from 'react';
import { RULE_COUNT } from '../defaultRules';
import {
  createDefaultRules,
  createEmptyRule,
  type RegexRule,
} from '../types';

const STORAGE_KEY = 'regex-sequential-rules-v2';

interface PersistedRule {
  id: number;
  enabled: boolean;
  pattern: string;
  replacement: string;
  flags: RegexRule['flags'];
}

function normalizePersisted(parsed: PersistedRule[]): RegexRule[] {
  return Array.from({ length: RULE_COUNT }, (_, index) => {
    const id = index + 1;
    const found = parsed.find((r) => r.id === id) ?? parsed[index];
    if (!found) return createEmptyRule(id);
    return {
      id,
      enabled: Boolean(found.enabled),
      pattern: String(found.pattern ?? ''),
      replacement: String(found.replacement ?? ''),
      flags: {
        g: found.flags?.g ?? true,
        i: Boolean(found.flags?.i),
        m: Boolean(found.flags?.m),
        s: Boolean(found.flags?.s),
      },
      matchCount: null,
      error: null,
    };
  });
}

function loadRules(): RegexRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultRules();
    const parsed = JSON.parse(raw) as PersistedRule[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return createDefaultRules();
    }
    return normalizePersisted(parsed);
  } catch {
    return createDefaultRules();
  }
}

function toPersisted(rules: RegexRule[]): PersistedRule[] {
  return rules.map(({ id, enabled, pattern, replacement, flags }) => ({
    id,
    enabled,
    pattern,
    replacement,
    flags,
  }));
}

export function useLocalRules() {
  const [rules, setRules] = useState<RegexRule[]>(() => loadRules());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(rules)));
  }, [rules]);

  const updateRule = useCallback(
    (id: number, patch: Partial<Omit<RegexRule, 'id'>>) => {
      setRules((prev) =>
        prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
      );
    },
    [],
  );

  const setMatchCounts = useCallback((counts: Record<number, number | null>) => {
    setRules((prev) =>
      prev.map((rule) => ({
        ...rule,
        matchCount: counts[rule.id] !== undefined ? counts[rule.id] : null,
      })),
    );
  }, []);

  const clearMatchCounts = useCallback(() => {
    setRules((prev) => prev.map((rule) => ({ ...rule, matchCount: null })));
  }, []);

  const setRuleErrors = useCallback(
    (errors: Record<number, string | null>) => {
      setRules((prev) =>
        prev.map((rule) => ({
          ...rule,
          error: errors[rule.id] !== undefined ? errors[rule.id] : rule.error,
        })),
      );
    },
    [],
  );

  const exportRules = useCallback(() => {
    const blob = new Blob([JSON.stringify(toPersisted(rules), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'regex-rules.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [rules]);

  const importRules = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result)) as PersistedRule[];
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('유효하지 않은 규칙 파일입니다.');
          }
          setRules(normalizePersisted(parsed));
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error('가져오기 실패'));
        }
      };
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
      reader.readAsText(file, 'UTF-8');
    });
  }, []);

  const resetRules = useCallback(() => {
    if (!window.confirm('모든 규칙을 convert.py 기본값으로 초기화하시겠습니까?')) {
      return;
    }
    setRules(createDefaultRules());
  }, []);

  return {
    rules,
    setRules,
    updateRule,
    setMatchCounts,
    clearMatchCounts,
    setRuleErrors,
    exportRules,
    importRules,
    resetRules,
  };
}
