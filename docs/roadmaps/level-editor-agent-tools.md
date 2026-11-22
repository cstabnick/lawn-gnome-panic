# Level editor: agent tools

The level editor (`tools/level-editor`) is a tool for people. Agents need to drive it the same way people do, without pixel clicks
or hand-edited JSON: the same commands the buttons run, the same checks, plain-data answers. Everything an agent does through it is
one undo step a person can see and revert.

## Plan

| # | Feature | Status |
|---|---|---|
| 1 | **Command layer** `window.le`: `le.run(name, args)` over the functions the Select tool itself calls (`src/agent/itemOps.ts`) | this PR |
| 2 | **Queries** as JSON: `le.state()`, `le.list()`, `le.get()`, `le.probe()`, `le.path()`, `le.reach()`, `le.catalog()` | this PR |
| 3 | **Problems**: one `collectProblems(ctx)` list (adapter checks, unknown prefabs and markers, overlaps, stale bake, reachability), a Problems panel in the header, `le.problems()` | this PR |
| 4 | **Headless CLI** `npm run level -- <game> <level> check / apply ops.json / query`: same adapters, commands and checks in Node, no browser; `check` in CI | later |
| 5 | **Proposals**: an agent writes an `ops.json`; the editor shows it as ghost objects with Accept / Reject per change | later |
| 6 | **Pins and notes**: a person drops a pin or box with a note, saved to a `*.notes.json` sidecar; `le.notes()` | later |
| 7 | **Snapshots**: `le.shot({ view: 'top', focus, radius, overlays })` returns a labelled top-down PNG | later |
| 8 | **Placement helpers**: `findSpot`, seeded `scatter`, `alongPath` | later |
| 9 | **Stable ids** for every item (today most refs are array indexes, which shift) | later |
| 10 | **Command log**: record a session as a command script, replay it, turn it into an e2e test | later |

## Shape of this PR

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | `src/agent/types.ts` contract, stubs for every module, `GameAdapter.checks?` in `context.ts`; build and tests pass | 0 (written by the planner) |
| 2 Agent API | build, `npm test -w tools/level-editor`, editor loads with `window.le` | 4 in parallel |
| 3 Wire-up (planner) | e2e covers `window.le` and the Problems panel; README and AGENT_INDEX updated | 0 (planner) |

File owners in epic 2: A `itemOps.ts`, `itemOps.test.ts`, `tools/select.ts`; B `queries.ts`, `queries.test.ts`; C `problems.ts`,
`problems.test.ts`, `problemsPanel.ts`, `adapters/gnomomia.ts`; D `api.ts`, `api.test.ts`, `editor.ts`. No file is under two issues.

## Issues

### A: item operations

~~~~text
Epic: 2 Agent API
Depends on: none

## Environment
Working directory: the repo root (C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\mako). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Three other workers are editing other files in
tools/level-editor/src/agent/ at the same time (queries.ts, problems.ts, problemsPanel.ts, api.ts, editor.ts, adapters/gnomomia.ts):
do not touch them. Do not commit.

## Goal
`tools/level-editor/src/agent/itemOps.ts` implements every change the Select tool makes to an item as a function of the editor
context, and the Select tool (`src/tools/select.ts`) calls these functions instead of its own copies, so a person's click and an
agent's command run the same code.

## Read first
- tools/level-editor/src/agent/itemOps.ts: the stub. Keep every exported signature exactly; fill in the bodies.
- tools/level-editor/src/agent/types.ts: `ItemRef`.
- tools/level-editor/src/tools/select.ts: `commitField`, `deleteSelected`, `placeAt`, `endDrag`, `duplicateSelected`,
  `nudgeSelected`, `rotateSelected`. Their bodies are the behaviour to move into itemOps.ts.
- tools/level-editor/src/context.ts: `EditorContext` (`editZone`, `zones`, `zone`, `round`, `select`, `selection`, `adapter.collections`),
  `CollectionDef` (`items`, `accepts`, `make`, `makeIn`, `fields`, `follows`, `fixed`, `deleteBlocked`), `FieldDef` (`key`, `get`, `set`).
- tools/level-editor/src/draft.test.ts: how a test builds a real context:
  `const ctx = createContext(createWorld(), gnomomiaAdapter); ctx.viewport = { refresh() {}, focus() {} } as never;`

## Change
- tools/level-editor/src/agent/itemOps.ts: implement, all on the current zone `ctx.zones[ctx.zone]` cast to `MutableZone`,
  collections found with `ctx.adapter.collections.find((c) => c.id === id)`:
  - `resolveRef(ctx, ref)`: unknown collection -> `Error('No collection "<id>" in <adapter.id>')`. `{index}`: must be an integer
    in range of `c.items(def)` and accepted by `c.accepts` when present, else `Error('No <label> at index <i>')`. `{id}`: first index
    whose item's `id === ref.id` (and accepted), else `Error('No <label> with id "<id>"')`.
  - `addItem`: throws `Error('<label> cannot be added')` for a fixed collection. One `ctx.editZone(label ?? 'Add <label>', ctx.zone, fn)`:
    `y = ctx.terrain.heightAt(x, z)`, push `c.makeIn ? c.makeIn(def, ctx.round(x), ctx.round(z), y) : c.make(ctx.round(x), ctx.round(z), y)`,
    then for each `[key, value]` of `fields`: find the FieldDef by key (unknown key -> throw `Error('<label> has no field "<key>"')`
    BEFORE calling editZone, so nothing changes), write through `f.set` when present else `item[key] = value`; keys `x` / `z` are
    allowed and set the position. Returns the new index (`c.items(def).length - 1`, read after the edit).
  - `moveItem`: one editZone (label default `'Move <label>'`) setting `it.x = ctx.round(x)`, `it.z = ctx.round(z)` and moving
    every `c.follows?.(def, it)` item by the same delta (rounded to 0.01 like `endDrag` does). Followers must be read BEFORE the item
    moves (call follows first, then move).
  - `nudgeItem`: exactly `nudgeSelected`'s body, label default `'Nudge <label>'`.
  - `setField`: the body of `commitField` minus the string parsing (the value arrives typed), including the props `solidR` rule.
    Key may be `x` or `z` too. Unknown key -> throw as in addItem. Label default `'Edit <label> <field label>'`.
  - `rotateItem`: `rotateSelected`'s body; returns false (and does not call editZone) when the item has no numeric yaw or rot.
  - `deleteItem`: fixed -> `Error('<label> cannot be deleted')`; `c.deleteBlocked?.(def, index)` string -> `Error(thatString)`. One
    editZone splicing it out (label default `'Delete <label>'`). Then if `ctx.selection` is that collection and index, `ctx.select(null)`.
  - `duplicateItem`: `duplicateSelected`'s copy rules (same id suffix rule, houses get `house-<suffix>`), fixed -> throw. Returns the copy's index.
- tools/level-editor/src/tools/select.ts: make `commitField` (after its parsing), `deleteSelected`, `placeAt`, the commit branch of
  `endDrag`, `duplicateSelected`, `nudgeSelected` and `rotateSelected` call the itemOps functions with
  `{ collection: c.id, index }`. Keep the selection handling that is UI behaviour in select.ts (selecting the new item after
  placeAt / duplicate, `armed = null`, `renderAddButtons()`). `deleteSelected` keeps showing a blocked reason with `ctx.status(msg)`:
  wrap `deleteItem` in try/catch and status the message. `endDrag` still puts the item back to its start before calling `moveItem`
  (moveItem needs the start position to carry followers). Keep the labels the UI used before ('Add Prop', 'Move Prop', ...).
- tools/level-editor/src/agent/itemOps.test.ts (new, vitest): with a real gnomomia context as in draft.test.ts, on the first zone:
  addItem('props', ...) with `{ prefab: <an id from the zone's existing props, or 'birdbath'> }` adds one item and one undo step
  (`ctx.history.undo()` removes it); moveItem by index and by id; setField with an unknown key throws and leaves `ctx.history.canUndo`
  unchanged; deleteItem on 'spawn' throws 'cannot be deleted'; duplicateItem returns a new index; resolveRef errors read as above.

## Contract
Keep the exported signatures of itemOps.ts exactly as the stub has them (other workers import them right now):
resolveRef(ctx, ref): number; addItem(ctx, collection, x, z, fields?, label?): number; moveItem(ctx, ref, x, z, label?): void;
nudgeItem(ctx, ref, dx, dz, label?): void; setField(ctx, ref, key, value, label?): void; rotateItem(ctx, ref, da, label?): boolean;
deleteItem(ctx, ref, label?): void; duplicateItem(ctx, ref, label?): number. Each mutating call is exactly one ctx.editZone call.

## Done when
- `npm run build -w tools/level-editor` passes (tsc --noEmit).
- `npm test -w tools/level-editor` passes, including itemOps.test.ts.

## Out of scope
Every other file under tools/level-editor/src/agent/, editor.ts, adapters/. No new npm dependencies.
~~~~

### B: queries

~~~~text
Epic: 2 Agent API
Depends on: none

## Environment
Working directory: the repo root (C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\mako). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Three other workers are editing other files in
tools/level-editor/src/ at the same time (agent/itemOps.ts, tools/select.ts, agent/problems.ts, agent/problemsPanel.ts,
agent/api.ts, editor.ts, adapters/gnomomia.ts): do not touch them. Do not import from agent/itemOps.ts (it is being written).
Do not commit.

## Goal
`tools/level-editor/src/agent/queries.ts` answers read-only questions about the editor as plain JSON-safe data, for the agent API.

## Read first
- tools/level-editor/src/agent/queries.ts: the stub. Keep every exported signature exactly; fill in the bodies.
- tools/level-editor/src/agent/types.ts: EditorState, ItemView, CollectionInfo, Probe, PathResult, ReachResultView, ItemRef.
- tools/level-editor/src/context.ts: EditorContext, CollectionDef, FieldDef (enum fields have `options`), GameAdapter.
- tools/level-editor/src/tools/analyze.ts: `computePath` (findPath3 call with `c.terrain.standY`, PATH_EXPAND = 60000,
  REACHED_TOL = 1.5 m) and `runReach` (computeReachability(c.terrain, c.zones[c.zone])).
- tools/level-editor/src/prefabPicker.ts lines 1-12 and src/prefabSearch.ts: `allPrefabs()` mapped to PrefabLite, `searchPrefabs(all, query, 'all', limit)`.

## Change
- tools/level-editor/src/agent/queries.ts:
  - A local `resolve(ctx, ref): number` (same rules as this text; do not import itemOps): unknown collection ->
    `Error('No collection "<id>" in <adapter.id>')`; `{index}` out of range or not accepted -> `Error('No <label> at index <i>')`;
    `{id}` -> first accepted item with `item.id === ref.id`, else `Error('No <label> with id "<id>"')`.
  - A local `view(c, item, index): ItemView`: `id` only when `typeof item.id === 'string'`; `name` = String of the first of
    item.name, item.label, item.id, item.prefab that is not undefined (omit when none); `fields` = for each FieldDef,
    `f.get ? f.get(item) : item[f.key]`, passed through `JSON.parse(JSON.stringify(v ?? null))` so it is JSON-safe.
  - `editorState`: fill every EditorState field from ctx (`adapter.id`, `ctx.zone`, `adapter.levels()`, `[...ctx.outdoorZones]`,
    selection, `[...ctx.dirty.zones]`, deltas, paint, `ctx.dirty.walkRects.length`, `ctx.history.nextUndo`, `ctx.history.canRedo`,
    snap, gatesOpen, `[...adapter.tools]`, and collections as CollectionInfo with count = accepted items in the current zone and
    fields mapped to { key, label, type, options? }).
  - `listItems`: views of the accepted items of one collection (unknown id throws as above) or of every collection in order.
  - `getItem`: view of the resolved item.
  - `probe(ctx, x, z, radius = 5)`: fields from ctx.terrain (`heightAt`, `zoneAt`, `regionNameAt`, `isBlocked`) and `ctx.paint.at(x, z)`;
    `near` = accepted items of every collection of the current zone with distance (hypot on x, z, rounded to 0.01) <= radius,
    sorted nearest first.
  - `pathBetween`: start point `{ x: a.x, y: ctx.terrain.heightAt(a.x, a.z), z: a.z }`, same for b; call
    `findPath3(start, end, (x, z, fromY) => ctx.terrain.standY(x, z, fromY), 60000)` from '@gnomomia/pathfind'. Empty -> `{ reached:false, length:0, waypoints:[] }`.
    Otherwise length over [start, ...waypoints] in 3D, reached = 2D gap from the last waypoint to b <= 1.5. Waypoints as plain {x,y,z}.
  - `reachability`: if `!ctx.adapter.tools.includes('analyze')` throw `Error('<adapter.label> has no reachability')`. Otherwise
    `computeReachability(ctx.terrain, ctx.zones[ctx.zone]).results` (from '@gnomomia/reach') mapped to ReachResultView.
  - `prefabCatalog(query, limit = 20)`: `searchPrefabs(allPrefabs() mapped to PrefabLite, query, 'all', limit)` mapped to { id, name, category }.
- tools/level-editor/src/agent/queries.test.ts (new, vitest). Real gnomomia context, as in src/draft.test.ts:
  `const ctx = createContext(createWorld(), gnomomiaAdapter); ctx.viewport = { refresh() {}, focus() {} } as never;`
  Check: editorState has game 'gnomomia', a collections entry 'props' and a JSON round trip equal to itself; listItems('spawn') has one
  item; listItems() covers every collection; getItem with a bad index throws 'No Spawn at index'; probe at the spawn's x, z gives a
  finite y and zone === ctx.zone; pathBetween from the spawn to a point 3 m east returns reached true; reachability returns an array
  containing a 'spawn' kind; prefabCatalog('bird') returns at most 20 entries. Also a Snigms context
  (`createContext(snigmsAdapter.createWorld('town'), snigmsAdapter)`, import from '../adapters/snigms') where reachability throws.

## Contract
Keep the exported signatures in queries.ts exactly as the stub has them (api.ts imports them right now). Return only plain data:
no three.js objects, no functions, no Sets.

## Done when
- `npm run build -w tools/level-editor` passes.
- `npm test -w tools/level-editor` passes, including queries.test.ts.

## Out of scope
agent/itemOps.ts, agent/problems.ts, agent/problemsPanel.ts, agent/api.ts, editor.ts, tools/*, adapters/*.
~~~~

### C: problems

~~~~text
Epic: 2 Agent API
Depends on: none

## Environment
Working directory: the repo root (C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\mako). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Three other workers are editing other files in
tools/level-editor/src/ at the same time (agent/itemOps.ts, tools/select.ts, agent/queries.ts, agent/api.ts, editor.ts): do not touch
them or import from them. Do not commit.

## Goal
One list of every problem in a level (`collectProblems`), a Problems window in the editor header that shows it, and Gnomomia's
save checks available as that list without a confirm() dialog.

## Read first
- tools/level-editor/src/agent/problems.ts and agent/problemsPanel.ts: the stubs. Keep the exported signatures; fill in the bodies.
- tools/level-editor/src/agent/types.ts: `Problem`.
- tools/level-editor/src/context.ts: `GameAdapter.checks?(ctx, zone): Problem[]` and `beforeSave?`; EditorContext (`viewport.focus`, `select`, `events`).
- tools/level-editor/src/adapters/gnomomia.ts: `beforeSave` (prefab check, then checkMarkersBeforeSave with window.confirm).
- tools/level-editor/src/saveCheck.ts: `findUnknownRefs(zones)` returns `{ zone, kind, id }[]`.
- tools/level-editor/src/tools/analyze.ts: `doorIssuesFor` (how door problems are computed with `contextDoorLinks`, `linksIn`,
  `doorProblems` and a per-destination `computeReachability`), and `runReach`.
- tools/level-editor/src/style.css: the editor's look (reuse its colours; class prefix `le-`).

## Change
- tools/level-editor/src/adapters/gnomomia.ts: add `checks(ctx, zone)` returning Problem[] for that zone: for each prop whose
  `getPrefab(p.prefab)` is undefined, `{ severity:'error', code:'unknown-prefab', msg:'Prop prefab "<id>" does not exist', zone, ref:{collection:'props', index}, x, z }`;
  for each `findUnknownRefs([zoneDef])` entry, `{ severity:'error', code:'unknown-marker', msg:'<kind> marker "<id>" has no pack entry', zone, x, z }`
  plus `ref: { collection: kind === 'object' ? 'objects' : 'spawns', index }` where index is the position among the
  zone's markers of that kind (the objects / spawns collections list markers of one kind in order; confirm in src/profile.ts by
  reading the `objects` collection's `items`/`accepts`, and use whatever index Select would use). Leave beforeSave unchanged.
- tools/level-editor/src/agent/problems.ts: `collectProblems(ctx, opts)` for `zone = ctx.zone`, each check in its own try/catch
  (a crash -> `{ severity:'error', code:'check-failed', msg:'<check name>: <message>', zone }`):
  1. Adapter: `ctx.adapter.checks ? ctx.adapter.checks(ctx, zone) : ` run `ctx.adapter.beforeSave?.(ctx, [zone])` and turn a thrown
     Error into `{ severity:'error', code:'save-check', msg: e.message, zone }`. (Only Gnomomia's beforeSave calls confirm(), and it has checks.)
  2. Outside the zone (warning 'outside-zone'): for every accepted item of every collection (`ctx.adapter.collections`, `c.items(def)`,
     `c.accepts`), when the item's x, z is outside `ctx.adapter.zoneRect(def)`. msg `'<label> is outside the level'`, with ref and x, z.
  3. Overlapping props (warning 'prop-overlap'): for props collection 'props' when present, pairs i<j whose distance < rA + rB - 0.05,
     where r = `Number(item.solidR ?? 0)`, skipping props with r <= 0. One problem per pair, ref to the later one, msg
     `'Prop <j> (<prefab>) overlaps prop <i> (<prefab>)'`.
  4. Prop in water (warning 'prop-in-lake'): when the zone has a `lakes` array of { x, z, r }, a prop whose centre is within a lake's r.
  5. Stale bake (warning 'stale-bake'): when `ctx.adapter.tools.includes('analyze') && ctx.dirty.walkRects.length > 0`,
     msg `'The walkability bake is out of date: Analyze > Re-bake'`.
  6. Only when `opts?.reach` and the adapter has 'analyze': `computeReachability(ctx.terrain, def).results` that are not reachable
     -> warning 'unreachable', msg `'<label> cannot be reached from the spawn'`, x, z; and door problems exactly as analyze.ts's
     doorIssuesFor computes them (copy that function into problems.ts as a local helper, taking ctx) -> warning 'door', msg = the line.
  Sort: errors first, then by code, keeping the order within a code.
- tools/level-editor/src/agent/problemsPanel.ts: `mountProblems(ctx, head)`: append a `<button id="le-problems">` to `head` reading
  `Problems (n)` (n = errors + warnings; add class `bad` when any error). Clicking toggles a window `<div class="le-problems">`
  in document.body (fixed, top-right under the header, max-height 60vh, scrolls). The window has a "Check reachability too" button
  (calls refresh(true)) and one row per problem: severity mark, msg; clicking a row calls `ctx.viewport.focus(p.x, p.z, 40)` when x, z
  are set, and `ctx.select(p.ref)` when ref is set (call `ctx.setZone(p.zone)` first if it differs). `refresh(reach = false)` re-runs
  collectProblems and redraws. Re-run automatically (without reach) on `ctx.events.changed` and `ctx.events.zone`, debounced 300 ms.
  Styles: inject one `<style>` element on mount with the rules for `#le-problems`, `#le-problems.bad`, `.le-problems` and its rows
  (do not edit style.css). The window must not hide or restyle anything else.
- tools/level-editor/src/agent/problems.test.ts (new, vitest). Real gnomomia context as in src/draft.test.ts:
  `const ctx = createContext(createWorld(), gnomomiaAdapter); ctx.viewport = { refresh() {}, focus() {} } as never;`
  The shipped first zone has no 'error' problems; pushing a prop `{ prefab:'no-such-prefab', x, z, rot:0, scale:1 }` onto
  `ctx.zones[ctx.zone].props` gives an 'unknown-prefab' error with ref.collection 'props'; two props at the same spot with solidR 1 give
  'prop-overlap'; a prop at origin.x + half + 50 gives 'outside-zone'; setting `ctx.dirty.walkRects.push(rect)` gives 'stale-bake';
  an adapter whose checks throws gives 'check-failed'. Also: a Club Gnome context (see src/adapters/club.ts and how
  src/adapters/snigmsLevel.test.ts builds one with createWorld) with a prop prefab 'no-such-prefab' gives a 'save-check' error.

## Contract
`collectProblems(ctx: EditorContext, opts?: { reach?: boolean }): Problem[]` (never throws) and
`mountProblems(ctx: EditorContext, head: HTMLElement): { refresh(reach?: boolean): void }`, exactly as the stubs. editor.ts (another
worker) calls `mountProblems(ctx, document.getElementById('le-head')!)`.

## Done when
- `npm run build -w tools/level-editor` passes.
- `npm test -w tools/level-editor` passes, including problems.test.ts.

## Out of scope
agent/itemOps.ts, agent/queries.ts, agent/api.ts, editor.ts, tools/*, style.css, every adapter except gnomomia.ts.
~~~~

### D: window.le

~~~~text
Epic: 2 Agent API
Depends on: none

## Environment
Working directory: the repo root (C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\mako). Git Bash: if `node` is not found,
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Three other workers are filling in agent/itemOps.ts,
agent/queries.ts, agent/problems.ts and agent/problemsPanel.ts right now: import from them by the signatures below, but do not edit
them. Until they land those functions throw 'not implemented' (or return []), which is fine for your tests. Do not commit.

## Goal
`window.le`, the editor as commands and queries for agents and scripts, installed by the editor page, plus the Problems button in
the header.

## Read first
- tools/level-editor/src/agent/api.ts: the stub (ApiHooks, installAgentApi). Keep the signatures.
- tools/level-editor/src/agent/types.ts: CommandDef, CommandResult, ItemRef.
- tools/level-editor/src/editor.ts: `activate(tool)`, `save()`, the `tools` array, and the last line `window.editor = ctx`.
- tools/level-editor/src/persist.ts: `saveAll(ctx)` returns `{ files }`.

## Contract (the functions you call; they exist with these signatures)
agent/itemOps.ts: resolveRef(ctx, ref): number; addItem(ctx, collection, x, z, fields?, label?): number; moveItem(ctx, ref, x, z, label?): void;
nudgeItem(ctx, ref, dx, dz, label?): void; setField(ctx, ref, key, value, label?): void; rotateItem(ctx, ref, da, label?): boolean;
deleteItem(ctx, ref, label?): void; duplicateItem(ctx, ref, label?): number.
agent/queries.ts: editorState(ctx); listItems(ctx, collection?); getItem(ctx, ref); probe(ctx, x, z, radius?); pathBetween(ctx, a, b);
reachability(ctx); prefabCatalog(query, limit?).
agent/problems.ts: collectProblems(ctx, opts?: { reach?: boolean }): Problem[].
agent/problemsPanel.ts: mountProblems(ctx, head: HTMLElement): { refresh(reach?: boolean): void }.

## Change
- tools/level-editor/src/agent/api.ts: export `createCommands(ctx, hooks): CommandDef[]` and `installAgentApi(ctx, hooks)`.
  Commands (args are one object; `ref` is an ItemRef; every label the agent passes is prefixed so a person sees who did it:
  `'Agent: ' + (args.label ?? default)` where default is e.g. 'add Prop'; pass that as the itemOps label):
  - `item.add { collection, x, z, fields?, label? }` -> `{ index }`
  - `item.move { ref, x, z }`, `item.nudge { ref, dx, dz }`, `item.set { ref, key, value }`, `item.rotate { ref, da }` (radians),
    `item.delete { ref }`, `item.duplicate { ref }` -> `{ index }`
  - `select { ref | null }`: `ctx.select(ref ? { collection, index: resolveRef(ctx, ref) } : null)`; `focus { x, z, distance? }`:
    `ctx.viewport.focus`; `zone.set { id }`: throws `Error('No zone "<id>"')` unless `ctx.outdoorZones` includes it, else `ctx.setZone`;
    `tool { id }`: `hooks.activateTool`, false -> throw; `snap { m }`: `ctx.snap = m`
  - `undo`, `redo` (ctx.history; return the new `ctx.history.nextUndo`), `save { force? }` -> `{ files }`: when force is not true and
    `collectProblems(ctx)` has an error, throw `Error('Save refused: ' + error msgs joined with '; ' + ' (pass force: true to save anyway)')`.
    Otherwise replace `window.confirm` with `() => true` while `await hooks.save()` runs (Gnomomia's save asks confirm() for unknown
    markers), restoring it in finally.
  Validate args with a small local helper: a missing or wrongly typed required arg throws `Error('<command>: <arg> must be a <type>')`.
  `installAgentApi` sets and returns `window.le`, typed as an exported interface `LeApi`:
  ```ts
  export interface LeApi {
    version: 1;
    run(name: string, args?: Record<string, unknown>): Promise<CommandResult>;   // never rejects; unknown name -> { ok:false, error:'Unknown command "<name>": see le.help()' }
    help(): { name: string; help: string }[];
    state(): EditorState; list(collection?: string): ItemView[]; get(ref: ItemRef): ItemView;
    probe(x: number, z: number, radius?: number): Probe; path(a: {x:number;z:number}, b: {x:number;z:number}): PathResult;
    reach(): ReachResultView[]; catalog(query: string, limit?: number): { id: string; name: string; category: string }[];
    problems(opts?: { reach?: boolean }): Problem[];
  }
  ```
  `run` awaits the command, returns `{ ok: true, value }` (value `null` when undefined) or `{ ok: false, error: message }`.
  The query methods may throw (they are plain calls). After every successful mutating command call `hooks.refreshProblems()`.
- tools/level-editor/src/editor.ts: import mountProblems and installAgentApi. After the header exists and `ctx.viewport` is set,
  `const problems = mountProblems(ctx, $('le-head'));`. At the end, next to `window.editor = ctx`, call
  `installAgentApi(ctx, { save: async () => (await saveAll(ctx)).files, activateTool: (id) => { const t = tools.find((x) => x.id === id); if (!t) return false; activate(t); return true; }, refreshProblems: (r) => problems.refresh(r) })`.
  The save hook must also do what the Save button's save() does after a successful save (`drafts.sync()`, set savedAt, syncDirty()):
  refactor `save()` into `async function saveFiles(): Promise<string[]>` (no try/catch, no status) used by both, keeping the button's
  status and error messages exactly as now.
- tools/level-editor/src/agent/api.test.ts (new, vitest) with a fake ctx and fake hooks (no other module's behaviour needed):
  `help()` lists every command name above; `run('nope')` resolves `{ ok:false }` mentioning le.help(); `run('item.move', {})`
  resolves `{ ok:false }` with 'ref'; `run('snap', { m: 1 })` sets ctx.snap; `run('zone.set', { id: 'x' })` fails when x is not in
  outdoorZones; `run('tool', { id: 'select' })` calls hooks.activateTool. (Build the fake ctx as a plain object cast `as never`, with
  `snap`, `outdoorZones`, `history`, `select`, `setZone`.) Set `globalThis.window = globalThis` in the test before installAgentApi if needed.

## Done when
- `npm run build -w tools/level-editor` passes.
- `npm test -w tools/level-editor` passes, including api.test.ts.

## Out of scope
agent/itemOps.ts, agent/queries.ts, agent/problems.ts, agent/problemsPanel.ts, agent/types.ts, tools/*, adapters/*. Do not start a dev server.
~~~~
