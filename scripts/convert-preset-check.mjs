/** Verify convert.py RULES parity in JS RegExp engine */

const LEFT = '\u201C';
const RIGHT = '\u201D';

const RULES = [
  [String.raw`[ \t]*\r?\n+[ \t]*`, ' ', 'g'],
  [`(?<=[^${LEFT}.\\n]{10}다\\.) +`, '\n', 'g'],
  [` *${LEFT}`, `\n${LEFT}`, 'g'],
  [`${RIGHT} *`, `${RIGHT}\n`, 'g'],
  [String.raw`[ \t]+$`, '', 'gm'],
  [String.raw`^\s+|\s+$`, '', 'g'],
];

function convert(text) {
  for (const [pat, rep, flags] of RULES) {
    text = text.replace(new RegExp(pat, flags), rep);
  }
  return text;
}

// Smoke: multiline article-like text
const src = `첫 문장입니다. \n\n두 번째 문장이 매우 길어서 열 자를 넘깁니다. \n${LEFT}인용문${RIGHT} 이어집니다.  \n`;
const out = convert(src);
console.log('input lines:', src.split('\n').length);
console.log('output lines:', out.split('\n').length);
console.log('output preview:', JSON.stringify(out.slice(0, 120)));

for (const [pat, , flags] of RULES) {
  try {
    new RegExp(pat, flags);
    console.log('valid:', pat.slice(0, 40));
  } catch (e) {
    console.error('INVALID:', pat, e.message);
    process.exit(1);
  }
}
console.log('convert preset patterns OK');
