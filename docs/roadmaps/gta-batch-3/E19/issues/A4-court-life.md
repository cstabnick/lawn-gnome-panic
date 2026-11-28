Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/court/life.ts` and `court/life.test.ts`. Another worker builds the court surface, hoops,
scoreboard, cage, bench, signs and railings (`court/build.ts`) at the same time: do not place those.

## Goal
Drainpipe Court feels lived in (environmental storytelling is acceptance criteria): the four regulars doing what they
do, at least three readable story vignettes (props telling a small story without text), signs and posters with jokes
that fit the place, and the court's ambient sound.

## Read first
- `games/gnome-theft-auto/src/court/types.ts` (`COURT`, `COURT_SITE`, `COURT_PEOPLE` spots, `SCOREBOARD`,
  `BALL_CAGE`, `OLD_BENCH`) and `src/sports/types.ts` (`SPORTS_CAST` looks: cardoon, lintel, pansy, benchley).
- `docs/lore/entries/apocrypha/drainpipe-court.md`, `cardoon-trowelly.md`, `lintel-crossover.md`, `pansy-rebound.md`,
  `burdock-benchley.md`, `lather-and-lint.md`, `pip-potsworth.md` (Pip lost his toolbox to Swish on a bet).
- `games/gnome-theft-auto/src/golf/life.ts` (all): the model for a place's life (people with `makeGnome` and
  `gnomeState`, idle animation loops, `buildPieces`/`prefabBox`/`textPlate` from `../homes/pieces` for vignettes and
  readable signs, `playAt` for ambient sound, `getPrefab` guards, culling by distance).
- `packages/prefabs/src/catalog/gta-drainpipe-court.ts` (`lost-ball-drain` and the rest) and search the catalog
  (`grep -rn "id: '" packages/prefabs/src/catalog/*.ts | grep -i <word>`) for props like a toolbox, a duster, a
  trainer/shoe, a stick, a puncture kit, a crate, a thermos.

## Change
`src/court/life.ts`:
```ts
export interface CourtLife {
  boxes: Box[];
  /** t = seconds since start; px, pz = the player. gameOn: a pickup game is being played (court/render draws the
   *  players then): hide Cardoon, Lintel and Pansy and stop the free-throw loop; Old Burdock stays on his bench. */
  update(dt: number, t: number, px: number, pz: number, gameOn: boolean): void;
  /** Make Old Burdock react (arms up and a line) when the player scores in a game. */
  cheer(): void;
}
export function buildCourtLife(scene: THREE.Scene): CourtLife;
```
- People at their `COURT_PEOPLE` spots with `SPORTS_CAST` looks: Cardoon shooting free throws at the east hoop on a
  loop (a `gba-basketball` arcs from his hands to the rim at (COURT.hoops[1].x, groundY + COURT.hoopY), drops through,
  rolls back; every third one clangs off; play 'jam-swish'/'jam-clang'/'jam-bounce' with `playAt` when the player is
  within 40 m); Lintel doing crossover fakes on the spot (a side-to-side shimmy and a ball bouncing hand to hand);
  Pansy stretching on the north side; Old Burdock sitting on the old bench (sitting pose), now and then raising a hand
  at a shot. Facing as in the spots.
- At least three vignettes, each a small cluster of props that tells a story without text, placed off the painted
  court (inside `COURT_SITE` or the margin just outside): (1) Pip's red toolbox on the end of Old Burdock's bench with
  a duster laid neatly on its lid ("He's kept it dusted"); (2) the `lost-ball-drain` at the south-west kerb with a
  second ball and a long stick beside it, someone's failed attempt to fish the first out; (3) a pair of tiny trainers
  tied together and hung over the north lamp's arm; (4) by the ball cage a deflated ball, a puncture-repair tin and a
  bicycle pump. Use existing prefabs; anything missing: skip it (getPrefab guard) and list it in your report.
- Signs and posters (readable text via `textPlate` or the helper golf/life.ts uses), with jokes in the place's voice:
  a rules board text by the court ("1. Winner keeps the court. 2. Loser fetches the ball from the drainpipe. 3. Swish
  calls his own fouls. 4. The drainpipe is not a warranty."), a laundrette notice ("Lather & Lint. Kit washed while
  you lose. Socks returned in pairs, eventually."), a poster on the railing ("PICKUP 2v2 - FIRST TO 11 - BRING A
  SPARE"), a hand-chalked "I.O.U. ONE TOOLBOX - P." on the scoreboard's side (a small plate). Keep text short.
- Ambient: the free-throw loop's sounds, a distant bounce every few seconds when the player is near and no game is on.
- Colliders for the people (round boxes) and any solid vignette props; nothing on the painted court.
- Cull: beyond ~200 m from the court do nothing.

`src/court/life.test.ts`: building returns colliders outside the painted court rectangle (COURT.x +- halfX, COURT.z
+- halfZ) and inside the site plus 3 m; `update` with gameOn true hides the three players and keeps Burdock; a long
`update` loop with the player far away does not throw.

## Contract
`buildCourtLife(scene): CourtLife`, exactly.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/court/life.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
court/build.ts, court/runtime.ts, prefabs (do not add any), every other file.
