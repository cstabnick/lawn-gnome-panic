Epic: E17 wave 2 (building the places)
Depends on: wave 1 prefabs (they exist now: check with `getPrefab`)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (helpers, rules, who the Underspanners are).

## Goal
The Underspan stands beside the Skyway's Unfinished Span: a scrap-built inventors' commune with scaffold towers, a
walkable scaffold deck (the Roost), hammocks, contraptions, the workshop shed, a manifesto wall, three story vignettes
and joke signage. Static scenery with colliders, built once.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`UNDERSPAN`: site, shed, workshopDoor, hogweed, roost, roostY,
  roostArrive, chuteTop, chuteBottom, scrapHeap, manifestoWall)
- `games/gnome-theft-auto/src/societies/underspan/build.ts` (yours: the stub `buildUnderspan(scene, boxes)`)
- `games/gnome-theft-auto/src/campus/story.ts` (lines 1-120: a vignette builder with `textPlate`, `loose`, colliders)
- `games/gnome-theft-auto/src/interiors/rooftops.ts` lines 1-40 (`Rooftop`, `addRooftop`)
- `packages/prefabs/src/catalog/gta-underspan.ts` (the ids and sizes you place)

## Change
- `games/gnome-theft-auto/src/societies/underspan/build.ts`: implement `buildUnderspan(scene, boxes)`. Ground is flat at
  y 0 everywhere in the site. EVERYTHING (meshes and colliders) stays inside `UNDERSPAN.site` (x 560..600, z -51..-1):
  the Unfinished Span's deck begins at x 605.5 and nothing may stand under it. Use `buildStaticCells` for the static
  prefabs (one batch named 'underspan') and `scene.add` it; text plates go in a group 'underspan-signs'.
  - The shed: `scrap-shed` centred on `UNDERSPAN.shed` (centre x 592, z -14) with yaw `-Math.PI / 2` (door faces west
    to `workshopDoor`). Colliders: four wall boxes along the shed footprint edges (0.4 m thick, h 5), leaving NO opening
    (the door is an E05 interior door, the player does not walk in).
  - The Roost: four `scaffold-tower` prefabs at the corners of `UNDERSPAN.roost` (x 564..584, z -46..-32, towers 3 x 3 m
    just inside the corners) plus two more mid-way along the long sides; a deck of planks across the whole roost rect at
    y `UNDERSPAN.roostY` (6): one thin box mesh (0.15 m thick, top surface exactly at y 6, plank-brown, `MeshLambertMaterial`)
    and NO collider for the deck itself (it is a rooftop). Colliders only for the tower legs (each tower one box, h 5.8,
    so the player can walk under the deck between towers). Then register it:
    `addRooftop({ id: UNDERSPAN.roost.id, name: 'The Roost', minX, maxX, minZ, maxZ, y: UNDERSPAN.roostY, solid: false, parapet: ['n', 'w', 's'] })`
    (import from '../../interiors'; the east side stays open for the Chute at `chuteTop`). Guard so a second call does not
    throw (check `rooftopById(UNDERSPAN.roost.id)` first). A slide from the deck at `chuteTop` down to `chuteBottom`:
    a tilted half-pipe of three thin box segments (silver-grey), no collider.
  - Hammocks: three `workshop-hammock` slung between the scaffold towers under the deck (y 0, they hang from posts).
  - Contraptions and clutter: `pedal-generator` near (568, -24), `welding-bench` x2 near (576, -10) and (572, -6),
    `umbrella-glider` on the deck? NO, on the ground at (590, -40); `spool-table` with blueprints at (578, -22);
    `underspan-scrap-heap` at `UNDERSPAN.scrapHeap` (596, -3; it must not cross z -1: shift it so its bounds stay inside);
    `dewdrop-cradle` near (586, -28); `citation-post` beside the shed door at (584, -19); a `manifesto-board` at
    `UNDERSPAN.manifestoWall` (x 561.5, z -20, yaw -PI/2, facing west to the road) and a second one at (561.5, -34).
    Colliders for each solid prop from its bounds (not for small things).
  - Manifesto posters (text plates on the two boards' west faces, 3-4 each), e.g. "A RULE IS ONLY A PROTOTYPE NOBODY
    TESTED", "PERMITS ARE FOR PEOPLE WHO ASK", "THE GROUND IS ALREADY OBSOLETE", "UP IS A DIRECTION, NOT A CRIME",
    "WE BUILT A LIFT. THEY BUILT A FORM." Signs elsewhere: on the shed "HOGWEED'S WORKSHOP / KNOCK, THEN DUCK"; on the
    citation post "CITATIONS: PLEASE TAKE ONE"; at the Roost ladder "THE ROOST. NO STAIRS. ASK THE UPDRAFT."; at the road
    edge facing west "THE UNDERSPAN / pop. varies / est. when the Span stopped"; a fading HOA notice "THIS STRUCTURE IS
    NOT A STRUCTURE (HOA ruling 44-b)".
  - Three vignettes (props telling a story without text; use prefab ids that exist, `getPrefab` guarded): (1) a half-
    built umbrella glider with its blueprints blowing away (a few loose paper-like plates scattered downwind at
    (592, -44)..(598, -48), tilted); (2) the pedal generator with a gnome-sized dent in the scrap heap beside it and a
    snapped chain on the ground (the last test); (3) a tiny "Local 404" union hard hat (use an existing hard-hat prefab if
    one exists: `grep -rn "hard-hat\|hardhat" packages/prefabs/src/catalog | head`) left politely on an upturned crate by
    the road with a thermos and two cups (the cousins came to talk and nobody did).
  - Return nothing; push colliders into `boxes`.
- `games/gnome-theft-auto/src/societies/underspan/build.test.ts` (new): build into a fresh `THREE.Scene` with an empty
  `boxes` array; check: every collider and every mesh's world bounds stay inside `UNDERSPAN.site` (allow 0.05 m); no
  collider overlaps the walkable spots `UNDERSPAN.workshopDoor`, `UNDERSPAN.hogweed`, `UNDERSPAN.chuteBottom` (0.6 m
  radius); `rooftopById('underspan-roost')` exists with y 6; building twice does not throw.

## Contract
`buildUnderspan(scene, boxes)` keeps its signature. Rooftop id `UNDERSPAN.roost.id` ('underspan-roost'), y 6, solid false.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/underspan/build.test.ts src/highways/deck.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (the workshop interior, life, config.ts).
