Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
The Unmown's three bird hides stand on their sites, each looking out over its habitat, each with its own small story and
sign, and you can step inside (the achievement counts standing within 3 m of the hide's centre, so the inside must be
reachable: the door side open, no collider over the centre).

## Read first
- `games/gnome-theft-auto/src/unmown/hides.ts` (your stub: keep `buildUnmownHides(scene, boxes): void`)
- `games/gnome-theft-auto/src/living/config.ts` (`UNMOWN_HIDES`: Reedmere Hide (-1050, -1550) yaw 0 (slot faces
  south over the marsh), Meadow Hide (-560, -1490) yaw PI (faces north... see below), Wood Hide (-1700, -1330) yaw PI;
  `HIDE_INSIDE_R` 3)
- `packages/prefabs/src/catalog/gta-preserve-kit.ts` (`bird-hide`: 5 x 3.5 x 2.8 m, viewing slot on +z, door on -z)
- `games/gnome-theft-auto/src/birding/hide.ts` (the Loch Moss hide: how its colliders leave the inside walkable)

## Facts
- Meadow Hide: the Long Meadow (x -780..-340, z -1760..-1520) lies SOUTH of it (larger z). Use yaw 0 for it too if the
  meadow is to the south; decide from the coordinates and say which in a comment (the config's yaw is only a hint; do
  not edit config).
- Wood Hide: Oldroot Wood is x -1780..-1560, z -1710..-1410, i.e. south-west of (-1700, -1330): face it (yaw ~ PI*0.85
  measured as three.js rotation.y where 0 faces +z... compute `Math.atan2(dx, dz)` toward (-1690, -1500)).
- The hides sit on natural (sloped) ground: put each at `heightAt` of its centre and sink it 0.1 m so no corner floats.

## Change
- `games/gnome-theft-auto/src/unmown/hides.ts`:
  - Place `bird-hide` at each of the three, facing its habitat. Colliders: four thin wall boxes (0.15 m) round the
    hide's footprint (rotate the footprint corners by yaw and take an axis-aligned box per wall), leaving a 1.2 m gap in
    the back (door) wall, so the player can walk in to the centre. If walls are not axis aligned (diagonal yaw), use
    2-3 small boxes per wall along it.
  - Per hide, a `rules-board` with a text plate by the door and a `bird-box` or feeder nearby. Texts (write your own,
    same voice): Reedmere Hide "REEDMERE HIDE / Whisper. The bittern is listening. / It is always listening.";
    Meadow Hide "MEADOW HIDE / Please do not count the grass. / We tried. We ran out of numbers."; Wood Hide
    "WOOD HIDE / The fox was here first. / Knock before entering."
  - A story vignette per hide, props only (pick existing prefabs, search the catalog): Reedmere: a tripod with a telescope
    knocked over, a flask, a notebook with one line written then crossed out (a tiny textPlate on the notebook is fine);
    Meadow: an abandoned folding chair facing the wrong way (at the wall), a pile of 30 sweet wrappers, binoculars;
    Wood: a single muddy boot by the door and a trail of acorns leading inside.
  - All dressing in ONE `buildStaticCells` batch named 'unmown-hides' (the hides themselves may be in it too).
- NEW `games/gnome-theft-auto/src/unmown/hides.test.ts`: build into a fresh scene; for each hide centre, no pushed box
  contains the centre point (the player can stand there); each hide has at least 3 wall boxes nearby; under node no throw.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/unmown/hides.test.ts src/birding/hide.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `unmown/*` files, `birding/*`, `living/config.ts`, prefabs.
