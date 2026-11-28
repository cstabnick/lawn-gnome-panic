"""Renumber an incoming branch's lore rulings during a batch merge (docs/process/big-batch-orchestration.md).

  python tools/renumber-rulings.py <branch> <first-new-number>

Two parallel epics often both take the next free ruling numbers (R-NNN). Run this during `git merge --no-commit`
of <branch>, after the HEAD side of docs/lore/rulings.md is known:
- the conflict hunk in docs/lore/rulings.md keeps HEAD's rulings and appends the branch's, renumbered from
  <first-new-number> in order (the ruling heading that sits just above the hunk belongs to the branch's first ruling
  when the hunk starts mid-ruling, as git usually leaves it);
- every other file the branch changed gets its references renumbered, but only on lines that are not in HEAD's
  version of the file (so HEAD's own references to the same numbers are untouched).
Prints the mapping and the files it changed.
"""
import re
import subprocess
import sys


def git(*args: str) -> str:
    return subprocess.run(['git', *args], capture_output=True).stdout.decode('utf-8', 'ignore')


def main() -> None:
    branch, first = sys.argv[1], int(sys.argv[2])
    path = 'docs/lore/rulings.md'
    s = open(path, encoding='utf-8', newline='').read()
    m = re.search(r'<<<<<<< [^\n]*\n(.*?)(?:\|\|\|\|\|\|\| [^\n]*\n.*?)?=======\n(.*?)>>>>>>> [^\n]*\n', s, re.S)
    if not m:
        sys.exit('no conflict hunk in docs/lore/rulings.md')
    ours, theirs = m.group(1), m.group(2)
    # The heading just above the hunk (shared by both sides) is the first ruling of each side.
    above = re.findall(r'^## R-(\d+)\s*$', s[:m.start()], re.M)
    first_old = int(above[-1]) if above else None
    olds = ([first_old] if first_old else []) + [int(x) for x in re.findall(r'^## R-(\d+)\s*$', theirs, re.M)]
    mapping = {o: first + i for i, o in enumerate(olds)}
    for o, n in sorted(mapping.items(), reverse=True):
        theirs = re.sub(rf'^## R-{o}\s*$', f'## R-{n}', theirs, flags=re.M)
    merged = ours.rstrip('\n') + f'\n\n## R-{mapping[olds[0]]}\n\n' + theirs
    s = s[:m.start()] + merged + s[m.end():]
    open(path, 'w', encoding='utf-8', newline='').write(s)
    print('mapping:', ', '.join(f'R-{o} -> R-{n}' for o, n in mapping.items()))

    base = git('merge-base', 'HEAD', branch).strip()
    pat = re.compile(r'R-(' + '|'.join(str(o) for o in mapping) + r')\b')
    for f in git('diff', '--name-only', base, branch).split():
        if f in (path, 'docs/lore/INDEX.md') or not re.search(r'\.(md|ts|json|mjs)$', f):
            continue
        try:
            text = open(f, encoding='utf-8', newline='').read()
        except OSError:
            continue
        if not pat.search(git('show', f'{branch}:{f}')):
            continue
        head_lines = set(git('show', f'HEAD:{f}').splitlines())
        out = []
        for line in text.splitlines(keepends=True):
            if line.rstrip('\r\n') not in head_lines:
                line = pat.sub(lambda x: f'R-{mapping[int(x.group(1))]}', line)
            out.append(line)
        new = ''.join(out)
        if new != text:
            open(f, 'w', encoding='utf-8', newline='').write(new)
            print('renumbered', f)


if __name__ == '__main__':
    main()
