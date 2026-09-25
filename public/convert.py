import re, sys

RULES = [
    # 1. 줄바꿈(빈 줄 포함) + 주변 공백 → 공백 1개 (기사 전체를 한 줄로 합침)
    (r'[ \t]*\r?\n+[ \t]*', ' ', 0),
    # 2. '다.' 뒤 공백 → 줄바꿈. 단, 문장(직전 '.' 또는 '“' 이후)이 10자 미만이면
    #    다음 문장과 붙여 둠 (예: “공부가 많이 됐다. 스타트…)
    (r'(?<=[^“.\n]{10}다\.) +', '\n', 0),
    # 3. 여는 따옴표 앞에서 줄바꿈 (앞 공백 제거)
    (r' *“', '\n“', 0),
    # 4. 닫는 따옴표 뒤에서 줄바꿈 (뒤따르는 조사 '며/고'를 다음 줄로)
    (r'” *', '”\n', 0),
    # 5. 줄 끝 공백 제거 + 문서 앞뒤 공백 정리
    (r'[ \t]+$', '', re.M),
    (r'^\s+|\s+$', '', 0),
]

def convert(text):
    for pat, rep, flags in RULES:
        text = re.sub(pat, rep, text, flags=flags)
    return text

if __name__ == '__main__':
    src = open('source.txt', encoding='utf-8').read()
    tgt = open('target.txt', encoding='utf-8').read()
    tgt_norm = '\n'.join(l.rstrip() for l in tgt.strip().split('\n'))
    ok_all = True
    variants = {
        '원문(줄끝 공백 포함)': src,
        '원문(줄끝 공백 제거)': re.sub(r'[ \t]+\n', '\n', src),
        '원문(CRLF)': src.replace('\n', '\r\n'),
    }
    for name, s in variants.items():
        out = convert(s)
        ok = out == tgt_norm
        ok_all &= ok
        print(f'[{name}] 일치: {ok}  ({len(out.splitlines())}줄 / 목표 {len(tgt_norm.splitlines())}줄)')
        if not ok:
            import difflib
            for d in difflib.unified_diff(tgt_norm.splitlines(), out.splitlines(), lineterm=''):
                print('  ', d)
    open('output.txt', 'w', encoding='utf-8').write(convert(src) + '\n')
    sys.exit(0 if ok_all else 1)
