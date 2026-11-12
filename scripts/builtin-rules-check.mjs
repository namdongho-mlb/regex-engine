const LEFT = '\u300C';
const RIGHT = '\u300D';

const RULES = [
  [' {2,}', ' ', 'g'],
  [String.raw`\]\s*`, ']\n', 'g'],
  [String.raw`([^\w\s])\1+`, '$1', 'g'],
];

function applyRegexRules(text) {
  for (const [pat, rep, flags] of RULES) {
    text = text.replace(new RegExp(pat, flags), rep);
  }
  return text;
}

function applyDialogueCornerQuotes(text) {
  let count = 0;
  const openRe = new RegExp(` *${LEFT}`, 'g');
  const closeRe = new RegExp(`${RIGHT} *`, 'g');
  const next = text
    .replace(openRe, () => {
      count += 1;
      return `\n${LEFT}`;
    })
    .replace(closeRe, () => {
      count += 1;
      return `${RIGHT}\n`;
    });
  return { next, count };
}

function wrapLongLinesAt80(text, maxLen = 80) {
  let breakCount = 0;
  const lines = text.split('\n');
  const outLines = [];
  const endRe = /[.．。!！?？]/;

  for (const line of lines) {
    if (line.length <= maxLen) {
      outLines.push(line);
      continue;
    }
    let rest = line;
    const chunks = [];
    while (rest.length > maxLen) {
      let splitAt = -1;
      for (let i = Math.min(maxLen, rest.length) - 1; i >= 1; i--) {
        if (endRe.test(rest[i])) {
          splitAt = i + 1;
          break;
        }
      }
      if (splitAt < 0) {
        for (let i = maxLen; i >= 1; i--) {
          if (/\s/.test(rest[i])) {
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

let out = applyRegexRules('a..b  c] d==e');
if (out !== 'a.b c]\nd=e') {
  console.error('regex rules failed');
  process.exit(1);
}

const dialogue = `앞말 ${LEFT}일찍부터 기다렸네${RIGHT} 뒤말`;
const dOut = applyDialogueCornerQuotes(dialogue).next;
if (!dOut.includes(`\n${LEFT}일찍부터 기다렸네${RIGHT}\n`)) {
  console.error('dialogue rule failed:', JSON.stringify(dOut));
  process.exit(1);
}
console.log('dialogue corner quotes OK');

const long =
  '가'.repeat(40) + '. ' + '나'.repeat(40) + '. ' + '다'.repeat(10);
const wOut = wrapLongLinesAt80(long).next;
const wLines = wOut.split('\n');
if (wLines.length < 2 || wLines.some((l) => l.length > 85)) {
  console.error('wrap80 failed:', wLines.map((l) => l.length));
  process.exit(1);
}
console.log('wrap 80 OK, lines:', wLines.length);

console.log('All builtin checks passed');
