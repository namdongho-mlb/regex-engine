import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react';
import { FileUp, X } from 'lucide-react';
import type { FileMeta } from '../types';
import {
  TEXT_ENCODINGS,
  decodeBytes,
  getEncodingLabel,
  savePreferredEncoding,
  type TextEncodingId,
} from '../utils/textEncoding';

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
  encoding: TextEncodingId;
  onEncodingChange: (encoding: TextEncodingId) => void;
  oversized: boolean;
  hasDecodeWarning?: boolean;
  onFileLoaded: (content: string, meta: FileMeta) => void;
  onClear: () => void;
  error: string | null;
}

export function FileUploader({
  fileMeta,
  encoding,
  onEncodingChange,
  oversized,
  onFileLoaded,
  hasDecodeWarning = false,
  onClear,
  error,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef<ArrayBuffer | null>(null);
  const pendingFileRef = useRef<{ name: string; size: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const decodeAndEmit = useCallback(
    (buffer: ArrayBuffer, name: string, size: number, enc: TextEncodingId) => {
      try {
        const content = decodeBytes(buffer, enc);
        onFileLoaded(content, {
          name,
          size,
          lineCount: countLines(content),
          encoding: enc,
        });
        setLocalError(null);
      } catch (err) {
        setLocalError(
          err instanceof Error ? err.message : '파일 디코딩에 실패했습니다.',
        );
      }
    },
    [onFileLoaded],
  );

  const readFile = useCallback(
    (file: File, enc: TextEncodingId = encoding) => {
      const ext = getExtension(file.name);
      if (!ALLOWED_EXT.includes(ext)) {
        setLocalError(
          `허용되지 않는 확장자입니다. (${ALLOWED_EXT.join(', ')})`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result;
        if (!(buffer instanceof ArrayBuffer)) {
          setLocalError('파일을 읽을 수 없습니다.');
          return;
        }
        bufferRef.current = buffer;
        pendingFileRef.current = { name: file.name, size: file.size };
        decodeAndEmit(buffer, file.name, file.size, enc);
      };
      reader.onerror = () => setLocalError('파일을 읽을 수 없습니다.');
      reader.readAsArrayBuffer(file);
    },
    [decodeAndEmit, encoding],
  );

  useEffect(() => {
    const pending = pendingFileRef.current;
    const buffer = bufferRef.current;
    if (!pending || !buffer) return;
    decodeAndEmit(buffer, pending.name, pending.size, encoding);
  }, [encoding, decodeAndEmit]);

  const handleEncodingChange = (next: TextEncodingId) => {
    savePreferredEncoding(next);
    onEncodingChange(next);
  };

  const handleClear = () => {
    bufferRef.current = null;
    pendingFileRef.current = null;
    setLocalError(null);
    onClear();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const displayError = localError || error;

  return (
    <div className="border border-slate-200 rounded-md bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="shrink-0">인코딩</span>
          <select
            value={encoding}
            onChange={(e) =>
              handleEncodingChange(e.target.value as TextEncodingId)
            }
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-blue-500"
            title="텍스트 파일 디코딩 인코딩"
          >
            {TEXT_ENCODINGS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {fileMeta && (
          <span className="text-xs text-slate-400">
            적용 중: {getEncodingLabel(fileMeta.encoding)}
          </span>
        )}
      </div>

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
              onClick={handleClear}
              title="파일 제거"
            >
              <X size={14} />
              제거
            </button>
          </div>
        )}
      </div>

      {fileMeta && (
        <p className="mt-2 text-xs text-slate-500">
          한글이 깨져 보이면 <strong>CP949 (Windows)</strong> 또는{' '}
          <strong>EUC-KR</strong>로 바꿔 보세요. 인코딩 변경 시 파일을 다시
          읽습니다.
        </p>
      )}

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
      {hasDecodeWarning && (
        <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
          일부 문자()가 올바르게 디코딩되지 않았습니다. CP949 또는 EUC-KR
          인코딩을 선택해 보세요.
        </div>
      )}
    </div>
  );
}
