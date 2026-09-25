import { useCallback, useEffect, useState } from 'react';
import { createConvertPresetRules } from '../defaultRules';
import {
  DEFAULT_PY_PATH,
  mergePyRulesWithStored,
  parsePyRules,
} from '../utils/parsePyRules';
import type { RegexRule } from '../types';

const STORAGE_KEY = 'regex-sequential-rules-v3';

interface PersistedRule {
  id: number;
  enabled: boolean;
  pattern: string;
  replacement: string;
  flags: RegexRule['flags'];
}

function readStoredRules(): PersistedRule[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedRule[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
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

function normalizeImported(parsed: PersistedRule[]): RegexRule[] {
  return parsed.map((found, index) => ({
    id: found.id ?? index + 1,
    enabled: found.enabled !== false,
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
  }));
}

export function useLocalRules() {
  const [rules, setRules] = useState<RegexRule[]>(() => createConvertPresetRules());
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesSource, setRulesSource] = useState<string | null>(null);
  const [rulesLoadError, setRulesLoadError] = useState<string | null>(null);

  const applyPyContent = useCallback(
    (content: string, sourceLabel: string, preserveEnabled = true) => {
      const pyRules = parsePyRules(content);
      const stored = preserveEnabled ? readStoredRules() : null;
      const merged = mergePyRulesWithStored(pyRules, stored);
      setRules(merged);
      setRulesSource(sourceLabel);
      setRulesLoadError(null);
      return merged;
    },
    [],
  );

  const loadFromPyUrl = useCallback(
    async (url = DEFAULT_PY_PATH, sourceLabel = 'convert.py') => {
      setRulesLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`${sourceLabel} 파일을 불러올 수 없습니다.`);
        }
        const content = await response.text();
        applyPyContent(content, sourceLabel, true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '규칙 파일 로딩에 실패했습니다.';
        setRulesLoadError(message);
        const stored = readStoredRules();
        if (stored) {
          setRules(normalizeImported(stored));
          setRulesSource('localStorage');
        } else {
          setRules(createConvertPresetRules());
          setRulesSource('fallback');
        }
      } finally {
        setRulesLoading(false);
      }
    },
    [applyPyContent],
  );

  useEffect(() => {
    void loadFromPyUrl();
  }, [loadFromPyUrl]);

  useEffect(() => {
    if (rulesLoading) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(rules)));
  }, [rules, rulesLoading]);

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

  const importRules = useCallback(
    (file: File) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const text = String(reader.result ?? '');
            if (file.name.endsWith('.py')) {
              applyPyContent(text, file.name, false);
              resolve();
              return;
            }
            const parsed = JSON.parse(text) as PersistedRule[];
            if (!Array.isArray(parsed) || parsed.length === 0) {
              throw new Error('유효하지 않은 규칙 파일입니다.');
            }
            setRules(normalizeImported(parsed));
            setRulesSource(file.name);
            setRulesLoadError(null);
            resolve();
          } catch (err) {
            reject(err instanceof Error ? err : new Error('가져오기 실패'));
          }
        };
        reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
        reader.readAsText(file, 'UTF-8');
      });
    },
    [applyPyContent],
  );

  const resetRules = useCallback(() => {
    if (
      !window.confirm(
        'convert.py에서 규칙을 다시 불러오고 적용/제외 설정을 초기화하시겠습니까?',
      )
    ) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    void loadFromPyUrl(DEFAULT_PY_PATH, 'convert.py');
  }, [loadFromPyUrl]);

  const reloadFromPy = useCallback(() => {
    void loadFromPyUrl(DEFAULT_PY_PATH, 'convert.py');
  }, [loadFromPyUrl]);

  return {
    rules,
    rulesLoading,
    rulesSource,
    rulesLoadError,
    setRules,
    updateRule,
    setMatchCounts,
    clearMatchCounts,
    setRuleErrors,
    exportRules,
    importRules,
    resetRules,
    reloadFromPy,
  };
}
