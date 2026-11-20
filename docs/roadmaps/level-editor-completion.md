# Level editor: finish the open items

Goal: close the open items in `docs/roadmaps/level-placement/level-editor-todo.md` (items 1 to 7) in `tools/level-editor`, and add the
first missing feature from `docs/roadmaps/level-placement/warps-and-interiors.md` (R1: see where every door and exit goes).
Items 8 (an answer, no task) and 9 (multiplayer spawn keys in the game) are not in this plan: item 9 edits game code.

Foundation, written by the planner: `tools/level-editor/src/markerCheck.ts` (`unknownMarkers`, `PACK_KNOWN`, `MarkerKnown`), the CSS rules
for the inspector note and the load-error banner in `style.css`, and `applyDraft` already returning `string[]` (`[]` for now).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Editor hardening (all parallel) | `npx tsc --noEmit -p tools/level-editor`, `npm test -w tools/level-editor`, `npm test -w games/gnomes-of-gnomomia -- levelDocs`, `npm run build -w games/gnomes-of-gnomomia`, then the planner runs `npm run e2e -w tools/level-editor` | I1 e2e, I2 load errors, I3 sort markers, I4 edit boundary, I5 draft check, I6 save check |
| 2. Door and exit links (one issue) | same, plus e2e | I7 |
| 3. Docs (planner or one worker) | `npm run lore` unaffected; README and AGENT_INDEX describe the new behaviour | I8 |

## File ownership (epic 1)

| Issue | Owns |
|---|---|
| I1 | `tools/level-editor/e2e/run.mjs` |
| I2 | `tools/level-editor/src/main.ts`, new `tools/level-editor/src/editor.ts`, new `tools/level-editor/src/loadError.ts` (+ test) |
| I3 | `games/gnomes-of-gnomomia/src/levelDocs.ts`, `levelDocs.test.ts`, the `*.level.json` files in `games/gnomes-of-gnomomia/src/data/levels/` |
| I4 | `tools/level-editor/src/inspector.ts`, `inspector.test.ts` |
| I5 | `tools/level-editor/src/draft.ts`, `draft.test.ts` |
| I6 | `tools/level-editor/src/adapters/gnomomia.ts`, new `tools/level-editor/src/saveCheck.ts` (+ test) |

## Common environment (pasted into every issue)

~~~~text
Repo: /Users/alex/cstabnick/lawn-gnome-panic/.claude/worktrees/level-editor-todo (a git worktree; run every command from there,
never cd to another checkout). `npm install` has been run. macOS. Read AGENTS.md rules that matter here: do not commit, do not push
(the planner does); do not edit files another issue owns (listed in your issue); do not start a dev server or open a port unless your
issue says so (other workers run at the same time). tools/level-editor is a desktop dev tool: the mobile and online rules do not apply.
The editor imports Gnomomia's code through the `@gnomomia/*` alias (games/gnomes-of-gnomomia/src). Check commands that are safe to run
in parallel: `npx tsc --noEmit -p tools/level-editor` and `npx vitest run <file>` from tools/level-editor. Other workers edit other files
at the same time, so a type error in a file you do not own is not yours: report it, do not fix it.
~~~~

## Issues

### I1: e2e steps for object and spawn markers (todo item 1)

~~~~text
Epic: 1. Depends on: none.
## Goal
tools/level-editor/e2e/run.mjs also checks, in a real browser with real clicks, the object markers, the spawn markers and the
details window (the inspector) that PR #247 added and only unit tests cover.
## Read first
- tools/level-editor/e2e/run.mjs: the whole file. Copy its style: `openPage(search)` returns a controller `t` with `ev`, `click`,
  `status`, `box`, `key`; `check(name, ok, detail)`; saves go into a throwaway copy of the level files (`levels` dir); the existing
  steps around lines 150-195 select a house, nudge it with arrow keys and save. Pattern to follow.
- tools/level-editor/src/profile.ts: the `objects` and `spawns` collections (ids `objects`, `spawns`), their fields (objects: id, x,
  z, yaw, scale; spawns: id, name, x, z, count, spread) and how a selection is set (`window.editor.selection = {collection, index}`
  shape: read context.ts `Selection`; use `window.editor.setSelection` or whatever context.ts exposes).
- tools/level-editor/src/inspector.ts: the window has class `le-inspector`, title text `Objects: <id>` / `Spawns: <id>`, and a
  `Pack definition` section whose rows are `<dt>key</dt><dd>value</dd>`; a row `model` and a row `prefab` exist for objects.
- games/gnomes-of-gnomomia/src/data/levels/*.level.json: find a zone whose `markers` array has `kind: "object"` and one with
  `kind: "spawn"` (grep `"kind": "object"`), and the zone's name in the editor's zone select.
## Change
- tools/level-editor/e2e/run.mjs only. Add a new block (before the final summary) that:
  1. opens the editor, switches to the zone that has object markers (`window.editor.setZone(id)`), activates the Select tool
     (click the button with text `Select`), and selects the first item of the `objects` collection. Check `window.editor.selection`.
  2. checks the inspector window is visible (`.le-inspector` not hidden) and its text contains the selected object's id and a row
     `model`.
  3. nudges it with ArrowRight (the select tool nudges 0.5 m, as for houses), Saves (Ctrl+S, status starts with `Saved`), reads the
     zone's saved `.level.json` from the `levels` temp dir and checks that exactly that marker's `x` moved by 0.5 and no other
     marker changed. Then Ctrl+Z, Ctrl+S, and checks the file is byte for byte the original again.
  4. same for a spawn marker: select the first `spawns` item, set its count through the select panel's `count` input (find the
     number input by its label text in `#le-panel .le-panel:not([hidden])`; if the panel offers no input, set it via the item field
     the collection exposes: read profile.ts), Save, and check the saved marker's `data.count` equals the new value; undo and save
     restore the original bytes.
  5. checks the inspector shows a row `enemy name` for the spawn.
- Every check name must start with `markers:` so failures are easy to find.
## Done when
- `node --check tools/level-editor/e2e/run.mjs` passes.
- Do NOT run the e2e (other workers are changing the editor and the level files at the same time and would make it flap): the
  planner runs it once the epic is done. In your report list the check names you added.
## Out of scope
Every file except e2e/run.mjs. If a check fails because of an editor bug, report the bug (file, line, what you saw); do not fix it.
~~~~

### I2: show load errors instead of a blank page (todo item 3)

~~~~text
Epic: 1. Depends on: none.
## Goal
When the game's content fails to load, the editor shows a fixed banner with the first ten messages and a note to restart the
editor server, instead of a blank page.
## Why it is blank today
games/gnomes-of-gnomomia/src/content.ts line ~353: at import it throws `content packs failed to load:\n<LOAD_ERRORS joined by \n>`
unless `globalThis.__GNOMOMIA_LINT__` is set. tools/level-editor/src/main.ts imports content statically (through adapters and
inspector), so the throw happens before any of main.ts runs and nothing is drawn.
## Read first
- tools/level-editor/src/main.ts (226 lines), tools/level-editor/index.html (which script it loads), tools/level-editor/src/style.css
  (see how `#le-banner` and `#le-toast` are styled), games/gnomes-of-gnomomia/src/content.ts lines 75-85 and 350-356.
## Change
1. `git mv tools/level-editor/src/main.ts tools/level-editor/src/editor.ts`. Keep its contents, except: remove nothing, and keep
   `import './style.css'` out of it (move it to the new main.ts). editor.ts keeps `window.editor = ctx` at its end.
2. New `tools/level-editor/src/loadError.ts`, pure, exports exactly:
   `export function loadErrorLines(err: unknown, max = 10): { lines: string[]; more: number }`
   - message = `err instanceof Error ? err.message : String(err)`; split on `\n`; drop empty lines and a leading line that is exactly
     `content packs failed to load:`; `lines` = the first `max`; `more` = how many were cut (0 if none).
   and `export function showLoadError(err: unknown, doc: Document = document): HTMLElement` which appends a `div#le-loaderror` to
   `doc.body` containing a heading `The editor could not load the game's content.`, the lines as a `<ul>` (set with textContent
   only), `and N more (see the terminal)` when `more > 0`, and the sentence `Fix the content, then restart the editor server
   (npm run level-editor): a running server keeps the old modules.` Returns the element. Also logs the error with console.error.
3. New `tools/level-editor/src/main.ts`:
   ```ts
   import './style.css';
   import { showLoadError } from './loadError';
   import('./editor').catch((e: unknown) => { showLoadError(e); });
   ```
   Also, in index.html nothing changes if it already points at /src/main.ts (check).
4. style.css is NOT yours: the planner already added the `#le-loaderror` rules (it styles `#le-loaderror`, its `h2` and its `ul`:
   use an `h2` for the heading).
5. tools/level-editor/src/loadError.test.ts (vitest; the config is tools/level-editor/vitest.config.ts, check its environment: if it
   is `node`, test only `loadErrorLines`; if jsdom is not available do not test showLoadError): tests for: 12 lines -> 10 lines and
   more 2; the `content packs failed to load:` header dropped; a non-Error value; an empty message gives no lines.
## Contract
- `applyDraft(ctx, d)` in src/draft.ts already returns `string[]` (the descriptions of markers it dropped; another worker fills it
  in). In editor.ts use it: `const dropped = applyDraft(ctx, recovered);` and when `dropped.length > 0` append a line to the recovered-edits banner text: ` Dropped ${dropped.length} marker(s) that no longer
  exist: ${dropped.slice(0, 5).join(', ')}${dropped.length > 5 ? ', ...' : ''}.` and call `ctx.status(...)` with the same text
  (kind 'error'). Never restore silently.
## Done when
- `npx tsc --noEmit -p tools/level-editor` succeeds (errors in files you do not own are not yours).
- `cd tools/level-editor && npx vitest run src/loadError.test.ts` passes.
## Out of scope
draft.ts (I5), inspector.ts, adapters/, e2e/. Do not start the dev server.
~~~~

### I3: sort markers by kind then id on save (todo item 4)

~~~~text
Epic: 1. Depends on: none.
## Goal
`worldZoneToDoc` writes a zone's `markers` in a fixed order (kind, then id), and every existing level file already has that order,
so saving a zone in the editor changes only the markers that were edited.
## Read first
- games/gnomes-of-gnomomia/src/levelDocs.ts: `worldZoneToDoc` builds `markers` from `def.markers` (about line 107).
- games/gnomes-of-gnomomia/src/levelDocs.test.ts: how the round-trip test is built.
- games/gnomes-of-gnomomia/src/content.ts lines 140-180 and 317: how markers are consumed. The planner checked: SPAWNS is built in
  `SPAWN_SPECS` (pack) order, and markers are only looked up by id in Maps, so marker order does not matter to the game. Re-confirm
  that in these lines; if you find any code that reads `markers` by array index or order, stop and report it before changing anything.
- games/gnomes-of-gnomomia/src/data/levels/*.level.json: the `markers` arrays (grep -c '"kind"').
## Change
1. levelDocs.ts: export `export function compareMarkers(a: MarkerDef, b: MarkerDef): number`: by `kind`, then `id`, using plain
   `<` / `>` string comparison (NOT localeCompare: it must not depend on the machine's locale), then by `x`, then `z`. Use it in
   `worldZoneToDoc`: `markers = [...mapped].sort(compareMarkers)` (sort a copy; do not mutate `def.markers`).
2. Re-order the `markers` array in every `games/gnomes-of-gnomomia/src/data/levels/*.level.json` that has one, with the same
   comparator, changing nothing else. Match each file's existing formatting exactly: look at how the file is written today (indent,
   whether small arrays/objects are inline) and at tools/level-editor/server/ (the code that writes these files: use the same
   serializer if it is importable from a node script, otherwise reorder by editing with a script and compare `git diff` to be sure
   that only the order of the marker entries changed). Do not touch walk.bake.json, world.deltas.json or world.paint.json.
3. levelDocs.test.ts: add tests: (a) a ZoneDef whose markers are given shuffled saves in the same order every time, sorted by kind
   then id; (b) the input `def.markers` array is not mutated; (c) every `ZONE_DOCS` zone's `markers` is already sorted by
   `compareMarkers` (so a save of an untouched zone is a no-op for markers).
## Done when
- `npm test -w games/gnomes-of-gnomomia -- levelDocs` passes. (Do not run the whole game suite: `src/gear.test.ts` is a known
  unrelated failure.)
- `git diff --stat games/gnomes-of-gnomomia/src/data/levels` shows only .level.json files, and `git diff` of them shows only
  reordered marker entries (paste the stat in your report).
- `npm run check-bake -w games/gnomes-of-gnomomia` passes. If it reports the bake is stale, run `npm run bake-walk -w games/gnomes-of-gnomomia`
  and say so in your report (the bake file is then yours to change).
- `npm run build -w games/gnomes-of-gnomomia` passes (it writes games/gnomes-of-gnomomia/dist; that is gitignored, fine).
- `npx tsc --noEmit -p tools/level-editor` still succeeds.
## Out of scope
tools/level-editor/ (except reading), content.ts, the bake files.
~~~~

### I4: say where the edit boundary is, in the details window (todo item 5)

~~~~text
Epic: 1. Depends on: none.
## Goal
The details window (inspector) tells the author that pack values are read-only here and where each comes from.
## Read first
- tools/level-editor/src/inspector.ts: `describeItem` (pure, tested) builds sections `{ title, rows: [key, value][] }`; `mountInspector`
  draws them in `sectionElement`. A section `Pack definition` is added for objects and spawns whose id is a pack entry.
- tools/level-editor/src/inspector.test.ts: how describeItem is tested.
- games/gnomes-of-gnomomia/src/content.ts: find where OBJECTS and SPAWNS are filled (grep `OBJECTS[` and `SPAWNS.push`, and
  `import.meta.glob`) to learn which files the pack values come from (it is a folder of pack files; name the real folder).
- tools/level-editor/src/style.css: classes starting `le-inspector`.
## Change
1. In `InspectSection` add an optional field to the row-section variant: `note?: string` (a line shown under the title) and
   `sources?: Record<string, string>` is NOT wanted; instead make rows carry an optional third tuple element: change
   `rows: [string, string][]` to `rows: ([string, string] | [string, string, string])[]` where the third element is the tooltip.
   Keep every existing consumer type-correct (the test file reads rows with `rowsOf`: keep it working; update helper types if needed).
2. `describeItem`: for the `Pack definition` section set `note: 'Pack values are set in code. Placement and spawn overrides are editable in the select panel.'`
   and give every pack row a tooltip: `From <folder> (pack file for id "<id>"): edit it there, not here.` with the real folder you found.
   Rows in the `Placement` section get no tooltip.
3. `sectionElement`: render `note` as a `<p class="le-inspector-note">` under the heading (textContent), and set `dt.title` and
   `dd.title` to the tooltip when a row has one. The `.le-inspector-note` CSS rule already exists (the planner added it): do not edit style.css.
4. inspector.test.ts: tests that the objects and spawns pack sections have the note and that each pack row has a tooltip that
   contains the id; and that a Placement row has no tooltip.
## Done when
- `npx tsc --noEmit -p tools/level-editor` succeeds.
- `cd tools/level-editor && npx vitest run src/inspector.test.ts` passes.
## Out of scope
main.ts, draft.ts, adapters/, e2e/. style.css (the planner already added your rule).
~~~~

### I5: check draft recovery against the current content (todo item 6)

~~~~text
Epic: 1. Depends on: none.
## Goal
A recovered draft never brings back an object or spawn marker that no longer exists in the game's packs: they are dropped and
reported to the caller.
## Read first
- tools/level-editor/src/draft.ts: `applyDraft(ctx, d)` restores each zone's `Snapshot` (state.ts `snapshot`/`restore`).
- tools/level-editor/src/draft.test.ts: how it is tested (and whether it builds a fake ctx).
- tools/level-editor/src/state.ts: the `Snapshot` type (find where `markers` of a zone sit inside it; it is keyed by the adapter's
  `editableKeys`, which includes `'markers'`).
- tools/level-editor/src/markerCheck.ts: FINISHED, written by the planner. `unknownMarkers(markers, known = PACK_KNOWN): MarkerDef[]`
  returns the object/spawn markers whose id has no pack entry; `MarkerKnown { object(id), spawn(id) }`.
## Change
1. draft.ts: new export `export function pruneDraft(d: Draft, known?: MarkerKnown): { draft: Draft; dropped: string[] }`. It returns
   a COPY of the draft in which each zone snapshot's `markers` array (if it has one) lacks the markers `unknownMarkers` reports;
   `dropped` is one string per removed marker: `<kind> "<id>" in <zone>`. The input is not mutated. If a zone snapshot has no
   markers, it is left alone. Only do this for gnomomia drafts: the function takes the draft only, so decide by the markers' kinds
   (`unknownMarkers` already ignores other kinds).
2. `applyDraft(ctx, d)` ALREADY returns `string[]` (currently `return []` at its end; replace that): it calls `pruneDraft` first (only when `ctx.adapter.id === 'gnomomia'`), applies the
   pruned draft, and returns `dropped`. Everything else it does stays. Update its doc comment.
3. draft.test.ts: tests with a fake `MarkerKnown`: a snapshot with one known and one unknown object marker and one unknown spawn
   marker keeps only the known one and reports two dropped strings; a snapshot with a marker of another kind (`kind: 'sign'`) is
   kept; input not mutated; a draft with no markers returns `dropped: []`.
## Contract
Another worker (I2) edits editor.ts (the old main.ts) to use the return value of `applyDraft`. Keep the signature
`applyDraft(ctx: EditorContext, d: Draft): string[]`.
## Done when
- `npx tsc --noEmit -p tools/level-editor` succeeds.
- `cd tools/level-editor && npx vitest run src/draft.test.ts` passes.
## Out of scope
main.ts / editor.ts (I2), markerCheck.ts (do not edit it), adapters/.
~~~~

### I6: refuse to save a marker that has no pack entry (todo item 7)

~~~~text
Epic: 1. Depends on: none.
## Goal
Save in the Gnomomia editor stops, and lists the ids, when a dirty zone has an object or spawn marker with no pack entry, unless the
author confirms.
## Read first
- tools/level-editor/src/adapters/gnomomia.ts: `beforeSave(ctx, dirty)` already throws for a prop whose prefab does not exist. A throw
  blocks the save and the message is shown in the status bar and a toast (see persist.ts line ~27 and main.ts's `save()`).
- tools/level-editor/src/markerCheck.ts: FINISHED, written by the planner. `unknownMarkers(markers, known = PACK_KNOWN): MarkerDef[]`.
- tools/level-editor/e2e/run.mjs: headless Chrome auto-accepts dialogs (`page.on('dialog', d => d.accept())`).
## Change
1. New `tools/level-editor/src/saveCheck.ts`, pure, exports exactly:
   ```ts
   export interface UnknownRef { zone: string; kind: string; id: string }
   export function findUnknownRefs(zones: { id: string; markers?: readonly MarkerDef[] }[], known?: MarkerKnown): UnknownRef[]
   export function unknownMessage(refs: readonly UnknownRef[]): string
   export function checkMarkersBeforeSave(zones: { id: string; markers?: readonly MarkerDef[] }[], confirm: (msg: string) => boolean, known?: MarkerKnown): void
   ```
   `findUnknownRefs` uses `unknownMarkers` per zone. `unknownMessage` lists up to 10 as `<kind> "<id>" in <zone>` plus `and N more`,
   preceded by `These markers have no entry in the game's packs, so the game would fail to load:` and followed by
   `Save anyway only if you are about to add them to a pack in another file.` `checkMarkersBeforeSave` does nothing when there are
   none; otherwise it asks `confirm(unknownMessage(refs))` and, when that returns false, throws
   `new Error('Save cancelled: ' + <the unknown ids joined with ", ">)`.
2. adapters/gnomomia.ts: at the end of `beforeSave`, after the prop check, call
   `checkMarkersBeforeSave(dirty.map((id) => ctx.zones[id as keyof typeof ctx.zones]), (m) => window.confirm(m))`. Keep the existing prop
   check unchanged and first.
3. saveCheck.test.ts: with a fake `MarkerKnown`: no unknown markers -> confirm never called; two unknown markers -> confirm called once
   with a message containing both ids and zone; confirm returning false throws an Error whose message starts `Save cancelled`;
   confirm returning true does not throw; 12 unknown -> message says `and 2 more`; markers of kind `sign` ignored.
## Done when
- `npx tsc --noEmit -p tools/level-editor` succeeds.
- `cd tools/level-editor && npx vitest run src/saveCheck.test.ts` passes.
## Out of scope
markerCheck.ts (do not edit it), draft.ts, main.ts, inspector.ts, e2e/.
~~~~

### I7: show where every door and exit goes (warps R1), split in two parallel issues

Planner foundation already written: `src/doorLinks.ts` (`DoorLink`, `doorLinks`, `linksIn`, `contextDoorLinks(ctx)`), its test,
`GameAdapter.doorZones?()` in context.ts, and the Gnomomia adapter's `doorZones: () => ZONES`. `contextDoorLinks(ctx)` returns one
`DoorLink` per exit of every zone (the game's zones with the editor's edited zones on top), so destinations that are indoor zones
are known even though the editor only loads outdoor ones. A `DoorLink` has: zone, index (into that zone's `exits`), label,
kind 'exit'|'door', from {x,z}, to, toName, arrive {x,z}, destKnown, destIndoor.

#### I7a (owns src/entityView.ts, e2e/run.mjs)

~~~~text
Epic: 2. Depends on: epic 1 (done).
## Goal
The 3D view shows a line from each exit of the current zone to where it arrives.
## Read first
- tools/level-editor/src/entityView.ts: `createEntityView`, `rebuild()`, the `line(pts, color, opacity)` and `pole(x, z, color)` helpers,
  `clearGroup`, how rebuild is re-run (events) and how the "rings" visibility is handled (grep `rings`, `visible` here and in
  tools/level-editor/src/tools/view.ts).
- tools/level-editor/src/doorLinks.ts: FINISHED (do not edit): `contextDoorLinks(ctx)`, `linksIn(links, zone)`, `DoorLink`.
- tools/level-editor/e2e/run.mjs: the last block ("object and spawn markers, details window") shows how a page is opened, a zone
  set, the Select tool activated and an item selected.
## Change
1. entityView.ts, inside `rebuild()`: `const links = linksIn(contextDoorLinks(ctx), ctx.zone)`. Put everything below into a
   `THREE.Group` named `door-links` added to `group` (so it is cleared with the rest and honours the rings toggle). For each link of
   kind 'exit' (skip kind 'door': house doors already show as houses): if `destKnown && !destIndoor` and the destination zone is in
   `ctx.zones`, draw a line from `from` to `arrive` (both heights from `h`, lifted by LIFT) in a distinct colour (use 0x44ddff),
   plus a pole at the arrival point; otherwise (indoor or unknown destination) draw only a short pole at `from` in colour 0xffaa33
   (unknown: 0xff4444). A dashed look is not required.
2. e2e/run.mjs: add a block whose check names start with `doors:`: open the editor, `window.editor.setZone('mossbottom')`, check
   `window.editor.viewport.overlay.getObjectByName('door-links')` exists and has at least 1 child; pick the zone's first exit
   (`window.editor.zones.mossbottom.exits[0]`) and check that moving it with the Select tool's arrow-key nudge (as the existing
   "an exit can be nudged" step does) changes the line's first vertex x by 0.5 (read it from `children[0].geometry.attributes.position`).
## Done when
- `npx tsc --noEmit -p tools/level-editor` succeeds; `cd tools/level-editor && npm test` passes.
- Do NOT run the e2e (the planner runs it). `node --check tools/level-editor/e2e/run.mjs` passes.
## Out of scope
inspector.ts, tools/analyze.ts, doorLinks.ts, context.ts, adapters/.
~~~~

#### I7b (owns src/inspector.ts, inspector.test.ts, tools/analyze.ts, new tools/doorReport.ts)

~~~~text
Epic: 2. Depends on: epic 1 (done).
## Goal
The details window names the destination of a selected exit, and the Analyze report flags exits whose destination is unknown or whose
arrival point cannot be reached.
## Read first
- tools/level-editor/src/inspector.ts and inspector.test.ts: `describeItem(input, lookup)` is pure; `InspectInput`; rows are
  `[key, value]` or `[key, value, tooltip]`; the window renders in `mountInspector`'s `render()`, which builds `describeItem({collection,
  label, zone, index, item, marker})`. The exits collection id is `exits` (src/profile.ts).
- tools/level-editor/src/doorLinks.ts: FINISHED (do not edit): `DoorLink`, `contextDoorLinks(ctx)`, `linksIn`.
- tools/level-editor/src/tools/analyze.ts (422 lines): the reachability report; find where it lists exits and house doors and what
  helper tells whether a point is walkable / reachable from the spawn.
## Change
1. inspector.ts: add `destination?: DoorLink` to `InspectInput`. In `describeItem`, when `input.destination` is present, add a section
   `Destination` BEFORE `Raw` with rows `to` (zone id), `name` (toName), `arrives at` (`x, z` rounded to 0.1), `indoor` (`yes`/`no`),
   `known` (`yes`/`no`). In `mountInspector`'s `render()`, when `coll.id === 'exits'` set `destination` to
   `linksIn(contextDoorLinks(ctx), ctx.zone).find((l) => l.index === sel.index)`. Existing tests must pass unchanged (the new field
   is optional). Add tests: with a destination the section exists with those rows; without, no `Destination` section.
2. New `tools/level-editor/src/tools/doorReport.ts`, pure: `export function doorProblems(links: readonly DoorLink[], zone: string, reachable: (x: number, z: number) => boolean): string[]`.
   For each link of that zone with kind 'exit': `destKnown` false -> `exit "<label>" goes to unknown zone "<to>"`; else when the
   destination is outdoors (`!destIndoor`) and `!reachable(arrive.x, arrive.z)` -> `exit "<label>" arrives at x, z (<toName>), which is
   blocked or unreachable`. Indoor destinations are never reported as unreachable. Test file doorReport.test.ts.
3. analyze.ts: where the reachability report text is built, append the `doorProblems` lines (use `contextDoorLinks(ctx)`; for
   `reachable` use the file's existing walkability helper for a point in the DESTINATION zone only if it can answer for another zone,
   otherwise pass `() => true` and rely on the unknown-zone check; say which you did in your report). When there are no problems,
   add nothing (the existing report text must not change).
## Done when
- `npx tsc --noEmit -p tools/level-editor` succeeds; `cd tools/level-editor && npm test` passes.
## Out of scope
entityView.ts, e2e/, doorLinks.ts, context.ts, adapters/.
~~~~

### I8: docs (epic 3)

~~~~text
Epic: 3. Depends on: epics 1 and 2.
## Goal
tools/level-editor/README.md and AGENT_INDEX.md describe what the editor does now.
## Read first
- `git diff origin/main --stat` and `git diff origin/main -- tools/level-editor/src` to see what changed.
- docs/roadmaps/level-placement/level-editor-todo.md items 2 and 4 to 7; tools/level-editor/README.md; AGENT_INDEX.md line 128 (the
  level-editor row) and the `Known traps` lines about level data.
## Change
- README.md: add a `Markers` section (what a marker is: an entry of the level file's `markers`, `kind` `object` or `spawn`, an
  `id` that is the pack's id, and `data`: for objects `v`, `yaw`, `scale`; for spawns `v`, `count`, `spread`; read
  tools/level-editor/src/profile.ts for the exact keys and meaning; markers are saved sorted by kind then id); the `objects` and
  `spawns` collections in Select (placing is not offered: ids come from the packs); the details window (read-only pack values, note
  and tooltips); the save check (a marker with no pack entry blocks Save unless confirmed); draft recovery dropping markers that no
  longer exist; the load-error banner; door and exit links (line, `Destination` section, Analyze warnings). Replace the
  `## Later` paragraph's stale content only if it is now wrong. Correct the roadmap docs `docs/roadmaps/level-format.md` "Left to
  do" bullets that are now false (surface paint and authored roads exist; spawn, shrine, exits can be moved).
- AGENT_INDEX.md: update the level-editor row only to mention markers, the details window and the door links, in the same style as
  its neighbours. Keep it one row.
- docs/roadmaps/level-placement/level-editor-todo.md: put `Done in <PR>` under items 1-7 and a status line at the top; add under
  `warps-and-interiors.md` a `Status` line that R1 is built.
## Done when
- `npm run lore` is unaffected (you edit no lore file). No code changed: `git diff --stat` lists only .md files.
~~~~
