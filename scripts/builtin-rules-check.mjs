const LEFT = '\u300C';
const RIGHT = '\u300D';

const KANJI_PAREN =
  /(?:\(|[\uFF08])[^)\uFF09\r\n]*[\u4E00-\u9FFF\u3400-\u4DBF][^)\uFF09\r\n]*(?:\)|[\uFF09])/g;

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

const kanjiSample =
  '해외(海外)로 전근(轉勤)해 버렸다．시로(志郎)는 아버지가 재혼(再婚)하는데';
const kanjiOut = kanjiSample.replace(KANJI_PAREN, '');
if (kanjiOut !== '해외로 전근해 버렸다．시로는 아버지가 재혼하는데') {
  console.error('kanji paren removal failed:', JSON.stringify(kanjiOut));
  process.exit(1);
}
console.log('kanji in parentheses removal OK');

function joinSplitParentheticalClose(text) {
  return text.replace(/([?!])[\s\n\r]+\)/g, (_, punct) => `${punct})`);
}

function applyParentheticalCloseLinebreaks(text) {
  return text.replace(/(?:\.\s+\)|\.\s*\)|[?!]\))\s+/g, (match) => {
    const close = match.replace(/\s+$/, '');
    return `${close}\n`;
  });
}

function applyPreConvertParenRules(text) {
  let next = joinSplitParentheticalClose(text);
  next = applyParentheticalCloseLinebreaks(next);
  return next;
}

const parenThought = [
  '(벌써 폐점 시간으로부터 30분이나 지났군.) 마사시의 생각은 이어졌다.',
  '(일단 집으로 데리고 가서 조금 혼내주고 연락처라도 알아둘까?',
  ') 결론을  낸 마사시는 상점으로부터 그다지 떨어져있지 않은 자신의 아파트에',
].join('\n');
const parenOut = applyPreConvertParenRules(parenThought);
const parenExpected = [
  '(벌써 폐점 시간으로부터 30분이나 지났군.)',
  '마사시의 생각은 이어졌다.',
  '(일단 집으로 데리고 가서 조금 혼내주고 연락처라도 알아둘까?)',
  '결론을  낸 마사시는 상점으로부터 그다지 떨어져있지 않은 자신의 아파트에',
].join('\n');
if (parenOut !== parenExpected) {
  console.error('paren thought rules failed');
  console.error('got:\n', JSON.stringify(parenOut));
  console.error('want:\n', JSON.stringify(parenExpected));
  process.exit(1);
}
console.log('parenthetical thought rules OK');

const exclaim =
  '(앗! 이사람, 날 알고 있었잖아?) 젊은 마사시는 자신을 잘 모를 것이라고 생각했던 케이코는 점 다리에 힘이 빠져갔다.';
const exclaimOut = applyPreConvertParenRules(exclaim);
const exclaimExpected =
  '(앗! 이사람, 날 알고 있었잖아?)\n젊은 마사시는 자신을 잘 모를 것이라고 생각했던 케이코는 점 다리에 힘이 빠져갔다.';
if (exclaimOut !== exclaimExpected) {
  console.error('!? close paren break failed:', JSON.stringify(exclaimOut));
  process.exit(1);
}
console.log('!? ) close line break OK');

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

const DQ = '"';
const chain = `${DQ}사실은 말예요.${DQ} ${DQ}2층의 6평짜리 방 하나, 우리는 쓰지 않고 있잖아요?${DQ} ${DQ}무슨 소리야?.${DQ}`;
const chainOut = chain.replace(/(?<=[\u201D"])\s+(?=[\u201C"])/g, '\n');
const chainLines = chainOut.split('\n').filter(Boolean);
if (chainLines.length !== 3) {
  console.error('quoted dialogue split failed:', JSON.stringify(chainOut));
  process.exit(1);
}
console.log('quoted dialogue line breaks OK');

function applyQuoteNarrationLinebreaks(text) {
  let count = 0;
  let next = text.replace(/(?<=[\u201D"])\s+(?=[^\u201C"\n])/g, () => {
    count += 1;
    return '\n';
  });
  next = next.replace(/(?<=[^\u201C"\n])\s+(?=[\u201C"])/g, () => {
    count += 1;
    return '\n';
  });
  return { next, count };
}

const sample = [
  '"안돼요." 시즈에도 아직 자지 않은 것 같았다.',
  '그러나 그녀는 두 손을 뻗으며 거절 하려고 했다.',
  '"그렇지만 내일은 쉬지 않아?" 시즈에는 현재 봄방학 중이므로 매일 집에 있다.',
].join('\n');
const sampleOut = applyQuoteNarrationLinebreaks(sample).next;
const expected = [
  '"안돼요."',
  '시즈에도 아직 자지 않은 것 같았다.',
  '그러나 그녀는 두 손을 뻗으며 거절 하려고 했다.',
  '"그렇지만 내일은 쉬지 않아?"',
  '시즈에는 현재 봄방학 중이므로 매일 집에 있다.',
].join('\n');
if (sampleOut !== expected) {
  console.error('quote/narration split failed');
  console.error('got:\n', sampleOut);
  console.error('want:\n', expected);
  process.exit(1);
}
console.log('quote vs narration line breaks OK');

const long =
  '가'.repeat(40) + '. ' + '나'.repeat(40) + '. ' + '다'.repeat(10);
const wOut = wrapLongLinesAt80(long).next;
const wLines = wOut.split('\n');
if (wLines.length < 2 || wLines.some((l) => l.length > 85)) {
  console.error('wrap80 failed:', wLines.map((l) => l.length));
  process.exit(1);
}
console.log('wrap 80 OK, lines:', wLines.length);

function applyParagraphSpacing(text) {
  const nonEmpty = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const sizes = [6, 5, 7];
  const paragraphs = [];
  let index = 0;
  let paraIndex = 0;
  let blankInserts = 0;
  while (index < nonEmpty.length) {
    const size = sizes[paraIndex % sizes.length];
    const chunk = nonEmpty.slice(index, index + size);
    paragraphs.push(chunk.join('\n'));
    index += chunk.length;
    paraIndex += 1;
    if (index < nonEmpty.length) blankInserts += 1;
  }
  return { next: paragraphs.join('\n\n'), count: blankInserts };
}

const narrative = [
  '그리고 후일, 가다기리는 뜻밖에 마미의 모친을 대면하게 된다.',
  '가다기리는 휴일로서 집에 혼자만 있었다.',
  '아침 일찍 시즈에는 스키를 타러 갔으며, 마미는 학교 친구들하고 디즈니랜드로 구경하러 가서 저녁때까지는 돌아오지 않는다.',
  '오늘은 여자친구들만 5명이 간다고 하므로 약간의 용돈까지 주었다.',
  '오랫만의 휴일이지만, 그는 오래 전부터 집에서 혼자 지내는 것이 조금도 괴롭지 않았다.',
  '외출하는 것을 그다지 좋아하지 않았으며, 혼자서 독서를 하거나 음악을 듣는 것이 성격 에 맞았던 것이다.',
  '마미를 배웅한 가다기리는 현관문을 잠가놓고 커피물을 끓였으며, 이어 2층의 서재로 올라갔다.',
  '그러자 얼마 후 차임소리가 났다.',
].join('\n');
const paraOut = applyParagraphSpacing(narrative).next;
if (!paraOut.includes('성격 에 맞았던 것이다.\n\n마미를 배웅한')) {
  console.error('paragraph spacing failed:\n', paraOut);
  process.exit(1);
}
console.log('paragraph spacing OK');

console.log('All builtin checks passed');
