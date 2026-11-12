const RULES = [
  [' {2,}', ' ', 'g'],
  [String.raw`\]\s*`, ']\n', 'g'],
  [String.raw`([^\w\s])\1+`, '$1', 'g'],
];

function applyAll(text) {
  for (const [pat, rep, flags] of RULES) {
    text = text.replace(new RegExp(pat, flags), rep);
  }
  return text;
}

const src = 'a..b  c] d==e';
const out = applyAll(src);
if (out !== 'a.b c]\nd=e') {
  console.error('expected', 'a.b c]\nd=e', 'got', JSON.stringify(out));
  process.exit(1);
}
console.log('builtin 3 rules OK:', JSON.stringify(out));
