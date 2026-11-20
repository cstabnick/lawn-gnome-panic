# Spawn placement: markers, migration, editor

Goal: enemy spawn groups (`SpawnGroup` in games/gnomes-of-gnomomia) get their position from a `spawn` marker in the zone's
level file, like world objects. Packs keep the enemy, count, spread and the `when` condition. The level editor shows and
moves them. This is the second marker kind; it tests whether the placement design generalises beyond objects.

Fixed rules:
- Runtime keys are index-based: `groupMembers` (entities.ts), the enemy sync key `s:${index}:${i}` and the random seed
  `99 + index` all use each spawn's position in `SPAWNS`. So NO reordering, insertion or removal of spawn entries. Ids are
  added alongside the index, never in its place. Multiplayer sync keys stay index-based in this roadmap.
- `resolveObject` (placement.ts) remains the loader pattern. The spawn resolver is a sibling function in placement.ts.
- Only literal numeric x/z are migrated. Spawns whose position comes from a constant or expression stay in their pack
  (for example s08 `HAYLOFT.x`), as with objects.
- Saves are unaffected: no save state refers to spawn positions.

Facts from the code (checked before writing this plan):
- 147 spawn literals across 19 pack files (`enemy:` lines). Some packs define spawns in a `const spawns` array (ch5, ch7,
  s13); others inline them under `spawns: [...]`. s14 reuses a `SPAWNS` constant.
- `content.ts` line ~101 pushes pack spawns into `SPAWNS`; line ~166 uses SPAWNS for house-door clearance (reads zone-local
  positions, so resolution must run before it, like objects in pass 1b); lines ~313-315 shift SPAWNS by the zone origin.
- `entities.ts` `spawnGroup` (line ~233) spawns `count` enemies in a disc of radius `spread`; `refreshGroups` (line ~271)
  spawns and despawns groups with `when`.

| Epic | Done when | Issues |
|---|---|---|
| S0. Identity and resolver | every spawn has a unique id; resolver exists; resolved SPAWNS unchanged | 1 (scripted) |
| S1. Migrate positions | literal spawn positions are markers; resolved SPAWNS identical before and after | 1 (scripted) |
| S2. Editor spawns | editor lists spawn markers as a fixed collection; rings show `spread`; count and spread editable | 1 |

Gates for every epic: `npm run build -w games/gnomes-of-gnomomia`, `npm run lint:content -w games/gnomes-of-gnomomia`,
`npm test -w games/gnomes-of-gnomomia` (except the pre-existing `src/gear.test.ts`), `npm test -w packages/level`,
`npm test -w tools/level-editor`.

---

## Epic S0: Identity and resolver

~~~~text
Epic: S0 Identity and resolver
Depends on: none

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\isopod. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing.
Do not commit. Do not start dev servers. Scratch files go in a fresh subfolder of the scratchpad directory.

## Goal
Every pack spawn entry has a unique `id`. A pure resolver for spawn markers exists and is wired into content.ts so that resolved
`SPAWNS` is unchanged. No spawn position moves in this epic.

## Read first
- games/gnomes-of-gnomomia/src/config.ts: `SpawnGroup` (about line 215) and `ContentPack.spawns` (about line 407).
- games/gnomes-of-gnomomia/src/placement.ts: `resolveObject`, `isObjectMarker`, `OBJECT_MARKER_KIND`, `OBJECT_PLACEMENT_V`.
  Mirror this style for spawns.
- games/gnomes-of-gnomomia/src/content.ts: pass 1b (object resolution, about lines 131-150), the `SPAWNS.push` (about line 101),
  and the origin shift for SPAWNS (about lines 313-315).
- games/gnomes-of-gnomomia/src/data/packs/ch5-hedgewood.ts (`const spawns`, about line 421) and s13-the-kings-cart.ts (about
  line 365) for the two spawn styles.

## Change
1. games/gnomes-of-gnomomia/src/config.ts: `SpawnGroup` gains `id?: string` (optional in the type so that code building
   spawns in tests still compiles). Document: "stable id; the level file's spawn marker refers to it".
2. Every spawn literal in every pack file under games/gnomes-of-gnomomia/src/data/packs/ gets `id: '<pack prefix>-spawn-<n>'`,
   where `<pack prefix>` is the pack's id prefix from src/data/README.md (for example `c5-`, `s13-`, `mb-`) and `<n>` counts
   from 1 within that pack in file order. Do this with a script, not by hand. Do NOT reorder or move any spawn entry.
   Do NOT change x, z, count, spread, enemy or when.
3. games/gnomes-of-gnomomia/src/placement.ts: add
   ```ts
   export const SPAWN_MARKER_KIND = 'spawn';
   export interface SpawnPlacementData { v: 1; count?: number; spread?: number; [k: string]: unknown }
   export function resolveSpawn(spec: SpawnGroup, zoneId: ZoneId, marker?: MarkerDef): { def: SpawnGroup; errors: string[] };
   ```
   Rules, mirroring resolveObject: never throws; no marker -> spec returned unchanged, no errors; with marker: marker must be
   kind 'spawn' and the same zone (else error and marker ignored); `data.v` must be 1 (else error, marker ignored);
   `count` must be a positive integer, `spread` a finite number >= 0 (else error, marker ignored); x and z come from the marker
   if present. Unknown data keys ignored. Returns a full SpawnGroup with x and z.
4. games/gnomes-of-gnomomia/src/content.ts: pass 1b also resolves spawns. Collect zone markers of kind 'spawn' (same loop as
   objects), resolve each `SPAWNS` entry that has an id against its marker, replace it in `SPAWNS` at the SAME index. Load
   errors: duplicate spawn ids across packs -> loadError; markers with no spawn id -> loadError; spawn ids missing -> loadError
   "spawn without id" ONLY for spawns that you gave ids in step 2 (all of them, so this should never fire; keep it as a guard).
   Keep the origin shift of step (SPAWNS shift, about lines 313-315) unchanged; it runs after pass 1b, as it does now.
5. games/gnomes-of-gnomomia/src/placement.test.ts (extend the existing file): resolveSpawn cases: no marker; marker
   overrides x/z; wrong zone; wrong v; count 0; spread negative; unknown key ignored.

## Contract
- Spawn order and length of `SPAWNS` do not change.
- `resolveSpawn` is pure and does not import content.ts.

## Done when
- A before/after snapshot of SPAWNS (enemy, zone, x, z, count, spread, id-presence, `when` presence per index) is identical.
  Write the snapshot script in the scratchpad; run it before the pack edits (step 2) and after; the two outputs must match on
  every field except `id`. Report the spawn count.
- `npm run build -w games/gnomes-of-gnomomia` passes.
- `npm run lint:content -w games/gnomes-of-gnomomia` reports 0 errors.
- `npm test -w games/gnomes-of-gnomomia` passes except `src/gear.test.ts`.
- `npm test -w tools/level-editor` passes.

## Out of scope
- Moving any spawn position into a level file (Epic S1).
- Changing index-based sync keys or rng seeds.
- Editor code.
~~~~

---

## Epic S1: Migrate spawn positions to markers

~~~~text
Epic: S1 Migrate spawn positions to markers
Depends on: S0

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\isopod. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing.
Do not commit. Do not start dev servers. Scratch files in a fresh subfolder of the scratchpad directory.

## Goal
Every spawn whose pack x and z are plain numeric literals moves into its zone's level file as a `spawn` marker, keyed by the
spawn id from S0, with its pack x and z removed. Resolved SPAWNS does not change.

## Read first
- games/gnomes-of-gnomomia/src/placement.ts: `resolveSpawn` (S0).
- games/gnomes-of-gnomomia/src/data/levels/*.level.json: `markers` arrays. Outdoor zones only (skip deeps, indoor).
- games/gnomes-of-gnomomia/src/data/packs/*.ts: spawn literals have `zone:`, `enemy:`, `x:`, `z:`, `count:`, `spread:`.
- The scratch scripts from the object migration (Epic 1 of world-object-placement.md), for the same approach.

## Procedure (one scripted run, golden-checked)
1. Snapshot before: write `$SCRATCH/before.json`: for each entry of SPAWNS (by index): zone, enemy, x, z, count, spread,
   `when` presence, id.
2. Candidates: spawn entries whose literal line has `x: <number>, z: <number>` (plain numbers, not expressions). Exclude:
   - indoor zones (deeps);
   - packs s08, s09, s14 (positions from constants) and any entry whose x or z is an expression;
   - anything else not a plain literal.
   Print the list and the count. Expect roughly 110 to 130.
3. Rewrite: remove exactly the `x: N, z: N` fragment from each candidate's own literal. Append to that zone's level JSON
   `markers` array `{"id": "<spawn id>", "kind": "spawn", "x": N, "z": N, "data": {"v": 1}}`, keeping order and 2-space
   indentation. Do not add count or spread (they stay in the pack).
4. Snapshot after to `$SCRATCH/after.json`, same fields.
5. Compare: identical on every field, index by index. If an entry differs, revert that entry and report it.

## Change
- games/gnomes-of-gnomomia/src/data/packs/*.ts: remove x/z from candidate literals only.
- games/gnomes-of-gnomomia/src/data/levels/<zone>.level.json: append spawn markers.
- Do not change placement.ts or content.ts.

## Done when
- before.json and after.json identical on every field, every index. Report candidate count and any reverted entries.
- `npm run build -w games/gnomes-of-gnomomia` passes.
- `npm run lint:content -w games/gnomes-of-gnomomia` reports 0 errors.
- `npm test -w games/gnomes-of-gnomomia` passes except `src/gear.test.ts`.
- `npm test -w packages/level` and `npm test -w tools/level-editor` pass.

## Out of scope
- Editor code. Reordering. Excluded packs. Indoor zones.
~~~~

---

## Epic S2: Editor spawns

~~~~text
Epic: S2 Editor spawns
Depends on: S1

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\isopod. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing.
Do not commit. Do not start dev servers.

## Goal
The select panel lists each zone's spawn markers as a fixed `spawns` collection with count and spread fields. Each spawn shows a
ring of radius `spread` at its position, and the enemy name in its label.

## Read first
- tools/level-editor/src/profile.ts: the `objects` collection and its `objectView` accessor pattern (added in Epic 2a of the
  object roadmap). Mirror it.
- tools/level-editor/src/entityView.ts: how rings are drawn for collections (`radius`, `shape`, `color`).
- tools/level-editor/src/objectView.ts: how markers are read for objects (Epic 2b).
- games/gnomes-of-gnomomia/src/content.ts exports `SPAWNS` (merged, zone-world positions). The editor needs the zone-local
  marker values; read them from the zone document, not from SPAWNS.

## Change
- profile.ts: add a collection `{ id: 'spawns', label: 'Spawn', color: 0xff5050, shape: 'circle', fixed: true, ... }`.
  - `items(d)`: the zone's markers with `kind === 'spawn'`, each as an accessor view onto the marker: `x`, `z` (marker
    values), `count` (`data.count` if a number, else the pack's count looked up by id from SPAWNS, else 1), `spread`
    (`data.spread` if a number, else the pack's spread looked up from SPAWNS, else 0). Writing `count` or `spread` sets
    `data.count` / `data.spread` and keeps `data.v = 1`. Read-only `enemy` is shown via the label, not as a field.
  - `radius`: `Number(spread)` as read through the view (so the ring shows the spread).
  - `fields`: `count` (number, step 1, min 1), `spread` (number, step 0.5, min 0).
  - Fixed: no add, delete or duplicate.
- Label: the existing select panel shows an id or name; if it needs a name, use the enemy name from ENEMIES via the spawn
  id's lookup in SPAWNS. Keep this to what the existing panel can show.
- adapters/gnomomia.ts: `'markers'` is already in editableKeys (from Epic 2a); confirm and do not add a duplicate.

## Contract
- Saved format unchanged: marker `{id, kind: 'spawn', x, z, data: {v: 1, count?, spread?}}`.
- The ids come from S0; the editor never creates or deletes spawns.

## Done when
- `npm test -w tools/level-editor` passes, including a new test `tools/level-editor/src/spawnProfile.test.ts`: builds a zone doc
  with one spawn marker, reads the `spawns` items, sets count and spread through the view, and checks `data.count`,
  `data.spread` and `data.v` afterwards. Also checks that the view falls back to the pack value when `data` has no count.
- `npm run build -w tools/level-editor` (tsc) passes.
- `npm run build -w games/gnomes-of-gnomomia` passes.

## Out of scope
- 3D rendering of spawn members, enemy meshes, changes to the game's spawn logic.
- Changing ids, order, or index-based sync keys.
~~~~
