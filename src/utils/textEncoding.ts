export type TextEncodingId = 'utf-8' | 'euc-kr' | 'windows-949' | 'iso-8859-1';

export interface TextEncodingOption {
  id: TextEncodingId;
  label: string;
  /** TextDecoder label 후보 (브라우저별 차이 대응) */
  decoderLabels: string[];
}

export const TEXT_ENCODINGS: TextEncodingOption[] = [
  {
    id: 'utf-8',
    label: 'UTF-8',
    decoderLabels: ['utf-8'],
  },
  {
    id: 'euc-kr',
    label: 'EUC-KR',
    decoderLabels: ['euc-kr'],
  },
  {
    id: 'windows-949',
    label: 'CP949 (Windows)',
    decoderLabels: ['windows-949', 'cp949', 'ms949', 'euc-kr'],
  },
  {
    id: 'iso-8859-1',
    label: 'ISO-8859-1',
    decoderLabels: ['iso-8859-1', 'latin1'],
  },
];

const STORAGE_KEY = 'regex-processor-text-encoding';

export function loadPreferredEncoding(): TextEncodingId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TEXT_ENCODINGS.some((item) => item.id === saved)) {
      return saved as TextEncodingId;
    }
  } catch {
    // ignore
  }
  return 'utf-8';
}

export function savePreferredEncoding(encoding: TextEncodingId): void {
  localStorage.setItem(STORAGE_KEY, encoding);
}

function isDecoderSupported(label: string): boolean {
  try {
    const decoder = TextDecoder as typeof TextDecoder & {
      isSupported?: (label: string) => boolean;
    };
    if (typeof decoder.isSupported === 'function') {
      return decoder.isSupported(label);
    }
    new TextDecoder(label);
    return true;
  } catch {
    return false;
  }
}

export function resolveDecoderLabel(encodingId: TextEncodingId): string {
  const option = TEXT_ENCODINGS.find((item) => item.id === encodingId);
  if (!option) return 'utf-8';
  for (const label of option.decoderLabels) {
    if (isDecoderSupported(label)) return label;
  }
  throw new Error(`브라우저에서 ${option.label} 인코딩을 지원하지 않습니다.`);
}

export function decodeBytes(buffer: ArrayBuffer, encodingId: TextEncodingId): string {
  const label = resolveDecoderLabel(encodingId);
  return new TextDecoder(label, { fatal: false }).decode(buffer);
}

export function getEncodingLabel(encodingId: TextEncodingId): string {
  return TEXT_ENCODINGS.find((item) => item.id === encodingId)?.label ?? encodingId;
}
