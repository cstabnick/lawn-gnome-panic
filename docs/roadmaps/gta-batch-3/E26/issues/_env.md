## Environment (shared by every E26 issue)

- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a6cc6ca26de966f17` (a git worktree).
  Game: `games/gnome-theft-auto` (three.js + TypeScript + Vite). Use Git Bash; if `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` is already done.
- Other workers edit other files of the same game at the same time. Only change the files your issue names. Never
  commit, never run `git stash`, `git checkout` or `git reset`. Do not start a dev server unless the issue says so (and
  then only on the port it names).
- Keep LF line endings in new files; a file that is already CRLF stays CRLF (`cloudSave.ts`, `saveIO.ts`,
  `online/protocol.ts` are CRLF). Never rewrite a whole file just to reformat it.
- Type-check: `cd games/gnome-theft-auto && npx tsc --noEmit -p .` (safe in parallel; other workers' stub files keep
  their exported signatures). Single test file: `npx vitest run src/<path>.test.ts` from `games/gnome-theft-auto`.
  Do not run `npm run build` (it writes dist/; the lead runs it at the end).
- Shared contracts live in `games/gnome-theft-auto/src/streetRace/types.ts` and
  `docs/roadmaps/gta-batch-3/E26/contracts.md`. Do not change exported signatures of stub files you do not own.
- World coordinates: +x east, +z south; yaw 0 faces +z, yaw = atan2(dx, dz).
- Repo rules: new objects go through `@lawn/prefabs`; assets CC0 or generated in code; UI appends to `#ui`, never
  restyles it; phone first (44 px touch targets, fits 390 x 844); writing follows `docs/lore/canon.md`; the game's
  tone is dry, satirical, gnome-sized ("keep the charm").
