import { Loader2, Play } from 'lucide-react';
import type { RegexRule } from '../types';
import { RuleRow } from './RuleRow';

interface RulePanelProps {
  rules: RegexRule[];
  onChange: (id: number, patch: Partial<Omit<RegexRule, 'id'>>) => void;
  onRun: () => void;
  canRun: boolean;
  isRunning: boolean;
  rulesLoading?: boolean;
  rulesSource?: string | null;
  rulesLoadError?: string | null;
  hiddenRuleCount?: number;
}

export function RulePanel({
  rules,
  onChange,
  onRun,
  canRun,
  isRunning,
  rulesLoading = false,
  rulesSource,
  rulesLoadError,
  hiddenRuleCount = 0,
}: RulePanelProps) {
  return (
    <div className="border border-slate-200 rounded-md bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-[28px_52px_minmax(0,1fr)_minmax(0,1fr)_auto_64px] gap-2 px-2 text-xs font-medium text-slate-500">
            <span className="text-center">#</span>
            <span className="text-center">적용</span>
            <span>패턴</span>
            <span>치환</span>
            <span className="w-[124px]">플래그</span>
            <span className="text-right">매치</span>
          </div>
          {!rulesLoading && (
            <p className="mt-1 px-2 text-xs text-slate-400">
              기본 규칙 {hiddenRuleCount}개(convert.py + 내장 8개)는 자동 적용되며
              화면에 표시되지 않습니다. 아래는 추가 사용자 규칙({rules.length}
              칸)입니다.
              {rulesSource && ` · 기본 규칙 출처: ${rulesSource}`}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={!canRun || rulesLoading}
          onClick={onRun}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isRunning ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          실행
        </button>
      </div>

      {rulesLoading && (
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Loader2 size={16} className="animate-spin" />
          convert.py에서 규칙을 불러오는 중…
        </div>
      )}

      {rulesLoadError && (
        <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
          {rulesLoadError}
        </div>
      )}

      <div className="space-y-1.5">
        {rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}
