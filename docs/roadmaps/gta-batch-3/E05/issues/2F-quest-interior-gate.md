Epic: E05-2 Interiors and rooftops: engine pieces
Depends on: none

## Environment
Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a89501009f27d94ba` (a git worktree; stay in it).
Game: `games/gnome-theft-auto`. Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
Keep LF line endings (if a file you edit already has CRLF endings, keep CRLF in it; check with `file <path>`). Do not
commit. Other workers are editing other files of this game at the same time (src/interiors/*, app.ts is NOT to be
touched). Existing quests must behave exactly as before: every new field is optional.

## Goal
Quests can put a giver, a visit marker or a checkpoint gate **inside an interior**: an optional `interior: <id>` on
`GiverDef`, the `visit` objective and `CheckpointDef`. With it, the position is local to that interior (metres from
the room centre) and is converted to world coordinates at run time; while the player is outside, the map blip points at
the interior's door. The quest simulator treats such positions as reachable and skips its ground checks for them.

## Read first
- `games/gnome-theft-auto/src/interiors/registry.ts`: `interiorToWorld(id, lx, lz): [x, z]` (throws for an unknown id), `interiorById(id)` (`.def.door: {x, z, yaw}`, `.def.name`). Interiors register at import time, so convert at run time (inside functions), never at module top level.
- `games/gnome-theft-auto/src/interiors/runtime.ts`: `currentInterior(): string | null`.
- `games/gnome-theft-auto/src/quests/types.ts`: `GiverDef` (line ~21), the `visit` objective (~line 93), `CheckpointDef` (~line 193).
- `games/gnome-theft-auto/src/quests/quests.ts`: `visitRun` (~line 243) and every use of a giver's `x`, `z`, `exit` (lines ~438-453 markers, 475, 684-687, 714, 735-761, 828).
- `games/gnome-theft-auto/src/quests/objectivesCity.ts`: the `checkpoints` runner (gate positions `p.at`).
- `games/gnome-theft-auto/src/questSim/checks.ts`: `spots` (~line 50-110, `visit` and `checkpoints` cases) and the giver check (~line 143).

## Change
- `src/quests/types.ts`: add `interior?: string` to `GiverDef` (doc: "When set, x, z and exit are local to this
  interior (E05 src/interiors/registry.ts), metres from its room centre; the map marker shows at the interior's door
  while the player is outside."), to the `visit` objective and to `CheckpointDef` (same meaning for `at`).
- `src/quests/quests.ts`:
  - A helper `worldGiver(g: GiverDef): GiverDef` that returns `g` unchanged without `interior`, else a copy with `x, z`
    and `exit.x, exit.z` converted by `interiorToWorld`. Inside `createQuests`, resolve the givers map through it once
    (lazily on first use is also fine) and use the resolved givers everywhere in quests.ts (markers, prompt/range checks,
    `placePlayer(g.exit...)`).
  - Giver map blips / labels (~714, ~828): for an interior giver while `currentInterior() !== g.interior`, report the
    interior door's x, z instead.
  - `visitRun`: target = `obj.interior ? interiorToWorld(obj.interior, obj.at[0], obj.at[1]) : obj.at`; use it for the
    ring, the hose, the distance check and the blip; the blip is the interior's door while the player is not inside it.
- `src/quests/objectivesCity.ts`: gates with `interior` use the converted position for the gate mesh, the pass check
  and the blips (door when outside), exactly like `visitRun`.
- `src/questSim/checks.ts`: in `spots`, skip `visit` targets and checkpoint gates that have `interior` (like the
  existing skip for gates with `height`); in the giver check, skip the ground/box checks for a giver with `interior`
  but report a finding (class 'content', check 'giver.interior') when `interiorById(g.interior)` is undefined.
- `src/quests/quests.test.ts` (or a new `src/quests/interiorGate.test.ts`): a test that defines a test interior with
  `defineInterior` (from `../interiors/registry`; give it a unique id like `'test-gate-room'`), and checks
  `interiorToWorld` of a visit target lands at x >= 5000, and that the static checks (`staticFindings`) produce no
  spot finding for a fake quest whose visit objective has `interior: 'test-gate-room'`. Keep it small.

## Contract
```ts
interface GiverDef { ...; interior?: string }                       // x, z, exit local when set
{ kind: 'visit'; ...; interior?: string }                            // at local when set
interface CheckpointDef { ...; interior?: string }                   // at local when set
```
This is E04's "interior-visit" objective: a `visit` with `interior`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/quests src/questSim/checks.sim.test.ts src/questSim/coverage.test.ts` passes (the sim test may be
  slow; it must not get new failures from your change).

## Out of scope
app.ts, src/interiors/*, quest content files (chapter*.ts, sideQuests.ts, cityQuests.ts, defs.ts).
