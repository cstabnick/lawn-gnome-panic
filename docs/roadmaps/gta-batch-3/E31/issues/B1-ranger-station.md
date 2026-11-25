Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
The Unmown Ranger Station stands at the end of the Unmown Lane: a timber cabin with a yard that tells the rangers'
story, and you can walk in (a small furnished interior with exhibits and Head Ranger Burdock Haybright at the desk).

## Read first
- `games/gnome-theft-auto/src/unmown/station.ts` (your stub: keep `buildRangerStation(scene, boxes): void`)
- `games/gnome-theft-auto/src/living/config.ts` (`STATION`: site x -1585..-1535, z -1170..-1130, flat ground; door
  anchor (-1540, -1130) on the +z side facing the lane; trailhead (-1560, -1172) on the -z side)
- `games/gnome-theft-auto/src/interiors/showcase/bodega.ts` (a small interior: `defineInterior({...})` at module level,
  door/exit poses, furnishing with the kit) and `games/gnome-theft-auto/src/interiors/types.ts` (`InteriorDef`)
- `games/gnome-theft-auto/src/unmownGate.ts` (placing prefabs + colliders in the Unmown)
- `packages/prefabs/src/catalog/gta-preserve-kit.ts` (the prefabs you place; read the `about` lines for sizes)

## Change
- `games/gnome-theft-auto/src/unmown/station.ts`:
  - Exterior: `unmown-ranger-hut` (12 x 8 m, front +z) centred about (-1560, -1148) facing +z (yaw 0) so its porch is
    near the door anchor's z; a `textPlate('UNMOWN RANGER STATION\nPlease do not mow', ...)` on the hut's name board (use
    the board centre given in the prefab's `about`, 0.03 m in front); collider box for the hut. Yard dressing with
    `buildStaticCells` (name 'unmown-station'): a flagpole or the existing 'bird-feeder', 2 `log-bench`, a `rules-board`
    by the lane with a text plate (rules below), a `trail-fingerpost` at the trailhead, a `bird-box`, an `insect-hotel`,
    a woodpile, the parked buggy spot left clear at (-1575, -1135) (another issue parks it), wildflowers.
  - The rules board text (4-6 short lines), e.g. "UNMOWN PRESERVE RULES / 1. No mowing. / 2. No thinking about mowing. /
    3. Hats off to the herons. / 4. The HOA may visit on Tuesdays, but may not enjoy it." — write your own in this voice.
  - Vignette at the station (environmental storytelling, no text needed): the rangers' confiscated-mower pile — two
    rusty mowers (existing mower prefabs, e.g. 'reel-mower' tinted rust 0x8a4b2a) behind a little rope barrier, with a
    paper tag on a stake; and a "lost property" crate (`lost-hat-box`) by the porch overflowing with HOA hats.
  - Interior via `defineInterior` (id 'unmown-ranger-station', name 'Unmown Ranger Station', theme 'burrow' or a custom
    warm wood theme, size about 10 x 7 x 3.2 m): door pose at the porch step (world, facing the hut), exit pose a couple
    of metres in front of the porch facing away. Furnish it: a counter, `unmown-display-case` (the Last Blade), 3 `specimen-jar`
    on a shelf, a wall map / notice (`rules-board` or a textPlate "WHERE THE GRASS IS (EVERYWHERE)"), a kettle, a chair
    with a ranger's hat on it, `lost-hat-box`. Use the interior kit the bodega uses.
  - Head Ranger Burdock Haybright stands inside at the counter if the interior system supports interior NPCs the way the
    bodega/other showcase rooms do; otherwise skip the NPC (the outdoor rangers are another issue).
  - Colliders for everything solid; nothing on the lane (the road `unmown-lane` ends at (-1540, -1120)).
- NEW `games/gnome-theft-auto/src/unmown/station.test.ts`: building the station into a `new THREE.Scene()` and an empty
  `boxes` array does not throw under node; at least 5 boxes are added; every box lies within the site rect grown by 6 m;
  the interior 'unmown-ranger-station' is defined (`interiorById` from '../interiors/registry').

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/unmown/station.test.ts src/interiors` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `unmown/*` files (other workers), `living/*`, `world.ts`, `app.ts`, prefabs.
