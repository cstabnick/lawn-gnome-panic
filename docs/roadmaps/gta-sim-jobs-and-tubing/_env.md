## Environment (every issue)

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn` (a git worktree). The game is
  `games/gnome-theft-auto` (Vite + TypeScript + three.js). Node: in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
  Dependencies are installed: never run `npm install`.
- NEVER `git commit`, `git stash`, `git checkout`, switch branches, or revert files. Never start a dev server or run
  `vite build` / `npm run build`.
- Many other workers and planners are editing OTHER files of this game at the same moment. Edit ONLY the files your
  issue lists under "Change". Type errors in files you do not own are not yours: check only your own with
  `cd games/gnome-theft-auto && npx tsc --noEmit -p . 2>&1 | grep -E "src/(jobs|tubing)/"` (plus any other path your
  issue owns). Keep every exported signature of the stub you fill in exactly as it is (other workers code against it).
- Tests: `cd games/gnome-theft-auto && npx vitest run <your test files>` (vitest; `import { describe, expect, it } from 'vitest'`).
- Shared contracts (read, do not edit): `games/gnome-theft-auto/src/jobs/types.ts` (Gig, Stop, Sample, GigState,
  ComfortState, PayResult, JobsSave, JobsDeps, Jobs), `src/jobs/defs.ts` (JOBS table, LEVEL_XP, perksFor, JOB_TUNING,
  CHATTER, JOB_ACHIEVEMENTS), `src/jobs/protocol.ts` (wire records), `src/tubing/types.ts` (TOW, TubeState, Tubing).
- Repo rules: pure modules take plain data (no DOM, no three.js at import time) so they unit-test; UI modules append
  their own container to the `ui` element they are given and never restyle `#ui`; every touch target is at least 44 px;
  plain, short comments.
