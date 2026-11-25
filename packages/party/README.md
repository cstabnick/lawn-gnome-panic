# @lawn/party: party slices

Gnome Party (`games/gnome-party`) is a board party for 4 gnomes. Its minigames are **party slices**: a party-sized piece of an existing game (one hole of golf, one bowling frame) that the game itself surfaces through this interface. Gnome Party never edits a game; it finds every `games/*/src/minigames/index.ts` on its own.

A slice is built from the game's **own** modules, so when the game changes, its slice changes with it. The same slice plays inside the game alone (`#minigame`) and in the party.

| File | What |
|---|---|
| `src/types.ts` | The contract: `MinigameDef` (pure `init` / `step` / `cpu` / `result` + `createView`), `PadState`, `ViewCtx`, `SeatInfo` |
| `src/report.ts` | `MinigameReport`: the self-describing result of a slice (see below), `buildReport`, `formatStat` |
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

## The result report

`result()` decides the places. The optional `report(s, places)` says what happened, in a form any screen can
show without knowing the slice (the party's results card, the `#minigame` page):

```ts
report(s, places, seats) {
  const w = soleWinner(places);                               // null on a tie for 1st
  return {
    headline: w === null ? undefined : `${seats[w].name} holed out in ${s.balls[w].strokes}!`, // how they won; default '<winner> wins!'
    stats: [                                                  // columns, main score first, at most 3 shown
      { key: 'strokes', label: 'Strokes', better: 'lower' },
      { key: 'left', label: 'To pin', unit: 'yd', format: '1dp', better: 'lower' },
    ],
    values: s.balls.map((b) => ({ strokes: b.holed ? b.strokes : null, left: b.holed ? null : b.dist })),
    notes: s.balls.map((b) => (b.strokes === 1 ? 'Hole in one!' : null)),
  };
}
```

The runner wraps it into a `MinigameReport` (`kind: 'lawn.minigame-report/v1'`): the minigame's id, title and
goal, the `winners`, `win` (who won and how: the first ranked stat that separates the winner from the runner-up,
the runner-up's value, the margin, and a sentence such as 'Time 11.1s, 2.4s ahead of Gnorbert (13.5s).'), rows sorted by place with each seat's name and colour, `timeUp`, and hypermedia `links`
(`game`: the full game, `practice`: this slice alone vs 3 CPUs) a screen can offer. It reaches `onDone(places,
report)`, and Gnome Party sends it to every screen in its `results` phase. A slice without `report()` still gets
a report with places, winners and links, and a `report()` that throws is logged and treated the same way.
The testkit checks every report: 4 rows, each value key has a stat, plain JSON, under 2 KB.

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
| last-ladder | dayg (planned) | Last Ladder: four gnomes on a headstone top as a herd piles up; first down the ropes wins. Not yet: DayG is a long, slow world game and has no code yet | later |
| lawn-race | faster-than-lawn | Mow the most of a shared lawn in 30 s (Phaser sim + Three view) | later |
| dodge-drops | sample-dodge | Dodge falling objects, last one standing (Phaser sim + Three view) | later |
| gnomomia-skirmish | gnomes-of-gnomomia | 45 s click-to-move arena: last gnome standing, or most burrow critters cleared | later |
| — | gnome-creator | Not a game (the gnome editor): no slice | no |
| aether-trick-jam | aether-board | later: the controls are many verbs (carve, pop, flick tricks, grabs, boost); a party round would need a one-verb cut (e.g. 40 s on one island, auto-ride, flick tricks only). The sim is pure, so it is a small issue once the game settles | later |
| bj-sprint | gnome-blackjack | 3 simultaneous hands vs one dealer, most chips wins | done |
| prix-race | lawn-prix | 3-lap mower race on a random course (4), all four at once, auto-throttle, items fire on their own: steer and hop-drift | building |
| oly-sprint | gnomylpics | Gnome Sprint: 100 m, alternate A and D, same key twice is a stumble | building |
| oly-triple-jump | gnomylpics | Triple Gnome Jump: run up, take off before the line, tap on each landing; best of 2 | building |
| oly-mower-toss | gnomylpics | Mower Toss: alternate to spin the mower, release near 45°; best of 2 | building |
| oly-lawn-dart | gnomylpics | Lawn Dart Javelin: run up, hold to aim, release before the foul line; best of 2 | building |
| oly-grass-mow | gnomylpics | Grass Mowing: steer a mower on a shared lawn, mow the most cells in 40 s | building |
| gsg-swap-race | gnome-sweet-gnome | 45 s match-3 score race: four small boards side by side, same seed, most points (CPU = the game's own smart bot; Phaser game, needs a small Three view) | later |
| oly-gnome-hero | gnomylpics | Gnome Hero: a random beat-driven 4-lane jam, hit the notes on the beat, most points | building |
| — | gnomeokemon | Model viewer / field guide only; add a battle or capture slice once gameplay exists | later |
| — | club-gnome | A hub world, not a game: it opens the other games (and their slices live there) | no |
| — | gnomillion | later: a 20 s everyone-types-an-answer round needs a text input kind in PadState |
| — | gnome-billiards | 8-ball is two players at one table; a four-at-once round has no shape yet (a 20 s cut-the-ball race could be one later) | later |
| — | snigms | A slow solo life sim (needs decay over minutes and sim days); a 45 s "furnish a room, best vibes wins" round could work later, once the build tools settle | later |
| — | giant-pup | Pet care is a slow, solo loop; a 4-gnome fetch race (swipe to throw, first dog back wins) could work once there is more than one dog | later |
| lawn-clip | incregnomtal | 30 s shared 8×8 lawn: tap to trim growing tiles and pull dandelions, most Clippings wins (reuses sim tile growth & trim) | later |
| — | tribute-schedule | later: solo 3am first-person domestic horror; could become a "nod & chirp on cue" reaction slice once mechanics settle | later |
| gta-getaway | gnome-theft-auto | 45 s getaway from The Gnomecino through 5 Turfton checkpoints to Pay 'n' Glaze while dodging Hat Watch cruisers | building |
| boat-regatta | gnome-theft-auto | 45 s regatta on Loch Moss: four gnomes in Walnut Dinghies round three buoys and Tessie's island, first back to the dock wins (one verb: steer; reuses boats.ts stepBoat and waterAt) | later |
| cake-stir | cooking-gnoma | later: a cake is five steps over about 90 s with different verbs (scoop, stir, pour, bake, frost). A party round needs one verb, e.g. 30 s of stirring to the beat with most even circles, once the steps settle | later |
| jam-shootout | gba-gjam | later: 2v2 full-court basketball has multiple verbs (move, shoot/dunk, pass/steal, turbo); a 40 s 4-gnome 3-point or dunk shootout slice (one verb: jump & release) fits once the core court sim settles | later |
| no-answer | wordle-gnome | later: a 20 s everyone-types-five-letters round needs a text input kind in PadState, and the answer is always gnome | later |
| gsr-rail-jam | gnome-set-radio | later: 45 s shared rooftop rail-grind & tag score jam once the core rollerblade physics settle | later |
| hoard-rush | nothing-left-to-collect | Hoard Rush: 30 s, four gnomes on one office floor while the ceiling rains office supplies and the multiplier doubles every 10 s; most collected wins (reuses collect.ts, walk.ts, office.ts) | building |
| gnomelock-orb-rush | gnomelock | later: 40 s 4-gnome Soul Acorn last-hit & deny race; full 2v2 MOBA has too many verbs for a party slice | later |
| hose-dodge | gnome-souls | later: 40 s 4-gnome dodge survival in the Sunken Spigot Basin against Slink's sweeps; full Souls combat has too many verbs for a party slice | later |
| — | dead-grid | Not a party slice: open-ended WASM society simulation sandbox with thousands of agents | no |
