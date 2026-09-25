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
        className={`grid grid-cols-[28px_52px_minmax(0,1fr)_minmax(0,1fr)_auto_64px] items-center gap-2 rounded-md border px-2 py-1.5 ${
          hasError
            ? 'border-red-500 bg-red-50'
            : rule.enabled
              ? 'border-slate-200 bg-white'
              : 'border-slate-200 bg-slate-50 opacity-80'
        }`}
      >
        <span className="text-center text-sm font-medium text-slate-600">
          {rule.id}
        </span>
        <button
          type="button"
          onClick={() => onChange(rule.id, { enabled: !rule.enabled })}
          className={`rounded border px-2 py-0.5 text-xs font-medium ${
            rule.enabled
              ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
              : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-100'
          }`}
          title={rule.enabled ? '실행 시 이 규칙을 적용합니다' : '실행 시 이 규칙을 건너뜁니다'}
        >
          {rule.enabled ? '적용' : '제외'}
        </button>
        <input
          type="text"
          disabled={!rule.enabled}
          className={`min-w-0 rounded border px-2 py-1 font-mono text-[13px] outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 ${
            hasError ? 'border-red-400' : 'border-slate-200'
          }`}
          placeholder="패턴"
          value={rule.pattern}
          onChange={(e) => onChange(rule.id, { pattern: e.target.value })}
          spellCheck={false}
        />
        <input
          type="text"
          disabled={!rule.enabled}
          className="min-w-0 rounded border border-slate-200 px-2 py-1 font-mono text-[13px] outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
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
              disabled={!rule.enabled}
              className={`h-7 w-7 rounded border text-xs font-mono disabled:cursor-not-allowed disabled:opacity-40 ${
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
          {!rule.enabled ? '—' : rule.matchCount === null ? '—' : `${rule.matchCount}건`}
        </span>
      </div>
      {hasError && (
        <p className="px-1 text-xs text-red-600">{rule.error}</p>
      )}
    </div>
  );
}
