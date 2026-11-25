## Environment (pasted into every E03 issue)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-ada7fa494c6b1c990` (Git Bash:
  `/c/Users/cpsai/cstabnick/lawn-gnome-panic/.claude/worktrees/agent-ada7fa494c6b1c990`). Branch `epic/E03-bugs`.
  Game: `games/gnome-theft-auto` (three.js + TypeScript). Paths below are under `games/gnome-theft-auto/src/` unless noted.
- If `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers edit OTHER files of this game at the same time. Change only the files this issue lists. Never commit,
  never `git stash`, never switch branches, never revert files you did not change. Keep LF line endings.
- Do not run `npm run build`, `vite build` or a dev server (the lead does that at the end). Check with
  `npx tsc --noEmit -p games/gnome-theft-auto` from the worktree root (errors in files you do not own may be other
  workers mid-edit: only yours must be clean) and targeted tests: `cd games/gnome-theft-auto && npx vitest run <files>`.
- Repo rules that apply: new objects go through `@lawn/prefabs` (`buildPrefab(id, opts)`), 3D things laid flat use
  `flatLayer(material, LAYER.x)` from `@lawn/depth` (no z-fighting), mobile and online must not break.
- Bug issues: find and write down the ROOT CAUSE first (a failing test or a recorded repro), then fix, then a regression
  test. Your final report (<= 20 lines): root cause, fix, files changed, tests run and their result, anything left.
