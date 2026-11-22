Epic: 1 (World as level documents, flat parity)
Depends on: none

## Environment
- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, use absolute paths).
- Git Bash: if `node` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first. Dependencies are installed.
- Two other workers are editing `games/gnome-theft-auto/src/config.ts`, `quests/defs.ts`, `biomes.ts` and `world.ts`
  at the same time. You do not touch any file under `games/`. You only read `games/gnome-theft-auto/src/levels.ts`
  and the JSON under `games/gnome-theft-auto/src/data/`.
- The level editor is a local desktop dev tool: the mobile and online rules do not apply to it.
- Do not commit, push or open a PR. You are the only worker running the editor's e2e test (it starts its own Vite
  server on port 5394 and a headless Chrome/Edge); do not start any other server.

## Goal
The level editor (`tools/level-editor`) opens Gnome Theft Auto: one region document at a time
(`?game=gnome-theft-auto&level=<region>`, Turfton by default), shows the region's ground colour with its roads, the
hand-placed props through the real prefabs, and the markers; Select places and edits props (with the prefab picker),
moves the markers, and adds walk points and reserved zones; Road edits the highways; Save writes the region back to
`games/gnome-theft-auto/src/data/levels/<region>.level.json`, byte for byte unchanged when nothing was edited.

## Read first
- `games/gnome-theft-auto/src/levels.ts`: `REGION_DOCS`, `REGION_IDS`, `LAYOUT`, `regionDocProblems`, types
  `GtaRegionDoc`, `GtaProp`, `GtaRegionData`, `RegionId`. The documents are region-local: edit them in their own
  coordinates (no origin maths in the editor).
- `games/gnome-theft-auto/src/data/levels/turfton.level.json` and `dust-flats.level.json`.
- `tools/level-editor/src/adapters/gnomeokemon.ts` and `gnomeokemonLevel.ts` (first 80 lines and `asZone`): the
  pattern for a single-level game (one document per page, `createStubTerrain`).
- `tools/level-editor/src/adapters/snigms.ts` and `clubObjects.ts`: a flat level with props and markers, and an object
  view that draws props with `buildPrefab`.
- `tools/level-editor/src/context.ts`: `GameAdapter`, `CollectionDef`, `FieldDef`, `World`.

## Change
- `tools/level-editor/vite.config.ts`: `const gtaSrc = resolve(repo, 'games/gnome-theft-auto/src');`, alias
  `'@gta': gtaSrc`, add `'**/games/gnome-theft-auto/src/data/levels/**'` to `server.watch.ignored`, and in
  `gameDirs`: `'gnome-theft-auto': process.env.LEVEL_EDITOR_GTA_LEVELS_DIR ? resolve(process.env.LEVEL_EDITOR_GTA_LEVELS_DIR) : resolve(gtaSrc, 'data/levels')`.
- `tools/level-editor/vitest.config.ts`: alias `'@gta'` to `../../games/gnome-theft-auto/src`.
- `tools/level-editor/tsconfig.json`: `"@gta/*": ["../../games/gnome-theft-auto/src/*"]` in `paths`.
- `tools/level-editor/src/adapters/gtaLevel.ts` (new): the editable region.
  ```ts
  import type { GeneratorRef, MarkerDef, PathDef, Stamp } from '@lawn/level';
  import type { ZoneDef } from '@gnomomia/config';
  import { REGION_DOCS, REGION_IDS, type GtaProp, type GtaRegionData, type GtaRegionDoc, type RegionId } from '@gta/levels';

  /** A region as the editor holds it: the document's own fields, plus what the editor core reads. */
  export interface GtaLevel {
    id: RegionId; name: string;
    /** doc.bounds */
    w: number; d: number;
    /** Camera framing: the region's centre (always 0, 0: documents are region-local) and half its larger side. */
    origin: { x: number; z: number }; half: number;
    indoor: false;
    /** The Road tool shows only drawn roads (GTA has no derived roads). Not saved. */
    roadMode: 'authored';
    base: GeneratorRef; stamps: Stamp[]; paths: PathDef[]; props: GtaProp[]; markers: MarkerDef[]; data: GtaRegionData;
  }
  export const REGION_LIST: { id: string; name: string }[];          // REGION_IDS order, names from REGION_DOCS
  export function docToLevel(doc: GtaRegionDoc): GtaLevel;           // structuredClone the doc first; add no keys to props or markers
  export function levelToDoc(l: GtaLevel): GtaRegionDoc;
  export const asZone: (l: GtaLevel) => ZoneDef;                     // l as unknown as ZoneDef
  /** Road colour on a road (within width / 2 of a road path, or of a Turfton grid line inside data.grid.half), a dark
   * 0x2a2e36 outside the bounds, else data.ground. */
  export function groundColourAt(l: GtaLevel, x: number, z: number): number;
  ```
  `levelToDoc` must build the object with keys in exactly this order, so an unedited region saves byte for byte:
  `{ format: 'lawn-level', version: 1, game: 'gnome-theft-auto', id, name, bounds: { w, d }, base, stamps, paths, props, markers, data }`.
  Road colour: `0x55555b`.
- `tools/level-editor/src/adapters/gtaProfile.ts` (new): `export const GTA_COLLECTIONS: readonly CollectionDef[]`.
  Props get their own list; the markers are one shared array (`items: (d) => lvl(d).markers`) split by `kind` with
  `accepts`, like the stamp collections in `gnomeokemonProfile.ts`:
  - `props` "Prop": shape circle, radius `Math.max(1, Number(i.scale ?? 1))`, `make: (x, z) => ({ prefab: 'garden-rock', x, z, rot: 0, scale: 1 })`,
    fields: `prefab` (type `'prefab'`), `rot` (number, step 0.05), `scale` (number, step 0.1, min 0.1), `solid`
    (type `'bool'`, label "Solid (box collider)"), `tint` (text, label "Tint #rrggbb").
  - `landmarks` "Landmark": kinds `spawn`, `landmark`, `area`, `portal`; `fixed: true` (the game's code names these
    ids); radius 3; no fields.
  - `givers` "Quest giver": kind `giver`; `fixed: true`; radius 1.5.
  - `sites` "Site": kind `site` (Fort Sandpit, the airfield); `fixed: true`; radius 10.
  - `setpieces` "Setpiece": kind `setpiece`; `fixed: true`; radius 6; one field `yaw` read and written in
    `data.yaw` with `get`/`set` (only stations and the chapel van have one).
  - `reserves` "Reserved zone": kind `reserve`; radius `Math.max(hw, hd)` from `data`; `makeIn` creates
    `{ id: <next free 'reserve/zone-N'>, kind: 'reserve', x, z, data: { hw: 8, hd: 8 } }` (keys in that order); fields
    `hw` and `hd` (number, step 0.5, min 0.5) through `get`/`set` on `data`.
  - `walks` "Walk point": kind `walk`; radius 0.8; `makeIn` creates `{ id: <next free 'walk/N'>, kind: 'walk', x, z }`.
  For a collection with `makeIn`, give `make` a fallback with a fixed id; the next free id counts the markers of that
  kind in the level.
- `tools/level-editor/src/adapters/gtaObjects.ts` (new): `export function createGtaObjectView(ctx: EditorContext): { dispose(): void }`,
  modelled on `createClubObjectView` (same `object-view` root with a `structures` group and an empty second group,
  same rebuild-on-`changed` and dispose). Draw each prop with `buildPrefab(p.prefab, { scale: p.scale ?? 1, ...(p.tint ? { tint: parseInt(p.tint.slice(1), 16) } : {}) })`
  at `(p.x, 0, p.z)` with `rotation.y = p.rot ?? 0`, or a magenta 0.8 m box when the id is unknown. Draw markers as
  thin posts (a 0.15 m wide, 3 m tall box) coloured by kind, an `area` as a translucent `w x d` box, a `reserve` as a
  translucent `2hw x 2hd` box, and the `fort-sandpit` site as a translucent `w x d` box. Roads need no meshes (the
  ground colour shows them).
- `tools/level-editor/src/adapters/gta.ts` (new): `export const gtaAdapter: GameAdapter` with `id: 'gnome-theft-auto'`,
  `label: 'Gnome Theft Auto'`, `singleLevel: true`, `levels: () => REGION_LIST`, `createWorld(levelId)` (default
  `'turfton'`, unknown ids fall back to it; flat `createStubTerrain` with `groundColourAt` and `regionNameAt` returning
  the region name), `collections: GTA_COLLECTIONS`, `editableKeys: ['paths', 'props', 'markers']`, `zoneRect`: the
  bounds grown by 20 m, `tools: ['view', 'select', 'road']`, `toDoc` via `levelToDoc`, `createObjectView: createGtaObjectView`,
  and `beforeSave(ctx)` that throws (with a readable message) when: `regionDocProblems(doc)` is not empty (throw its
  first entry); a prop's prefab does not exist (`getPrefab` from `@lawn/prefabs`: `Prefab "<id>" does not exist.`); a
  road id is used by another region (`REGION_DOCS` of the other regions); a marker id appears twice in the region.
- `tools/level-editor/src/adapters/index.ts`: register `gtaAdapter`.
- `tools/level-editor/src/adapters/gtaLevel.test.ts` (new, vitest): for every region, `levelToDoc(docToLevel(doc))`
  serialised with `JSON.stringify(x, null, 2) + '\n'` equals the file text (read it with `readFileSync` from
  `../../../../games/gnome-theft-auto/src/data/levels/<id>.level.json` resolved from this file); `groundColourAt` is
  the road colour on a highway point and on a Turfton grid line, the ground colour away from them; the `walks`
  collection's `makeIn` gives an id no marker has.
- `tools/level-editor/e2e/run.mjs`: copy `games/gnome-theft-auto/src/data/levels` into the temp folder and set
  `process.env.LEVEL_EDITOR_GTA_LEVELS_DIR` to it (like the golf copy), then add a `console.log('gnome theft auto')`
  section before the final "no console errors" check:
  open `?game=gnome-theft-auto&level=dust-flats`; check the adapter id, the zone `dust-flats` and the tools
  `View,Select,Road`; select `{ collection: 'props', index: 0 }`, press ArrowRight, Save; check the status matches
  `/^Saved/` and the saved file's `props[0].x` is the original plus 0.5; Ctrl+Z, Save, and check the file is the
  original byte for byte; then `editZone` a prop's prefab to `'no-such-prefab'`, Save, check the status matches
  `/does not exist/` and the file's mtime did not change; Ctrl+Z, Save, byte for byte again. Also open
  `?game=gnome-theft-auto` and check the zone is `turfton`.
- `tools/level-editor/README.md`: add Gnome Theft Auto to the list of games and to "Games": one region per page, View /
  Select / Road, what Select can add (props, walk points, reserved zones) and what is fixed (landmarks, givers, sites,
  setpieces: their ids are named by the game's code), and that the scattered trees, cacti and farms are generated by
  the game at run time and are not shown in the editor.

## Contract
- Read-only use of `@gta/levels` exports named above. The documents are written by the dev server as
  `JSON.stringify(doc, null, 2) + '\n'` into the folder `gameDirs['gnome-theft-auto']` names.

## Done when
- `npx tsc --noEmit -p tools/level-editor` passes.
- `npm test -w tools/level-editor` passes (including `gtaLevel.test.ts`).
- `npm run e2e -w tools/level-editor` passes, all checks (the old ones and the new GTA ones). If it cannot find a
  browser, say so in your report instead of skipping silently.
- `git status` shows no change under `games/`.

## Out of scope
- Anything under `games/` (another worker owns those files; the editor only reads them).
- Brush, Paint and Analyze tools for GTA (the terrain is flat in this epic).
