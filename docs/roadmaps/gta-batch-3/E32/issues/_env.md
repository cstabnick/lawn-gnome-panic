## Environment (shared by every E32 issue)

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af3091b90b4de9463` (a git
  worktree). Use Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. `npm install` is done.
- Game: `games/gnome-theft-auto` (three.js + TypeScript). Hedgeworth Links (golf) lives in `src/golf/`.
- **Other workers edit other files of the same game at the same time.** Touch only the files your issue lists. Never
  commit, never run `git stash`/`git checkout` on files, never run `npm run build` (it writes `dist/`); the lead does
  the full build. Keep LF line endings.
- Type-check: `npx tsc --noEmit -p games/gnome-theft-auto` (other workers' files may be mid-edit; if an error is in a
  file you do not own, ignore it and say so in your report).
- Tests: `cd games/gnome-theft-auto && npx vitest run src/golf/<file>.test.ts` (run only your own test files).
- A dev server is already running at `http://localhost:5332/` (do not start another, do not stop it). Screenshots:
  `node tools/gta-shots.mjs http://localhost:5332/ <out-dir> name:<x>,<z>,<yaw> --wait 10` (yaw 0 faces +z/south,
  Math.PI faces north, Math.PI/2 faces east; `--size 390x844` for a phone). Put screenshots in the scratchpad
  `C:\Users\cpsai\AppData\Local\Temp\claude\5c6e1ad7636bf755\491bbd90-be40-460d-b246-8599e60336ab\scratchpad\<your-issue-id>\`,
  not in the repo. Read the PNG to look at it.
- World: +x east, +z south (north is -z), metres; yaw 0 faces +z; a facing vector is (sin yaw, cos yaw).
- Repo rules: new visible objects are `@lawn/prefabs` prefabs (add a `PrefabDef` to the catalog file your issue names;
  `npm test -w packages/prefabs` must pass for your ids); assets are code-generated; lore in `docs/lore/` (search with
  `npm run lore -- find <word>`); 3D surfaces laid flat take a draw layer (`flatLayer(material, LAYER.<x>)` from
  `@lawn/depth`), boxes that touch must not share a face; touch controls for every action (44 px targets).

## What changed already (the lead's foundation, do not redo)

`src/golf/types.ts` now has nine holes. Key facts:
- `YARD = { minX: -1360, maxX: -1000, minZ: 410, maxZ: 974 }` (was maxZ 830). The new strip z 829..974 is the
  **Bottom Garden** (`BOTTOM_GARDEN`). The old south fence stays standing at `OLD_FENCE.z = 829` with an open gap, the
  **Turn Gate** `TURN_GATE = { x: -1140, z: 829, half: 3 }`. Ground is flat at y ≈ -2.41 everywhere in the yard.
- `POTTING_SHED = { x: -1178, z: 953, w: 8, d: 6, yaw: 0, roofY: 2.6, ladder: { x: -1173.6, z: 953 } }` (w along x,
  d along z): its flat roof is hole 7's tee.
- `HOLES[0..8]`: indices 0..3 are E15's holes card numbers 1, 2, 3, **9** (index 3 = "The Ninth", par 4); indices 4..8
  are card numbers 4..8: 4 "Peony's Promise" par 4 (tee -1150,850 → green -1272,862 r10), 5 "The Maze" par 4 (tee
  -1318,845 → S-bend → green -1322,950 r9), 6 "The Drip" par 3 (tee -1282,932 → green -1212,936 r10, pond -1248,934
  r14), 7 "The Potting Shed" par 3 (tee -1178,953 on the shed roof, `teeY: 2.6` → green -1092,938 r10), 8 "The Rhubarb
  Patch" par 4 (tee -1030,960 → corner -1026,886 → green -1108,860 r9). `COURSE_PAR` = 34.
- `HedgeworthHole.teeY?: number` (elevated tee, metres over the ground).
- `HOLE_ORDER` = `[0, 1, 2, 4, 5, 6, 7, 8, 3]` (play / card order). `holeIndexOfNumber(n)` (card number → index, -1 if
  none). `nextHoleIndex(index)` (-1 after the last).
- `MAZE_H = 2.6`; `MAZE_HEDGES: { a: [x, z]; b: [x, z] }[]` (5 walls on hole 5; two of them cross hole 5's fairway on
  purpose). `HEDGES` (E15's 4 walls, `HEDGE_H = 3.2`) unchanged.
- `CART_PATHS` has two more polylines through the Turn Gate into the Bottom Garden.
- `GolfSave` gained `bestNine: number | null`; `bestRound` is now the legacy four-hole best (kept, merged, not written).
- `GOLF_ACH` gained `fullNine: 'gta-hedgeworth-full-nine'`, `underPar: 'gta-nine-under-par'`, `maze: 'gta-out-of-the-maze'`.
- `GOLF_PROBES.bottomHoles = 'golf-bottom-holes'`; `GOLF_QUESTS.promise = 'sq-hedgeworth-peonys-promise'`.
- `round.ts` plays holes in HOLE_ORDER and `cardView` lists holes in card order (1..9).
- `src/golf/bottomGarden.ts` exists as a stub (`buildBottomGarden(scene): { boxes, soft, update }`), already wired in
  `runtime.ts`.
- Four empty prefab catalog files exist and are registered: `packages/prefabs/src/catalog/gta-golf-nine-garden.ts`
  (`GTA_GOLF_NINE_GARDEN`), `-props.ts` (`GTA_GOLF_NINE_PROPS`), `-critters.ts` (`GTA_GOLF_NINE_CRITTERS`), `-gear.ts`
  (`GTA_GOLF_NINE_GEAR`). Look at `packages/prefabs/src/catalog/gta-golf-plants.ts` / `gta-golf-props.ts` /
  `gta-golf-gear.ts` for the PrefabDef style (parts, tint, `about`, five `examine` lines in the Hedgeworth voice).
