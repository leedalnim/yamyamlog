"""손글씨 글꼴(메모먼트 꾹꾹체)을 앱에 쓰는 글자만 남겨 줄인다.

원본은 1만2천 자라 2MB 가 넘는다. 앱 코드에 들어 있는 한글(원료 이름·
시중 제품 목록·화면 글자)과 영문·숫자만 남긴다. 남긴 글자 목록은
src/lib/handChars.ts 에 적어, 목록에 없는 글자가 섞인 이름은 기본 글꼴로
보여 준다(한 낱말 안에서 글꼴이 섞이지 않게).

  /usr/bin/python3 scripts/subset-hand-font.py <원본.woff2>
"""
import pathlib, subprocess, sys

root = pathlib.Path(__file__).resolve().parent.parent
text = ''
for p in (root / 'src').rglob('*'):
    if p.suffix in ('.ts', '.tsx') and p.name != 'handChars.ts':
        text += p.read_text(encoding='utf-8')
hangul = sorted({c for c in text if '가' <= c <= '힣'})
ascii_ = [chr(c) for c in range(0x20, 0x7F)]
extra = list('·…')
chars = ''.join(hangul + ascii_ + extra)
tmp = root / 'node_modules' / '.hand-chars.txt'
tmp.write_text(chars, encoding='utf-8')
out = root / 'src' / 'assets' / 'fonts' / 'MemomentKkukkukk-sub.woff2'
subprocess.run([sys.executable, '-m', 'fontTools.subset', sys.argv[1], f'--text-file={tmp}',
                '--flavor=woff2', f'--output-file={out}'], check=True)
js = ''.join(hangul).replace('\\', '\\\\')
(root / 'src' / 'lib' / 'handChars.ts').write_text(
    '// scripts/subset-hand-font.py 가 만든다. 손글씨 글꼴에 남긴 한글.\n'
    '// 여기 없는 글자가 섞인 이름은 기본 글꼴로 보여 준다.\n'
    f"export const HAND_HANGUL = '{js}'\n", encoding='utf-8')
print(len(hangul), 'hangul ->', out.stat().st_size, 'bytes')
