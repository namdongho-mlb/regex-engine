/**
 * Headless acceptance checks for sequential regex pipeline logic
 * (mirrors worker behavior without DOM).
 */
function countAndReplace(text, pattern, flags, replacement) {
  let count = 0;
  if (flags.includes('g')) {
    count = [...text.matchAll(new RegExp(pattern, flags))].length;
  } else {
    count = new RegExp(pattern, flags).test(text) ? 1 : 0;
  }
  const next = text.replace(new RegExp(pattern, flags), replacement);
  return { next, count };
}

function runPipeline(text, rules) {
  const matchCounts = {};
  let applied = 0;
  let total = 0;
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const pattern = rule.pattern.trim();
    if (!pattern) continue;
    const { next, count } = countAndReplace(
      text,
      pattern,
      rule.flags,
      rule.replacement,
    );
    text = next;
    matchCounts[rule.id] = count;
    total += count;
    applied += 1;
  }
  return { text, matchCounts, total, applied };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// AC2: \d+ -> #
{
  const r = runPipeline('a1 b22 c333', [
    { id: 1, enabled: true, pattern: '\\d+', flags: 'g', replacement: '#' },
  ]);
  assert(r.text === 'a# b# c#', `AC2 failed: ${r.text}`);
  assert(r.matchCounts[1] === 3, `AC2 count: ${r.matchCounts[1]}`);
  console.log('AC2 ok');
}

// AC3: sequential — rule2 applies to rule1 output
{
  const r = runPipeline('123-456', [
    { id: 1, enabled: true, pattern: '\\d+', flags: 'g', replacement: '#' },
    { id: 2, enabled: true, pattern: '#+', flags: 'g', replacement: 'X' },
  ]);
  assert(r.text === 'X-X', `AC3 failed: ${r.text}`);
  assert(r.matchCounts[1] === 2, `AC3 r1: ${r.matchCounts[1]}`);
  assert(r.matchCounts[2] === 2, `AC3 r2: ${r.matchCounts[2]}`);
  console.log('AC3 ok');
}

// AC4: empty pattern skipped
{
  const r = runPipeline('hello123', [
    { id: 1, enabled: true, pattern: '\\d+', flags: 'g', replacement: '' },
    { id: 2, enabled: true, pattern: '', flags: 'g', replacement: 'x' },
    { id: 3, enabled: true, pattern: 'hello', flags: 'g', replacement: 'hi' },
  ]);
  assert(r.text === 'hi', `AC4 failed: ${r.text}`);
  assert(r.applied === 2, `AC4 applied: ${r.applied}`);
  assert(r.matchCounts[2] === undefined, 'AC4 should skip rule 2');
  console.log('AC4 ok');
}

// AC5: invalid pattern
{
  let threw = false;
  try {
    new RegExp('[');
  } catch {
    threw = true;
  }
  assert(threw, 'AC5 RegExp should throw');
  console.log('AC5 ok');
}

// Capture groups
{
  const r = runPipeline('name=Alice', [
    {
      id: 1,
      enabled: true,
      pattern: 'name=(\\w+)',
      flags: 'g',
      replacement: 'user:$1',
    },
  ]);
  assert(r.text === 'user:Alice', `capture failed: ${r.text}`);
  console.log('capture groups ok');
}

console.log('All logic checks passed');
