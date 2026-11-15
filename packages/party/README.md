# @lawn/party: party slices

Gnome Party (`games/gnome-party`) is a board party for 4 gnomes. Its minigames are **party slices**: a party-sized piece of an existing game (one hole of golf, one bowling frame) that the game itself surfaces through this interface. Gnome Party never edits a game; it finds every `games/*/src/minigames/index.ts` on its own.

A slice is built from the game's **own** modules, so when the game changes, its slice changes with it. The same slice plays inside the game alone (`#minigame`) and in the party.

| File | What |
|---|---|
| `src/types.ts` | The contract: `MinigameDef` (pure `init` / `step` / `cpu` / `result` + `createView`), `PadState`, `ViewCtx`, `SeatInfo` |
| `src/runner.ts` | `startMinigame`: countdown, fixed 1/60 s steps on the host with CPU and remote inputs, snapshots, time cap, host takeover, cleanup |
| `src/pad.ts` | `createPad(canvas)`: keyboard, mouse and touch as one `PadState` |
| `src/standalone.ts` | `playMinigame(def, { canvas, ui })`: a game plays its slice alone against 3 CPUs |
| `src/testkit.ts` | `testMinigame(def)` (vitest): plays the slice headless with 4 CPUs and checks the rules below |
| `template/minigame.ts` | A working slice ("Mash") that `npm run new-mini` copies |

<!-- size-rules -->
A party slice is **party-sized**:

- **One round of 20-60 seconds** (`maxSeconds` 15-90). One hole of golf, not a course. One bowling frame, not a game.
- **One verb**, explained by the one-sentence `controls`: putt, bowl, dodge, aim, mash, steer.
- **All four seats play at the same time**, and every seat ends with a place. Nobody who is knocked out waits more than ~20 s.
- **Built from the game's own modules.** If what the slice needs is tangled in the game's `Ctx` or `main.ts`, refactor the game once so it is callable on its own. Never copy it. Slice-only code (CPU, scoring, view glue) stays small: about 300 lines in all.
- **State is small JSON** (< 2 KB); input is a level, and one-off actions are counters. Replay deterministic simulations from their inputs rather than sending trajectories.
- **No** menus, levels, progression, saving, its own netcode or its own music. The slice's modules must not touch the DOM or `window` at import time.
- **Reuse the game's rules, not just its physics.** Before writing a helper (club choice, clamping, scoring, penalties), look for the game's own; if it is private or takes `Ctx`, extract it once so both call it.
- **Every screen runs the view; only the host runs `init`.** Reset any module-level game state the view's replays depend on in `createView` too.
- **Inputs:** keep action counters in the view's closure and gate a new action on the host's acknowledgement (`shots <= lastShots`); `pad.pointer` is in NDC; count a swipe's release sample.
- **Replays use a local clock** (advance by `dt`, snap to `s.t - t0` when far off), since snapshots arrive 15 times a second.
- **Tested by the game:** `src/minigames/minigames.test.ts` calls `testMinigame(def)` for every slice, so the game's `npm test` keeps the slice working.
<!-- /size-rules -->

## How a game surfaces a slice

Scaffold with `npm run new-mini -- <game> <id>` (Three.js games), or by hand:

1. `src/minigames/<id>.ts`: `export default` a `MinigameDef` built from the game's modules.
2. `src/minigames/index.ts`: `export const minigames: AnyMinigame[] = [...]`.
3. `src/minigames/minigames.test.ts`: `for (const m of minigames) testMinigame(m);`
4. `src/minigames/play.ts`: `playOwnSlice()` calls `playMinigame(def, { canvas, ui })` for `#minigame=<id>` (or the first slice).
5. Split the entry once so `#minigame` runs without the game's side effects: `git mv src/main.ts src/app.ts`, remove the `loadMyGnome` lines from `app.ts`, and write `src/main.ts`:

   ```ts
   // Entry: the full game, or (#minigame) this game's Gnome Party slice played alone against 3 CPUs.
   import { loadMyGnome } from '@lawn/gnome';
   await loadMyGnome();
   if (/[#&]minigame\b/.test(location.hash)) (await import('./minigames/play')).playOwnSlice();
   else await import('./app');
   ```
6. `package.json`: `"@lawn/party": "*"` in dependencies, `vitest` in devDependencies, `"test": "vitest run"`.

Phaser games cannot hand over a Three.js view. Their slice reuses the game's pure simulation with a small Three.js view written in the slice.

## Party-only games

A game whose only purpose is to surface slices (a set of events that make no sense as a stand-alone game) sets `"lawn": { "partyOnly": true }` in its `package.json`. Make one with `npm run new -- <name> --party-only`.

It is a normal workspace (build, test, the `#minigame=<id>` dev page), but `npm run site` neither builds nor lists it, and `tools/thumbnails.cjs` skips it. Its slices reach players through Gnome Party, which finds `games/*/src/minigames/index.ts` like any other game's.

Its own page (`npm run dev -w games/<name>`) lists its slices and plays one against 3 CPUs.

Example: `games/gnomylpics`, the Gnome Olympics.

## Backlog

Every new game adds its row: a slice idea, or why not (yet).

| Slice | Game | Idea | Status |
|---|---|---|---|
| golf-hole | gnome-golf | One random par 3 of the island, all four play at once, fewest strokes | building |
| bowl-frame | gnome-bowling | One frame, four lanes side by side, most pins | building |
| golf-disc | gnome-golf | Gnome Disc: one throw each, closest to the basket | later |
| lawn-dodge | sample-3d | Dodge mowers crossing a yard, last gnome standing | later |
| chain-sprint | mower-chain | 40 s mower snake in a small pen, longest chain (Phaser sim + Three view) | later |
| raft-fish | gnaft | First to reel in three fish | later |
| front-flag | gnome-front | Hold the one flag longest in 45 s | later |
| lawn-race | faster-than-lawn | Mow the most of a shared lawn in 30 s (Phaser sim + Three view) | later |
| dodge-drops | sample-dodge | Dodge falling objects, last one standing (Phaser sim + Three view) | later |
| gnomomia-skirmish | gnomes-of-gnomomia | 45 s click-to-move arena: last gnome standing, or most burrow critters cleared | later |
| — | gnome-creator | Not a game (the gnome editor): no slice | no |
| oly-sprint | gnomylpics | Gnome Sprint: 100 m, alternate A and D, same key twice is a stumble | building |
| oly-triple-jump | gnomylpics | Triple Gnome Jump: run up, take off before the line, tap on each landing; best of 2 | building |
| oly-mower-toss | gnomylpics | Mower Toss: alternate to spin the mower, release near 45°; best of 2 | building |
| oly-lawn-dart | gnomylpics | Lawn Dart Javelin: run up, hold to aim, release before the foul line; best of 2 | building |
| oly-grass-mow | gnomylpics | Grass Mowing: steer a mower on a shared lawn, mow the most cells in 40 s | building |
| oly-gnome-hero | gnomylpics | Gnome Hero: a random beat-driven 4-lane jam, hit the notes on the beat, most points | building |
