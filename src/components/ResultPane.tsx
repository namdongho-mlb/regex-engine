import { Copy, Download } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from 'react';
import type { FileMeta, PipelineResult } from '../types';

interface ResultPaneProps {
  source: string;
  onSourceChange: (value: string) => void;
  sourceReadOnly: boolean;
  fileMeta: FileMeta | null;
  result: PipelineResult | null;
  hasExecuted: boolean;
  runError: string | null;
}

function LineGutter({ lineCount }: { lineCount: number }) {
  const lines = useMemo(
    () => Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1),
    [lineCount],
  );
  return (
    <div
      aria-hidden
      className="select-none border-r border-slate-200 bg-slate-50 px-2 py-2 text-right font-mono text-[13px] leading-5 text-slate-400"
    >
      {lines.map((n) => (
        <div key={n}>{n}</div>
      ))}
    </div>
  );
}

function downloadResult(content: string, fileMeta: FileMeta | null) {
  let filename = 'text_result.txt';
  if (fileMeta?.name) {
    const name = fileMeta.name;
    const idx = name.lastIndexOf('.');
    if (idx > 0) {
      filename = `${name.slice(0, idx)}_result${name.slice(idx)}`;
    } else {
      filename = `${name}_result.txt`;
    }
  }
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultPane({
  source,
  onSourceChange,
  sourceReadOnly,
  fileMeta,
  result,
  hasExecuted,
  runError,
}: ResultPaneProps) {
  const sourceScrollRef = useRef<HTMLDivElement>(null);
  const resultScrollRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const [copied, setCopied] = useState(false);

  const sourceLines = source === '' ? 1 : source.split('\n').length;
  const output = result?.output ?? '';
  const resultLines = output === '' ? 1 : output.split('\n').length;

  const syncScroll = useCallback(
    (from: 'source' | 'result') => (e: UIEvent<HTMLDivElement>) => {
      if (syncing.current) return;
      syncing.current = true;
      const target =
        from === 'source' ? resultScrollRef.current : sourceScrollRef.current;
      if (target) {
        target.scrollTop = e.currentTarget.scrollTop;
        target.scrollLeft = e.currentTarget.scrollLeft;
      }
      requestAnimationFrame(() => {
        syncing.current = false;
      });
    },
    [],
  );

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const showPlaceholder = !hasExecuted || (!result && !runError);

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col border border-slate-200 rounded-md bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <div className="text-sm text-slate-600">
          {result ? (
            <span>
              총 {result.totalReplacements}건 치환 / 규칙{' '}
              {result.appliedRuleCount}개 적용 / 처리시간 {result.elapsedMs}ms
            </span>
          ) : (
            <span className="text-slate-400">결과 요약</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!result}
            onClick={async () => {
              if (!result) return;
              await navigator.clipboard.writeText(result.output);
              setCopied(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Copy size={14} />
            {copied ? '복사됨' : '복사'}
          </button>
          <button
            type="button"
            disabled={!result}
            onClick={() => result && downloadResult(result.output, fileMeta)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={14} />
            다운로드
          </button>
        </div>
      </div>

      {runError && (
        <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {runError}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Source */}
        <div className="flex min-h-[40vh] flex-col border-b border-slate-200 lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
            원본{sourceReadOnly ? ' (읽기 전용)' : ' (편집 가능)'}
          </div>
          <div
            ref={sourceScrollRef}
            onScroll={syncScroll('source')}
            className="flex min-h-0 flex-1 overflow-auto"
          >
            <LineGutter lineCount={sourceLines} />
            {sourceReadOnly ? (
              <pre className="m-0 flex-1 whitespace-pre px-2 py-2 font-mono text-[13px] leading-5 text-slate-800">
                {source || ' '}
              </pre>
            ) : (
              <textarea
                className="w-full flex-1 resize-none overflow-hidden border-0 bg-transparent px-2 py-2 font-mono text-[13px] leading-5 text-slate-800 outline-none"
                style={{ height: `${Math.max(sourceLines, 1) * 20 + 16}px` }}
                value={source}
                onChange={(e) => onSourceChange(e.target.value)}
                placeholder="파일을 업로드하거나 여기에 텍스트를 붙여넣으세요"
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Result */}
        <div className="flex min-h-[40vh] flex-col lg:min-h-0">
          <div className="border-b border-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
            결과 (읽기 전용)
          </div>
          {showPlaceholder ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              실행 버튼을 눌러주세요
            </div>
          ) : result ? (
            <div
              ref={resultScrollRef}
              onScroll={syncScroll('result')}
              className="flex min-h-0 flex-1 overflow-auto"
            >
              <LineGutter lineCount={resultLines} />
              <pre className="m-0 flex-1 whitespace-pre px-2 py-2 font-mono text-[13px] leading-5 text-slate-800">
                {output || ' '}
              </pre>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              결과가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
