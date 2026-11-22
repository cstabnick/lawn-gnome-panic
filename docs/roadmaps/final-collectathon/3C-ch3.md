Epic: 3 Content
Depends on: none (Epics 1-2 are done: every system works; chapters and floors f1-f4 are still stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Five other workers are writing the other chapters, floors, the ending and the party slice right now. Edit only `games/final-collectathon/src/chapters/ch3.ts` and `src/floors/f3.ts`.
- Your dev server, if you run one, uses port **5223** only: `npx vite --port 5223 --strictPort` from `games/final-collectathon`. Stop it when done.
- Repo rules: props are `@lawn/prefabs` ids placed through the layout. Dialogue: dry, short, a little absurd, no references to real games or films. Nothing bleeds.

## Goal

Write Chapter 3, "Synergy" (Floor 2½: meta-collectibles, a treadmill of fake in-game achievements, a multiplier
that keeps doubling, music that speeds up, a narrator getting tired, sleeping coworkers) and Floor 2½'s layout.
About 5 minutes of play.

## Read first

- `games/final-collectathon/src/types.ts`: `ChapterCtx` (the ONLY API a chapter uses), `Chapter`, `FloorLayout`, `NpcPlacement`, `Pickup`.
- `games/final-collectathon/src/config.ts`: `ACH`, `ITEM_KINDS` (kinds `acorn`, `clip`, `sticky`, `token`, `star`, `badge`).
- `games/final-collectathon/src/collect.ts`: `formatCount(n)` (you may import it for goal text).
- `games/final-collectathon/src/floors/lobby.ts`: a finished layout to copy the shape of.

How the builder treats a layout: the floor spans x in [-w/2, w/2], z in [-d/2, d/2]; outer walls are added (lift in
the north wall at `elevatorX`, low south cutaway toward the camera); `walls` are 1.6 m partitions; `solid` props
block the player; an NPC with `asleep: true` slumps and shows a floating "z z z". `ctx.rain(kind, n, area)` drops
items from the ceiling. `ctx.collect.multiplier` multiplies every pickup.

## Change

### `src/floors/f3.ts` (`export const F3: FloorLayout`)

`id: 'f3'`, `title: 'Floor 2½: Synergy'`, `w: 36`, `d: 30`, `floorColor: 0xb8a08f`, `wallColor: 0xf2ece9`, `elevatorX: 0`, `spawn: { x: 0, z: -12.5, facing: 0 }`, `windows: false`.
A beige maze of cubicles where everyone is asleep:
- **Cubicle maze** (most of the floor, x -12..16, z -9..12): a grid of 4 x 4 m cubicles from 1.6 m partitions (`walls`), with openings so the whole maze is connected (one 1.6 m gap per cubicle, alternating sides). An `office-desk` and a `chair` in most cubicles. At least 8 sleeping coworker NPCs at desks: `asleep: true`, ids `sleeper-1`..`sleeper-8`, varied looks (`hat`, `shirt` colours; some `beard: 0xdedede`, some `glasses: true`).
- **Break room** (west, x -17.5..-12.5, z -6..6, one wide doorway on its east side): `arcade-cabinet` (solid) at (-17, 0) rot 90, `vending-machine` (solid) at (-17, 3.5) rot 90, a `couch` at (-14, -4.5).
- A wide clear **aisle** from the lift down the middle (x -1.5..1.5): no walls or props in it.
- `wall-clock` at (6, -14.85) y 2.2; plants in the corners.
- `areas`: `maze: {x0:-12, z0:-9, x1:16, z1:12}`, `aisle: {x0:-1.5, z0:-14, x1:1.5, z1:13}`, `break-room: {x0:-17.5, z0:-6, x1:-12.5, z1:6}`, `all: {x0:-17.5, z0:-14.5, x1:17.5, z1:14.5}`.
- `interactables`: `{ id: 'arcade', label: 'Play', x: -16, z: 0, radius: 1.4 }`, `{ id: 'clock', label: 'Look', x: 6, z: -14, radius: 1.2 }`, and one `{ id: 'sleeper', label: 'Wake', x, z, radius: 1.2 }` in front of `sleeper-1`.

### `src/chapters/ch3.ts` (`export const CH3: Chapter`, id `'ch3'`)

Music: `ctx.music('synergy-loop')`. Intensity rises over the chapter: `ctx.intensity(0.5 + 0.5 * min(1, elapsed / 240))` updated every 5 s (`ctx.every(5, ...)`, track elapsed yourself in game seconds).

1. narrator: "Floor two and a half. Synergy. Here, collectibles collect other collectibles, and you collect those."; "Every hundred of anything becomes a Token of Appreciation. Every ten Tokens become a Star of Recognition. Every five Stars become a Collector's Badge."; "Don't write it down. There's a collectible for that too."
2. **Rain**: `ctx.every(1.5, () => { ctx.rain('clip', 6, 'maze'); ctx.rain('sticky', 3, 'maze'); ctx.rain('acorn', 3, 'aisle'); })`, skipped while more than 300 items are live (`ctx.collect.items.length`).
3. **Conversions** (`onPickup`): keep a running "base" tally of everything picked up that is not a token, star or badge (`base += p.amount`). Every time `base` crosses another multiple of 100 (handle big jumps: compute how many hundreds were crossed, cap at 5 drops per pickup), `ctx.spawnAt('token', player.x + small random offset, player.z + offset)`. Likewise when the `token` count crosses each multiple of 10, drop a `star` next to the player; when `star` crosses each multiple of 5, drop a `badge`, `ctx.sfx('fanfare')`, toast `"Collector's Badge!"`. Each `star` pickup also `ctx.increment(ACH.employee)`. Do not use `Math.random` for anything the player must rely on; small visual offsets are fine.
4. **The achievement treadmill**: `ctx.every(6, ...)` shows the next fake achievement from this list (in order, then loop) with `ctx.toast('Achievement unlocked', title)` and `ctx.increment(ACH.employee)` (the real Employee of the Month needs 50 Recognitions; toasts + stars get there in about 4 minutes):
   "Walked a Bit", "Collected an Achievement", "Looked at a Desk", "Breathed (Ongoing)", "Got Ten of Something", "Got Ten of Something Else", "Read This", "Achievement Hunter", "Achievement Hunter Hunter", "Stood Near a Coworker", "Didn't Wake Anyone", "Didn't Wake Anyone Again", "Picked Up a Thing You Already Had", "Found a Secret (Not That One)", "Completionist (12%)", "Synergised", "Leveraged", "Circled Back", "Took It Offline", "Unlocked: Unlocking", "Moved Forward", "Patience: Waited 0 Seconds", "Exceeded Expectations (They Were Low)", "Employee of the Minute", "Collector's Edition Collector", "Remembered to Blink", "Attended a Meeting (In Spirit)", "Opened a Drawer, Emotionally", "The Grind", "Number Go Up".
5. **The multiplier**: `ctx.every(45, ...)`: `ctx.collect.multiplier *= 2`; first time narrator "Your multiplier has doubled. Everything you collect is now worth twice what it was worth, which was nothing, twice."; later times just a toast `Multiplier x${multiplier}`.
6. **Narrator fatigue**: one line every 35-40 s (a queue started with `ctx.every(38, ...)`), in this order: "I used to have a script. It's in a filing cabinet. I collected it." / "Is this the interview, or the dream where you're late for the interview? Both have carpet." / "Don't wake them. They're on their break. It's been a long break. Since nine." / "You know, you could stop. ...No. Look at the numbers. Look at them go." / "Somebody on this floor collected so much he became a collectible. We keep him in a drawer. Don't collect the drawer." / "Have you noticed the music's got faster? That's not me. That's the economy."
7. Goal line (every 1 s): `Total: ${formatCount(ctx.collect.total)}   Badges: ${ctx.count('badge')}/2`.
8. **End**: `await Promise.race([ctx.waitCount('badge', 2), ctx.wait(300)])`; stop the rain; narrator "Synergy achieved. Your synergy has been noted, filed and collected."; "There's one more floor. The top one. It has everything."; `ctx.setGoal(null)`; `await ctx.rideElevator('f4')`.

Eggs and gags (all chapter):
- **The Answer Is Always Gnome** `onInteract('arcade')`: `const i = await ctx.choose('WORD OF THE DAY: guess the five-letter word', ['GNOME', 'CLIPS', 'TOKEN', 'SLEEP'])`; if GNOME: narrator "Correct. The answer is GNOME. It was GNOME yesterday. It will be GNOME tomorrow."; otherwise narrator "No. The answer was GNOME. It is always GNOME." Then `ctx.egg('arcade-cabinet')` (either way).
- `onInteract('sleeper')`: coworker "Mm... five more minutes... it's only nine..." (set `ctx.name('coworker', 'A Sleeping Coworker')` before, and back to `'A Coworker'` after).
- `onInteract('clock')`: narrator "Still nine. Of course it is."

## Contract

Export names and types unchanged: `CH3: Chapter`, `F3: FloorLayout`. Use only `ChapterCtx` members (plus importing
`formatCount` from `../collect` and `ACH` from `../config`).

## Done when

- `npx tsc --noEmit -p games/final-collectathon` shows no errors in your two files.
- With your dev server on 5223: `http://localhost:5223/?chapter=ch3&fast` rains items, drops Tokens at your feet as you collect, shows toasts; the arcade cabinet asks its question. `bash tools/smoke.sh "http://localhost:5223/?chapter=ch3&fast" fc-hud fc-counters` reports no console errors. Check a 390x844 window: the toasts do not cover the counters.

## Out of scope

Every other file in `games/final-collectathon/`, all packages.
