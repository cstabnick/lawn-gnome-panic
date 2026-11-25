"""Resolve diff3-style conflict hunks by a word-level three-way merge (tools/batch-merge.sh helper).

  git checkout --conflict=diff3 -- <files>; python tools/merge-hunks.py <files>

For each hunk (ours / base / theirs): when the base part is empty (both sides only added lines at the same spot) both
are kept, ours first ('union'); otherwise the three texts are split into tokens (words and whitespace runs) and merged
with `git merge-file`, which keeps both sides' edits to different parts of one line ('word'). Anything else is left in
conflict ('manual'). Every non-trivial resolution is printed for review. Line endings of the file are kept.
"""
import os
import re
import subprocess
import sys
import tempfile

HUNK = re.compile(
    r'<<<<<<< [^\n]*\n(?P<ours>.*?)\|\|\|\|\|\|\| [^\n]*\n(?P<base>.*?)=======\r?\n(?P<theirs>.*?)>>>>>>> [^\n]*\n',
    re.S)
TOKEN = re.compile(r'\s+|[^\s]+')


def tok(text: str) -> str:
    # One token per line; newlines inside whitespace tokens are escaped so line structure is preserved.
    return ''.join(t.replace('\n', '\\n') + '\n' for t in TOKEN.findall(text))


def untok(text: str) -> str:
    return ''.join(line.replace('\\n', '\n') for line in text.split('\n'))


def _merge_file(texts, union=False):
    with tempfile.TemporaryDirectory() as d:
        paths = []
        for name, txt in zip('obt', texts):
            p = os.path.join(d, name)
            with open(p, 'w', encoding='utf-8', newline='') as f:
                f.write(txt)
            paths.append(p)
        args = ['git', 'merge-file', '-p'] + (['--union'] if union else []) + paths
        r = subprocess.run(args, capture_output=True)
        return r.returncode == 0 or union, r.stdout.decode('utf-8')


def merge3(ours: str, base: str, theirs: str):
    """Returns (text, how) with how in 'line', 'union', 'word', or (None, 'manual')."""
    ok, out = _merge_file((ours, base, theirs))
    if ok:
        return out, 'line'
    if base.strip() == '':
        # Both sides only added lines at the same spot: keep both, ours first.
        return ours + theirs, 'union'
    ok, out = _merge_file((tok(ours), tok(base), tok(theirs)))
    if ok:
        return untok(out), 'word'
    return None, 'manual'


def main() -> None:
    for path in sys.argv[1:]:
        with open(path, encoding='utf-8', newline='') as f:
            s = f.read()
        notes = []

        def rep(m):
            out, how = merge3(m.group('ours'), m.group('base'), m.group('theirs'))
            if out is None:
                notes.append('MANUAL: ' + m.group('ours').strip()[:100])
                return m.group(0)
            if how != 'line':
                notes.append(how.upper() + ': ' + out.strip()[:140])
            return out

        s = HUNK.sub(rep, s)
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(s)
        print(f'{path}: ' + ('OK' if not notes else f'{len(notes)} hunk(s)'))
        for n in notes:
            print('   ' + n.replace('\n', ' | '))


if __name__ == '__main__':
    main()
