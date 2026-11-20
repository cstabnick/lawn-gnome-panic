# World object placement: editor view, migration, editing

Goal: every outdoor world object (`OBJECTS` in games/gnomes-of-gnomomia) is drawn in the level editor, its position lives in
the zone's level file as an `object` marker, and the editor can select, drag, nudge and rotate it. Builds on PR #247 (the loader,
`src/placement.ts`, and four s13 markers).

Fixed rules: ids never change; saves stay compatible; `WorldObjectDef` readers are unchanged; `resolveObject` in
`src/placement.ts` stays the only loader path; interior generated objects (`<zone>#shelf<n>`, `#lectern<n>`) are out of scope.
Packs whose positions come from shared constants stay on pack coordinates: s08, s09, s14, and the stacked pairs
`c3-record-long-lawn` / `s05-seven-ledger` and `c7-kings-cart` / `lrv-scroll-kings-cart`.

| Epic | Done when | Issues |
|---|---|---|
| 0. Editor view (read-only) | editor draws every outdoor object | 1 |
| 1. Migrate positions to markers | every outdoor object outside the exclusions has a marker; resolved coordinates unchanged | 1 (scripted, golden-checked) |
| 2a. Object collection | editor lists object markers and edits yaw/scale in the select panel | 1 |
| 2b. Object picking and dragging | select, drag, nudge, rotate work in the 3D view; save writes markers | 1 |

Why the migration is scripted: level files and packs are shared, so parallel hand edits to one zone would collide, and a
golden check of resolved coordinates before and after is a stronger guarantee than reading 120 edits.

Gates for every epic: `npm run build -w games/gnomes-of-gnomomia`, `npm run lint:content -w games/gnomes-of-gnomomia`,
`npm test -w games/gnomes-of-gnomomia` (except the pre-existing `src/gear.test.ts` failure), `npm test -w packages/level`,
`npm test -w tools/level-editor`. Smoke check at the end: `bash tools/smoke.sh http://localhost:<port>/ game ui` with the dev
server running (use a port other than 5292 and 5393 if they are taken).

---

## Epic 0: Editor view (read-only)

Depends on: none.

~~~~text
Epic: 0 Editor view (read-only)
Depends on: none

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\isopod. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing.
Other workers are not running in parallel for this epic. Do not commit.

## Goal
Every outdoor world object is drawn in the level editor's 3D view at its real position, using the same model builders as the game.

## Read first
- games/gnomes-of-gnomomia/src/objects.ts: `BUILDERS` table (about lines 23-114) and `buildObject` (about line 116). The builder
  table maps a model name to a colour and a function that adds a prefab to a Group.
- tools/level-editor/src/objectView.ts: `createObjectView`, `buildStructures`. Outdoor zones come from `ctx.outdoorZones`.
- tools/level-editor/src/world.ts: the editor imports `OBJECTS` and `ZONES` from '@gnomomia/content'.
- games/gnomes-of-gnomomia/src/config.ts: `WorldObjectDef` (the `model` union and the `color`/`scale`/`yaw` fields).

## Change
- games/gnomes-of-gnomomia/src/objectModels.ts (NEW): move `BUILDERS` here unchanged, and export:
  ```ts
  export const OBJECT_MODEL_COLOR: Record<WorldObjectDef['model'], number>;   // default colour per model
  export function buildObjectModel(model: WorldObjectDef['model'], color: number, parent: THREE.Group): void;
  ```
  Imports allowed: `three`, `@lawn/prefabs`, and TYPE-only imports from './config'. No import of './state', './quests',
  './terrain', './events' or './inventory' (the editor must be able to import it without starting the game).
- games/gnomes-of-gnomomia/src/objects.ts: import `buildObjectModel` and `OBJECT_MODEL_COLOR` from './objectModels' and delete
  its local `BUILDERS`. `buildObject` keeps its behaviour (same colour fallback, same scale, position and yaw).
- tools/level-editor/src/objectView.ts: inside `buildStructures`, for each outdoor zone id, add every entry of `OBJECTS` whose
  `zone` equals that id. For each, create a Group at `(def.x, heightAt(def.x, def.z), def.z)`, rotation.y = `def.yaw ?? 0`,
  scale = `def.scale ?? 1`, call `buildObjectModel(def.model, def.color ?? OBJECT_MODEL_COLOR[def.model], group)`, mark
  children as shared-geometry (`userData.sharedGeo = true; userData.sharedMat = true`) like props do, and add to `structures`.
  Import `OBJECTS` from '@gnomomia/content' and `buildObjectModel`, `OBJECT_MODEL_COLOR` from '@gnomomia/objectModels'.
  Use the editor's `t.heightAt` (the editor's terrain), as the surrounding code does.
- games/gnomes-of-gnomomia/src/objectModels.test.ts (NEW): a test that every key of `OBJECT_MODEL_COLOR` exists and that
  `buildObjectModel` adds at least one child for every model name (use the same model list as the `model` union; read it from
  the type by listing the keys of `OBJECT_MODEL_COLOR`).

## Contract
- `buildObjectModel(model, color, parent)` adds prefab children to `parent` and returns nothing.
- `OBJECT_MODEL_COLOR[model]` is the same default colour the old BUILDERS used.

## Done when
- `npm run build -w games/gnomes-of-gnomomia` passes.
- `npm test -w games/gnomes-of-gnomomia` passes except `src/gear.test.ts` (pre-existing).
- `npm test -w tools/level-editor` passes.
- `npm run dev -w tools/level-editor` opens (port 5393 or the next free one) and `bash tools/smoke.sh` is not required here.
- A grep for `BUILDERS` under games/gnomes-of-gnomomia/src finds nothing.

## Out of scope
- Do not change placement.ts, content.ts, levelDocs.ts or any level JSON.
- Do not touch the select tool, profile.ts or entityView.ts.
- Do not change how the game renders objects beyond moving the builder table.
~~~~

---

## Epic 1: Migrate positions to markers (scripted)

Depends on: Epic 0 (done first only so the editor shows the objects being moved; the migration itself does not need it).

~~~~text
Epic: 1 Migrate positions to markers
Depends on: Epic 0

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\isopod. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing.
Do not commit. Do not start dev servers.

## Goal
Every outdoor world object whose pack position is a literal `x` and `z` moves into its zone's level file as an `object` marker,
with its pack `x`/`z` removed. Resolved coordinates do not change.

## Read first
- games/gnomes-of-gnomomia/src/placement.ts: `resolveObject`, `OBJECT_MARKER_KIND`, `OBJECT_PLACEMENT_V`.
- games/gnomes-of-gnomomia/src/content.ts: pass 1b (object resolution) and `worldZone`.
- games/gnomes-of-gnomomia/src/data/levels/*.level.json: the `markers` array. Outdoor zones: mossbottom, thatchford, keep,
  cloverfield, hedgewood, rockery, verge. The deeps zone is indoor: skip it.
- games/gnomes-of-gnomomia/src/data/packs/*.ts: object literals look like `id: 'x', zone: 'verge', name: '...', x: -58, z: -10, model: ...`.
- games/gnomes-of-gnomomia/src/data/packs/s13-the-kings-cart.ts: the reference case (already migrated in PR #247).

## Procedure (write one script in the scratchpad, run it, do not hand-edit packs)
1. Snapshot. Write a vitest-free node script (or a `.test.ts` run with `npx vitest run`) that imports `OBJECTS` from
   `src/content.ts` and writes `{id: {zone, x, z, yaw: yaw ?? 0, scale: scale ?? 1}}` for every entry with
   `!id.includes('#')` to `$SCRATCH/before.json`. `$SCRATCH` is the scratchpad directory; use a fresh subfolder.
2. Select candidates. An object is a candidate when:
   - it is in a pack file (not generated), and
   - its zone is an outdoor zone above, and
   - its literal line has `x: <number>, z: <number>` (plain numbers, not expressions like `HAYLOFT.x - 4`, `seam(...)`, or a constant), and
   - its pack file is NOT one of s08, s09, s14, and its id is NOT one of `c3-record-long-lawn`, `s05-seven-ledger`,
     `c7-kings-cart`, `lrv-scroll-kings-cart`, and it is not already migrated (s13's four ids).
   Print the candidate list and its count. Expect roughly 100 entries. If the count differs from the list you printed, stop
   and report.
3. Rewrite. For each candidate, in its pack file, delete exactly the `x: N, z: N` fragment from its own literal (keep the rest
   of the line; keep commas valid). Then append to that zone's level JSON `markers` array (create the array if missing) an entry
   `{"id": "<id>", "kind": "object", "x": N, "z": N, "data": {"v": 1}}`. Keep the file valid JSON, 2-space indentation, and
   the existing order. Do not add any other field.
4. Snapshot after with the same script to `$SCRATCH/after.json`.
5. Compare. `before.json` and `after.json` must be identical for every id (use `JSON.stringify` on sorted keys). If not, revert
   the change to that id only and report it. Do not force a match.

## Change
- games/gnomes-of-gnomomia/src/data/packs/*.ts: remove `x`/`z` from the candidate literals only.
- games/gnomes-of-gnomomia/src/data/levels/<zone>.level.json for the outdoor zones: append markers.
- Do not change placement.ts, content.ts, the level editor, or any excluded pack.

## Done when
- `npm run build -w games/gnomes-of-gnomomia` passes.
- `npm run lint:content -w games/gnomes-of-gnomomia` reports 0 errors.
- `npm test -w games/gnomes-of-gnomomia` passes except `src/gear.test.ts`.
- `npm test -w packages/level` and `npm test -w tools/level-editor` pass.
- before.json and after.json are identical for every id. Report the count and the candidate count.

## Out of scope
- s08, s09, s14 packs, the four stacked-pair ids, generated interior objects, and indoor zones.
- Any change to placement.ts or content.ts.
~~~~

---

## Epic 2a: Object collection in the editor

Depends on: Epic 1.

~~~~text
Epic: 2a Object collection in the editor
Depends on: Epic 1

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\isopod. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing.
Do not commit. Do not start dev servers.

## Goal
The select tool's panel lists each zone's object markers as a fixed collection, with fields `yaw` and `scale`, and editing a field
updates the marker's `data` and is saved.

## Read first
- tools/level-editor/src/profile.ts: `COLLECTIONS`, the `CollectionDef` shape, and how `props` (line ~80) reads and writes a
  zone list.
- tools/level-editor/src/context.ts: `CollectionDef`, `Item`, `MutableZone`, `EditorContext`.
- tools/level-editor/src/tools/select.ts: how a collection's items are read (`items`), written (fields) and marked `fixed`.
- tools/level-editor/src/adapters/gnomomia.ts: `editableKeys` and the save conversion.
- games/gnomes-of-gnomomia/src/levelDocs.ts: `docToZone` and `worldZoneToDoc` (markers pass through here).

## Change
- tools/level-editor/src/profile.ts: add a collection `{ id: 'objects', label: 'Object', color: 0xe0c040, shape: 'circle', fixed: true, ... }`.
  - `items(d)`: the object markers of the zone (`d.markers` filtered to `kind === 'object'`), each shown as a flat view
    `{ id, x, z, yaw, scale }` where `yaw = data.rot?.y ?? 0` and `scale = typeof data.scale === 'number' ? data.scale : 1`.
  - `radius`: 1.5.
  - `fields`: `id` (text, read-only if the collection supports it, else omit), `yaw` (number, step 0.1), `scale` (number, step 0.1, min 0.1).
  - Writes must go back into `data` (`rot.y` for yaw, `scale` for scale, keep `v: 1`). Look at how select.ts applies a field
    edit. If it writes to the item object directly, the item view must be the marker itself, or the collection needs a write-back
    hook. Choose the smallest change that keeps the saved file in marker format. Document the choice in your report.
  - Ids are fixed: no add, delete or duplicate for this collection.
- tools/level-editor/src/adapters/gnomomia.ts: add `'objects'` to `editableKeys` (or the equivalent list) so undo and draft recovery copy it.

## Contract
- Saved file format is unchanged: `markers: [{ id, kind: 'object', x, z, data: { v: 1, rot?, scale? } }]`.
- Only `yaw` and `scale` are editable in this epic. `pos.y` and `rot.x`/`rot.z` are not written.

## Done when
- `npm test -w tools/level-editor` passes, including a new unit test in tools/level-editor/src that builds a zone doc with
  one object marker, reads the `objects` collection items, applies yaw and scale edits, and checks the marker's `data`
  afterwards.
- `npm run build -w games/gnomes-of-gnomomia` passes.
- `npm test -w packages/level` passes.

## Out of scope
- 3D picking and dragging of object meshes (Epic 2b).
- Anything in games/gnomes-of-gnomomia.
~~~~

---

## Epic 2b: Object picking and dragging

Depends on: Epic 2a.

~~~~text
Epic: 2b Object picking and dragging
Depends on: Epic 2a

## Environment
Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\isopod. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing.
Do not commit. Do not start dev servers.

## Goal
In the editor's 3D view, object markers have rings you can pick, drag, nudge and rotate with the select tool, like props.

## Read first
- tools/level-editor/src/entityView.ts: how collections draw rings (the `radius`, `shape`, `color` fields).
- tools/level-editor/src/tools/select.ts: pick, drag, nudge (arrow keys), rotate (Q/E) for a collection item; the `fixed` flag.
- tools/level-editor/src/objectView.ts: where Epic 0 draws object meshes (for matching the ring to the mesh position).

## Change
- Make the `objects` collection draw a ring at each object's `x`/`z` (already handled if entityView draws every collection in
  COLLECTIONS; verify).
- select.ts: confirm drag, nudge and Q/E rotate write `yaw` through the same path as Epic 2a. Fix only what is needed.
- Ensure `fixed: true` removes Add, Delete and Duplicate for this collection (select.ts already reads `fixed`; check the code).
- tools/level-editor/src/tools/select.test.ts or a sibling test file: a unit test for rotate and drag on an object marker, if the
  existing test file structure allows it (follow the pattern in selectMath.test.ts).

## Done when
- `npm test -w tools/level-editor` passes.
- `npm run build -w games/gnomes-of-gnomomia` passes.
- Report whether you could run the editor in a browser; if not, say so.

## Out of scope
- Changing the data format or any level JSON.
- Anything in games/gnomes-of-gnomomia except what the build needs.
~~~~

---

## After the last epic

Run the gates, run the smoke check with the game's dev server, commit the branch, push it to the upstream remote (cstabnick/lawn-gnome-panic), and update PR #247 or open a new one, as the user prefers.
