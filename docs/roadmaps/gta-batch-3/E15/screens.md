# E15 screenshot pass and storytelling AC

Taken with `node tools/gta-shots.mjs http://localhost:5315/ docs/roadmaps/gta-batch-3/E15/screens <spots> --wait 10`.

| Spot | Where | What it shows |
|---|---|---|
| [fence.png](screens/fence.png) | (-985, 646) facing west, on the road side | the neighbour's board fence, the Kicked Board, the "BALLS FROM OVER THE FENCE" bucket and verge balls |
| [firsttee.png](screens/firsttee.png) | (-1066, 474) facing west | the first tee, clubhouse terrace, tall grass, Basil on the tee, hedges down the course |
| [course.png](screens/course.png) | (-1180, 560) facing north | the middle of the course, a hedge wall with its arch |
| [shed.png](screens/shed.png) | (-1068, 618) facing east | Thrift's shed and Thrift, the ninth green, the sign "QUIET PLEASE. THE GRASS IS GROWING." |
| [round-tee.png](screens/round-tee.png) | `?golf=1` | a round: hole strip, "Address the ball", Card / Quit, the hole sign |

Acceptance criteria (a)-(e), per area (code: `golf/life.ts`, `golf/clubhouse.ts`, `golf/yard.ts`):

- **First tee / clubhouse**: vignettes `vignette-tee-temper` (a bag tipped over, a club wrapped round a yardage post),
  `vignette-tee-picnic` (knocked-over teacup, scorecard torn in two), `vignette-tee-basil` (Basil's ball pyramid, one ball
  apart, a four-leaf clover); inside, Vesper's final reminder on Peony's desk and the honours board "A MOLE (DISPUTED)".
  Signs: hole signs with jokes, "MEMBERS' CUP · DRESS: TWEED", "PRO SHOP · LESSONS · EXCUSES". Residents: Peony
  surveying from the terrace, Basil's practice swings (patting his sock), Old Ferrule at the bar.
- **The course**: a ball stuck on a giant hosta, a rake left in a bunker with footprints into the rough, the pond mower
  with a heap of wet balls at Hosepipe Pond. Signs: "HOSEPIPE POND. NO PADDLING. THE MOWER IS WORKING.", "CARTS ON PATHS.
  GNOMES ON GRASS. MOLES: WE DO NOT HAVE MOLES." Two members on the 2nd fringe; sprinklers tick round.
- **The groundskeeper's shed**: watering cans by size, a deck chair facing the ninth green with a thermos and a book,
  a mole-hill with a tiny cup and a rolled-back turf over a tunnel mouth. Thrift crouching, patting the ground, watering.
- **The broken fence**: the ball bucket outside, balls on the verge, the prop-stick and brick Thrift used, an arrow
  "THIS WAY TO THE KICKED BOARD" by the road, "PRIVATE COURSE. IF YOU CAN READ THIS YOU ARE ON THE WRONG SIDE OF IT."
- **Sound**: distant `golf-tock`, birdsong, `sprinkler-hiss`, `board-crack`, `hedge-rustle` through giant plants.

Not checked by hand: the mole (no mole prefab yet, skipped), a full round played by a person on a phone.
