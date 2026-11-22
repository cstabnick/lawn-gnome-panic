Epic: 3 Content
Depends on: none (Epics 1-2 are done: every system works; chapters and floors f1-f4 are still stubs)

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\stingaree` (a git worktree). Node: if not found, `export PATH="/c/Program Files/nodejs:$PATH"` in Git Bash.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`.
- Five other workers are writing the other chapters, floors, the ending and the party slice right now. Edit only `games/final-collectathon/src/chapters/prologue.ts`, `src/chapters/ch1.ts`, `src/floors/f1.ts`.
- Your dev server, if you run one, uses port **5221** only: `npx vite --port 5221 --strictPort` from `games/final-collectathon`. Stop it when done.
- Repo rules: props are `@lawn/prefabs` ids placed through the layout (never hand-built meshes). Dialogue follows the game's voice (below): dry, short, a little absurd, no references to real games or films, gnomes rename office things. Nothing bleeds.

## Goal

Write the prologue (reception: the secretary's "Hello.") and Chapter 1, "Orientation" (a collectathon tutorial
parody on Floor 1), plus Floor 1's layout. Together about 4-5 minutes of play.

## Read first

- `games/final-collectathon/src/types.ts`: `ChapterCtx` (the ONLY API a chapter uses), `Chapter`, `FloorLayout`, `PropPlacement`, `NpcPlacement`, `Interactable`, `Rect`.
- `games/final-collectathon/src/config.ts`: `ACH`, `ITEM_KINDS` (kinds `acorn`, `golden-acorn`).
- `games/final-collectathon/src/floors/lobby.ts`: the reception layout (area names `front-door`, `outside`, `reception`, `waiting`, `all`; interactables `secretary`, `nameplate`, `clock`; Primrose the secretary is NPC `primrose` behind the desk at (0, -4.1)) and a finished example of a layout.
- `games/final-collectathon/src/director.ts`: skim how `say`, `choose`, `waitArea`, `onArea`, `onInteract`, `rideElevator`, `egg` behave (the director shows the chapter title card itself; you do not).

How the builder treats a layout (from `office.ts`): the floor spans x in [-w/2, w/2], z in [-d/2, d/2]; outer walls
are added for you (north wall has the lift at `elevatorX`, the south wall is a low cutaway facing the camera);
`walls` are 1.6 m partitions; `solid` props block the player. The player walks at 5 m/s and jumps about 1.05 m
high. `office-desk` is 2.16 x 0.63 (top) x 0.9 m; `filing-cabinet` is 0.64 x 1.32 x 0.72 m (too tall to jump on
from the floor, so put a desk in front of each as a step).

## Change

### `src/chapters/prologue.ts` (`export const PROLOGUE: Chapter`, id `'prologue'`)

Script (`ctx.*` calls; lines are `[speaker, text]`):
1. `ctx.setControls('locked')`, `ctx.music('hold-music')`, `ctx.camera('close')`, `ctx.player.lookAt(0, -4.1)`, `await ctx.hud.fade(1, 0)`, `await ctx.hud.fade(0, 1.2)`.
2. secretary: "Hello."
3. `const c = await ctx.choose(null, ['Hello.', '...', 'Is this the interview?'])`:
   - 0: player "Hello." then `ctx.unlock(ACH.hello)`; secretary "Lovely. Nobody says it back."
   - 1: secretary "That's fine. Most applicants say less."
   - 2: secretary "Everything is the interview. That was the first question. You got it right, probably."
4. secretary: "You're here for the position. The position is Collector."; "Bucketworth & Sons have been collecting since before there was anything to collect."; "Take the lift to Floor 1. The Interviewer will be with you shortly. He's always with you shortly."; "Oh, and help yourself to anything that glows. That's sort of the job."
5. `ctx.camera('follow')`, `ctx.setControls('walk')`, `ctx.setGoal('Take the lift to Floor 1')`.
6. Listeners (keep the unsubscribe functions; call them all before returning):
   - `onInteract('secretary')`: cycle through: "The lift is behind me. It's the large door that goes ding." / "Nobody has ever been late for an interview here. Time doesn't go that way." / "I collect nothing. That's my secret." / "Still here? The lift won't ride itself. Well. It will. But not with you in it."
   - `onInteract('nameplate')`: count reads. 1: narrator "It says PRIMROSE PAPERWEIGHT, RECEPTION." 2: secretary "Still Primrose." 3: secretary "Primrose. Honestly. It's brass, it doesn't change." 4: secretary "...Fine. Today it's Primrose Paperweight, Reception, Second Class." then `ctx.egg('nameplate')`. 5+: secretary "It's a nameplate, love."
   - `onInteract('clock')`: narrator "Nine o'clock. Interviews are always at nine."
   - **The Shortest Interview**: `onArea('front-door', ...)` (only reacts once per entry, ignore while a sequence is running): `setControls('locked')`; narrator lines "And so the applicant turned round and walked straight back out, before the interview could even begin." / "A short career. Efficient. No collectibles were harmed."; `await ctx.hud.credits(['THE END', '', 'The Shortest Interview', '', 'Collected: nothing. Lovely.'])`; `ctx.egg('shortest-interview')`; fade to black 0.6 s; `ctx.player.teleport(0, 0, 5.5, Math.PI)`; fade in; secretary "Hello." / "You came back. Everyone comes back."; `setControls('walk')`.
7. `await ctx.rideElevator('f1')`, then unsubscribe everything and `ctx.setGoal(null)`.

### `src/floors/f1.ts` (`export const F1: FloorLayout`, keep the name)

`id: 'f1'`, `title: 'Floor 1: Orientation'`, `w: 28`, `d: 22`, `floorColor: 0x8fa3b8`, `wallColor: 0xe9eef2`, `elevatorX: 0`, `spawn: { x: 0, z: -8.5, facing: 0 }`, no `frontDoorX`, `windows: false`, `npcs: []`.
A bright, slightly too-neat open-plan office "where every career begins":
- `walls`: two short partitions making a "Training Corridor" from the lift: `{x0:-2, z0:-9, x1:-2, z1:-3}` and `{x0:2, z0:-9, x1:2, z1:-3}`.
- props: 6 `office-desk` (solid) in two rows at z = 1 and z = 5, x = -6, 0, 6, each with a `chair` behind it (z + 0.9, rot 180, not solid); along the west wall the **cabinet run**: 5 `filing-cabinet` (solid) at x = -12.8, z = -6, -3, 0, 3, 6, each with an `office-desk` step in front at x = -11, rot 90 (solid); a **plinth** for the display acorn in the north-east: a `side-table` (solid) at (10, -7) and four `flower-pot`s at (9, -8), (11, -8), (9, -6), (11, -6) as the "rope posts"; `spiky-potted-plant` in the corners; a `wall-clock` at (5, -10.85) y 2.2; a `bookshelf` (solid) at (12.8, 3) rot -90; a `trophy-cup` on the plinth table's top (read `side-table`'s height in `packages/prefabs/src/catalog/furniture.ts`) is NOT added: the acorn goes there.
- `areas`: `corridor: {x0:-1.8, z0:-9, x1:1.8, z1:-3}`, `open-plan: {x0:-9, z0:-2, x1:9, z1:9.5}`, `cabinets: {x0:-13.5, z0:-7, x1:-10, z1:7}`, `plinth: {x0:8.4, z0:-8.6, x1:11.6, z1:-5.4}`, `all: {x0:-13.5, z0:-10.5, x1:13.5, z1:10.5}`.
- `interactables`: `{ id: 'clock', label: 'Look', x: 5, z: -10, radius: 1.2 }`.

### `src/chapters/ch1.ts` (`export const CH1: Chapter`, id `'ch1'`)

Music stays `hold-music` (call `ctx.music('hold-music')`). Keep a goal line updated from `onPickup`.
1. narrator: "Ah. The applicant. Welcome to Bucketworth & Sons. I'm the Interviewer. I'll be in the ceiling."; "This is Floor 1, Orientation. Every great career begins the same way: with a line of acorns leading somewhere."
2. Skip button: `ctx.hud.setSkipButton('Skip Tutorial', onSkip)`. `onSkip` count n: 1 "There is no skipping. The tutorial is the job." 2 "You pressed it again. Noted, on your file." 3 "The button is decorative. Like a lot of things on this floor." 4 "Pressing it harder does not help. We've measured." 5-9: no line, `ctx.sfx('denied')`. 10: relabel `ctx.hud.setSkipButton('Skip Skip Tutorial')`, narrator "Fine. You have skipped skipping the tutorial. Carry on." and `ctx.egg('skip-tutorial')`. Further presses: `sfx('denied')`. Do not await the say inside the click handler in a way that blocks other script lines (fire and forget: `void ctx.say(...)`). Hide the button (`setSkipButton(null)`) at the end of the chapter.
3. The trail: `ctx.spawnLine('acorn', 10, {x:0, z:-7}, {x:0, z:-1})` and `ctx.spawnLine('acorn', 10, {x:1, z:0}, {x:8, z:4})`. Goal `Acorns: n/20`. Reactions on the acorn count: at 1 narrator "Wonderful. That's one. The industry standard is somewhere between three hundred and all of them."; at 10 "Ten. You're a natural. Or you have a pulse. We test for either."; `await ctx.waitCount('acorn', 20)`; "Twenty. On to the advanced material."
4. Golden acorns: one on top of each filing cabinet: `ctx.spawnAt('golden-acorn', -12.8, z, 1.32 + 0.35)` for z in -6, -3, 0, 3, 6. narrator: "These are Golden Acorns. They're on top of the filing cabinets, because that's where gold goes."; "Jump on the desk, then the cabinet. Space, or the Jump button. Nobody said Collector was a desk job. Well, it is. But you stand on the desk."; goal `Golden Acorns: n/5`; `await ctx.waitCount('golden-acorn', 5)`; narrator "Five Golden Acorns. In some companies, that's a pension."
5. The display acorn (set this up at step 3, so it can happen any time): `ctx.spawnAt('acorn', 10, -7, <side-table top> + 0.35)`. `onArea('plinth')` once: narrator "That acorn is not for collecting. It's a display acorn. It's been there since the founding." `onPickup`: if a pickup is within 0.6 m of (10, -7): `ctx.egg('do-not-collect')`, narrator "You collected it. Of course you did. That's the job, isn't it. I'll put it on your file as initiative."
6. Sweep: `ctx.spawn('acorn', 25, 'open-plan')`, narrator "Now the rest. Twenty-five acorns, scattered about. We scatter them every morning. Then we collect them. Then it's morning again."; goal `Acorns: n/45`; `await ctx.waitCount('acorn', 45)` (the display acorn counts too, which is fine).
7. `onInteract('clock')` (whole chapter): narrator "Don't mind the clock. It's always nine here."
8. End: narrator "That's every acorn on Floor 1. Orientation complete. You are now oriented."; "Upstairs is Onboarding. It has more things on it. Things are good. Take the lift."; `ctx.hud.setSkipButton(null)`; `await ctx.rideElevator('f2')`.

## Contract

Export names and types unchanged: `PROLOGUE: Chapter`, `CH1: Chapter`, `F1: FloorLayout`. Use only `ChapterCtx`
members (no imports of `director.ts`, `hud.ts` and so on: `ctx.hud` is the only HUD access, for `fade`,
`credits` and `setSkipButton`).

## Done when

- `npx tsc --noEmit -p games/final-collectathon` shows no errors in your three files.
- With your dev server on 5221: `http://localhost:5221/?chapter=prologue&fast` plays the prologue into Floor 1; `http://localhost:5221/?chapter=ch1&fast` shows the trail of acorns; collecting works. Check `bash tools/smoke.sh "http://localhost:5221/?chapter=ch1&fast" fc-hud fc-counters fc-dialog` reports no console errors. Also look at a 390x844 window: the counters and the Skip button do not cover each other.

## Out of scope

Every other file in `games/final-collectathon/` (other chapters, floors, `director.ts`, `office.ts`, `config.ts`, `types.ts`), all packages.
