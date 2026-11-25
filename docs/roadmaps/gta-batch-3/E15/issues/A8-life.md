Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): environmental storytelling, residents and sound (acceptance criteria)

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/golf/life.ts` makes Hedgeworth feel lived in: the hole signs, jokes on signs and posters,
at least three readable vignettes in each of the four areas (first tee and clubhouse, the course, the groundskeeper's
shed, the broken fence), Peony, Basil and Thrift each doing something specific to them at their spots, a few members
playing, a mole, sprinklers that tick round, and the place's sounds.

## Read first
- `games/gnome-theft-auto/src/golf/types.ts`: everything (places, `HOLES`, `PEOPLE_SPOTS`, `HEDGEWORTH_CAST`,
  `KICKED_BOARD`, `MEMBERS_GATE`, `SHED`, `CLUBHOUSE`, `TERRACE`, `MOLEHILLS`, `LOST_BALLS`, `inPlay`, `GOLF_SOUNDS`).
- `games/gnome-theft-auto/src/golf/life.ts`: the stub (keep `HedgeworthLife` and `buildHedgeworthLife`).
- `games/gnome-theft-auto/src/winter/hill.ts`: the model: vignettes from prefabs (`tilted`), text plates on prefabs
  (`plateOn`, `textPlate`), residents (`makeGnome`, `gnomeState`, arm poses in `update`), a `life` group.
- `games/gnome-theft-auto/src/coast/life.ts` (residents doing a place-specific thing, ambient sound with `playAt`
  rate-limited by distance to the player).
- `games/gnome-theft-auto/src/sound/bus.ts` `playAt(id, pos, opts)` (ids in `GOLF_SOUNDS` are registered by
  golf/sounds.ts; also existing ids like 'bird-song', 'sprinkler-tick', 'crowd-murmur').
- Prefabs you may use (guard new ones with `getPrefab`; they are being made right now): `tee-sign`, `yardage-post`,
  `golf-bag`, `ball-washer`, `bunker-rake`, `lost-ball-bucket`, `mole-hill`, `sprinkler-head`, `fence-plank-pile`,
  `golf-ball`, `golf-tee`, `golf-cart` (as a parked prop only if you must; the real carts are vehicles), `watering-can`,
  `garden-shed`? (no: the shed is clubhouse.ts's), `wheelbarrow`, `hose`/`hose-reel`, `deck-chair`, `picnic-basket`,
  `umbrella`, `thermos`, `newspaper` - search the catalog with `grep -rn "id: '<word>" packages/prefabs/src/catalog`
  and only use ids that exist.

## Change
`src/golf/life.ts`, `buildHedgeworthLife(scene)`:
- **Hole signs**: a `tee-sign` beside every tee (2.5 m left of the tee box, facing the player who stands behind the tee
  looking down the hole) with a text plate `${number} · ${name}` / `Par ${par} · ${yards} yd` (yards = path length / YD,
  rounded) and a one-line joke under it: 1 "The Mortgage: pay it off in four." 2 "Vesper's Patience: short, and gone
  before you know it." 3 "The Long Week: mind the pond. It minds you." 9 "The Ninth: the other five are on order."
  A `yardage-post` 100, 150 and 200 gnome yards from the green on holes 1 and 3 (red/white/yellow), off the fairway
  centre by 1 m so they do not block a ball line.
- **Signs and posters** (text plates on posts or walls; 5+ in all): by the Kicked Board inside: "PRIVATE COURSE. IF YOU
  CAN READ THIS YOU ARE ON THE WRONG SIDE OF IT."; on the shed fence: "QUIET PLEASE. THE GRASS IS GROWING."; at the pond:
  "HOSEPIPE POND. NO PADDLING. THE MOWER IS WORKING."; at the cart shelter path: "CARTS ON PATHS. GNOMES ON GRASS.
  MOLES: WE DO NOT HAVE MOLES."; a fixture poster on the clubhouse wall facing the terrace: "MEMBERS' CUP · FIRST OF THE
  MONTH · DRESS: TWEED".
- **Vignettes**, at least three per area, never `inPlay(x, z, 1)` (except where noted), each a small group of prefabs that
  tells a story without words:
  - First tee / clubhouse: a golf bag tipped over with clubs spilled and one club wrapped round a yardage post (somebody's
    temper); a picnic on the terrace's edge with a teacup knocked over and a scorecard torn in two; Basil's practice
    spot: a neat pyramid of balls with one ball set apart on a tee, a four-leaf clover pinned beside it.
  - The course: a `golf-ball` sitting on top of a `giant-hosta` leaf (or as high in a plant as you can place it); a
    `bunker-rake` left in a bunker with gnome footprints (small flat decals, `LAYER.decal`) leading out into the rough;
    a paddling-pool-sized "pond mower" (a small `push-mower`/`ride-on`-looking prefab if one exists, else a lost-ball
    bucket and a rake) parked at Hosepipe Pond's edge with a heap of wet balls beside it.
  - The groundskeeper's shed: a tidy row of watering cans by size; a deck chair facing the ninth green with a thermos and
    a book (Thrift talks to the grass); a `mole-hill` with a tiny cup and saucer next to it (a mole's tea) and a doormat-
    sized patch of turf rolled back to show a little tunnel mouth (a dark flat disc `LAYER.decal`).
  - The broken fence (outside, on the road side, x > -1001, and inside): a `lost-ball-bucket` labelled "BALLS FROM OVER
    THE FENCE · HELP YOURSELF · DON'T" outside; a dozen golf balls scattered on the verge toward the road (they keep
    coming over); a wooden prop-stick and a brick on the inside of the gap (what Thrift used to prop the board shut); a
    hand-painted arrow "THIS WAY TO THE KICKED BOARD" on a post by the road at (-956, 640).
- **Residents** (`makeGnome` with `HEDGEWORTH_CAST[key].look`, a held prefab if makeGnome supports one, else skip it),
  standing at `PEOPLE_SPOTS`: Peony on the terrace, turning slowly to survey the course every few seconds and lifting
  her driver-cane to point; Basil at his spot doing slow practice swings (arm rotation like winter's Gentian demo) and,
  every ~20 s, patting his sock; Thrift by his spot, crouching and patting the ground, then lifting the watering can
  (a short loop). They stay within 1.5 m of their spot (quests use those positions). Two members: a pair in tweed on
  the 2nd green putting (one crouched reading the line, one standing with a flag), only while the player is not in a
  round on that hole is not needed: keep them off the green, on the fringe edge. A mole (a small dark round body with a
  pink nose if there is a mole prefab; else skip) that pops up from a `MOLEHILLS` spot every ~30 s and ducks back.
- **Sprinklers**: four sprinkler sprays near the greens: a thin rotating arc of small water droplets (a `THREE.Points`
  of 30 points or a few thin cone meshes, `depthWrite: false`, transparent) that sweeps round for 12 s, then rests 18 s,
  with `playAt('sprinkler-hiss', ...)` when the player is within 40 m (rate limited). Keep the spray low (under 1.2 m)
  and short (radius 4 m): an earlier sprinkler in the game was a "tall water cone" bug.
- **Ambient sound** (in `update`, only when the player is within ~120 m of the course centre, rate-limited): an
  occasional distant `golf-tock` from somewhere on the course with a polite `crowd-murmur`-quiet clap is too much: just
  the tock, every 15-30 s; `bird-song` now and then.
- `update(dt, t, px, pz)`: animate the residents, the mole, the sprinklers; skip all work when the player is more
  than 250 m from `GOLF_ORIGIN` (performance).
- Return colliders only for solid vignette pieces taller than 0.5 m (via `buildPieces` they come for free; giant plants
  and grass are yard.ts's, not yours).
- New `src/golf/life.test.ts` (fake DOM): build; count vignette groups per area (>= 3 each, name your groups
  `vignette-tee-*`, `vignette-course-*`, `vignette-shed-*`, `vignette-fence-*`); the three residents exist near their
  spots; `update` runs for 10 s of frames without throwing.

## Contract
`buildHedgeworthLife(scene): HedgeworthLife` exactly. Residents within 1.5 m of `PEOPLE_SPOTS`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/golf/life.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.
- Report each vignette in one line (what story it tells and where).

## Out of scope
Every other file. Buildings and the clubhouse interior are clubhouse.ts's, the fence/hedges/plants yard.ts's.
