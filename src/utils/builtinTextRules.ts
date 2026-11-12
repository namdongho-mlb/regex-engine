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

export const BUILTIN_HANDLER_IDS = {
  dialogueCorner: 9104,
  wrap80: 9105,
} as const;
