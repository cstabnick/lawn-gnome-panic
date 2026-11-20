Epic: 1 (Modules), issue 1B2: forest and farmland scenery prefabs
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
Ten new scenery prefabs exist with the exact ids below, for the forest and the farmland of Gnome Theft Auto.

## Read first
- packages/prefabs/src/types.ts: `PrefabDef`, `PrefabPart`, `footprint`.
- packages/prefabs/src/catalog/gnome-theft-auto.ts: `sandbag-wall` and `watch-tower` (scenery prefabs with `footprint`) and the examine voice.
- packages/prefabs/src/catalog/props.ts: outdoor props (trees, sheds), for the part vocabulary.
- docs/roadmaps/prefab-library/_common.md: modelling and examine-voice rules.

## Change
- packages/prefabs/src/catalog/gta-world-green.ts (currently `export const GTA_WORLD_GREEN: readonly PrefabDef[] = [];`, already registered in catalog/index.ts): append these defs. Category 'prop' (whatever existing scenery uses), uses ['place'], each with `footprint: { r, h }` as listed (omit where it says none), `about`, 5 `examine` lines (dry gnome voice, cartoon-safe), tags, `emoji: []`. Sizes at scale 1.
  - `log-cabin`: a 7 x 5 x 5 stacked-log cabin, pitched roof, stone chimney, door on +z; r 4, h 5.
  - `giant-oak`: a 10-tall tree with a thick trunk and a broad layered canopy; r 0.9, h 10 (r is the trunk).
  - `fallen-log`: a 5-long mossy log lying along x; r 1.2, h 1.
  - `fern-clump`: a small leafy clump about 1 across; none.
  - `barn`: a 14 x 10 x 9 red barn with white trim, a big white-X door on +z and a gambrel roof; r 8, h 9.
  - `silo`: a 12-tall grain silo, 6 across, with a domed top; r 3, h 12.
  - `haystack`: a round golden stack 3 wide and 2.5 tall; r 1.5, h 2.5.
  - `scarecrow`: a 2.5-tall scarecrow on a post with a floppy gnome hat and outstretched arms; r 0.4, h 2.5.
  - `wooden-fence`: a 4-long fence section (two posts, two rails), 1.2 tall, long axis along x; r 2, h 1.2.
  - `wheat-patch`: a flat 4 x 4 square of low golden stalks, 0.8 tall; none.

## Contract
Exact ids: log-cabin, giant-oak, fallen-log, fern-clump, barn, silo, haystack, scarecrow, wooden-fence, wheat-patch. games/gnome-theft-auto builds them by id.

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
Every other file. Other workers are editing gta-guns-air.ts and gta-world.ts.
