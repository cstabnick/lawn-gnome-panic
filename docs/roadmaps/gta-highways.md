# GTA highways: the Turfton Skyway (world verticality)

Request (verbatim): "gta - highways - fun way to add verticality but not sure how to add yet."

## Decision

**Elevated decks as a second ground level, not a change to the land.** `heightAt(x, z)` stays the one land height (single
valued, used by 60+ files); a skyway is a deck *above* it. One new documented query, `groundAt(x, z, y?)` in
`terrain.ts`, is the level-aware ground: the highest surface (land, bridge or deck top) at or below `y + 0.6`. A body on a
deck stays on it; one under a viaduct stays on the land; with no `y`, the top surface (for things dropped from the sky:
the coming air vehicles and garage heli drop use this).

Why this shape:
- **Drive-under for free.** The physics wheel probe (`terrainProbe`) hits a deck only when the ray starts above it, so the
  same chassis drives over the viaduct or under it. `aboveGround`, `collide.groundHeight` (gnomes on foot), the sim chassis
  floor and box sweeps, ragdolls and the camera floor all go through `groundAt`, so they follow the level they are on.
- **Embankment + viaduct.** Where a deck is lower than 4 m above the land it is a solid embankment with side walls that are
  ordinary `world.boxes` (so traffic, police, gnomes and the camera already respect them). Higher, it is a viaduct on column
  bents (also `world.boxes`, topped at the underside, so a car on the deck ignores them) and anything drives under.
  Embankments lie on axis-aligned legs so their wall boxes are tight (a test checks it).
- **Not in the road graph (v1).** `RoadNode` is 2D; adding a deck would need a level on every node and changes to traffic,
  police roadblocks, ambulance and errands. So no AI traffic on the deck and no GPS routing over it yet. The skyway is the
  player's fast lane; ground traffic keeps flowing underneath. Follow-up: `RoadNode.deck`, traffic `groundAt` spawn.
- **Outside buildWorld.** `installSkyways` runs in app.ts right after `buildWorld`, so the golden layout snapshot is untouched.
  It also removes parked spots and walk points inside/next to the low parts, so nothing spawns on a ramp or in its way.
  No column stands within 7.5 m of a road centre line (city grid and highways).
- **Placement.** The Turfton Skyway climbs from the dead-end of the z = -60 street at Turfton's east edge, runs at 7.5 m over
  Ring Road North-East and the airfield spur (two drive-unders), and comes down onto the east highway at x = 550 (a gap in
  the hedgerow). The Unfinished Span climbs north of the east highway at x = 610 and stops 6.5 m up, pointed over it: a jump.
  Both sit in the flat Dust Flats edge (land 0-1.6 m); a test builds the world and checks nothing stands in them.
- **Online:** the skyway is static world geometry; every client builds the same thing. Nothing to sync.
- **Mobile:** no new input; driving and walking use the existing touch controls.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| H1 Foundation (planner, done) | `highways/skyways.ts` data, `highways/deck.ts` queries, `groundAt` + probe + `aboveGround` in terrain.ts, deck-aware collide/simdrive/ragdoll/player/camera, `colliders.ts`, `install.ts`, stubs, app.ts + hud.ts wiring; `npx vitest run src/highways` passes | 0 (written directly) |
| H2 Build-out | meshes, runtime (walls, achievements, jump), map + icon + lore; tsc clean for these files, tests pass | 3 |

Hot-file edits (all small, by the planner): `terrain.ts` (groundAt, probe, aboveGround, resetDecks), `collide.ts`
(groundHeight), `simdrive.ts` (4 lines), `ragdoll.ts` (1), `player.ts` (1), `camera.ts` (floor + viaduct ceiling),
`app.ts` (3 lines), `hud.ts` (2 lines).

**Needed in vehicles.ts (not owned by this workstream):** an arcade (non-sim) vehicle on a deck, e.g. one the player just got
out of, otherwise snaps to the land under the deck. Replace `heightAt(v.x, v.z)` with `groundAt(v.x, v.z, v.y)` in
`stepVehicle` (wreck drop), `stepPilotedPlane` (`const g`), `stepOther` (`const g`) and `moveVehicle`
(`if (grounded) v.y = ...`), and import `groundAt` from './terrain'.

## Epic H2 issues

~~~~text
Epic: H2 Build-out
Depends on: none
Issue H2.1: skyway meshes

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (Vite + TypeScript + three.js).
In Git Bash, if node is missing: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files in this
game at the same time: touch ONLY the file listed under Change. Do not commit. tsc may show errors in files that are not
yours; ignore those. Do not run vite build or a dev server.
Repo rules: 3D scenes must not z-fight: anything flat on another surface gets `flatLayer(material, LAYER.<x>)` from
'@lawn/depth' (LAYER: ground 0, tint 1, area 2, road 3, edge 4, marking 5), and boxes that touch must not share a face.

## Goal
`buildSkywayMeshes()` returns a THREE.Group that draws every skyway: deck, rails, embankment walls, column bents, lane
markings, and a barrier at the Unfinished Span's open end.

## Read first
- games/gnome-theft-auto/src/highways/skyways.ts: SKYWAY tuning (slab, railHeight, solidBelow, columnSize), SKYWAYS defs (width, openEnd)
- games/gnome-theft-auto/src/highways/deck.ts: `deckSamples(id, step)` returns DeckSample {x, z, y (deck top), land, along, dirX, dirZ, solid}; `skywayDefs()`
- games/gnome-theft-auto/src/highways/colliders.ts: `skywayBents()` returns Bent {x, z, deckY, land, dirX, dirZ, columns: [{x,z},{x,z}]}
- games/gnome-theft-auto/src/highways/mesh.ts: the stub you replace

## Change
- games/gnome-theft-auto/src/highways/mesh.ts: keep the signature `export function buildSkywayMeshes(): THREE.Group`
  (group.name = 'skyways'). For each def of skywayDefs(), with s = deckSamples(def.id, 2):
  - Cross-section direction at sample i: right = (dirZ, -dirX) (right of travel); at an interior sample use the normalised
    average of the previous and next sample directions so the corners mitre with no gap.
  - Deck: ONE BufferGeometry ribbon per skyway, built from the samples (shared vertices along the length, not a box per
    piece): top strip at y (half width def.width/2 + 0.4 so it runs under the rails), two side faces and a bottom face.
    Side/bottom bottom edge: where s.solid, down to s.land - 0.5 (an embankment, buried a little); else y - SKYWAY.slab.
    Two materials: top MeshStandardMaterial color 0x55555b (asphalt, roughness 1); sides/bottom color 0xb9b2a4
    (concrete). Use geometry groups (geo.addGroup) with a material array, call geo.computeVertexNormals(). The top is not
    coplanar with anything, so no flatLayer needed for it.
  - Rails: per skyway, a ribbon (or merged thin boxes, BufferGeometryUtils.mergeGeometries from
    'three/examples/jsm/utils/BufferGeometryUtils.js') 0.3 wide, from y to y + SKYWAY.railHeight, centred at
    +/- (def.width/2 + 0.15). Colour 0xd8d2c4. Rails must not share a face with the deck sides: centre them 0.15 inside the
    deck edge (deck top half width is width/2 + 0.4, so the rail sits on the deck top, not flush with its side).
  - Lane markings: dashed centre line, 0.25 wide, 3 m dash every 6 m along `along`, as thin quads 0.02 above the deck top,
    material MeshBasicMaterial color 0xf2e7a6 passed through flatLayer(mat, LAYER.marking); plus solid white edge lines
    0.2 wide at +/- (width/2 - 0.6), same layer, color 0xf4f4f4. Merge into one mesh per colour.
  - Columns: for every Bent of skywayBents(), two boxes SKYWAY.columnSize square from bent.land - 0.3 up to
    bent.deckY - SKYWAY.slab, centred on bent.columns[k], plus a cap beam under the deck across both columns
    (0.8 tall, 0.9 deep, length = distance between the columns + columnSize), its top 0.05 BELOW the deck underside so it
    does not share a face with it. Rotate the beam to the deck direction (yaw = Math.atan2(dirX, dirZ)). Colour 0xb9b2a4.
    Merge all into one mesh.
  - Open end (def.openEnd): at the last sample put three red/white boards across the deck 1 m before the end:
    thin boxes (width - 1) x 0.6 x 0.15 at heights y + 0.4 and y + 1.0, color 0xd94f3d, on two posts. Merge them in the
    rail mesh or a small extra mesh.
  - castShadow = true and receiveShadow = true on deck and columns.
- Add a test games/gnome-theft-auto/src/highways/mesh.test.ts: buildSkywayMeshes() has children, every mesh geometry has a
  position attribute with no NaN, and the group's bounding box (new THREE.Box3().setFromObject(group)) contains the point
  (300, 7, -60) area (x range covers 200..540).

## Contract
`export function buildSkywayMeshes(): THREE.Group` (no arguments). It is called by highways/install.ts; do not change that file.
This is infrastructure (like world.ts roads), so it is built in the game, not as a prefab.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in src/highways/mesh.ts or mesh.test.ts
- `npm test -w games/gnome-theft-auto -- src/highways` passes

## Out of scope
Every other file, including deck.ts, colliders.ts, install.ts, skyways.ts, system.ts, map.ts, world.ts, app.ts.
~~~~

~~~~text
Epic: H2 Build-out
Depends on: none
Issue H2.2: skyway runtime (walls for the player, achievements, the Unfinished Span jump)

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (TypeScript). In Git Bash, if
node is missing: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files in this game at the same
time: touch ONLY the files listed under Change. Do not commit. tsc may show errors in files that are not yours; ignore
those. Do not run vite build or a dev server.

## Goal
`createHighways(deps)` keeps the player's vehicle (and the player on foot) inside a deck's rails / out of its sides, and
unlocks two achievements: driving the whole Turfton Skyway, and flying off the Unfinished Span.

## Read first
- games/gnome-theft-auto/src/highways/system.ts: the stub (HighwaysDeps { toast, unlock }, Highways { update(dt, player) })
- games/gnome-theft-auto/src/highways/deck.ts: `pushOutOfDecks(x, z, r, baseY)` returns {x, z, hit, nx, nz}; `deckContactsAt(x, z)` returns DeckContact[] {skyway: {id, name, openEnd}, along, surfaceY, ...}; `skywayLength(id)`
- games/gnome-theft-auto/src/stunts.ts lines 240-280: how a ramp wall push is applied to the player's vehicle (sim body vs arcade) — copy that pattern
- packages/achievements/src/catalog.ts: the `// ---- Gnome Theft Auto ----` entries (AchievementDef shape)

## Change
- games/gnome-theft-auto/src/highways/system.ts (keep the exported names and signatures):
  - Each update: if player.vehicle (v) and !v.spec.flies and !v.spec.boat: baseY = v.sim ? v.sim.py : v.y;
    s = pushOutOfDecks(v.x, v.z, v.spec.radius, baseY); if s.hit apply exactly like stunts.ts does for ramp sides (sim:
    move body.pos by s - v, set v.x/v.z, v.sim.lastX/lastZ, remove the into-wall velocity along (s.nx, s.nz); arcade: set
    v.x/v.z and remove the into-wall part of the heading velocity from v.speed).
    Else if on foot (no vehicle): s = pushOutOfDecks(player.x, player.z, 0.4, player.y); if hit set player.x/z.
  - Skyway run: while the player drives (vehicle, not flying) on 'turfton-skyway' (a deckContactsAt hit with
    c.skyway.id === 'turfton-skyway' and |baseY - c.surfaceY| < 1), track min and max `along` reached since getting on.
    Reset when the player is off it for more than 3 s or leaves the vehicle. When max - min >= skywayLength('turfton-skyway')
    - 12: deps.unlock('gta-skyway-run'), deps.toast('Turfton Skyway: end to end!'), once per run.
    First time on any skyway per session: deps.toast(`${c.skyway.name}`, 2500).
  - Mind the Gap: when the player's vehicle is on 'unfinished-span' with along >= skywayLength('unfinished-span') - 3 and
    then within 1.5 s has no deck contact and is airborne (v.sim ? v.sim.ctrl.telemetry.groundedWheels === 0 : v.y -
    groundAt(v.x, v.z, v.y) > 0.5, groundAt from '../terrain'), remember the launch point; when it is grounded again and
    the horizontal distance from the launch point is >= 25: deps.unlock('gta-mind-the-gap') and deps.toast('Mind the gap!').
  - Keep the logic in small pure helpers where possible (e.g. `export function runComplete(min, max, length): boolean`).
- packages/achievements/src/catalog.ts: append two entries at the end of the Gnome Theft Auto section (do not touch others):
  { id: 'gta-skyway-run', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Higher Than a Bridge',
    description: 'Drive the Turfton Skyway from one end to the other.',
    reward: { slot: 'neck', prefabId: 'wool-scarf', label: 'Skyway Scarf' } },
  { id: 'gta-mind-the-gap', game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: 'Mind the Gap',
    description: 'Fly a mower off the end of the Unfinished Span.',
    reward: { slot: 'head', prefabId: 'foreman-hard-hat', label: "Foreman's Hard Hat" } },
- games/gnome-theft-auto/src/highways/system.test.ts: test the pure helpers (runComplete true/false cases).

## Contract
system.ts exports exactly: `HighwaysDeps`, `Highways`, `createHighways(deps: HighwaysDeps): Highways` (plus any helpers).
app.ts already calls `createHighways({ toast, unlock })` and `highways.update(dt, player)` each frame; do not edit app.ts.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files
- `npm test -w games/gnome-theft-auto -- src/highways` passes
- `npm test -w packages/achievements` passes

## Out of scope
deck.ts, colliders.ts, install.ts, skyways.ts, mesh.ts, map.ts, stunts.ts, vehicles.ts, app.ts, everything else.
~~~~

~~~~text
Epic: H2 Build-out
Depends on: none
Issue H2.3: skyways on the map, a map icon, and the lore entry

## Environment
Repo C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn, game games/gnome-theft-auto (TypeScript). In Git Bash, if
node is missing: export PATH="/c/Program Files/nodejs:$PATH". Other workers edit other files in this game at the same
time: touch ONLY the files listed under Change. Do not commit. tsc may show errors in files that are not yours; ignore them.

## Goal
The minimap and big map draw both skyways (a raised road with a light outline, clearly different from ground roads), a
'skyway' place icon marks the Turfton Skyway, and the lore knows about it.

## Read first
- games/gnome-theft-auto/src/highways/map.ts: the stub `drawSkywaysOnMap(g, X, Y)`; hud.ts already calls it right after drawing the speedway, on the pre-rendered map canvas (X(x), Y(z) give canvas pixels; 1 world metre is |X(1) - X(0)| pixels)
- games/gnome-theft-auto/src/highways/deck.ts: `skywayDefs()`, `deckSamples(id, step)` ({x, z, y, land, solid})
- games/gnome-theft-auto/src/mapIcons.ts: PlaceKind union, PLACE_STYLE, drawPlaceIcon switch
- games/gnome-theft-auto/src/mapPois.ts: placeBlips()
- docs/lore/entries/apocrypha/everspring-bridges.md (format, and its loose thread) and docs/lore/README.md

## Change
- games/gnome-theft-auto/src/highways/map.ts: for each def, path through deckSamples(def.id, 8) centre points; stroke it
  three times with lineCap 'butt', lineJoin 'round': a dark shadow (rgba(0,0,0,0.35), width = def.width * m + 4 offset by
  +2 px in x and y) only where !solid... simpler: shadow for the whole path, then an outline '#f4f4f4' width def.width*m + 3,
  then '#3d3d44' width def.width*m (m = |X(1) - X(0)|, at least 1). For openEnd defs draw a short red bar (#d94f3d) across
  the last point. Restore g.lineCap/lineJoin/lineWidth/strokeStyle you change (g.save()/g.restore()).
- games/gnome-theft-auto/src/mapIcons.ts: add 'skyway' to PlaceKind, PLACE_STYLE.skyway = { name: 'Skyway', color: '#8a8f9c' },
  and a drawPlaceIcon case: a small bridge glyph (a horizontal deck bar with two legs) in white on the disc, like the other cases.
  If mapIcons.test.ts checks every PlaceKind, keep it passing.
- games/gnome-theft-auto/src/mapPois.ts: add at('skyway', 316, -60, 'Turfton Skyway') (over Ring Road North-East).
- docs/lore/entries/apocrypha/turfton-skyway.md: new entry (copy the front matter format of everspring-bridges.md; id
  turfton-skyway, kind place, tier apocrypha, setting apocrypha, era now, status draft, games [gnome-theft-auto],
  aliases [The Skyway, The Unfinished Span], sources [games/gnome-theft-auto/src/highways/skyways.ts], related
  [everspring-bridges, local-404-union-hall, dust-flats]). Content: the raised road Local 404 poured after a mower finally
  asked for a bridge higher than a step (answering the Everspring Bridges' loose thread); it leaves the dead end of the
  z = -60 street at Turfton's east edge, passes 7.5 m over Ring Road North-East and the airfield spur, and comes down on the
  east highway in the Dust Flats. The Unfinished Span is a second stub north of the east highway that stops in mid-air,
  where the crew walked off the job during a strike; drivers jump it. Loose threads: who still owes the union for it.
  Check the related ids exist (ls docs/lore/entries/apocrypha); drop any that do not.
- Then run `npm run lore` from the repo root (it may regenerate docs/lore/INDEX.md) and make it pass.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in map.ts, mapIcons.ts, mapPois.ts
- `npm test -w games/gnome-theft-auto -- src/mapIcons` passes
- `npm run lore` passes

## Out of scope
hud.ts, deck.ts, skyways.ts, mesh.ts, system.ts, install.ts, app.ts, other lore entries (other than INDEX regeneration).
~~~~

## Status

H1 and H2 are done. Changes from the issue text: every wearable prefab was already an achievement reward, so the two
rewards are new prefabs in `packages/prefabs/src/catalog/gnome-theft-auto.ts` (`skyway-hi-vis-sash`, neck;
`span-hard-hat`, head). `types.ts` `Blip.kind` gained `'skyway'`. The `vehicles.ts` change above is still open.
