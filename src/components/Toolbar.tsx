import { FileCode2, FolderInput, FolderOutput, RotateCcw } from 'lucide-react';
import { useRef } from 'react';

interface ToolbarProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  onReloadPy: () => void;
  rulesLoading?: boolean;
}

export function Toolbar({
  onExport,
  onImport,
  onReset,
  onReloadPy,
  rulesLoading = false,
}: ToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onReloadPy}
        disabled={rulesLoading}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FileCode2 size={14} />
        convert.py 다시 불러오기
      </button>
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <FolderOutput size={14} />
        규칙 내보내기
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <FolderInput size={14} />
        규칙 가져오기
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json,.py,text/x-python,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImport(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <RotateCcw size={14} />
        전체 초기화
      </button>
    </div>
  );
}
