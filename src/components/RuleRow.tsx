import type { FlagKey, RegexRule } from '../types';

const FLAG_KEYS: FlagKey[] = ['g', 'i', 'm', 's'];

interface RuleRowProps {
  rule: RegexRule;
  onChange: (id: number, patch: Partial<Omit<RegexRule, 'id'>>) => void;
}

export function RuleRow({ rule, onChange }: RuleRowProps) {
  const hasError = Boolean(rule.error);

  return (
    <div className="space-y-1">
      <div
        className={`grid grid-cols-[28px_28px_minmax(0,1fr)_minmax(0,1fr)_auto_64px] items-center gap-2 rounded-md border px-2 py-1.5 ${
          hasError ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'
        }`}
      >
        <span className="text-center text-sm font-medium text-slate-600">
          {rule.id}
        </span>
        <input
          type="checkbox"
          className="mx-auto h-4 w-4 accent-blue-600"
          checked={rule.enabled}
          onChange={(e) => onChange(rule.id, { enabled: e.target.checked })}
          title="활성화"
        />
        <input
          type="text"
          className={`min-w-0 rounded border px-2 py-1 font-mono text-[13px] outline-none focus:border-blue-500 ${
            hasError ? 'border-red-400' : 'border-slate-200'
          }`}
          placeholder="패턴"
          value={rule.pattern}
          onChange={(e) => onChange(rule.id, { pattern: e.target.value })}
          spellCheck={false}
        />
        <input
          type="text"
          className="min-w-0 rounded border border-slate-200 px-2 py-1 font-mono text-[13px] outline-none focus:border-blue-500"
          placeholder="치환 (빈 값 = 삭제)"
          value={rule.replacement}
          onChange={(e) => onChange(rule.id, { replacement: e.target.value })}
          spellCheck={false}
        />
        <div className="flex items-center gap-1">
          {FLAG_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`h-7 w-7 rounded border text-xs font-mono ${
                rule.flags[key]
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() =>
                onChange(rule.id, {
                  flags: { ...rule.flags, [key]: !rule.flags[key] },
                })
              }
              title={`플래그 ${key}`}
            >
              {key}
            </button>
          ))}
        </div>
        <span className="text-right text-xs text-slate-500 tabular-nums">
          {rule.matchCount === null ? '—' : `${rule.matchCount}건`}
        </span>
      </div>
      {hasError && (
        <p className="px-1 text-xs text-red-600">{rule.error}</p>
      )}
    </div>
  );
}
