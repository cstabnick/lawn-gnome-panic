Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): dressing and environmental storytelling

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
`winter/hill.ts` builds Snowdrop Slope as a place: the Woolly Sock Lodge with its porch spots, the Bootlace Tow (pylons,
the rope and cotton-reel handles moving round the loop), the Wool Run (start hut, six slalom gates, finish banner), the
Tea-Tray Run (lane markers, start sign, finish banner), the piste map, signs with jokes, at least three story vignettes,
and Gentian Bootlace teaching two learners the snowplough. Gentian's home is registered at the lodge door.

## Read first
- `games/gnome-theft-auto/src/winter/types.ts`: `LODGE`, `SLED_STACK`, `COCOA_HATCH`, `SKI_RACK`, `TOW`, `WOOL_RUN`,
  `TEA_TRAY_RUN`, `SNOWCAP_BEARS` (the `lodge-mug` bear and its bench are another worker's: keep 2 m clear around
  (-438, -1035)).
- `games/gnome-theft-auto/src/winter/hill.ts`: the stub (`buildSnowdropSlope(scene): SnowdropScenery` with `boxes` and
  `update(dt, t, px, pz)`); keep the signatures.
- `games/gnome-theft-auto/src/winter/tow.ts`: `handlePositions(t, n)` and `towPoint(s)` (another worker fills them in
  right now; they are stubs that return [] / the origin until then: code against the signatures).
- `games/gnome-theft-auto/src/homes/outerHomes.ts`: the pattern to copy: `buildPieces(scene, pieces, name)` returns
  colliders and puts static prefabs in culled cells; `textPlate` signs; a resident via `makeGnome(group, look)`; small
  flat decals.
- `games/gnome-theft-auto/src/homes/pieces.ts`: `HomePiece` (prefab, x, z, yaw, scale | size, solid, y, tint, trim),
  `buildPieces`, `textPlate(text, x, y, z, yaw, { w, h, bg, fg })` (mount plates >= 0.03 m in front of what they hang on).
- `games/gnome-theft-auto/src/homes/data.ts`: `homeOf('gentian')`, `registerHome(def)` (door = [x, z, yaw], yaw the way
  a gnome faces walking out).

## Change
`src/winter/hill.ts`, `buildSnowdropSlope(scene)`:
- Pieces (via `buildPieces`, name 'snowdrop-slope'); prefab ids from the parallel prefab workers (they exist by the end of
  the epic; `buildPieces` warns and skips a missing id meanwhile, so do not guard):
  - `woolly-sock-lodge` at `LODGE` (x, z), yaw `LODGE.yaw` (door faces east, +x), `size: LODGE.size`.
  - `ski-rack` at `SKI_RACK`, a stack of three `tea-tray-sled` pieces at `SLED_STACK` (y 0, 0.06, 0.12, solid false,
    slightly turned), a hatch counter at `COCOA_HATCH` (a `crate` or `bar-stool`s plus a plate), `sock-rack` 3 m south of
    the lodge's south-east corner, `piste-map-board` near the lodge front facing east, a `bench` and `woodpile` by the
    lodge's north wall.
  - The Bootlace Tow: `TOW.pylons` `tow-pylon` pieces evenly from `TOW.base` to `TOW.top` (use the line between them
    directly: (base + (top - base) * k / (pylons - 1))), yaw along the line; a small `start-hut`-like shelter is not
    needed at the base, but put `lost-mittens` and a plate "LOST & FOUND\n(MOSTLY LEFT)" beside the base pylon.
  - The Wool Run: `start-hut` just north-west of the start line (about (start.x - 16, start.z - 4), facing south; keep the
    line itself and the 30 m between the tow top and the start clear); for each gate two `slalom-flag` pieces at x = g.x ±
    g.half, alternating tint blue 0x2a6fdb / red 0xc0392b gate by gate, `solid: false`; a `finish-banner` centred on the
    finish line, `solid: false`, with a plate "FINISH" on the banner (both faces or facing north, up the hill).
  - The Tea-Tray Run: orange `slalom-flag` markers (tint 0xe67e22, `solid: false`) on both lane edges (x = start.x ± 9)
    every 30 m from the start z to the finish z; a `signpost` at the top with "THE TEA-TRAY RUN\nROSE SIDE UP"; a
    `finish-banner` (solid false) at its finish line.
  - Framing: 8-12 `snow-pine` pieces along the west and east margins of the site (x < -455 or x > -265, inside the site
    x -460..-240 only where they do not touch the runs, the tow line or the lodge), irregular spacing.
- Signs (textPlate, on `signpost` pieces or on the buildings): "SNOWDROP SLOPE\nGRADIENT: YES" at the foot facing south;
  "THE BOOTLACE TOW\nHOLD ON. LET GO.\nIN THAT ORDER." at the tow base; "THE WOOL RUN\nSIX GATES. NO EXCUSES." on the
  start hut; "THE WOOLLY SOCK LODGE\nBOOTS ON THE RACK.\nTROUBLES IN THE STOVE." beside the door; "HOT COCOA 6 🌰" at the
  hatch (no emoji if the plate renderer cannot draw it: use "ACORNS"); "SKIS 8 / TEA TRAYS 4" at the rack.
- Vignettes (props arranged to tell a story, no text needed): (1) a half-built `snowman` with one ski (`snow-skis`
  built with `buildPrefab` and tilted ~60° so it sticks out of the snowman) and a flattened 'LEARNERS' plate lying on the
  snow beside it; (2) a `tea-tray-sled` jammed nose-first into a `hay-bale` at the Tea-Tray Run's run-out, south of its
  finish, with one mitten (a small piece of `lost-mittens` or a plate) in the tray; (3) the `sock-rack` with one huge
  sock and a ladder or `crate` under it as if someone tried to reach it; (4) a lone `slalom-flag` knocked over (tilted
  80°) next to gate 3 with ski tracks curving round it (2-3 thin dark-grey flat strip decals, `flatLayer(material,
  LAYER.marking)` from `@lawn/depth`, a few cm above the snow, following `heightAt`).
- The rope: a thin dark line from base to top and back on the return side (see `tow.ts handlePositions`: the return line
  is 0.8 m beside the up line); draw it as two `THREE.Line` or very thin boxes per span between pylons, at pylon top
  height (~2.2 m above `heightAt`), sagging is optional. Not a collider.
- Handles: `TOW.handles` clones of `buildPrefab('tow-handle')` in one group; `update` moves them to
  `handlePositions(t, TOW.handles)` hanging below the rope (y = heightAt + 2.2 - 0.45). Hide the group when the player is
  more than 350 m away (cheap distance check).
- Residents: Gentian Bootlace (`makeGnome` look: hat 0xc0392b with a striped `bobble-beanie` head equipment if
  `getPrefab('bobble-beanie')` exists, shirt 0x2e5e4e, beard 0xd8d8d8, glasses false) standing 8 m east of the lodge door
  facing west toward two learner gnomes (bright jackets) 3 m in front of her; in `update` the learners shuffle back and
  forth 0.3 m (knees-in snowplough: keep it simple, a slow sideways sway with `gnomeState` from `../gnomes` if it helps)
  and every 6 s Gentian raises an arm (rotate the model's arm if a named part exists; otherwise a small hop). Skip the
  update when the player is more than 250 m away.
- Home: `registerHome({ ...homeOf('gentian')!, door: [doorX, doorZ, Math.PI / 2] })` where the door spot is 1.5 m east of
  the lodge's front face at `LODGE.z` (the lodge front is about `LODGE.x + LODGE.size / 2 * 0.7` east of its centre: use
  the prefab's measured bounds if you can (`prefabBox` in pieces.ts), else LODGE.x + 6).
- Return `{ boxes, update }`.
- New `src/winter/hill.test.ts` (vitest, `installFakeDom` from `../testing/fakeDom` if needed like other scenery tests):
  `buildSnowdropSlope(new THREE.Scene())` returns colliders, none of which overlaps a gate centre, the start or finish
  line centres, `SKI_RACK`, `SLED_STACK`, `COCOA_HATCH` (spots must stay reachable) or the tow line (sample 20 points
  from base to top: no box contains them, except the pylons' own small boxes within 0.5 m); `update(0.1, 1, -440, -1020)`
  does not throw; `homeOf('gentian')` has a door after the build.

## Contract
`buildSnowdropSlope(scene): SnowdropScenery` as in the stub. No collider on the ski lines, the gates, the finish banners,
the tow line or the porch spots.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/winter/hill.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/winter/hill*.ts`.

## Out of scope
Every other file. The runtime (another worker) calls `buildSnowdropSlope` and pushes the boxes.
