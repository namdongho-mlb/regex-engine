const LEFT_CORNER = '\u300C'; // 「
const RIGHT_CORNER = '\u300D'; // 」

const SENTENCE_END_RE = /[.．。!！?？]/;
const LINE_WRAP_MAX = 80;

/** 「대사」 앞뒤 줄바꿈 (convert.py 따옴표 규칙과 동일 패턴) */
export function applyDialogueCornerQuotes(text: string): {
  next: string;
  count: number;
} {
  let count = 0;
  const openRe = new RegExp(` *${LEFT_CORNER}`, 'g');
  const closeRe = new RegExp(`${RIGHT_CORNER} *`, 'g');

  const next = text
    .replace(openRe, () => {
      count += 1;
      return `\n${LEFT_CORNER}`;
    })
    .replace(closeRe, () => {
      count += 1;
      return `${RIGHT_CORNER}\n`;
    });

  return { next, count };
}

/**
 * 한 줄이 80자를 넘으면 마침표·문장부호 또는 공백 경계에서 줄바꿈.
 */
export function wrapLongLinesAt80(
  text: string,
  maxLen = LINE_WRAP_MAX,
): { next: string; count: number } {
  let breakCount = 0;
  const lines = text.split('\n');
  const outLines: string[] = [];

  for (const line of lines) {
    if (line.length <= maxLen) {
      outLines.push(line);
      continue;
    }

    let rest = line;
    const chunks: string[] = [];

    while (rest.length > maxLen) {
      let splitAt = -1;

      for (let i = Math.min(maxLen, rest.length) - 1; i >= 1; i--) {
        const ch = rest[i]!;
        if (SENTENCE_END_RE.test(ch)) {
          splitAt = i + 1;
          break;
        }
      }

      if (splitAt < 0) {
        for (let i = maxLen; i >= 1; i--) {
          if (/\s/.test(rest[i]!)) {
            splitAt = i;
            break;
          }
        }
      }

      if (splitAt < 0) splitAt = maxLen;

      chunks.push(rest.slice(0, splitAt).trimEnd());
      rest = rest.slice(splitAt).trimStart();
      breakCount += 1;
    }

    if (rest) chunks.push(rest);
    outLines.push(chunks.join('\n'));
  }

  return { next: outLines.join('\n'), count: breakCount };
}

/**
 * 대사("…")와 지문이 한 줄에 붙어 있을 때 줄바꿈.
 * - "대사." 지문 → 줄 분리
 * - 지문. "대사" → 줄 분리
 */
export function applyQuoteNarrationLinebreaks(text: string): {
  next: string;
  count: number;
} {
  let count = 0;
  const afterQuoteToNarrative = /(?<=[\u201D"])\s+(?=[^\u201C"\n])/g;
  const narrativeToOpeningQuote = /(?<=[^\u201C"\n])\s+(?=[\u201C"])/g;

  let next = text.replace(afterQuoteToNarrative, () => {
    count += 1;
    return '\n';
  });
  next = next.replace(narrativeToOpeningQuote, () => {
    count += 1;
    return '\n';
  });

  return { next, count };
}

const SENTENCE_SPLIT_RE = /(?<=[.!?？。])(?=\s)/;
const PARAGRAPH_SIZES = [6, 5, 7] as const;

function toSentenceLines(text: string): string[] {
  const normalized = text.replace(/\n{2,}/g, '\n').trim();
  if (!normalized) return [];

  const rawLines = normalized.split('\n').map((line) => line.trim());
  const nonEmpty = rawLines.filter((line) => line.length > 0);
  if (nonEmpty.length >= 2) return nonEmpty;

  return normalized
    .split(SENTENCE_SPLIT_RE)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * 연속된 문장 사이에 5~7문장 단위로 빈 줄을 삽입해 단락을 나눈다.
 */
export function applyParagraphSpacing(text: string): {
  next: string;
  count: number;
} {
  const lines = toSentenceLines(text);
  if (lines.length <= PARAGRAPH_SIZES[0]) {
    return { next: lines.join('\n'), count: 0 };
  }

  const paragraphs: string[] = [];
  let blankInserts = 0;
  let index = 0;
  let paraIndex = 0;

  while (index < lines.length) {
    const size = PARAGRAPH_SIZES[paraIndex % PARAGRAPH_SIZES.length] ?? 6;
    const chunk = lines.slice(index, index + size);
    paragraphs.push(chunk.join('\n'));
    index += chunk.length;
    paraIndex += 1;
    if (index < lines.length) blankInserts += 1;
  }

  return { next: paragraphs.join('\n\n'), count: blankInserts };
}

/** (…?)|!)|.) ) 뒤 본문이 이어지면 줄바꿈 */
export function applyParentheticalCloseLinebreaks(text: string): {
  next: string;
  count: number;
} {
  let count = 0;
  const re = /(?:\.\s+|\.\)|[?!])\)\s+/g;
  const next = text.replace(re, (match) => {
    count += 1;
    return `${match.trimEnd()} \n`;
  });
  return { next, count };
}

export const BUILTIN_HANDLER_IDS = {
  dialogueCorner: 9104,
  wrap80: 9105,
  quoteNarration: 9107,
  paragraphSpacing: 9108,
  parenCloseBreak: 9111,
} as const;
