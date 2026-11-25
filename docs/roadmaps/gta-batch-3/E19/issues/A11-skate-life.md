Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: general-purpose (Sonnet)

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You own the new files
`games/gnome-theft-auto/src/skate/life.ts` and `skate/life.test.ts`. Another worker builds the park's surfaces, rails,
ledge, deck and the Board Library rack (`skate/build.ts`): do not place those.

## Goal
The Gutter Bowls feel lived in (environmental storytelling is acceptance criteria): Fennel, Moss and Pebble doing what
they do, Asphalt the cat visiting Fennel's hammock, an NPC skater riding the Long Gutter, at least three readable
story vignettes, signs and posters with jokes, and the park's ambient sound.

## Read first
- `games/gnome-theft-auto/src/skate/types.ts` (`SKATE_ORIGIN`, `SKATE_SITE`, `SKATE_PIECES` (where the Long Gutter,
  the bowl, the ledge, the platform and stairs and Fennel's deck are), `SKATE_PEOPLE`, `BOARD_LIBRARY`) and
  `skate/park.ts` (`parkHeight(x, z)`: stand people and props on the surface: y = heightAt + parkHeight).
- `games/gnome-theft-auto/src/sports/types.ts` (`SPORTS_CAST` looks: fennel, moss, pebble).
- `docs/lore/entries/apocrypha/the-gutter-bowls.md`, `fennel-gripwax.md`, `moss-squeegee.md`, `pebble-nollie.md`,
  `asphalt-the-cat.md`, `the-board-library.md`, `kilnside-rec.md` (the Hat Watch pretends not to see skaters).
- `games/gnome-theft-auto/src/golf/life.ts` (all): the model for a place's life (people, idle loops, vignettes with
  `buildPieces`/`prefabBox`/`textPlate` from `../homes/pieces`, `playAt`, culling).
- `packages/prefabs/src/catalog/gta-gutter-bowls.ts` (`fennel-hammock`, `squeegee-bucket`, `gutter-leaf-pile`,
  `gta-skateboard`) and search the catalog for a cat (`grep -rn "cat" packages/prefabs/src/catalog/critters.ts`, or
  whatever GTA uses for Asphalt), a Gnomlet/phone, a bandage, an HOA sign.

## Change
`src/skate/life.ts`:
```ts
export interface SkateLife {
  boxes: Box[];
  /** t = seconds since start; px, pz = the player; playerRiding: the player is on a board in the park (the NPC skater
   *  then keeps to the far end of the Long Gutter). */
  update(dt: number, t: number, px: number, pz: number, playerRiding: boolean): void;
}
export function buildSkateLife(scene: THREE.Scene): SkateLife;
```
- Fennel at his spot by the deck, leaning on his board, now and then crouching to the cat bowl; the `fennel-hammock`
  slung under `gutter-deck-platform` (centre of the deck footprint, on the ground); Asphalt the cat (if a cat prefab or
  GTA cat model exists) curled in the hammock by day, wandering to the bowl and back slowly.
- Moss on the bowl floor with `squeegee-bucket`, pushing a squeegee back and forth (an arm/held prop swing); after
  rain (if `getWeather` from `../weather` says rain or it rained recently; else always) little puddle decals in the bowl
  that Moss is chasing out (`LAYER.decal`, lifted 0.01 off the bowl floor).
- Pebble at her spot, holding a phone-like prop up toward the player when the player rides nearby (turn to face them).
- An NPC skater (a plain town look on a `gta-skateboard` prefab) riding the Long Gutter's trough back and forth across
  it (v sweeping between the two walls on the transition profile, y from `parkHeight`, popping a little air above the
  coping at each wall), moving slowly along u; `playAt('skate-roll')` and an occasional 'skate-grind' when the player is
  within 40 m.
- At least three vignettes: (1) a `gutter-leaf-pile` with the lost hubcap at the bottom of the Long Gutter's east end
  ("the best gutter in the yard" needs clearing; it sits where nobody skates); (2) an HOA "NO SKATING" sign at the north
  entrance with a skateboard leaning on it and a Hat Watch hat hung on the post, as if the officer went skating; (3) a
  skateboard snapped in two by the foot of the stairs with a tiny sticking plaster across the break; (4) Fennel's cat
  bowl, a bag of biscuits and a saucer of milk by the hammock. Existing prefabs only; skip missing ones (getPrefab
  guard) and list them in your report.
- Signs and posters (readable plates): over the north entrance "THE GUTTER BOWLS - est. the day it rained"; a chalk
  board by the Board Library "LINES NOBODY HAS SKATED: First Push. Round the Kidney. The Long Gutter. Asphalt's Way
  Down." (Fennel's list); a notice "If it rains the bowls fill. Fennel skates the water. Do not be Fennel. - Moss".
- Colliders for people and solid props (round boxes), never on a ridable line (keep off the trough, the bowl floor
  centre, the kicker run-up, the rail and ledge lines; Moss stands at his spot, which is on the bowl floor edge: give
  him no collider).
- Cull beyond ~200 m.

`src/skate/life.test.ts`: building gives colliders inside the site; none of them overlaps the Long Gutter's trough
(|v - 12| < 4 for u in -16..12 in the park frame) or the kicker-to-rail line (v -1.5..1.5, u -2..12); a long update
loop near and far does not throw.

## Contract
`buildSkateLife(scene): SkateLife`, exactly.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/skate/life.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
skate/build.ts, skate/park.ts, skate/types.ts, skate/runtime.ts, prefabs (add none), every other file.
