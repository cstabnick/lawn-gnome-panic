Epic: 1 (solvers and tools, all parallel)
Depends on: none

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment and style.)

## Goal
Static quest checks the bot needs no playing for: is every place a quest sends the player legal (not inside a
building, not on water unless it is a boat objective, not off the world), does every scene and comms call a quest names
exist, and can every quest ever be offered. New findings fail CI; existing ones are a recorded baseline.

## Read first
- `src/questSim/types.ts` (`Finding`), `src/questSim/prereqs.ts` (`neverOffered(quests)`), `src/questSim/runner.ts`
  (`expectedScenes(q, variant)`).
- `src/quests/types.ts` (every `ObjectiveDef` kind and its position fields), `src/quests/defs.ts` (`QUESTS`, `GIVERS`).
- `src/quests/quests.test.ts` test 'no quest giver, vehicle spawn, drop-off, or visit spot is trapped inside a building'
  (how `pushOutOfBoxes(x, z, r, world.boxes, 0).hit` is used; reuse the idea, do not edit that file).
- `src/collide.ts` `pushOutOfBoxes`; `src/terrain.ts` `waterAt(x, z)` (non-null on water); `world.half`.
- `src/cutscene/scenes/index.ts` `SCENES`; `src/quests/comms.ts` `commsFor(questId, step)`; `src/quests/races.ts`
  (`race-<raceId>-podium` scene ids used by objectivesRace.ts).
- `src/questSim/harness.ts` `buildSimWorld()` (for `world`).

## Change
- `src/questSim/checks.ts` (new):
  - `export function spotsOf(q: QuestDef): { step: number; what: string; x: number; z: number; r: number; water: boolean }[]`:
    every position a quest uses, per objective kind (crack target `near` r 0 (targets snap to the nearest walk point, so
    only the off-world check applies to them); visit `at` r 1; steal-deliver `spawnAt`
    r 1.8 and `dropAt` r 2; chase-follow waypoints r 1; convoy route / dropAt; air-drop planeAt / dropZone (x, z = [0],
    [2]); survive-derby arena; boss-combine (0, startZ) / (0, endZ); choice optionA/B `at`; tessie-* points / route /
    nest / spawnAt / to with `water: true`; checkpoints `at` of each gate (skip gates with `height`); probe `at` when set;
    race: none). `water: true` means the spot is expected on water.
  - `export function staticFindings(q: QuestDef, world: World): Finding[]`: for each spot: 'spot-off-world' (outside
    `world.half`), 'spot-in-collider' (`pushOutOfBoxes(...).hit`, only for r > 0), 'spot-on-water' (`!water && waterAt(x, z)` for
    visit / choice / dropAt / spawnAt of non-boat kinds), 'spot-dry' (`water && !waterAt(x, z)`); scenes:
    'scene-missing' for each `expectedScenes(q, 'A')` and `expectedScenes(q, 'B')` id not in `SCENES`, and for each
    race objective without `SCENES['race-' + raceId + '-podium']`; giver: 'giver-missing' when `GIVERS[q.giver]` is
    undefined, 'spot-in-collider' for the giver spot (r 0.8). All class 'content', `detail` with the coordinates.
  - `export function tableFindings(quests: readonly QuestDef[]): Finding[]`: 'unlock-unreachable' (class 'content') for
    each id from `neverOffered(quests)` (comms are covered by `src/quests/comms.test.ts`; do not repeat them).
  - `export const findingKey = (f: Finding): string => `${f.questId}|${f.step ?? ''}|${f.check}|${f.detail}``.
- `src/questSim/checks.test.ts` (new): build the world once; collect `staticFindings` for every quest in `QUESTS` plus
  `tableFindings(QUESTS)`; compare their keys with `KNOWN_STATIC` (an exported-in-test `const` string array at the top
  of the test file): the test fails on any key not in KNOWN_STATIC (print them) and on any KNOWN_STATIC key no longer
  found (print: "fixed, remove from KNOWN_STATIC"). Fill KNOWN_STATIC with the findings the first run prints (they are
  real content issues to report, not test bugs), so the test passes.

## Contract
```ts
export function spotsOf(q: QuestDef): { step: number; what: string; x: number; z: number; r: number; water: boolean }[];
export function staticFindings(q: QuestDef, world: World): Finding[];
export function tableFindings(quests: readonly QuestDef[]): Finding[];
export const findingKey: (f: Finding) => string;
```

## Done when
- `npx vitest run src/questSim/checks.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/checks*.ts`.
- Your report lists every KNOWN_STATIC entry (these are the content findings).

## Out of scope
Every other file, including `src/quests/quests.test.ts` and all quest data (do not "fix" a spot).
