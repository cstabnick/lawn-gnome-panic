Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): dressing and environmental storytelling

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
`winter/pond.ts` builds Pail Pond as a place: Thermos Theo's red shanty and camp on the ice with Theo himself jigging a
line, two more shanties, stools round old holes, the giant pail's handle sticking out of the ice at the edge, signs with
jokes and at least three story vignettes. Pail Pond reads as "a Tall-One pail sunk to its rim and frozen over".

## Read first
- `games/gnome-theft-auto/src/winter/types.ts`: `PAIL_POND` (centre (-640, -1060), ice radius 62), `SHANTY`, `ICE`,
  `SNOWCAP_BEARS` (the three `pond-*` bears and their stool/tube/hole props are another worker's: keep 3 m clear around
  each of them).
- `games/gnome-theft-auto/src/winter/pond.ts`: the stub (`buildPailPond(scene): PailPondScenery`); keep the signatures.
- `games/gnome-theft-auto/src/homes/outerHomes.ts`: the pattern to copy (`buildPieces`, `textPlate`, `makeGnome`,
  a flat dark hole decal).
- `games/gnome-theft-auto/src/homes/pieces.ts`: `HomePiece`, `buildPieces`, `textPlate`.
- `games/gnome-theft-auto/src/homes/data.ts`: `homeOf('theo')` / `workOf('theo')` (Theo's home stays his camp elsewhere;
  do NOT register a home here).

## Change
`src/winter/pond.ts`, `buildPailPond(scene)`:
- The rim: Pail Pond is a sunk pail, so ring the ice edge with a low galvanized rim: 24-32 short curved segments (plain
  boxes are fine: it is architecture) on the circle of radius `PAIL_POND.r + 0.6`, 0.35 tall, 0.25 thick, grey 0x9aa3a8,
  not colliders (a gnome steps over it; set `solid: false` or build them outside `buildPieces`), each segment rotated to
  the tangent; segments must not overlap each other's faces (leave 2 cm gaps).
- `pail-handle` prefab at the north-east edge, its two feet on the rim (about at angle -40° from +x, i.e. (-640 + 63 cos,
  -1060 + 63 sin)), facing the pond centre, `size` ~ 9, `solid: false` (it arcs over the rim; a collider would block).
- Theo's shanty: `ice-shanty` at `SHANTY` (yaw `SHANTY.yaw`, door facing west toward the pond centre) with a plate on its
  door "THEO'S\nBACK IN FIVE\n(SINCE TUESDAY)"; beside it a `stool`, a thermos (use `espresso-cup` scaled if no thermos
  prefab exists, or a short `barrel`: small), an `ice-auger` leaning on the wall, a `sardine-tin`.
- Two more shanties (tint 0x2e6b8f blue, 0x6a8f2e green) further round, doors facing the centre, one with a plate
  "GONE FISHING\nBACK NEVER" and its door ajar (rotate a plate), one dark.
- Theo himself (`makeGnome` look: hat 0x8a5a2b with ear flaps if `getPrefab('ear-flap-hat')` exists, shirt 0x7a3b2e,
  beard 0xbababa) sitting on his stool 3 m in front of the shanty over an old hole (a dark disc decal of radius 0.45,
  `THREE.CircleGeometry`, `flatLayer(material, LAYER.marking)` from `@lawn/depth`, 0.02 above the ice), a `fishing-rod`
  prop by his hand; in `update` he jigs the rod (small up-down 1.5 Hz) and every 10 s lifts the thermos (a small
  rotation). Skip work when the player is more than 250 m away.
- Signs (on `signpost` pieces, facing the road/shore): "PAIL POND\nTHIN ICE: NONE\nTHICK ICE: ALL OF IT" at the south shore;
  "HOA NOTICE\nICE HOLES MUST BE ROUND.\nSQUARE HOLES WILL BE FINED." near the shanties; "DO NOT FEED THE BEARS\n(THEY HAVE
  SARDINES)" by the bears' side of the pond (outside their 3 m).
- Vignettes: (1) a ring of four `stool`s facing an old hole decal, an empty `sardine-tin` in the middle and one stool tipped
  over (built with `buildPrefab`, rotated ~80° on x) as if someone left in a hurry; (2) an abandoned hole with a
  `fishing-rod` frozen upright in it (rod built with `buildPrefab`, base 0.2 below the ice so it looks stuck) and a
  frosted thermos beside it; (3) a trail of bear paw prints (8-10 small flat dark ovals, flatLayer decals) leading from
  the shore to the door of the dark shanty and back out again; (4) a "measuring board" (a `crate` or a plate 1.5 long laid
  flat) with a chalked fish outline (a plate with "THIS BIG" text, laid flat via the flatPaper idea in outerHomes.ts).
- Return `{ boxes, update }` (colliders: shanties and other tall solid pieces only).
- New `src/winter/pond.test.ts`: `buildPailPond(new THREE.Scene())` returns colliders, none within 2 m of the pond centre
  or of `SHANTY`'s front (1.5 m west of it); none within 3 m of the `pond-*` bears; `update(0.1, 1, -630, -1050)` does not
  throw.

## Contract
`buildPailPond(scene): PailPondScenery` as in the stub. Holes the player drills are another worker's (winter/iceFishing.ts):
do not add a drilling system here.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/winter/pond.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/winter/pond*.ts`.

## Out of scope
Every other file.
