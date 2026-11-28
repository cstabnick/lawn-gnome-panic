# E32 Hedgeworth Links to nine holes
Wave: 6 · Depends on: E15 · Kind: Content
Source items: L115 "add 5 more holes to the course. make it 9 hole." (with L85, the course itself, and L117 "I want the
world to feel hand crafted and that requires spending a lot of time on the details making iterative adjustments until
it all feels just right.")

## Goal
Hedgeworth Links becomes a real nine-hole course: five new hand-crafted holes, each with its own signature and its own
small stories, played in card order 1..9, with the card, HUD, app, save, achievements, a quest and the lore to match.
The four E15 holes get a polish pass.

## Scope
In:
- **Land.** The E01 site `golf-yard` grows south from z 830 to z 974 (x unchanged, -1360..-1000): the **Bottom
  Garden**, open meadow between the old yard and the harbour road (z ~1000). The old south fence stays, now inside, with
  an open garden gate, the **Turn Gate** (x -1140), next to hole 3's green and hole 9's tee. Terrain levels to -2.41
  over the whole site (was -2.3; everything reads heightAt, nothing moves in x/z).
- **Five holes** (indices 4..8, card numbers 4..8), all in the Bottom Garden, par 18, course par 34:
  4 *Peony's Promise* (par 4, 249 yd, the long-promised hole, opening ribbon still up), 5 *The Maze* (par 4, 295 yd, an S
  through the Tall One's hedge maze, hedges stop the ball), 6 *The Drip* (par 3, 140 yd, water carry over Hosepipe
  Pond's overflow with a giant birdbath in it), 7 *The Potting Shed* (par 3, 175 yd, teed off a shed's flat roof,
  2.6 m up), 8 *The Rhubarb Patch* (par 4, 320 yd, dogleg left over a vegetable patch to a small green ringed by giant
  plants). Data: `golf/types.ts` HOLES (written by the lead).
- **Round** in card order (`HOLE_ORDER` = indices [0,1,2,4,5,6,7,8,3]); save index stays stable, so an E15 save's
  bests for 1, 2, 3, 9 stay put; `bestNine` beside the old four-hole `bestRound`.
- Card (9 rows), HUD, Gnomlet app, `?golf=1..9`, ball collision with hedges and the shed, 3 achievements with wearable
  rewards, side quest `sq-hedgeworth-peonys-promise`, probe `golf-bottom-holes`, lore ruling + entries.
- **Polish of the E15 four:** hedge walls 2.8 m thick (a thinner `hedge-wall` prefab), the mole that pops from the
  molehills (a `mole` prefab now), the hole strip overlapping the weather chip on phone portrait, The Ninth's sign joke.
Out: online shared balls (still local), a second clubhouse, story quests m29/m47/m48/m52 (E20/E21 own them).

## Code pointers (confirmed)
- `src/data/levels/west-estates.level.json` slot `golf-yard`: now z 692, hd 282, anchors breach dz -52, approach dz -192.
- `src/golf/types.ts`: YARD, BOTTOM_GARDEN, OLD_FENCE, TURN_GATE, POTTING_SHED, HOLES (+ `teeY`), HOLE_ORDER,
  holeIndexOfNumber, nextHoleIndex, MAZE_HEDGES / MAZE_H, CART_PATHS (+2), GOLF_ACH (+3), GOLF_PROBES.bottomHoles,
  GOLF_QUESTS.promise, GolfSave.bestNine.
- `src/golf/round.ts` nextHole / cardView in HOLE_ORDER; `src/app.ts` `?golf=` by card number.
- `src/golf/bottomGarden.ts` (new, stub by the lead, wired in runtime.ts), four new prefab catalog files
  `packages/prefabs/src/catalog/gta-golf-nine-{garden,props,critters,gear}.ts` (registered by the lead).

## Contracts provided
- `golfApi().startRound(index)` takes a HOLES index 0..8; `holeIndexOfNumber(n)` maps a card number.
- Probe `golf-bottom-holes` (0..5). Quest id `sq-hedgeworth-peonys-promise`.
- Achievements `gta-hedgeworth-full-nine`, `gta-nine-under-par`, `gta-out-of-the-maze`.

## Online / mobile / achievements / prefabs / lore
Rounds stay local (E15). Every new action is a touch button or an E prompt (the shed ladder). New objects are prefabs.
Lore: next free ruling after R-217 is R-226 (E17/E26 run in parallel and may take numbers; renumber at merge with
`tools/renumber-rulings.py`).

## Risks and decisions
- Five holes do not fit the old yard without breaking E15's dressing: decided to grow the site south (open meadow,
  checked by screenshot) rather than cram the middle.
- The maze must stop the ball: GTA's `CourseEnv.collide` (unused so far) gets hedge walls; this also makes E15's
  hedges solid to the ball (more honest, no golden test pins a shot through a hedge).
- Elevated tee: the shed roof is a walkable rooftop (`addRooftop`), the course ground rises over the shed rectangle,
  and an E prompt at the ladder puts the gnome on the roof.

## Done when
Every hole playable and completable (scripted round test), screenshot pass of every tee under `E32/screens/` with notes,
build, game tests, golf/prefabs/achievements tests, Gnome Golf unchanged, lore, smoke and zfight on the course.
