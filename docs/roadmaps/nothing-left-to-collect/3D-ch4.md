Epic: 3 Content
Depends on: none (Epics 1-2 are done: every system works; chapters and floors f1-f4 are still stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Five other workers are writing the other chapters, floors, the ending and the party slice right now. Edit only `games/nothing-left-to-collect/src/chapters/ch4.ts` and `src/floors/f4.ts`.
- Your dev server, if you run one, uses port **5224** only: `npx vite --port 5224 --strictPort` from `games/nothing-left-to-collect`. Stop it when done.
- Repo rules: props are `@lawn/prefabs` ids placed through the layout. Dialogue: dry, short, a little absurd, no references to real games or films. Nothing bleeds.

## Goal

Write Chapter 4, "Everything" (Floor ∞: everything becomes collectible, the furniture included, the numbers hit
infinity, the HUD breaks, then **the Pointlessness**: everything stops, "you are finally free to play the game") and
Floor ∞'s layout. About 4 minutes of play. This is the emotional turn of the game: the second half must be quiet.

## Read first

- `games/nothing-left-to-collect/src/types.ts`: `ChapterCtx` (the ONLY API a chapter uses), `Chapter`, `FloorLayout`, `Floor` (`props[i]` matches `layout.props[i]`; `removeProp(i)` hides prop i and drops its collider).
- `games/nothing-left-to-collect/src/config.ts`: `ACH`, `ITEM_KINDS` (kind `anything`: an item that shows any prefab via `spawnAt(kind, x, z, y, prefab)`).
- `games/nothing-left-to-collect/src/collect.ts`: `formatCount` (returns `'∞'` for `n >= 1e100`), `clearItems(s)`.
- `games/nothing-left-to-collect/src/floors/lobby.ts`: a finished layout to copy the shape of.

How the builder treats a layout: the floor spans x in [-w/2, w/2], z in [-d/2, d/2]; outer walls are added (lift in
the north wall at `elevatorX`, low south cutaway); `windows: true` adds window panes on the side and north walls with
**Shellshore**, a sandy beach planet, hanging in the sky to the north; `solid` props block the player.

## Change

### `src/floors/f4.ts` (`export const F4: FloorLayout`)

`id: 'f4'`, `title: 'Floor ∞: Everything'`, `w: 30`, `d: 30`, `floorColor: 0xd8d8e0`, `wallColor: 0xffffff`, `elevatorX: 0`, `spawn: { x: 0, z: -12.5, facing: 0 }`, `windows: true`, `walls: []`, `npcs: []`.
The top floor: white, airy, full of nice furniture, about 40 props, all `solid` except small ones:
`office-desk` ×8 with `chair`s, `filing-cabinet` ×4, `couch` ×3, `bookshelf` ×4, `vending-machine`, `arcade-cabinet`, `fc-water-cooler`, `fc-photocopier`, `reception-desk`, `spiky-potted-plant` ×6, `flower-pot` ×4, `trophy-cup` ×2 (on desks, with the desk top `y: 0.63`), `crate` ×3, `wall-clock` at (6, -14.85) y 2.2. Leave a clear 3 m path from the lift to a **window spot** at the north-east (x 10..14, z -14..-11), where the view of Shellshore is best.
- `areas`: `floor: {x0:-14, z0:-13, x1:14, z1:14}`, `window-spot: {x0:10, z0:-14.5, x1:14.5, z1:-11}`, `all: {x0:-14.5, z0:-14.5, x1:14.5, z1:14.5}`.
- `interactables`: `{ id: 'window', label: 'Look', x: 12, z: -13.8, radius: 1.8 }`, `{ id: 'clock', label: 'Look', x: 6, z: -14, radius: 1.2 }`.

### `src/chapters/ch4.ts` (`export const CH4: Chapter`, id `'ch4'`)

Keep every `every(...)` unsubscribe so you can stop them all at the Pointlessness.

**Phase A: everything is collectible (about 100 s).**
1. `ctx.music('synergy-loop')`, `ctx.intensity(1)`. narrator: "Floor Infinity. The top. From here, everything is collectible."; "I mean everything. The desks. The chairs. The plants. Me, probably. Go on."
2. Turn the furniture into loot, one piece every 0.15 s (a `ctx.every(0.15, ...)` walking an index): for prop i (skip `wall-clock`): read `ctx.floor().layout.props[i]`, `ctx.floor().removeProp(i)`, `ctx.spawnAt('anything', p.x, p.z, 0.35, p.prefab)`, `ctx.sfx('ui')` every fourth one.
3. Rain office things: `ctx.every(0.5, () => { ctx.rain('anything', 6, 'floor'); ctx.rain('clip', 6, 'floor'); })` (an `anything` item without a prefab shows as a crate), skipped when more than 350 items are live (`ctx.collect.items.length`).
4. Escalation: `ctx.every(15, () => { ctx.collect.multiplier *= 10; })`; toasts every 1 s from this list (loop): "Collected a Desk", "Collected the Idea of a Desk", "Collected a Chair (Sat In)", "Collected Gravity (Partial)", "Collected the Floor Plan", "Collected the Concept of Mondays", "Collected Collecting", "Your Collection Has a Collection", "Its Collection Is Concerned", "Collected a Number", "Collected a Bigger Number", "Ran Out of Numbers".
5. HUD overflow: every 1 s, `ctx.hud.setOverflow(min(1, log10(max(1, total)) / 30))`. `ctx.camera('wide')` after 40 s.
6. Narrator lines spaced ~20 s apart: "Collected: one desk. Collected: the idea of a desk." / "We're out of words for numbers. The next one is just 'more'." / "The counters are leaving the screen. Let them go. They've earned it."
7. Infinity: wait until `ctx.collect.total >= 1e100` (formatCount shows ∞) OR 100 s pass: if the total is still short, set `ctx.collect.total = 1e100` (it is plain data). narrator "Infinity. Congratulations. You have collected infinity." `await ctx.wait(1.5)` "...Infinity and one." `await ctx.wait(1.5)` "...Infinity and two."

**Phase B: the Pointlessness (about 90 s).**
8. Everything stops at once: unsubscribe every `every`; `ctx.music(null)`; `clearItems(ctx.collect)` (import from `../collect`); remove all remaining props (`removeProp` for every index); `ctx.hud.setOverflow(0)`; `ctx.hud.setCounters([])` and `ctx.hud.setCountersVisible(false)`; `ctx.setGoal('Collected: everything.   Left to collect: nothing.')`; `ctx.sfx('thud')`; `ctx.camera('wide')`; `ctx.setControls('locked')`. `await ctx.wait(3)` in silence.
9. narrator (each with `{ auto: 2.5 }` so it plays without taps): "..."; "That's it. There's nothing left."; "There's nothing left to collect. You have collected all of it."; `ctx.unlock(ACH.point)`; `await ctx.hud.titleCard('', 'The Pointlessness', '')`; narrator "So. You're free."; "You are finally free to play the game."
10. `ctx.setControls('walk')`, `ctx.camera('follow')`, `ctx.setGoal(null)`. Wait 6 s while nothing happens (the player can walk the empty white floor).
11. `ctx.music('shellshore')`, `ctx.intensity(0)` (pads and the sea only). narrator: "...The game was the collecting. I'm sorry. I thought you knew."; `await ctx.wait(3)`; "Nobody's ever got this far. Usually they stop at a nice round number and take the job."
12. The window: `ctx.setGoal('Go back down.')`. `onInteract('window')` (and `onArea('window-spot')` once): narrator "That's Shellshore. The beach planet. Nobody collects anything there. They just... sit."; `ctx.intensity(0.5)`. Then `await ctx.rideElevator('lobby')` (the lift panel only accepts L; that is the director's job).
13. Leave the counters hidden when you return (the ending keeps them hidden).

`onInteract('clock')` all chapter: narrator "Nine. Still. Even up here."

## Contract

Export names and types unchanged: `CH4: Chapter`, `F4: FloorLayout`. Use only `ChapterCtx` members (plus
`clearItems`/`formatCount` from `../collect` and `ACH` from `../config`). Assigning `ctx.collect.total` and
`ctx.collect.multiplier` is allowed (plain data).

## Done when

- `npx tsc --noEmit -p games/nothing-left-to-collect` shows no errors in your two files.
- With your dev server on 5224: `http://localhost:5224/?chapter=ch4&fast`: furniture turns into pickups, the counters overflow and leave the screen, then everything stops and the empty-floor lines play; the lift takes you to L. `bash tools/smoke.sh "http://localhost:5224/?chapter=ch4&fast" fc-hud` reports no console errors. Check a 390x844 window.
- The frame rate stays usable during Phase A (items capped at 350 live; the item view creates at most 40 drops a frame).

## Out of scope

Every other file in `games/nothing-left-to-collect/`, all packages.
