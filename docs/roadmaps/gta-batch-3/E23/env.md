## Environment (pasted into every E23 issue)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-ac3f179f02cb290f3` (Git Bash:
  `/c/Users/cpsai/cstabnick/lawn-gnome-panic/.claude/worktrees/agent-ac3f179f02cb290f3`). Branch `epic/E23-quests`.
  Game: `games/gnome-theft-auto` (three.js + TypeScript). Paths below are under `games/gnome-theft-auto/src/` unless noted.
- If `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers edit OTHER files of this game at the same time. Change only the files this issue lists (new files you
  create are fine). Never commit, never `git stash`, never switch branches, never revert files you did not change.
- **Line endings: keep each file's own.** `config.ts` and `types.ts` are CRLF; most others are LF. Never rewrite a whole
  file; use targeted edits. Check `git diff --stat` on your files at the end: a whole-file diff means you broke this.
- Do not run `npm run build`, `vite build` or a dev server (the lead does that). Check with
  `npx tsc --noEmit -p games/gnome-theft-auto` from the worktree root (errors in files you do not own may be other
  workers mid-edit: only yours must be clean) and targeted tests: `cd games/gnome-theft-auto && npx vitest run <files>`.
- Contracts already in place (written by the lead, do not change their shape):
  - `quests/types.ts`: `HoaPolicy = 'off' | 'free' | { cap: number }`, `QuestDef.hoa?`, `QuestDef.hoaSteps?`,
    `QuestCheckpoint { step, x, z, yaw }`, `QuestSave.checkpoint?`, `Run.failed?(): string | null`.
  - `types.ts`: `Watch.setCap?(cap: number | null)`, `Watch.search?(): WatchSearch | null`,
    `WatchSearch { x, z, r, seen, inside, evade, level, dispatchIn }`, `HudState.search?: WatchSearch | null`.
  - `config.ts` `WATCH`: `dispatchDelay: [0, 6, 5, 4, 3]`, `officerSpawnMin: 60`, `officerSpawnMax: 110`,
    `pursuitSpawnMin: 90`, `pursuitSpawnMax: 160`, `spawnNever: 50`, `searchRadius: 45`, `searchRadiusPerLevel: 15`.
  - `quests/hoaPolicy.ts`: `hoaPolicyFor(q, step): HoaPolicy`, `hoaCap(p): number | null` (convoy-ambush,
    boss-combine, survive-derby default to `{ cap: 1 }`).
  - `quests/questPins.ts` (stub bodies until issue 1-2): `createQuestPins(): QuestPins`, `restoreVehicle(v)`,
    `recoverVehicleNear(v, x, z, world): { x, z }`.
  - `quests/quests.ts` `Quests` interface: `onPlayerDown?(): boolean`, `retryActive?(reason: string): boolean`,
    `pins?: QuestPins`.
- Repo rules that apply: 3D things laid flat use `flatLayer(material, LAYER.x)` from `@lawn/depth`; mobile (390x844) and
  online must not break; no new one-off meshes for objects (prefabs).
- Final report (<= 20 lines): what changed, files, tests run and their result, anything left or surprising.
