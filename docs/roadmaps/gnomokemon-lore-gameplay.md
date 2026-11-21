# Gnomokemon Snap: lore and gameplay (temperaments)

**Goal.** Make the creatures behave by temperament (the eight in `docs/design/gnomeokemon/temperaments.md`), give every
Gnomokedex page a temperament word and a two-line hint in Gnome Jesus's voice, and finish the shipped lore fixes that
are still open. Nothing here adds harm: Territorial creatures warn, and Pester costs a smear or a lost frame.

**Source of truth.** `docs/design/gnomeokemon/` (README decisions, rulings R-030 to R-032, regions.md section 9,
temperaments.md sections 1, 2, 4, 6).

**Not in this roadmap (later):** splitting `LawnSpawn` home and sighting with a `reason` string (regions.md 9.3), rail
shapes per course (9.2), the Stopping Road / Glasshouse / Rime spawn changes (9.4), new courses and species (9.5), the
Lobby prop positions (9.7), multiplayer and achievements.

## Shape

| Epic | Issues | Done when |
|---|---|---|
| 0. Contract (written by the planner, `src/snap/temperament.ts` stub) | 0 | `npm run build -w games/gnomeokemon` passes |
| 1. Data, text and docs (parallel) | 4 | build passes; `npm test -w games/gnomeokemon`; `npm run lore` passes |
| 2. Behaviour (one issue owns `game.ts`) | 1 | build, tests, smoke check at 390x844 and desktop |

Elapsed: 2 epics. Dependency: 2 waits on 1A because it imports the temperament functions.

---

## Epic 1: data, text and docs

~~~~text
Epic: 1A Temperament table and rules
Depends on: none

## Environment
Working directory: games/gnomeokemon (run commands from the repo root with `-w games/gnomeokemon`).
Toolchain: if `node` is not found in Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`.
Other workers are editing other files in games/gnomeokemon at the same time (gnomokedex.ts, world.ts, models.ts, docs/lore). Touch only the files listed under Change.

## Goal
`src/snap/temperament.ts` fills in the table of all 42 species and the four pure rule functions, with tests.

## Read first
- src/snap/temperament.ts: the stub. Keep every exported name and signature exactly. Replace only the bodies and the TEMPERAMENTS table.
- src/prefabs/dex.ts: the `id` field of each entry (the species ids). Confirm each id below exists there.
- docs/design/gnomeokemon/temperaments.md: section 2 (the tool table) for the rule functions.

## Change
- src/snap/temperament.ts: fill `TEMPERAMENTS` with exactly this map (42 entries):
  docile: mossback, unfired, sunlizard, starbeetle, snowcap
  curious: sproutling, kilnpup, dewdrop, clogmaw, glowmoth, kelpsprite, clockworkfrog, frosthound
  skittish: grubthorn, bellrat, icicleimp
  shy: armadillan, cisterneel, drownedtoad, mooncap, dewghost, pinego
  territorial: staghorn, hoseleech, paperwasp, seamower, hedgewright
  thief: thimblekin, rustcrab, magpiethief
  sentinel: strawight, cactuskin, kilnwarden, barnacleknight, bonsaititan
  aloof: minimower, tumblewight, acorndrake, gnomespirit, gnomejesus, chimneyowl, frostking
  Write each as `'id': 'temperament',` in one object literal. Do not add comments per row.
  Replace the stub's `TEMPERAMENTS` declaration only if you need to; the type stays `Readonly<Record<string, Temperament>>`.
- Bodies of the rule functions, from temperaments.md section 2 (write a `switch` on the temperament, with a default that returns the first listed result):
  - baitResult: docile -> 'eat'; curious -> 'eat'; skittish -> 'eatWhenDogStill'; shy -> 'eatAfterStill'; territorial -> 'ignore'; thief -> 'steal'; sentinel -> 'ignore'; aloof -> 'ignore'
  - pesterResult: docile -> 'startle'; curious -> 'backOff'; skittish -> 'bolt'; shy -> 'hide'; territorial -> 'display'; thief -> 'drop'; sentinel -> 'stiff'; aloof -> 'spin'
  - fluteResult: docile -> 'dance'; curious -> 'dance'; skittish -> 'freeze'; shy -> 'dance'; territorial -> 'dance'; thief -> 'dance'; sentinel -> 'sway'; aloof -> 'nod'
  - tagResult: docile -> 'ignore'; curious -> 'approach'; skittish -> 'flee'; shy -> 'retreat'; territorial -> 'warn'; thief -> 'hover'; sentinel -> 'ignore'; aloof -> 'ignore'
- src/snap/temperament.test.ts (new): vitest (`import { describe, expect, it } from 'vitest'`). Tests:
  1. every key of TEMPERAMENTS is a value from the label map, and there are exactly 42 keys;
  2. count per temperament: docile 5, curious 8, skittish 3, shy 6, territorial 5, thief 3, sentinel 5, aloof 7;
  3. temperamentOf('mossback') === 'docile' and temperamentOf('no-such-species') === DEFAULT_TEMPERAMENT;
  4. every temperament returns a value from each rule function (use `expect(['eat', ...]).toContain(...)` or `toBe` for the table values above).
  Do not import dex.ts in the test.

## Contract
Exports, unchanged from the stub: `Temperament`, `NOTICE_RADIUS`, `TEMPERAMENTS`, `DEFAULT_TEMPERAMENT`,
`TEMPERAMENT_LABEL`, `temperamentOf`, `BaitResult`, `PesterResult`, `FluteResult`, `TagResult`, `baitResult`,
`pesterResult`, `fluteResult`, `tagResult`. Do not rename or add required parameters.

## Done when
- `npm test -w games/gnomeokemon -- temperament` passes.
- `npx tsc --noEmit -p games/gnomeokemon` reports no errors in src/snap/temperament.ts.

## Out of scope
Every other file. Do not edit game.ts, gnomokedex.ts or dex.ts.
~~~~

~~~~text
Epic: 1B Course labels and the Tag comments
Depends on: none

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are editing other files in games/gnomeokemon at the same time. Touch only the files listed under Change.

## Goal
Course labels drop "World N" and use the names from regions.md (section 9.1), and the code comments say the dog is Tag, not Gnome Company's Giant Fetch Dog (section 9.6).

## Read first
- docs/design/gnomeokemon/regions.md: section 9, items 1 and 6 only.
- src/snap/world.ts: lines 23 to 31, the `COURSE_META` object.
- src/snap/models.ts: all comments that mention "Gnome Company" or "Fetch Dog".

## Change
- src/snap/world.ts `COURSE_META`: change the labels (keep the emoji and the subtitle text unless it says "World N"):
  - lawn: keep `🌿 Fescue Lawn` (label)
  - desert: `🌵 Dry Yard`
  - depths: `🌑 Drainpipe Deeps`
  - kiln: `🔥 The Stopping Road`
  - ocean: `🌊 Cistern Reef`
  - night: `🌌 The Glasshouse`
  - frost: `❄️ The Rime`
  Remove the "World N:" prefix from every label. Keep the subtitles. Use the exact course names from `regions.md` if they differ from the list above: grep regions.md for "Dry Yard", "Stopping Road", "Glasshouse" and "Rime" first.
- src/snap/models.ts: change comments that say "Giant Goofy Fetch Dog from Gnome Company" so they say the dog is Tag, Tall One's dog from the town side. Do NOT rename the prefab id `giant-fetch-dog` and do NOT change any code.

## Contract
`COURSE_META` keeps its type `Record<CourseId, { label: string; subtitle: string }>`. Only string values change.

## Done when
- `npx tsc --noEmit -p games/gnomeokemon` passes.
- `grep -rn "World [0-9]" games/gnomeokemon/src/snap/world.ts` prints nothing.

## Out of scope
Everything except world.ts (COURSE_META only) and models.ts (comments only). Do not change spawn lists.
~~~~

~~~~text
Epic: 1C Gnomokedex temperament word and hints
Depends on: 1A (src/snap/temperament.ts exports; the stub already has the final signatures, so this compiles now)

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are editing temperament.ts (1A), world.ts (1B) and docs/lore (1D) at the same time. Touch only the files listed under Change.
Repo rule: lore canon is in docs/lore/canon.md. Search before writing names or text: `npm run lore -- find <word>`.

## Goal
Each Gnomokedex page shows the species' temperament word (e.g. "Shy") and a two-line hint in Gnome Jesus's voice, for all 42 species.

## Read first
- docs/design/gnomeokemon/temperaments.md: sections 1 and 3 (the "Shy. It will come out if you stop talking." style).
- src/snap/jesus.ts: `SPECIES_LINES` (around line 208) for Jesus's voice, and the file's existing tone.
- src/snap/temperament.ts: `temperamentOf`, `TEMPERAMENT_LABEL` (signatures only matter here; do not edit this file).
- src/screens/gnomokedex.ts: how a page is rendered (the entry's fields and where the species' text is shown).
- docs/lore/canon.md: rule 6 (every creature wants something) and the no-gore rule.

## Change
- src/snap/temperament-hints.ts (new): `export const TEMPERAMENT_HINTS: Readonly<Record<string, readonly [string, string]>> = { ... }`
  One entry per species id (42 ids, the same ids as dex.ts). Each value is exactly two short lines, in Gnome Jesus's voice, dry and kind, no gore, no harm. The first line says the creature's temperament in its own terms; the second says how to get a photo of it. Example shape (do not reuse verbatim for other species):
  `'dewdrop': ['Curious. It wants a pebble tossed in it, and it will splash for you.', 'Pester it gently and hold still; the splash is the picture.']`
  Keep each line under 90 characters. Use only ids that exist in src/prefabs/dex.ts.
- src/screens/gnomokedex.ts: on each page, show the temperament word with `TEMPERAMENT_LABEL[temperamentOf(entry.id)]` and the two hint lines from `TEMPERAMENT_HINTS[entry.id]` (fallback: show nothing for a missing hint). Use the page's existing text styles. Do not change layout or any other element.
  Mobile: the page is already a touch UI; add no hover-only text. The new text must fit a 390 px wide page without horizontal scroll (wrap it).

## Contract
`TEMPERAMENT_HINTS` as above. The temperament word comes only from `temperamentOf` and `TEMPERAMENT_LABEL`.

## Done when
- `npx tsc --noEmit -p games/gnomeokemon` passes.
- A quick check: `node -e` is not needed; the test in 1A covers the table. Add `src/snap/temperament-hints.test.ts` (new) that imports `TEMPERAMENT_HINTS` and `TEMPERAMENTS` from temperament.ts and asserts every key of TEMPERAMENTS has a hint with exactly 2 non-empty lines of at most 90 characters. Run `npm test -w games/gnomeokemon -- temperament-hints` (it must pass).

## Out of scope
temperament.ts (read only), game.ts, world.ts, models.ts, docs/lore/. Do not change dex.ts or any other species data.
~~~~

~~~~text
Epic: 1D Lore: temperament entry, index and design status
Depends on: none

## Environment
Working directory: repo root. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are editing games/gnomeokemon at the same time. Touch only the files listed under Change.
Rule: any change under docs/lore/ must leave `npm run lore` passing. Run it at the end.

## Goal
The lore records that temperament is built (the shipped game now uses it), and the design doc's status matches.

## Read first
- docs/lore/entries/fescue/temperament.md: the entry (currently "proposed, not built").
- docs/lore/INDEX.md: the row for Temperament (around line 167).
- docs/lore/README.md: the entry format and the status values allowed (the lint enforces them).
- docs/design/gnomeokemon/temperaments.md: the status line at the top.

## Change
- docs/lore/entries/fescue/temperament.md: change its status to the value the README allows for a built, shipped thing (read the README; if there is no such value, keep "draft" and do not invent one). Replace "It is proposed, not built" with one sentence that says it is in Gnomokemon Snap (the game's temperament rules are in `games/gnomeokemon/src/snap/temperament.ts`). Keep the rest of the entry.
- docs/lore/INDEX.md: update the Temperament row's summary cell to match the entry (remove "It is proposed, not built.").
- docs/design/gnomeokemon/temperaments.md: change "**Status: draft proposal.** ... Nothing here is built" to say the table is built in `games/gnomeokemon/src/snap/temperament.ts` and the Gnomokedex shows it; keep the rest. Do NOT change the table or the rules.
- docs/design/gnomeokemon/README.md: change "Almost nothing here is built" to one sentence saying temperaments are built (the rest of this file stays).

## Contract
No code. Lore entry format unchanged.

## Done when
- `npm run lore` passes (repo root).
- `grep -n "proposed, not built" docs/lore/entries/fescue/temperament.md docs/lore/INDEX.md` prints nothing.

## Out of scope
games/gnomeokemon/src/**, docs/lore/canon.md, docs/lore/rulings.md, all other entries.
~~~~

---

## Epic 2: behaviour

~~~~text
Epic: 2A Temperament behaviour in the ride (bait, pester, flute, Tag)
Depends on: 1A (src/snap/temperament.ts rule functions are filled in)

## Environment
Working directory: games/gnomeokemon. Toolchain: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found.
Other workers are not editing games/gnomeokemon during this epic. You own game.ts and any new file you create under src/snap/.
Repo rules: no harm (Territorial creatures warn; a Pester costs a smear or a lost frame, never a wound, never damage to Tag, never film-ending). Every action stays touchable: the existing on-screen buttons already cover Bait, Pester, Flute.

## Goal
In the ride (`src/snap/game.ts`), each creature responds according to its temperament, using the rule functions in `temperament.ts`. A Pester on a Territorial creature costs a soft smear on the lens for a moment.

## Read first
- src/snap/temperament.ts: the rule functions and their result unions (do not edit).
- src/snap/game.ts:
  - the `Creature` interface near line 29 (fields `action`, `actionTimer`, `baitTarget`, `group`, `basePos`, `behavior`, `speed`, `phase`, `radius`);
  - `throwProjectile` and `blowFlute` (around lines 308 and 324);
  - the projectile hit loop around lines 600 to 625 (sets `action` to 'eating' or 'startled', `actionTimer` 4.6);
  - the creature update loop from about line 650 (`eating` walks to `baitTarget`; `idle` moves by behaviour);
  - `dog` and `dogT` and `speedMult` near lines 251 to 276 and 568 to 575 (Tag's position and speed).
- src/snap/game.ts `stage` (around line 88): the ride's full-screen container. Add overlays here, not in #ui.
- docs/design/gnomeokemon/temperaments.md section 2: the intent behind each response.

## Change
- src/snap/game.ts, one owner. Add these behaviours, each reading `temperamentOf(c.speciesId)` (add a `temperament: Temperament` field to `Creature`, set at spawn from `temperamentOf(spawn.speciesId)`; check where creatures are built and that the spawn has a species id):
  1. **Bait** (hit handler): `baitResult(t)`:
     - 'eat': existing behaviour (walk to bait, 'eating').
     - 'eatWhenDogStill': only start walking to the bait if Tag's current speed is below 0.2 (his speed is `speedMult`; if it is 0 or stopped). Otherwise the creature does not react.
     - 'eatAfterStill': only start walking after Tag has been still for 2 seconds (keep a `stillTime` in seconds, reset on movement; this is the same tracking for both the skittish and the shy case).
     - 'steal': walk to the bait like 'eat', then on arrival add a bonus of 150 to the score (use the existing score function; find it) and set action to 'idle' with `baitTarget = null`. (Steal = it takes the bait; the game shows a toast "🍎 Stolen!" with `showToast`.)
     - 'ignore': no change.
  2. **Pester** (hit handler, `p.kind === 'pester'`): `pesterResult(t)`:
     - 'startle': existing (action 'startled').
     - 'backOff': action 'startled' for 2 seconds (set `actionTimer` to 2), then it returns to idle.
     - 'bolt': action 'startled' and move away from the hit point for 3 seconds (set `c.baitTarget` to a point 6 units away from the hit point, and in the update loop walk toward it like 'eating'; set action to 'eating' so the same walk code runs, but use a separate flag `fleeing` so it does not award a bait bonus). Keep it simple.
     - 'hide': action 'startled' for 6 seconds, `behavior` motion frozen (skip idle movement while action !== 'idle').
     - 'display': action 'startled' with a rear of 1.2 seconds; then, as a soft cost, call `flashSmear(0.9)` (see below). Do not change the creature's position.
     - 'drop': action 'startled' 1 second; no bonus; if the creature has a bonus stored (it does not in this issue), nothing happens.
     - 'stiff' and 'spin': action 'startled' with the same timer as 'startle' (4.6 s is too long for 'stiff'; use 2 s). For 'spin' rotate `c.group.rotation.y` by 2π over 0.6 s (use `actionTimer`, no new state).
  3. **Flute** (`blowFlute`): for each creature in range, `fluteResult(t)`:
     - 'dance': existing (action 'dancing').
     - 'freeze': action 'idle' but skip its movement for 2 s (use a `frozenTime` seconds field).
     - 'sway': action 'dancing' but a small sway (existing dancing motion is fine).
     - 'nod': set `c.group.rotation.y` toward the dog for 1 second; no action change.
  4. **Tag notice** (update loop, each frame, for every creature with `action === 'idle'`): `tagResult(t)` when `c.group.position.distanceTo(dog.position) < NOTICE_RADIUS`:
     - 'approach': move a little (0.6 units/s) toward the dog, no further than the creature's basePos + radius.
     - 'flee': move away from the dog at 2.2 units/s for as long as Tag is within NOTICE_RADIUS (no actionTimer).
     - 'retreat': move away at 1.0 units/s, like 'flee' but slower.
     - 'warn': face the dog, do nothing else.
     - 'hover': follow the dog at 0.5 units/s while he is within NOTICE_RADIUS.
     - 'ignore': nothing.
     Note: existing creatures already react to the dog at `distanceTo < 12` (around line 329). Keep that code for the Flute; do not delete it.
  5. **Soft smear** (new file `src/snap/smear.ts`): `export function mountSmear(parent: HTMLElement): HTMLDivElement` creates a full-stage div with `pointer-events: none`, a radial gradient in dark blue at 0.35 opacity, `opacity: 0`, and `transition: opacity 0.35s`, and returns it; `export function flashSmear(el: HTMLDivElement, seconds: number): void` sets opacity to 0.6 for `seconds` then back to 0. Call `mountSmear(stage)` once in game.ts and `flashSmear(smearEl, 0.9)` from the 'display' Pester case. Respect `prefers-reduced-motion`: if it matches, skip the opacity change and do nothing.
- Creature type: add `speciesId: string` (if missing), `temperament: Temperament`, `stillTime: number`, `frozenTime: number`, `fleeing: boolean` and set defaults at creation.

## Contract
Uses exactly the exports of src/snap/temperament.ts (`temperamentOf`, `baitResult`, `pesterResult`, `fluteResult`, `tagResult`, `NOTICE_RADIUS`). Do not edit temperament.ts. The rule functions return the union types there; handle every member (a `switch` with a `never` check is a good idea).
Mesh building, scene layout, the rail and the photo pipeline (grading, scoring, storage) are unchanged.

## Done when
- `npm run build -w games/gnomeokemon` passes (tsc and vite).
- `npm test -w games/gnomeokemon` passes.
- With the dev server running (`npm run dev -w games/gnomeokemon`), `?mode=snap&course=lawn` loads with no console errors, Bait, Pester and Flute still work (press Q, E, F or tap the buttons), and a Pester on a Territorial creature (e.g. the staghorn on the lawn) shows the smear for about a second.
- Mobile: buttons unchanged, the smear overlay has `pointer-events: none`.

## Out of scope
temperament.ts, gnomokedex.ts, world.ts, models.ts, dex.ts, docs/, grading.ts and scoring.ts (you may call the existing score function; do not change it). Do not add new tools or buttons.
~~~~

---

## Checks at the end of each epic (planner)

- After Epic 1: `npm run build -w games/gnomeokemon`, `npm test -w games/gnomeokemon`, `npm run lore`.
- After Epic 2: the same, then `bash tools/smoke.sh <url> <markers>` against the dev server at 390x844 and desktop.
- Then a demo (`docs/demos.md`), upload through the media-upload MCP, PR to `cstabnick/lawn-gnome-panic`.
