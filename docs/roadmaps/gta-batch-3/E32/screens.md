# E32 screenshot pass and acceptance evidence

Tee views taken with `node tools/gta-shots.mjs http://localhost:5332/ docs/roadmaps/gta-batch-3/E32/screens <spots> --wait 10`
(4 m behind each tee, facing the first corner or the pin). Hole 7's round view was taken with `?golf=7` (the round puts
the gnome on the shed roof: player y = ground + 2.6).

| Shot | Hole | Notes |
|---|---|---|
| [hole1.png](screens/hole1.png) | 1 The Mortgage, par 4 | unchanged layout; E15 hedges now drawn with the thin `hedge-wall` (about 1.2 m deep, was ~2.8 m) |
| [hole2.png](screens/hole2.png) | 2 Vesper's Patience, par 3 | unchanged |
| [hole3.png](screens/hole3.png) | 3 The Long Week, par 5 | unchanged; its green sits just north of the Turn Gate |
| [hole4.png](screens/hole4.png) | 4 Peony's Promise, par 4, 249 yd | through the Turn Gate, west along the Bottom Garden; the marquee, the ribbon on the green and the rows of chairs are down the hole |
| [hole5.png](screens/hole5.png) | 5 The Maze, par 4, 295 yd | the maze entrance arch and the first wall straight ahead; the way through is at the west end, then the east end |
| [hole6.png](screens/hole6.png) | 6 The Drip, par 3, 140 yd | the water carry, the giant birdbath with birds on its rim in the middle of the Drip |
| [hole7-round.png](screens/hole7-round.png) | 7 The Potting Shed, par 3, 175 yd | a round on hole 7: the gnome on the shed roof by the tee markers, the roof's watering can and cold frame, the HUD strip |
| [hole7-ladder.png](screens/hole7-ladder.png) | 7 | the shed from the east: ladder (E: "Climb the ladder to the 7th tee"), the sign, the wheelbarrow, the tee markers on the roof |
| [hole8.png](screens/hole8.png) | 8 The Rhubarb Patch, par 4, 320 yd | north up the east side; the rhubarb and sunflowers ringing the green show on the left |
| [hole9.png](screens/hole9.png) | 9 The Ninth, par 4 | the sign now says "it really is, now" |

Environmental storytelling (code: `golf/bottomGarden.ts`, `golf/life.ts`, `golf/yard.ts`):

- **Vignettes:** the opening nobody held (rows of folding chairs facing the uncut ribbon, one knocked over, programmes
  on the grass, Peony's scissors on a cushion, a tea trestle with cups under a cloche); a lost member's trail of tees
  looping back on itself to his dropped tam in the maze, with a scribbled map on a scorecard; the leaking hosepipe
  dripping into the Drip with a heap of wet balls and a net on the bank; slug trails to a half-eaten cabbage in the
  rhubarb patch; the Turn's halfway table with an honesty box.
- **Signs:** "HOLES 4 TO 8" / "THE TURN" on the Turn Gate, "HOLE 4. PROMISED: EVERY SEASON. DELIVERED: THIS ONE.",
  "THE MAZE. IF FOUND, PLEASE RETURN MEMBERS TO THE CLUBHOUSE.", "YOU ARE HERE. SO IS EVERYONE ELSE.", "THE DRIP. FED
  BY HOSEPIPE POND, WHEN THRIFT REMEMBERS.", "HOLE 7 TEE: UP THE LADDER. ONE GNOME AT A TIME. THE ROOF IS LISTENING.",
  "THE RHUBARB PATCH. THE PLANTS WERE HERE FIRST.", "THE TURN. TEA: HONESTY BOX. HONESTY: ALSO HONESTY BOX.", and a
  joke on every tee sign.
- **Residents:** a member lost in the maze's dead end turning slowly; a member crouched on the Drip's bank fishing out
  a ball; the mole finally pops out of the molehills by the ninth green (every 25-35 s, within 60 m).
- **Life and sound:** birds hopping on the birdbath rim, a sprinkler on hole 8, the hosepipe drip, bunting; the E15
  ambient set (distant tock, sprinklers, hedge rustle) covers the Bottom Garden.

Played-through round: `src/golf/nine.test.ts` plays a full nine through the round API in card order with a bot (seeds
1-3, seeded wind up to 8 mph): every hole holed within par + 3 (bot totals 24, 25, 24 against par 34: the bot never
mishits, so it shows completability, not difficulty); hole 7 starts on the roof; a low shot at the maze's first wall
bounces off it.

Not checked by hand: a person playing a full round on a phone; the maze's difficulty for a human (a lofted club clears
the first wall from the tee, which is intended: "a high wedge can go over").
