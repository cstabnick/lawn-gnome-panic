Epic: 1 (Modules), issue 1B1: desert, airfield and tundra scenery prefabs
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
Nine new scenery prefabs exist with the exact ids below, for the desert, the airfield and the tundra of Gnome Theft Auto.

## Read first
- packages/prefabs/src/types.ts: `PrefabDef`, `PrefabPart`, `footprint`, `pivots`.
- packages/prefabs/src/catalog/gnome-theft-auto.ts: `sandbag-wall` and `watch-tower` (scenery prefabs with `footprint`) and the examine voice.
- packages/prefabs/src/catalog/props.ts: a couple of outdoor props, for the part vocabulary.
- docs/roadmaps/prefab-library/_common.md: modelling and examine-voice rules.

## Change
- packages/prefabs/src/catalog/gta-world.ts (currently `export const GTA_WORLD: readonly PrefabDef[] = [];`, already registered in catalog/index.ts): append these defs. Category 'prop' (use whatever category existing scenery like `watch-tower` uses), uses ['place'], each with a `footprint: { r, h }` as listed (r = collider radius, h = height; omit `footprint` where it says none), `about`, 5 `examine` lines (dry gnome voice, cartoon-safe), tags, `emoji: []`. Sizes are at scale 1 and the game scales them up where needed.
  - `tall-cactus`: a 4-tall green saguaro with two upturned arms; r 0.6, h 4.
  - `desert-mesa`: a flat-topped layered sandstone rock, 10 wide and 6 tall (stacked tapered boxes in two or three reds); r 5, h 6.
  - `adobe-hut`: a 6 x 4 x 4 clay hut with a flat roof, a dark doorway on the +z side and a ladder or beam ends on the roof; r 3.2, h 4.
  - `hangar`: an aircraft shed 24 wide, 14 deep, 9 tall, a curved or stepped corrugated roof, front open (a dark gap) on +z; r 12, h 9.
  - `windsock`: a 5-tall pole with an orange and white striped sock on a pivot named `'sock'` (the game swings this pivot about y); none.
  - `snow-pine`: a 7-tall cone pine with snow-white caps on each tier; r 1, h 7.
  - `snowman`: a 2-tall three-ball snowman with a carrot nose, coal eyes and a little gnome hat; r 0.6, h 2.
  - `ice-rock`: a 4-wide pale blue crystal spire cluster; r 1.6, h 4.
  - `snow-lodge`: a 7 x 5 x 5 log lodge with a thick snow roof, a chimney and a door on +z; r 4, h 5.

## Contract
Exact ids: tall-cactus, desert-mesa, adobe-hut, hangar, windsock (pivot 'sock'), snow-pine, snowman, ice-rock, snow-lodge. games/gnome-theft-auto builds them by id.

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
Every other file. Other workers are editing gta-guns-air.ts and gta-world-green.ts.
