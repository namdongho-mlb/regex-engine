import { useCallback, useRef, useState, type DragEvent } from 'react';
import { FileUp, X } from 'lucide-react';
import type { FileMeta } from '../types';

const ALLOWED_EXT = [
  '.txt',
  '.log',
  '.csv',
  '.json',
  '.xml',
  '.md',
  '.yaml',
  '.yml',
];

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function countLines(text: string): number {
  if (text === '') return 0;
  return text.split('\n').length;
}

interface FileUploaderProps {
  fileMeta: FileMeta | null;
  oversized: boolean;
  onFileLoaded: (content: string, meta: FileMeta) => void;
  onClear: () => void;
  error: string | null;
}

export function FileUploader({
  fileMeta,
  oversized,
  onFileLoaded,
  onClear,
  error,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const readFile = useCallback(
    (file: File) => {
      const ext = getExtension(file.name);
      if (!ALLOWED_EXT.includes(ext)) {
        setLocalError(
          `허용되지 않는 확장자입니다. (${ALLOWED_EXT.join(', ')})`,
        );
        return;
      }
      setLocalError(null);
      const reader = new FileReader();
      reader.onload = () => {
        const content = String(reader.result ?? '');
        onFileLoaded(content, {
          name: file.name,
          size: file.size,
          lineCount: countLines(content),
        });
      };
      reader.onerror = () => setLocalError('파일을 읽을 수 없습니다.');
      reader.readAsText(file, 'UTF-8');
    },
    [onFileLoaded],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const displayError = localError || error;

  return (
    <div className="border border-slate-200 rounded-md bg-white p-3">
      <div
        className={`flex flex-wrap items-center gap-3 rounded-md border border-dashed px-3 py-2 ${
          dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-slate-50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          onClick={() => inputRef.current?.click()}
        >
          <FileUp size={16} />
          파일 선택
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXT.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file);
            e.target.value = '';
          }}
        />
        <span className="text-slate-500 text-sm">
          또는 여기로 드래그앤드롭
        </span>
        {fileMeta && (
          <div className="ml-auto flex flex-wrap items-center gap-3 text-sm text-slate-700">
            <span className="font-medium">{fileMeta.name}</span>
            <span className="text-slate-500">{formatSize(fileMeta.size)}</span>
            <span className="text-slate-500">{fileMeta.lineCount} 라인</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
              onClick={onClear}
              title="파일 제거"
            >
              <X size={14} />
              제거
            </button>
          </div>
        )}
      </div>
      {oversized && (
        <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
          파일이 10MB를 초과합니다. 업로드는 허용되지만 처리가 느릴 수 있습니다.
        </div>
      )}
      {displayError && (
        <div className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700">
          {displayError}
        </div>
      )}
    </div>
  );
}
