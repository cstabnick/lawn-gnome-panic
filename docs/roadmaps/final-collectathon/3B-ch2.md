Epic: 3 Content
Depends on: none (Epics 1-2 are done: every system works; chapters and floors f1-f4 are still stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Five other workers are writing the other chapters, floors, the ending and the party slice right now. Edit only `games/final-collectathon/src/chapters/ch2.ts` and `src/floors/f2.ts`. (The party slice also builds Floor 2 as its arena, read-only: keep the areas named below.)
- Your dev server, if you run one, uses port **5222** only: `npx vite --port 5222 --strictPort` from `games/final-collectathon`. Stop it when done.
- Repo rules: props are `@lawn/prefabs` ids placed through the layout (never hand-built meshes). Dialogue follows the game's voice: dry, short, a little absurd, no references to real games or films, gnomes rename office things. Nothing bleeds.

## Goal

Write Chapter 2, "Onboarding" (Floor 2: the collectathon's second act: more kinds, respawns, an economy, a big
number), and Floor 2's layout. About 4-5 minutes of play.

## Read first

- `games/final-collectathon/src/types.ts`: `ChapterCtx` (the ONLY API a chapter uses), `Chapter`, `FloorLayout`, `NpcPlacement`.
- `games/final-collectathon/src/config.ts`: `ACH`, `ITEM_KINDS` (kinds `clip`, `sticky`, `button`).
- `games/final-collectathon/src/floors/lobby.ts`: a finished layout to copy the shape of.
- `games/final-collectathon/src/director.ts`: skim `say`, `choose`, `every`, `onInteract`, `rideElevator`, `egg`. The director shows the chapter title card itself.

How the builder treats a layout: the floor spans x in [-w/2, w/2], z in [-d/2, d/2]; outer walls are added (lift in
the north wall at `elevatorX`, low south cutaway toward the camera); `walls` are 1.6 m partitions; `solid` props
block the player. `office-desk` is 2.16 x 0.63 x 0.9 m. The player's pickup radius is `ctx.collect.magnet` metres
and each pickup is worth `ctx.collect.multiplier`; chapters may change both.

## Change

### `src/floors/f2.ts` (`export const F2: FloorLayout`)

`id: 'f2'`, `title: 'Floor 2: Onboarding'`, `w: 32`, `d: 26`, `floorColor: 0x8fb894`, `wallColor: 0xeef2e9`, `elevatorX: 0`, `spawn: { x: 0, z: -10.5, facing: 0 }`, `windows: false`.
A busy open-plan floor:
- **Open plan** (centre): a 3 x 3 grid of `office-desk` (solid) at x = -7, 0, 7 and z = -4, 1, 6, each with a `chair` (not solid) behind it.
- **Cubicles** (east): partitions `walls` forming four 4 x 4 m bays between x = 9 and x = 15.5, z = -9 to 7 (e.g. vertical walls at x = 9.5 from z -9 to -6 and -3 to 2 and 4 to 7, horizontal walls at z = -5, -1, 3 from x 9.5 to 15.5; leave 2 m gaps so every bay is reachable), a desk in each bay.
- **Break nook** (west, x -15.5..-10, z -9..-2): `fc-water-cooler` (solid) at (-14.5, -7), a `couch` (solid) at (-12, -3) rot 0, the NPC **Sorrel Gluepot** `{ id: 'sorrel', x: -13.6, z: -6.2, facing: 0.8, look: { hat: 0x3a8a5a, shirt: 0xe8d8b0, pants: 0x4a3a2a, beard: 0xd8d0c0 } }`.
- **Copy corner** (west, z 2..8): `fc-photocopier` (solid) at (-14.3, 5) rot 90, a `crate` (solid) of paper at (-14.4, 7.2).
- **Kiosk**: a `vending-machine` (solid) at (-6, -11.9) rot 0 against the north wall, left of the lift.
- Decor: `spiky-potted-plant` in the corners, a `wall-clock` at (6, -12.85) y 2.2, two `bookshelf`s (solid) along the south-west.
- `npcs`: Sorrel (above).
- `areas`: `open-plan: {x0:-9, z0:-6, x1:9, z1:9}`, `cubicles: {x0:9.6, z0:-9, x1:15.5, z1:7}`, `break-nook: {x0:-15.5, z0:-9, x1:-10, z1:-2}`, `storage: {x0:-15.5, z0:1, x1:-10, z1:9}`, `corners: {x0:-15.5, z0:9.5, x1:15.5, z1:12.5}`, `all: {x0:-15.5, z0:-12.5, x1:15.5, z1:12.5}`.
- `interactables`: `{ id: 'water-cooler', label: 'Chat', x: -13.4, z: -5.4, radius: 1.5 }`, `{ id: 'photocopier', label: 'Copy', x: -13.2, z: 5, radius: 1.3 }`, `{ id: 'kiosk', label: 'Shop', x: -6, z: -10.9, radius: 1.4 }`, `{ id: 'clock', label: 'Look', x: 6, z: -12, radius: 1.2 }`.

### `src/chapters/ch2.ts` (`export const CH2: Chapter`, id `'ch2'`)

Music: `ctx.music('synergy-loop')`, `ctx.intensity(0.1)`; raise intensity as Clips grow: `intensity(0.1 + 0.4 * min(1, clips / 1000))`.
`ctx.name('coworker', 'Sorrel Gluepot')` at the start. Keep a goal line updated from `onPickup`.

1. narrator: "Floor 2. Onboarding. Here you'll be issued your first real collectibles. Acorns are for children and founding members."
2. **Clips**: `ctx.spawn('clip', 120, 'open-plan')`. narrator "These are Clips. Small silver squiggles. They hold paper together, in theory. We hold them apart, and count them." Goal `Clips: n / 100`. Respawn: `ctx.every(2, () => ctx.spawn('clip', 4, 'open-plan'))`. At 50 Clips: narrator "Did you notice they come back? That's called retention."
3. At 100 Clips: `ctx.toast('New collectible unlocked: Sticky Squares', 'They were always there. Now you can see them.')`, `ctx.spawn('sticky', 40, 'cubicles')`, narrator "Sticky Squares. Each one has a word on it. Collect enough and they form a sentence. The sentence is 'collect more Sticky Squares.'" Goal becomes `Clips: n / 1,000   Sticky Squares: m / 30`.
4. At 30 Sticky Squares: Gold Buttons: `ctx.spawn('button', 8, 'corners')`, `ctx.spawn('button', 4, 'storage')`, and one on each of 3 desk tops (`spawnAt('button', x, z, 0.63 + 0.35)` at three open-plan desks). narrator "Gold Buttons are money. You can spend them at the kiosk, on things that help you collect things. This is called the economy."
5. **Kiosk** `onInteract('kiosk')`: `const i = await ctx.choose('Bucketworth Kiosk. You have N Gold Buttons.', ['Bigger Magnet (3 Buttons)', 'Double Clips (5 Buttons)', 'Just looking'])`. Magnet: if `ctx.collect.counts.button >= 3`: subtract 3, `ctx.collect.magnet += 0.8`, `sfx('fanfare')`; Double Clips: if `>= 5`: subtract 5, `ctx.collect.multiplier *= 2`. Not enough: `sfx('denied')`, narrator "You can't afford that. Collect more Gold Buttons. You'll find them where you'd least expect, which is everywhere." After the first purchase only: narrator "You spent collectibles to collect collectibles faster. Somewhere, an accountant sheds a single tear and buys a magnet." (Note: the multiplier multiplies every kind, which is the joke; the label says Clips.)
6. Free multipliers (so 1,000 is reachable without shopping): at 200 Clips `ctx.collect.multiplier *= 2`, `ctx.toast('Overtime!', 'Clips now count double. So does everything. We are not sure why.')`; at 500 Clips again ×2, toast `'Double Overtime!'`. After 300 Clips, respawn faster: replace the `every(2, ...)` with `every(1, () => ctx.spawn('clip', 6, 'open-plan'))` (keep the unsubscribe from the first one). Cap the work: skip a respawn when more than 250 items are live (`ctx.collect.items.length`).
7. Wait for 1,000 Clips: `await ctx.waitCount('clip', 1000)`; `ctx.unlock(ACH.clipArt)`; narrator "A thousand Clips. Enough to hold together every document Bucketworth & Sons has ever produced. It has produced none. It is mostly collecting."
8. Floor completion gag: stop the respawns; `ctx.setGoal('Floor 2: 100%')`, `await ctx.wait(3)`, `ctx.setGoal('Floor 2: 104%')`, narrator "One hundred and four percent. We round up. It's a sign of commitment."; "Upstairs is Synergy. Floor two and a half. Don't ask about the half."; `await ctx.rideElevator('f3')`.

Eggs and gags (listeners set up at the start, all chapter long):
- **Water Cooler Gossip** `onInteract('water-cooler')`, count n: 1 coworker "Did you hear? The last applicant is still up on two and a half. Still collecting. Lovely gnome. Glazed look." 2 coworker "I've worked here eleven years. I think. The clock says nine." 3 coworker "Between us, nobody's ever finished the interview. You just sort of... stop." then `ctx.egg('water-cooler')`. 4+ coworker "That's all the gossip. I collect it, I don't make it."
- **Two of You** `onInteract('photocopier')`: first time `ctx.sfx('whoosh')`, narrator "You photocopied yourself. Collected: You (2).", `ctx.toast('New collectible: You', 'You (2). Please do not collect the original.')`, `ctx.egg('photocopier')`. Later: narrator "It's out of toner. You used it all on yourself."
- `onInteract('clock')`: narrator (yawning) "Sorry. Long morning. It's been nine o'clock for ages."
- Once, 90 s into the chapter: narrator "If anyone asks, this is the interview. Not a dream. Dreams have fewer forms."

## Contract

Export names and types unchanged: `CH2: Chapter`, `F2: FloorLayout`. Area names `open-plan` and `all` must exist
(the party slice rains items there). Use only `ChapterCtx` members (`ctx.collect` for magnet, multiplier, counts).

## Done when

- `npx tsc --noEmit -p games/final-collectathon` shows no errors in your two files.
- With your dev server on 5222: `http://localhost:5222/?chapter=ch2&fast` shows Clips on Floor 2, the kiosk, Sorrel and the photocopier respond; `bash tools/smoke.sh "http://localhost:5222/?chapter=ch2&fast" fc-hud fc-counters` reports no console errors. Check a 390x844 window too.
- Re-read the timing: at ~2 Clips/s base, ×4 after the free multipliers, 1,000 Clips takes about 2.5-3 minutes.

## Out of scope

Every other file in `games/final-collectathon/` (other chapters, floors, `director.ts`, `office.ts`, `config.ts`, `types.ts`), all packages.
