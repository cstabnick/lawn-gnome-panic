## Environment (pasted into every E02 issue)
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-ae378e704a44d72b4` (a git worktree: work only inside it, use absolute paths). Game: `games/gnome-theft-auto` (Vite + TypeScript + three.js). Game paths in the issue are under `games/gnome-theft-auto/src/` unless they start with `packages/`.
- Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers edit other files of this game at the same time. Change only the files listed under Change. Do not commit or run git commands that change state, do not run `npm run build` (vite writes dist/), do not start a dev server.
- Type-check: `cd games/gnome-theft-auto && npx tsc --noEmit -p .` (errors in files you do not own may be other workers mid-edit: report them, do not fix them). Tests: from `games/gnome-theft-auto`, `npx vitest run src/<file>.test.ts`.
- Repo rules: tuning numbers go in a named exported const block; comments plain and short; no new npm dependencies.
