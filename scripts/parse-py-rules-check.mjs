import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const py = readFileSync(join(root, 'public/convert.py'), 'utf8');

// Minimal mirror of parsePyRules.ts for CI-style check
function parsePyRules(content) {
  const rulesIdx = content.indexOf('RULES');
  const open = content.indexOf('[', rulesIdx);
  let depth = 0;
  let close = open;
  for (; close < content.length; close++) {
    if (content[close] === '[') depth++;
    else if (content[close] === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  const block = content.slice(open + 1, close);
  const tuples = [...block.matchAll(/\(\s*r(['"])([\s\S]*?)\1\s*,\s*(['"])([\s\S]*?)\3\s*,\s*([^)]+)\)/g)];
  return tuples.map((m, i) => ({
    id: i + 1,
    pattern: m[2],
    replacement: m[4].replace(/\\n/g, '\n'),
    flags: /re\.M/.test(m[5]) ? 'gm' : 'g',
  }));
}

const rules = parsePyRules(py);
console.log('parsed', rules.length, 'rules from convert.py');
if (rules.length !== 6) throw new Error(`expected 6 rules, got ${rules.length}`);
for (const rule of rules) {
  new RegExp(rule.pattern, rule.flags);
  console.log('ok', rule.id, rule.pattern.slice(0, 40));
}
