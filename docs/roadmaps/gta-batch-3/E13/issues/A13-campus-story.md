Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): environmental storytelling

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`src/campus/story.ts` makes Rootwell University tell small stories without words, and makes people smile at its signs:
at least five readable vignettes (props arranged to tell a story) and a dozen signs and posters with jokes that fit
Rootwell's lore, including the sugar store behind the Trencher where a line of ants leads off toward the Anthill.

## Background (confirmed)
- Places (`src/campus/types.ts`): `CAMPUS_BUILDINGS` (centres, yaw, w x d, `door` spots; footprint is w along x and d
  along z for yaw 0/PI, swapped for +-PI/2), `CAMPUS.quad`, `quadCentre` (the founder's statue is there; another
  worker), `drive` (z -200, x 946..1080), `parking`, `sugarStore` (1265, -224: between the Trencher's back wall x 1257
  and the Cloche's west wall x 1276), `pitch` (1040, -95). The grounds worker lays paths from the quad ring to every
  door and puts benches, lamps, trees and a `park-noticeboard` by the quad's west entrance (about (1083, -202)): you put
  posters near it on your own `notice-board` or `chalk-equation-board` pieces 3-4 m away, not on theirs.
- Where you may build: the strips 3..12 m in front of buildings **beside** (not on) the door paths, building sides and
  backs, the lawn outside the quad, the sugar store, the Clod's surroundings. Never within 2.5 m of a door spot, on the
  drive, or on the quad's paths (a 3 m gravel ring just inside the quad edge, two diagonals to the centre).
- Lore to use (`docs/lore/entries/apocrypha/rootwell-university.md`, `lovage-inkwell.md`, `betony-sextant.md`,
  `the-anthill.md`): Rootwell teaches soil, stars and the physics of gnomes; "Rootwell men do not dig. They study
  digging."; "Four years and a hat. Some of them leave with the hat."; the university pays rent to the ants in sugar and
  is always late; the ants shut their doors when the rent is late; Dean Lovage Inkwell signed the survey over to the HOA
  (Vesper Thorne) for a grant; Professor Betony Sextant surveyed the stars for a perfectly level line; the ants are never
  termites. Nothing gets hurt.
- Prefabs (check ids exist; a missing id is skipped with a warning): existing `rootwell-mortarboard` (a head reward; you
  may `buildPrefab` it as scenery), `lectern`, `book-pile`? (new), `crate`, `cargo-crate`, `sack`, `ladder`, `picnic-table`,
  `bench`, `notice-board`, `park-noticeboard`, `signpost`, `litter-bin`, `filing-cabinet`, `office-desk`, `bike-rack`,
  `hedge-shears`, `compost-bin`; new E13 ones being added now: `sugar-sack`, `sugar-cube-crate`, `rootwell-ant`,
  `chalk-equation-board`, `book-pile`, `essay-page`, `paper-plane`, `ornithopter-frame`, `college-banner`, `lab-bench`.
  Folding chairs: if no chair prefab fits, use `bench` or a `bar-stool`.
- Helpers: `src/homes/pieces.ts` `buildPieces` (colliders: push into `boxes`; small things `solid: false`), `textPlate`
  (signs; mount >= 0.03 m in front of what it hangs on); `buildPrefab(id)` from `@lawn/prefabs` for a tilted/odd-angled
  piece (set rotation yourself, add to your group); flat decals with `flatLayer(mat, LAYER.decal)`.

## Read first
- `games/gnome-theft-auto/src/campus/types.ts`; `src/campus/story.ts` (stub; keep the signature).
- `games/gnome-theft-auto/src/homes/pieces.ts`.
- `games/gnome-theft-auto/src/winter/hill.ts` (a finished storytelling builder: vignettes, signs, tilted props).
- `docs/lore/entries/apocrypha/rootwell-university.md`.

## Change
`src/campus/story.ts`, `buildCampusStory(scene, boxes)`, at least these vignettes (adjust positions to the free strips):
1. **Degree day, the morning after** (on the lawn west of Tilth Hall, outside the quad): two rows of chairs, half knocked
   over, a `lectern` facing them, five or six `rootwell-mortarboard`s scattered on the grass at angles (one stuck high in
   a nearby tree is a bonus: lift it with `y`), a rolled scroll (a small `cyl` architecture prop is fine or `essay-page`).
2. **The sugar store** at `sugarStore`: three `sugar-sack`s and two `sugar-cube-crate`s on a pallet (a flat wooden box),
   one sack split with cubes spilled, and a line of 10-14 `rootwell-ant`s (each carrying its cube) walking away from
   the spill south toward the Anthill (along +z, slightly wavy, 0.5-0.8 m apart, solid false), a clipboard sign on the
   wall "SUGAR STORE / RENT (OVERDUE)". Keep a 3 m clear circle round (1265, -224) for the quest marker.
3. **Physics homework** at the foot of Plumbob Hall (beside its door path): a chalk circle target on the ground
   (a white `RingGeometry` decal, LAYER.marking) with a dented `crate` in the middle, a tape measure (a thin yellow strip
   decal), and a scatter of `paper-plane`s, one in the target's bullseye.
4. **Bodger's Shed's ornithopter**: the `ornithopter-frame` outside the shed's roller door with its plans blowing away
   (4-6 `essay-page`s at angles drifting across the grass downwind, one caught on a fence or bench).
5. **Bedstraw House**: a sofa dragged onto the lawn (a `bench` or sofa prefab if one exists), a `book-pile`, a mug and a
   laundry line between two posts (thin architecture boxes, a thin line, 4-5 small coloured cloth boxes hanging).
6. **The Dean's grant**: by the Dean's lodge door path, a garden table with a big cardboard cheque (a `textPlate`
   "PAY ROOTWELL UNIVERSITY\nONE GRANT\n— V. THORNE, HOA") propped on it and a ribbon-cut ribbon on the ground.
Signs and posters (textPlates; each on a `signpost`, a `notice-board`, a wall face (0.06 proud), or a
`chalk-equation-board`): at least 12, e.g. "KEEP OFF THE GRASS\n(THE GRASS IS STUDYING)"; "PLUMBOB HALL\nALL THINGS
FALL.\nWE TAKE NOTES."; "THE TRENCHER\nSUGAR IS NOT FOR STUDENTS"; "LIBRARY FINES\nPAYABLE IN SUGAR"; "BEDSTRAW HOUSE\nLIGHTS
OUT WHEN THE ANTS SAY SO"; "LOST: ONE ESSAY\nON LEVEL LINES\nREWARD: A PASS"; "SOCIETIES FAIR\nTHE FLAT EARTH SOCIETY\nHAS
BEEN EVENED OUT"; "THE COLD FRAME CLUB\nMEMBERS AND WARM\nGUESTS ONLY"; "DIG SAFELY\n(STUDY DIGGING INSTEAD)"; "THE
CLOCHE\nPLEASE DO NOT TAP\nON THE TOMATOES"; "HEAP BARN\nSTEAM IS NORMAL\nSMELL IS RESEARCH"; "THANK YOU\nMRS THORNE\nFOR
OUR GRANT" (a banner over the Dean's lodge path); "OPEN DAY\nTOURS OF THE ANTHILL\nCANCELLED (RENT)"; "NOT TERMITES" (a
small hand-painted board by the ant line). Write your own in the same voice if a spot suits something better.
- Put plates and loose props in one `THREE.Group` named 'rootwell-story'; colliders only for things a gnome should bump
  into (tables, sofas, the ornithopter, the cheque table, crates), none in front of doors.
- New `src/campus/story.test.ts` (vitest, `installFakeDom`): after `buildCampusStory(new THREE.Scene(), boxes)`:
  every collider inside `CAMPUS.site`; none within 2.5 m of any building `door`; none overlaps a building footprint or
  the quad; the circle of 3 m round `CAMPUS.sugarStore` holds no collider; the group has at least 12 plates
  (`mesh.name === 'home-plate'`).

## Contract
`buildCampusStory(scene, boxes): void` (stub signature).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/campus/story.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/campus/story*.ts`.

## Out of scope
Every other file (buildings, grounds, interiors and the rest of `src/campus/` are other workers').
