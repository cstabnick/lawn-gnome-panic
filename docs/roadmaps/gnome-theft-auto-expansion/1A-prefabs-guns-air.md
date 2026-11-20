Epic: 1 (Modules), issue 1A: prefabs for guns, the plane and the parachute
Depends on: none

## Environment
Working directory: C:\Users\cstab\Documents\gaming (Git Bash; if node is not found: export PATH="/c/Program Files/nodejs:$PATH"; dependencies are installed).
Game: games/gnome-theft-auto (Vite + TypeScript + three.js 0.187). Several other workers are editing other files of this game at the same time: change only the files named under "Change". Do not run `npm run build` or `npm run dev`, do not start servers, do not git commit.
The check is `npx tsc --noEmit -p games/gnome-theft-auto`. An error in a file you do not own means another worker is mid-edit: ignore it unless your change caused it. NEVER edit types.ts, config.ts or collide.ts: they are final contracts, already written. Read them first (types.ts: every interface; config.ts: WORLD_HALF, CITY_HALF, ROAD_LINES, BIOMES, biomeAt, HIGHWAYS, BASE, AIRFIELD, VIEW, BUILDINGS, VEHICLES, FLY, GUNS, BULLET, CHUTE).
Conventions: y is up, 1 unit = one gnome's height (about 1.3). Yaw 0 faces +z, forward = (sin yaw, 0, cos yaw), turning right DECREASES yaw. The ground is flat (y = 0) everywhere. No per-frame allocation in hot loops (reuse scratch vectors). Free assets only: everything is built from code or from @lawn/prefabs (prefabs are data in packages/prefabs/src/catalog). The game is a gnome parody (lore setting: apocrypha): keep any text dry and cartoon-safe, no gore, no real brands.
The world: a 1200 x 1200 flat map. Turfton (the city grid, |x|,|z| <= 215) in the middle; outside it four biomes split along the diagonals: desert east (Fort Sandpit and the airfield with two planes), forest west, tundra north, farmland south, joined to the city by highways (config.ts HIGHWAYS).

## Goal
Six new prefabs exist in the shared library: four real guns, a crop-duster plane and a parachute canopy, with the exact ids below, so the game can build them.

## Read first
- packages/prefabs/src/types.ts: `PrefabDef`, `PrefabPart` (shapes, `c: 'tint'`, `rot`, `seg`), `pivots`, `grip`, `seat`.
- packages/prefabs/src/catalog/front-weapons.ts: the gun convention (muzzle up along +y, grip at the origin; `grip` in the def; a short `about` and 5 `examine` lines).
- packages/prefabs/src/catalog/gnome-theft-auto.ts: `zero-turn-mower` and `whirligig-mower` (vehicle prefab with `seat`, named `pivots`, tint) and the examine voice.
- docs/roadmaps/prefab-library/_common.md: modelling and examine-voice rules.

## Change
- packages/prefabs/src/catalog/gta-guns-air.ts (currently `export const GTA_GUNS_AIR: readonly PrefabDef[] = [];`, already registered in catalog/index.ts): append these six defs.
  - `gta-pistol` (Pistol), `gta-smg` (SMG), `gta-shotgun` (Shotgun), `gta-rifle` (Rifle): category 'weapon', uses ['hold', 'shoot'], `grip` at the handle, muzzle toward +y, gnome-sized (about 0.35, 0.55, 0.8, 0.9 units long). Dark steel with a wooden or black grip; give the SMG a stick magazine, the shotgun a pump and the rifle a scope or iron sights. Silhouettes must differ at a glance.
  - `crop-duster` (Crop Duster): category 'prop', uses ['place', 'sit'], nose toward +z, wingspan about 7 and length about 5 at scale 1 (the game draws it at scale 1.5), a yellow `c: 'tint'` body and wings (tint default 0xf2c230), a cockpit bubble, tail fin and tail plane, two fixed wheels forward and a tail wheel. `seat: [0, 0.9, 0.2]`. `pivots`: `'prop': [0, 0.9, 1.9]` (the propeller hub; the game spins this pivot about its local z axis, so make the propeller two blades in the x-y plane at the hub), and `'wheel-0'`, `'wheel-1'`, `'wheel-2'`, `'wheel-3'` (the game spins these about x; put the two main wheels at wheel-0 and wheel-1, small tail wheels at wheel-2 and wheel-3). Name the propeller part group so it hangs on the 'prop' pivot the same way `whirligig-mower` hangs its rotor on its pivot.
  - `parachute-canopy` (Parachute Canopy): category 'prop', uses ['place']. Origin at the gnome's feet (the gnome is about 1.3 tall). An open dome canopy about 3.4 wide centred at y = 3.0 (a flattened ball or a few stacked tinted discs, striped in two colours), and four thin lines from the canopy rim down to the shoulders at y = 1.2. Nothing below y = 1.1.
- Every def needs `about` and 5 `examine` lines (dry gnome voice, cartoon-safe: the guns are plain props and the examine text must not be about hurting anyone), a `tags` list and `emoji: []`.
- If `npm test -w packages/prefabs` objects to the plane's size, look at how `whirligig-mower` satisfies the same check and do the same.

## Contract
Exact ids: gta-pistol, gta-smg, gta-shotgun, gta-rifle, crop-duster, parachute-canopy. Pivot names on crop-duster: prop, wheel-0..wheel-3. Do not rename them: games/gnome-theft-auto builds them by id.

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
Every other file. Another worker is adding other prefabs to gta-world.ts and gta-world-green.ts at the same time.
