# Gnome Theft Auto: quest flow, map markers and the Turfton Taxi

Goal: side quests unlock along the main story (one data table), the map tells story and side work apart and routes the
player to the active objective, and a summonable Turfton Taxi takes the player back to the Central Bus Stop.

## Decisions

- **Unlock table:** `games/gnome-theft-auto/src/quests/unlocks.ts` `SIDE_UNLOCKS` (side quest id -> story quest that
  must be done). Later cutscene/story chunks read it. Anything a save already started or finished stays; Tessie keeps an
  old save's rolled beat as well (whichever comes first).

  | Unlocks after (story quest) | Side quest |
  |---|---|
  | prologue-fresh-kiln | sq-grid-truthers |
  | ch1-mowers-keepers | sq-snail-rigging |
  | ch1-two-coat-tail | sq-big-lou-embargo |
  | ch1-founders-boot | sq-mulch-pyramid |
  | ch2-dew-run | sq-biscuit-hotdog |
  | ch2-sprinkler-gauntlet | sq-castaway-drydock |
  | ch2-vespers-offer | sq-porcelain-blues |
  | ch2-unmowed-tablet | sq-fescue-fugitive |
  | ch3-salvage-raid | sq-tessie |
  | ch3-kiln-resin-ice | sq-hose-revolt |
  | ch3-tundra-drift-run | sq-hoa-audit |
  | ch4-sandpit-drop | sq-porcelain-support |

- **Markers:** story giver = gold star; side giver = diamond with "?" in the giver's colour (`SIDE_COLORS`); active
  objective = orange target rings; taxi = yellow "T" square. Givers with nothing on offer are not drawn. Legend on the
  big map. A dashed route (road graph A*) runs to the active objective, or to a giver pinned from the journal.
- **Taxi:** new vehicle kind `taxi` on the existing `gta-taxi` prefab, driver Mabel Kerbstone. Called by the 44 px 🚕
  button, the Y key or gamepad D-pad left. Not while wanted, on a quest, in a vehicle, swimming, airborne or dead.
  Fare 10 + 0.04/unit, max 60 Acorns. Drive off 2 s, fade, roll up to the stop, get out, it drives away. Achievement
  `gta-meter-running` (3 rides) gives a Cabbie Cap.
- **Online:** the taxi is local to each browser (other players just see a parked/driving taxi via the existing pose
  relay, which knows the `taxi` code). Quest flow is single-player as before.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | types, unlock table, config TAXI + `taxi` vehicle, stubs for route.ts/taxi.ts/Quests API; tsc passes | 0 (done by planner) |
| 2 Systems | build passes, all tests | 6 parallel: 2A quest engine, 2B journal, 2C HUD markers/route, 2D road route, 2E taxi, 2F lore + achievement + prefab |
| 3 Wiring (planner) | app.ts wiring, smoke, docs | 0 (done by planner) |

## Epic 2 issues

Shared environment block (pasted into each issue):

~~~~text
## Environment
Working directory: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a88c21e1cb5de732a (a git
worktree; always use absolute paths under it, never cd to another checkout). Git Bash: run
`export PATH="/c/Program Files/nodejs:$PATH"` first if node is not found. `npm install` is already done. Five other
workers edit other files of games/gnome-theft-auto at the same time: change only the files under "Change". Do not
commit, do not start a dev server, do not run `npm run build` (it writes dist/). `npx tsc --noEmit -p games/gnome-theft-auto`
also compiles the other workers' files mid-edit; they keep their stubs' exported signatures, so a type error in a file
you do not own is theirs: mention it in your report, don't fix it. Tests: `cd games/gnome-theft-auto && npx vitest run <path>`.
~~~~

### 2A Quest engine: unlocks, notices, marker kinds, waypoint

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
(the shared environment block above)

## Goal
The quest engine offers side quests only once their story beat is done (table in quests/unlocks.ts), queues a
"new side quest" notice when one unlocks, tags its map blips as main / side / objective, colours the 3D giver markers by
kind, unlocks Tessie from the table as well as from an old save's rolled beat, and exposes a waypoint for the HUD route.

## Read first
- games/gnome-theft-auto/src/quests/unlocks.ts: SIDE_UNLOCKS, unlockRule, unlockMet, unlockedSideIds, MAIN_COLOR,
  OBJECTIVE_COLOR, sideColor. Do not change this file.
- games/gnome-theft-auto/src/quests/quests.ts: the whole engine (isQuestAvailable, createQuests, the 3D beam/star/ring/
  badge markers, blips(), hint(), tessieCheck, stepCheck, activate, getJournal, the stub waypoint()/pinGiver()).
- games/gnome-theft-auto/src/quests/tessieUnlock.ts and tessieUnlock.test.ts.
- games/gnome-theft-auto/src/quests/types.ts: QuestDeps.onSideUnlock (already added), QuestSave.
- games/gnome-theft-auto/src/quests/quests.test.ts: how tests build QuestDeps and provide localStorage.
- games/gnome-theft-auto/src/types.ts: `Blip.kind?: 'main' | 'side' | 'objective' | 'taxi'`.

## Change
- games/gnome-theft-auto/src/quests/quests.ts:
  1. `isQuestAvailable(q, saves)`: after the `if (saves[q.id]) return false;` line add
     `if (!unlockMet(q.id, saves)) return false;` (import from './unlocks').
  2. Export `markerKind(q: QuestDef): 'main' | 'side'` = `q.chapter !== undefined ? 'main' : 'side'`, and use the giver's
     next available quest (`questList.find((q) => q.giver === id && isQuestAvailable(q, saves))`, the same one
     interact() plays) to decide each giver's kind.
  3. blips(): only givers with a waiting quest (`waitingAt(id)`) produce a blip:
     `{ x, z, color: kind === 'main' ? MAIN_COLOR : sideColor(g.id), quest: g.name, kind }`. Givers with nothing
     waiting produce no blip at all (today they add a white dot; remove that). The active run's blips are returned as
     `{ ...b, kind: 'objective' }`.
  4. 3D markers: beam, star cone and ring take the kind colour (`material.color.set(hex)` only when a giver's kind
     changes; keep a Map of the last kind). `makeLetterBadge(letter, color = '#ffd23f')` gains a colour parameter (ring,
     letter). Build two badges per giver: the existing letter badge in gold for 'main', and a '?' badge in
     sideColor(g.id) for 'side'; show the one matching the kind, both hidden when not waiting.
  5. hint(): prefer a waiting giver whose next quest is 'main' ("A contract is waiting at <name>."); else a side one
     ("A side job is waiting at <name>.").
  6. Unlock notices: right after the load-time tessieCheck, `const known = new Set(unlockedSideIds(saves))` (no notices
     for what is already open at load). `noticeUnlocks()`: every id in `unlockedSideIds(saves)` not in `known` is added
     to `known` and, unless it is TESSIE.questId or not in questList, queued `{ id, t }` with t = 4.5 s for the first in
     the queue and 3 s after the previous one. Call noticeUnlocks() in stepCheck after a quest is marked done (after its
     tessieCheck) and after a step advance. In update(dt), count queued t down and on <= 0 call
     `deps.onSideUnlock?.(q, giversMap[q.giver])` with the QuestDef.
  7. Tessie: tessieCheck at load now checks too (call `tessieCheck(!!deps.tessieNow, true)`), so an old save already
     past the beat unlocks at once.
  8. Waypoint: keep `lastPx`, `lastPz` from update(). `let pinned: string | null = null`.
     `waypoint()`: with a run, the run blip nearest (lastPx, lastPz) -> `{ x, z, color: OBJECTIVE_COLOR, label: b.quest ?? title }`
     (null if the run has no blips); else if pinned and waitingAt(pinned) -> the giver's x/z, its kind colour, label =
     giver name; a pinned giver that no longer waits is cleared and null returned. `pinGiver(id)` sets pinned.
     activate() clears pinned. getJournal() returns `pinned`.
- games/gnome-theft-auto/src/quests/tessieUnlock.ts: new saves no longer roll a beat.
  - `ensureBeat(saves, rand, force)`: returns false and changes nothing unless `force` and there is no entry yet; then it
    adds `{ state: 'active', step: 0, cracked: [], beat: rollBeat(rand) }` and returns true. A save that already has an
    entry keeps it (and its beat).
  - `checkUnlock(saves, force)`: if the entry is 'done' return false. Unlock (set/create the entry with state 'done',
    keeping any beat, step 0, cracked []) and return true when `force`, or the table beat is done
    (`saves[unlockRule(TESSIE.questId)!.after]?.state === 'done'`), or the entry has a beat and `beatReached` says so.
  - Update the file's header comment to say this. Keep allBeats/rollBeat/beatReached/storyStarted/tessieUnlocked exports.
- games/gnome-theft-auto/src/quests/tessieUnlock.test.ts: update the tests to the new behaviour (no roll without force;
  legacy beat still unlocks; table beat unlocks; done stays done).
- games/gnome-theft-auto/src/quests/quests.test.ts: fix any existing test that assumed side quests are open on a fresh
  save (keep each test's intent).
- New games/gnome-theft-auto/src/quests/unlocks.test.ts (vi.mock('../audio', ...) like quests.test.ts):
  - every SIDE_QUESTS id and TESSIE.questId appears exactly once in SIDE_UNLOCKS; every `after` is a quest in QUESTS with
    a `chapter`; no story beat unlocks more than 2 side quests; at least 8 different beats are used.
  - a fresh save: every side quest and the Tessie quest is not available (isQuestAvailable false);
    'prologue-fresh-kiln' and 'first-contract' are.
  - unlockMet: true once `after` is done; true when the quest itself has a save (grandfathered, even with `after` not
    done); Tessie true when saves[TESSIE.unlockKey].state === 'done'.
  - engine test with createQuests(deps, quests, givers) on two givers, `pip` (story quest id 'prologue-fresh-kiln',
    chapter 1, one visit objective at [10, 0]) and `strangers` (side quest id 'sq-grid-truthers', no chapter, one visit):
    before: blips() has one quest blip with kind 'main' and color MAIN_COLOR, none for strangers. Complete the story
    quest (interact at the giver, update at the visit spot), then update(5) a few times: onSideUnlock called once with
    the 'sq-grid-truthers' def; blips() now has a 'side' blip coloured sideColor('strangers'). pinGiver('strangers') ->
    waypoint() is the strangers giver's x/z; getJournal().pinned === 'strangers'.

## Contract
- `export function isQuestAvailable(q: QuestDef, saves: Record<string, QuestSave>): boolean` (same signature)
- `export function markerKind(q: QuestDef): 'main' | 'side'`
- Quests interface (already in quests.ts, do not change): `waypoint(): Waypoint | null; pinGiver(id: string | null): void;`
  `Waypoint = { x: number; z: number; color: string; label: string }`; `JournalSnapshot.pinned: string | null`.
- QuestDeps.onSideUnlock?: (q: QuestDef, giver: GiverDef | undefined) => void  (already in types.ts)
- tessieUnlock.ts keeps every export name and signature.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.

## Out of scope
journal.ts (2B), hud.ts (2C), app.ts, unlocks.ts, defs.ts, the chapter*/sideQuests files, layout.golden.json.
~~~~

### 2B Quest Journal: available / locked / done, waypoint pins

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
(the shared environment block above)

## Goal
The Quest Journal (J, 📜 button) shows four tabs: Active, Available, Locked, Completed. Story and side quests are
visibly tagged; tapping an available quest pins its giver as the map waypoint; Locked lists side quests not open yet with
the story beat that opens them.

## Read first
- games/gnome-theft-auto/src/quests/journal.ts: the whole file (you own it).
- games/gnome-theft-auto/src/quests/quests.ts: `isQuestAvailable`, `Quests.getJournal()` (JournalSnapshot has
  activeId, activeStep, activeLines, saves, quests, givers, pinned), `Quests.pinGiver(id: string | null)`. Another worker
  is editing this file now: read it, do not change it.
- games/gnome-theft-auto/src/quests/unlocks.ts: `unlockRule(questId)` -> `{ questId, after, why } | undefined`,
  `unlockMet(questId, saves)`, `MAIN_COLOR` ('#ffd23f'), `sideColor(giverId)`.

## Change
- games/gnome-theft-auto/src/quests/journal.ts:
  - Tabs: Active, Available, Locked, Completed (data-tab 'active' | 'available' | 'locked' | 'done'). Labels with counts:
    `Available (n)`, `Locked (n)`, `Completed (done/total)`. Make the tab row fit 4 tabs at 390 px wide (12px font, no
    wrap, min-height 44px).
  - Tag helper: story quest (has `chapter`) -> `★ Ch.N` in MAIN_COLOR; side quest -> `? Side` in sideColor(q.giver).
    Use it in Active, Available, Locked and Completed rows (replace the plain `Ch.N` / `Side` text). Set the colour
    with an inline `style="color:..."` on a span.
  - Available: list `snap.quests.filter((q) => isQuestAvailable(q, snap.saves))`, story quests first, then side. Each
    row is a button: click -> `quests.pinGiver(q.giver)`, close the journal, toast
    `Waypoint set: <giver name>. Follow the dotted route on the map.` (4500 ms). The row whose giver is `snap.pinned`
    shows `📍 Waypoint` in its sub line. When something is pinned, show a "Clear waypoint" `.j-act` button at the top of
    the tab that calls `quests.pinGiver(null)` and re-renders. Empty text:
    `Nothing on offer right now. Keep playing the story to open more.`
  - Locked: `snap.quests.filter((q) => unlockRule(q.id) && !unlockMet(q.id, snap.saves))`; each row (div) is
    `🔒 <title>` with the side tag, and a sub line `Opens after Ch.<after.chapter>: "<after.title>"` where after is
    `snap.quests.find((x) => x.id === rule.after)`. Empty text: `Nothing locked: every side quest is open.`
  - Completed count: `snap.quests.filter((q) => snap.saves[q.id]?.state === 'done').length` (today it counts every save
    entry, including the Tessie pseudo-entry).
  - Keep every existing behaviour (Restart Step, Abandon, J / Esc keys, pointer stopPropagation, 44 px targets).

## Contract
`export function createQuestJournal(ui: HTMLElement, quests: Quests, hud: Hud): { isOpen(): boolean; toggle(): void; close(): void }`
(unchanged).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in journal.ts.
- Reading the code: four tabs, the tags, pinning, the Locked list, all buttons at least 44 px high.

## Out of scope
quests.ts, unlocks.ts, hud.ts, app.ts and every other file.
~~~~

### 2C HUD: marker shapes, legend, route line

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
(the shared environment block above)

## Goal
The minimap and the big map draw quest blips by kind (story = gold star, side = coloured "?" diamond, objective =
orange target rings, taxi = yellow "T" square), the big map has a legend, and both maps draw the dashed route in
`HudState.route`.

## Read first
- games/gnome-theft-auto/src/types.ts: `Blip` (now with `kind?: 'main' | 'side' | 'objective' | 'taxi'`), `HudRoute`
  (`{ points: { x: number; z: number }[]; color: string }`), `HudState.route?: HudRoute | null`.
- games/gnome-theft-auto/src/hud.ts: constants PIN, OUTLINE, TAU, pinBob, MAP_RANGE, MAP_VIEW; drawPin,
  drawEdgePointer; drawMap (minimap: blips loop, `half - dx * ks` / `half - dz * ks` mapping, mirrored x); drawBig
  (X(), Y() mapping, labels); `reduceMotion` and `clock()`.

## Change (hud.ts only)
- `drawMarker(g, x, y, r, t, b: Blip, still = false)`: picks by `b.kind`. All bob with `pinBob(t, r)` unless `still`,
  and all draw a fading pulse ring like drawPin's in their own colour (skip the ring when `still`).
  - 'main': a filled five-point star (outer radius r * 1.25, inner r * 0.5) in PIN gold, OUTLINE stroke 1.2.
  - 'side': a diamond (square rotated 45 degrees, half-diagonal r * 1.15) filled b.color, OUTLINE stroke 1.2, and a
    bold white "?" centred on it (`700 ${Math.round(r * 1.4)}px system-ui,sans-serif`, textBaseline 'middle').
  - 'objective': a ring (radius r, lineWidth 2) and a filled dot (radius r * 0.45), both b.color, with an OUTLINE
    stroke round the dot.
  - 'taxi': a rounded square (side r * 1.8, radius 2) filled '#f2c230', OUTLINE stroke, a black bold "T" centred.
  - no kind: the existing `drawPin(g, x, y, r, t, b.color)` (other systems' quest blips look as before).
- `drawEdgePointer(..., color = PIN)`: fill with `color`. Callers pass PIN for 'main' and no kind, else b.color.
- drawMap and drawBig: replace the drawPin calls for quest blips with drawMarker (same radii as today), pass the colour
  to drawEdgePointer.
- Route: before the blips in both maps, if `s.route && s.route.points.length >= 2`, stroke the polyline twice with
  `setLineDash` (minimap [4, 3], big map [6, 4]; `lineDashOffset = -t * 8`): first `rgba(0,0,0,.55)` (width 3.2
  minimap / 4 big), then `s.route.color` (width 1.8 / 2.4), round joins and caps; reset the dash afterwards. Minimap
  point mapping: `half - (p.x - px0) * ks`, `half - (p.z - pz0) * ks`; big map: `X(p.x)`, `Y(p.z)`.
- Legend on the big map: drawn on the big canvas in drawBig, bottom-left, after the region names: a rounded box
  rgba(10,12,16,.72) with rows (icon + text, 11px font, 10px when px < 360, row height 16 / 14): drawMarker still icons
  (r = 5) for 'main' "Story mission", 'side' (color '#3ad1c4') "Side quest (colour = who offers it)", 'objective'
  (color '#ff7a00') "Current objective", 'taxi' "Turfton Taxi"; a short dashed line in '#ffd23f' "Route to waypoint";
  and small dots: '#ff3b3b' "Hospital", '#ff3b9a' "Pay 'n' Glaze", '#f08a24' "Side-Valve Salvage", '#ffd23f'
  "Parked vehicle". Measure the widest label with measureText to size the box. Keep it inside the canvas.

## Contract
No exported signature changes (createHud, Hud). Reads HudState.route and Blip.kind only.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in hud.ts.

## Out of scope
types.ts (already has the fields), app.ts, quests/*, every other file.
~~~~

### 2D Road route

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
(the shared environment block above)

## Goal
`roadRoute(graph, from, to)` in games/gnome-theft-auto/src/route.ts returns a polyline along the road graph, for the
HUD's dashed route to a waypoint.

## Read first
- games/gnome-theft-auto/src/route.ts: the stub (you own it).
- games/gnome-theft-auto/src/types.ts: `RoadNode { id: number; x: number; z: number; links: number[] }` (links are
  node ids), `RoadGraph { nodes: RoadNode[]; laneOffset: number }`.

## Change
- games/gnome-theft-auto/src/route.ts: implement `roadRoute(graph, from, to): Pt[]`:
  - straight-line distance < ROUTE_DIRECT (60) or no nodes -> `[from, to]`.
  - a = node nearest `from`, b = node nearest `to` (plain linear scan). If the walk from->a plus b->to is longer than
    the straight from->to distance, return `[from, to]`.
  - A* from a to b over `links` (look nodes up by id with a Map), cost and heuristic = Euclidean distance; a small
    binary heap or a sorted array is fine (graph is a few hundred nodes). No path -> `[from, to]`.
  - Result `[from, ...path nodes as {x, z}, to]` (copies, not the node objects). Drop the first path node if it is
    behind the player, i.e. if from->second node is shorter than a->second node (keeps the line from doubling back);
    same for the last node relative to `to`.
  - Keep the file pure (no three.js, no DOM).
- New games/gnome-theft-auto/src/route.test.ts: a 3x3 grid graph (spacing 100, links to grid neighbours): route from
  near the bottom-left corner to near the top-right corner passes only through linked neighbours and its length is
  within 5% of the Manhattan distance; short trips (< 60) give 2 points; a graph with two disconnected parts gives
  `[from, to]`; an empty graph gives `[from, to]`.

## Contract
`export interface Pt { x: number; z: number }`, `export function roadRoute(graph: RoadGraph, from: Pt, to: Pt): Pt[]`,
`export const ROUTE_DIRECT = 60` (unchanged).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/route.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in route.ts / route.test.ts.

## Out of scope
Every other file.
~~~~

### 2E The Turfton Taxi module

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
(the shared environment block above)

## Goal
games/gnome-theft-auto/src/taxi.ts implements the Turfton Taxi: a 44 px 🚕 button, the Y key and gamepad D-pad left
call it; it drives up to the player and waits; once app.ts has run the mount sequence and reports the gnome seated, it
charges the fare, drives off, fades to black, jumps to the Central Bus Stop, rolls up to the kerb and asks app.ts to
let the gnome out; then it drives away and is removed. app.ts wiring is not yours (the planner does it).

## Read first
- games/gnome-theft-auto/src/taxi.ts: the stub with the full interface and doc comments (you own it; keep every export
  name and signature).
- games/gnome-theft-auto/src/config.ts: `TAXI` (all the numbers and the driver name) and `VEHICLES.taxi`.
- games/gnome-theft-auto/src/vehicles.ts: `createVehicle(scene, kind, x, z, yaw, tint?)`, `removeVehicle(scene, v)`.
- games/gnome-theft-auto/src/types.ts: Vehicle (x, y, z, yaw, speed, driver, questOwned), Box, World (boxes, spawn), Blip.
- games/gnome-theft-auto/src/terrain.ts: `heightAt(x, z)`, `waterAt(x, z)` (null on dry land).
- games/gnome-theft-auto/src/gamepad.ts: BTN table and read().
- games/gnome-theft-auto/src/quests/journal.ts: how a 44 px HUD button is made (CSS string, stopPropagation on pointerdown).

## Change
- games/gnome-theft-auto/src/taxi.ts:
  - Pure helpers (exported, tested):
    - `taxiFare(dist)` = `Math.min(TAXI.maxFare, Math.round(TAXI.baseFare + TAXI.perUnit * dist))`.
    - `segmentClear(boxes, ax, az, bx, bz, pad)`: false if the segment crosses any box with `h > 0.5` grown by `pad`
      (segment vs AABB slab test), else true.
    - `driveToward(v: { x: number; z: number; yaw: number; speed: number }, tx, tz, speed, dt, turnRate = 2.4): number`:
      turn yaw toward `Math.atan2(tx - v.x, tz - v.z)` by at most turnRate * dt (wrap the angle difference to -PI..PI),
      move `speed * dt` along (sin yaw, cos yaw) but never past the target, set v.speed = speed, return the remaining
      distance. (Forward in this game is (sin yaw, cos yaw).) Within 3 units of the target, aim straight at it
      (no turn limit) so it cannot orbit the target.
    - `pickApproach(boxes, px, pz, rand = Math.random, wet = (x, z) => waterAt(x, z) !== null)`: add a `wet` parameter
      at the end (keeps the stub signature compatible). For each d in TAXI.spawnDists, for 12 angles starting at
      rand() * 2PI: s = player + (sin a, cos a) * d, stop = player + (sin a, cos a) * TAXI.stopDist. Accept the first
      where s is not inside any box grown by 2.5, !wet(s), and segmentClear(boxes, s, stop, 1.6). yaw = atan2 from s to
      stop. Fallback: d = 8 at angle rand() * 2PI.
    - `dropSpot(boxes, spawn)`: for directions (0,1), (1,0), (0,-1), (-1,0): stop = spawn + dir * TAXI.dropOffset, from =
      spawn + dir * (TAXI.dropOffset + TAXI.arriveFrom); first where `from` is not in a box (pad 2.5) and
      segmentClear(boxes, from, stop, 1.6); yaw from `from` toward stop. Fallback: the first direction.
  - `createTaxi(deps)` state machine (phase(): 'idle' | 'approach' | 'waiting' | 'ride' | 'leaving'):
    - toggle(): approach/waiting -> sendAway with toast `${TAXI.driver}: "Suit yourself, dear."`; ride/leaving -> nothing.
      idle: `const why = deps.blocked()`; if why -> `deps.hud.toast(why, 3500)`, stop. p = deps.player(); dist to
      world.spawn < TAXI.minTripDist -> toast "You're already at the Central Bus Stop."; fare = taxiFare(dist);
      economy.state().acorns < fare -> toast `Turfton Taxi: the fare to the Bus Stop is ${fare} Acorns. You have ${acorns}.`.
      Else pickApproach(world.boxes, p.x, p.z), createVehicle(scene, 'taxi', x, z, yaw), `v.questOwned = true`,
      `v.y = heightAt(x, z)`, push to deps.vehicles, phase 'approach', play('whistle'), toast
      `${TAXI.driver}: "Turfton Taxi, on my way! Bus Stop fare: ${fare} Acorns."` (4500).
    - update(dt) returns TaxiEvent:
      - approach: driveToward(v, stop, Math.min(TAXI.approachSpeed, remaining * 2 + 2), dt); v.y = heightAt. Arrived
        (remaining < 0.6) or timer > TAXI.approachTimeout -> put it at the stop, speed 0, phase 'waiting', toast
        `${TAXI.driver}: "Hop in, dear. Meter's already running."`.
      - approach or waiting: if deps.blocked() is not null -> sendAway, toast `${TAXI.driver} won't wait around for that.`
      - waiting: timer > TAXI.waitSeconds or player farther than TAXI.leaveDist -> sendAway, toast `${TAXI.driver} gave up waiting.`
      - ride (after onSeated): t += dt. t < rideOut: drive straight along v.yaw at Math.min(TAXI.rideSpeed, t * 10),
        v.y = heightAt. Fade overlay opacity 0 -> 1 over [rideOut, rideOut + fadeS]. On the first frame at or past
        rideOut + fadeS: move v to dropSpot(world.boxes, world.spawn).from (x, z, yaw, y = heightAt, speed 0) and
        return 'jump' (once). Hold black for blackS (caption visible), then fade 1 -> 0 over fadeS while driving
        toward the stop with driveToward at speed `max(3, remaining / max(0.3, arriveS - tArrive))`, capped at
        TAXI.rideSpeed. When remaining < 0.4 or the arrive time passes arriveS + 1.5: put it at the stop, speed 0,
        overlay off, `deps.onDropOff()`, toast `${TAXI.driver}: "Central Bus Stop. Mind the NO LOITERING stencil."`,
        return 'dropoff' (once). riding() is true from onSeated until that frame, false after.
      - leaving: drive along v.yaw at 12 for TAXI.leaveSeconds, then remove it (splice from deps.vehicles,
        removeVehicle(deps.scene, v)), phase 'idle'.
      - Otherwise return null.
    - sendAway(): v.driver = 'none', phase 'leaving', timer 0.
    - boardable(): the vehicle while phase is 'waiting', else null.
    - onSeated(v): false unless v is the taxi and phase 'waiting'. fare = taxiFare(distance from v to world.spawn);
      `deps.economy.spend(fare, 'Turfton Taxi')`, if it fails toast `${TAXI.driver}: "Short? This one's on the meter."`.
      Remember the fare for the caption. Phase 'ride', t = 0, toast `${TAXI.driver}: "Central Bus Stop. Sit tight."`, true.
    - onStood(v): false unless v is the taxi; v.driver = 'none'; phase 'leaving'; timer 0; true.
    - blips(): approach/waiting -> `[{ x: v.x, z: v.z, color: '#f2c230', quest: 'Turfton Taxi', kind: 'taxi' }]`, else [].
    - cancel(): remove the vehicle if any, overlay off, phase 'idle'.
  - UI (created in createTaxi, appended to deps.ui; never restyle #ui): a `<style>` and a button `#gta-taxi-btn`
    (44 x 44 circle, '🚕', `aria-label`/`title` "Turfton Taxi (Y)", same look as #gta-journal-btn in journal.ts:
    `position:fixed;right:calc(env(safe-area-inset-right) + 210px);top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 8px);z-index:30`,
    class `on` = gold border while a taxi exists). pointerdown stopPropagation; click -> toggle().
    A fade overlay `#gta-taxi-fade` (fixed, inset 0, black, z-index 40, pointer-events none, opacity driven by update,
    `display:none` at opacity 0) with a centred caption `🚕 Turfton Taxi · Meter: ${fare} Acorns` (#f2c230, 800 18px system-ui).
  - Keyboard: `window` keydown with `e.code === TAXI.key && !e.repeat`, ignored when e.target is an INPUT/TEXTAREA/SELECT -> toggle().
  - Gamepad: `window.addEventListener('gta:taxi', () => toggle())`.
  - Guard every DOM call with `typeof document !== 'undefined'` (and window) so tests can import the module in node.
- games/gnome-theft-auto/src/gamepad.ts: add `LEFT: 14` to BTN; after the `if (blocked) return null;` line add
  `if (edge(BTN.LEFT)) window.dispatchEvent(new Event('gta:taxi'));` and add "D-pad left calls the Turfton Taxi" to
  the "Anywhere" line of the header comment.
- New games/gnome-theft-auto/src/taxi.test.ts (node, no DOM): taxiFare(0) = 10, taxiFare(500) = 30,
  taxiFare(5000) = 60; segmentClear false through a tall box, true beside it and through a box with h 0.3; driveToward
  reaches a target 20 units away within 200 steps of dt 0.05 at speed 10 and never overshoots; pickApproach with no
  boxes and `wet = () => false` stops TAXI.stopDist from the player and spawns 30 away; with boxes ringing the player at
  30 (but a gap) it picks a clear spot; dropSpot's stop is TAXI.dropOffset from spawn and its yaw faces the stop.

## Contract
Every export of the stub keeps its name and signature (pickApproach may gain the trailing optional `wet` parameter;
add `export function driveToward`). app.ts will: call `createTaxi(deps)` once; let E start the mount on
`taxi.boardable()`; call `taxi.onSeated(v)` when the mount finishes (and skip its own takeWheel when it returns true);
skip stepping the vehicle and zero the controls while `taxi.riding()`; call `taxi.update(dt)` each frame and on
'dropoff' start the exit mount, on 'jump' snap the camera; call `taxi.onStood(v)` when the gnome is out; add
`taxi.blips()` to the map; call `taxi.cancel()` when the player dies.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/taxi.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in taxi.ts, taxi.test.ts, gamepad.ts.

## Out of scope
app.ts, config.ts (TAXI is fixed), vehicles.ts, hud.ts, quests/*, every other file.
~~~~

### 2F Lore, achievement and Cabbie Cap prefab

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
(the shared environment block above; this issue touches packages/ and docs/, not the game's src)

## Goal
The Turfton Taxi and its driver Mabel Kerbstone are in the lore, the quest pacing is recorded as a ruling, and a
`gta-meter-running` achievement exists with a new `cabbie-cap` head prefab as its reward.

## Read first
- docs/lore/README.md (entry schema), docs/lore/canon.md (house style), the end of docs/lore/rulings.md (format; the
  last ruling number).
- docs/lore/entries/apocrypha/snail-coach.md, docs/lore/entries/apocrypha/turfton-bus-stop.md (style, related ids).
- packages/prefabs/src/catalog/gnome-theft-auto.ts: the `press-pass-cap` entry (a head-gear PrefabDef to copy the
  shape of); docs/roadmaps/prefab-library/_common.md (prefab rules).
- packages/achievements/src/catalog.ts: the Gnome Theft Auto block (e.g. 'gta-snail-saboteur'); packages/achievements/README.md.
- The `gta-taxi` prefab's examine lines in packages/prefabs/src/catalog/gta-world.ts (the meter ticks in acorns;
  drivers stop for a cabbage): reuse that flavour.

## Change
- packages/prefabs/src/catalog/gnome-theft-auto.ts: append a PrefabDef `cabbie-cap` ("Cabbie Cap", category 'armor',
  uses ['wear-head'], tags like ['cap', 'cabbie', 'taxi', 'checker', 'driver', 'gta']): a yellow flat cap with a short
  brim, a black-and-white checker band (small alternating boxes) and a tiny glowing yellow "taxi sign" box on the
  front; about + 5 examine lines in the catalog's voice. Follow the rules in _common.md.
- packages/achievements/src/catalog.ts: in the Gnome Theft Auto block add
  `{ id: 'gta-meter-running', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: "Meter's Running",
     description: 'Ride the Turfton Taxi back to the Central Bus Stop 3 times.', target: 3,
     reward: { slot: 'head', prefabId: 'cabbie-cap', label: 'Cabbie Cap' } }`.
- New docs/lore/entries/apocrypha/turfton-taxi.md (kind object, tier apocrypha, setting apocrypha, era now, status
  draft, games [gnome-theft-auto], aliases [Turfton Taxi, the cab], related [mabel-kerbstone, turfton-bus-stop,
  snail-coach], sources [games/gnome-theft-auto/src/taxi.ts, games/gnome-theft-auto/src/config.ts]): the yellow checker
  cab a gnome can call from anywhere in Turfton; it only knows one address, the Central Bus Stop; fare 10 to 60 Acorns
  by distance; it will not stop for a gnome with the Hat Watch after it or one in the middle of a job. "In the games"
  section: the 🚕 button, Y key, gamepad D-pad left; achievement Meter's Running.
- New docs/lore/entries/apocrypha/mabel-kerbstone.md (kind person, same tier/setting): Mabel Kerbstone, the Turfton
  Taxi's driver; calls everyone "dear"; lines she says in game: "Turfton Taxi, on my way!", "Hop in, dear. Meter's
  already running.", "Central Bus Stop. Sit tight.", "Central Bus Stop. Mind the NO LOITERING stencil.", "Suit yourself,
  dear.", "Short? This one's on the meter." Loose thread: why the taxi only ever drives to the Bus Stop.
- docs/lore/entries/apocrypha/turfton-bus-stop.md and snail-coach.md: add `turfton-taxi` to `related`.
- docs/lore/rulings.md: append the next ruling number: Question "In Gnome Theft Auto, when do the Strangers & Freaks
  side jobs open, and why can't a gnome hail a cab mid-job?" Ruling: side jobs open one by one as the story goes (the
  table is SIDE_UNLOCKS in games/gnome-theft-auto/src/quests/unlocks.ts; strangers only talk to a gnome with a
  reputation); the Loch Moss rumour reaches Driftwood after the Salvage Raid; the Turfton Taxi only drives to the
  Central Bus Stop, and Mabel won't take a fare with the Hat Watch after them or a contract running. Applies to
  apocrypha, gnome-theft-auto; Date 2026-11-22; Why line.
- Search docs/lore for text saying the Tessie quest unlocks at a random or rolled story beat
  (`npm run lore -- find Tessie`, and grep "random" / "rolled" in docs/lore/entries); change it to "after The Salvage
  Raid (chapter 3)".
- Run `npm run lore` (it regenerates docs/lore/INDEX.md) and keep the regenerated file.

## Done when
- `npm run lore` passes.
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/achievements` passes.

## Out of scope
games/ (the game wires the achievement), other catalog files.
~~~~

