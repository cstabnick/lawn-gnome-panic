#!/usr/bin/env bash
# Merge a workstream lead's branch into the current batch branch (see docs/process/big-batch-orchestration.md).
#   bash tools/batch-merge.sh <branch> <message-file>
# Merges with --no-ff, strips CRLF from files that were LF on the batch branch, and lists remaining conflicts.
# If there are none it commits; otherwise resolve them, `git add`, then `git commit --no-edit`.
set -u
branch="$1"; msg="$2"
git merge --no-ff --no-commit "$branch" >/dev/null 2>&1
for f in $(git diff --cached --name-only HEAD 2>/dev/null) $(git diff --name-only --diff-filter=U); do
  [ -f "$f" ] || continue
  grep -Iq . "$f" || continue   # skip binary files (images): never strip bytes from them
  [ "$(tr -cd '\r' < "$f" | wc -c)" -gt 0 ] || continue
  [ "$(git show HEAD:"$f" 2>/dev/null | tr -cd '\r' | wc -c)" -eq 0 ] || continue
  sed -i 's/\r$//' "$f"
  git diff --name-only --diff-filter=U | grep -qx "$f" || git add "$f"
  echo "lf: $f"
done
conf=$(git diff --name-only --diff-filter=U)
if [ -n "$conf" ]; then
  echo "CONFLICTS:"; echo "$conf"; exit 2
fi
git commit -q -F "$msg" && git log --oneline -1
