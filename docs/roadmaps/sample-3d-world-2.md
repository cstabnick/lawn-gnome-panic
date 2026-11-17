# Lawn Gnome Panic: World 2 (the desert yard)

Goal: after the three lawn levels, a second world of three levels in a desert house yard. Armadillos and lizards
replace the mowers, cacti replace the trees. World 2 is harder than 1-3 from the start, each step is bigger, and its
wave clock runs faster (`LevelDef.rampMult`), so the late tiers and the boss arrive sooner.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0. Foundation (written by the planner) | `npx tsc --noEmit -p games/sample-3d` | - |
| 1. Desert content | `npm run build -w games/sample-3d`, smoke test, World 2 plays | 4, parallel |

Epic 0 (done directly): `WorldTheme`, `LevelDef.world/theme/label/rampMult`, six `SOLO_LEVELS`, `DESERT_ENEMY_NAMES`,
`enemyName()`, `DESERT_WAVE_BANNERS`, desert obstacle set with `'cactus' | 'tumbleweed'` kinds and
`setObstacleTheme()` (swaps `OBSTACLES` in place), `setTheme()` on `Scenery`, `HouseLights`, `DayNight`, `MowerSystem`,
the desert day palette, `applyTheme()` in `main.ts`, themed banners, stubs for `createCritterModel`,
`scenery.setTheme`, `house.setTheme`.

No party slice: the backlog row (`lawn-dodge`, "later") is unchanged by this feature.

## Epic 1 issues

~~~~text
Epic: 1 Desert content
Depends on: none
Issue: 1A critter models

## Environment
Repo root /home/user/lawn-gnome-panic, game games/sample-3d (three.js 0.187, TypeScript). Other workers are editing
other files of this game at the same time (props.ts, scenery.ts, house.ts, ui/lobby.ts, ui/results.ts): touch only
the file below. Do not run git commit. Do not run vite build or a dev server.

## Goal
Lawn Gnome Panic's World 2 enemies are armadillos and lizards. `createCritterModel(tier)` in
games/sample-3d/src/mowerModels.ts currently is a stub returning the mower model. Replace the stub body with
procedural low-poly animal models built from three.js primitives.

## Read first
- games/sample-3d/src/mowerModels.ts: the whole file. `createMowerModel` shows the pattern: a THREE.Group facing +z,
  base at y = 0, a `mats` list of MeshStandardMaterials whose emissive is set white for setFlash, `sharedGeo(key, make)`
  for shared geometries, castShadow on meshes.
- games/sample-3d/src/config.ts: `interface MowerModel` and `MOWER_TIERS` (radius and height per tier: the model
  should roughly fill a circle of that radius and be about that height).

## Change
- games/sample-3d/src/mowerModels.ts: replace the body of `export function createCritterModel(tier: MowerTier): MowerModel`
  (keep the signature and doc comment, drop the word STUB). Tiers:
  - reel = baby gecko: radius 0.7, height ~0.4. Slim green-teal (0x6fbf73) body, long tapering tail, four splayed legs, big dark eyes.
  - green = armadillo: radius 0.9, height ~0.7. Banded grey-tan shell (0xa89279 with darker 0x7d6a55 bands made from
    3-5 half-torus or scaled half-sphere rings), pointy snout, two upright ears, short tail, four stubby legs.
  - yellow = horned lizard: radius 0.9, height ~0.6. Wide flat sandy body (0xd2a96a), a crown of small cones on the head, spikes along the sides.
  - red = racing lizard: radius 0.9, height ~0.7. Long lean red-orange (0xd2532c) body, raised head, long tail.
  - combine = giant armadillo (boss): radius 2.6, height ~2.5. The armadillo scaled up (about 2.8x) with a darker shell (0x8a7258).
  Night: setNight(night01) makes two eye spheres glow (MeshBasicMaterial 0xffe27a, scale or visible by night01 like the lamps).
  setFlash(on): same as the mowers (emissive 0xffffff, intensity 0.7 on every body material; 0 off).
  animate(dt, speed): legs swing (rotate leg meshes about x, phase-offset pairs, rate proportional to speed),
  tail wags (rotate the tail group about y with sin(t * 8)), and a small body bob. Keep each model under ~40 meshes.
  Use your own new materials per model (mats list) so flash does not leak between enemies; shared geometries are fine.

## Contract
```ts
export function createCritterModel(tier: MowerTier): MowerModel;
export interface MowerModel {
  setNight(night01: number): void;
  group: THREE.Group;           // built facing +z, base at y = 0
  setFlash(on: boolean): void;  // white hit flash
  animate(dt: number, speed: number): void;
}
```
`createMowerModel` must stay unchanged.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/sample-3d` succeeds.
- Each tier returns a distinct animal model facing +z, standing on y = 0.

## Out of scope
Every file except games/sample-3d/src/mowerModels.ts.
~~~~

~~~~text
Epic: 1 Desert content
Depends on: none
Issue: 1B desert props (cactus, tumbleweed)

## Environment
Repo root /home/user/lawn-gnome-panic, game games/sample-3d (three.js 0.187, TypeScript). Other workers are editing
other files of this game at the same time (mowerModels.ts, scenery.ts, house.ts, ui/lobby.ts, ui/results.ts): touch only
the file below. Do not run git commit. Do not run vite build or a dev server.

## Goal
The desert yard (World 2) uses two new obstacle kinds, 'cactus' and 'tumbleweed', already in `ObstacleKind` in
config.ts. `buildProp` in games/sample-3d/src/props.ts does not draw them yet. Add both.

## Read first
- games/sample-3d/src/props.ts: `mat()`, `xf()`, the `Kit` class (`k.add(geo, material, matrix)`), `buildProp`'s switch,
  and `tree()` / `bush()` as examples. A prop spans y = 0..o.height and roughly fills radius o.radius.
- games/sample-3d/src/config.ts: search `DESERT_SCATTER` and `DESERT_CORE` to see the sizes used.

## Change
- games/sample-3d/src/props.ts:
  - add `case 'cactus': cactus(k, o); break;` and `case 'tumbleweed': tumbleweed(k, o); break;` to the switch in `buildProp`.
  - `function cactus(k: Kit, o: Obstacle): void`:
    - if o.height > 12, a saguaro: a main column (CylinderGeometry r, r*1.05, height ~h*0.92, 12 segments) capped by a
      sphere at the top so the top is at h; 2-3 arms, each a short horizontal cylinder out from the trunk then an
      upright cylinder with a sphere cap, at heights between 0.35h and 0.65h, arm radius ~0.6r. Colour 0x4f8f4a,
      a slightly darker 0x3f7a3d for vertical rib strips (thin boxes around the trunk, 8 of them) optional.
      Add a few tiny light spines (0xf3ecd0 small cones) if cheap.
    - else a barrel cactus: a squat sphere scaled to fill radius r and height h (SphereGeometry, scale y = h / (2r)),
      ribbed look with 8 thin darker strips, and 3-5 small pink/yellow (0xff6fa3 / 0xffd54f) flower spheres on top.
  - `function tumbleweed(k: Kit, o: Obstacle): void`: a loose ball of dry twigs filling radius r, top at h: 25-40 thin
    TorusGeometry rings (tube ~0.04r) in random orientations (deterministic: seed from o.x and o.z) in 0xa07a4a and
    0x8a6a3e, centre at y = h/2, scaled to span 0..h.

## Contract
`export function buildProp(o: Obstacle): THREE.Object3D;` unchanged. Do not change other prop kinds.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/sample-3d` succeeds.
- buildProp returns a cactus or tumbleweed mesh for the new kinds.

## Out of scope
Every file except games/sample-3d/src/props.ts.
~~~~

~~~~text
Epic: 1 Desert content
Depends on: none
Issue: 1C desert backdrop and adobe house

## Environment
Repo root /home/user/lawn-gnome-panic, game games/sample-3d (three.js 0.187, TypeScript). Other workers are editing
other files of this game at the same time (mowerModels.ts, props.ts, ui/lobby.ts, ui/results.ts): touch only the
two files below. Do not run git commit. Do not run vite build or a dev server.

## Goal
World 2 is a desert house yard. `Scenery.setTheme(theme)` and `HouseLights.setTheme(theme)` exist as empty stubs.
Fill them in: in 'desert' the backdrop beyond the fences shows mesas and saguaro cacti instead of leafy trees and
hedges, and the giant house takes adobe colours. 'lawn' restores everything exactly as it is now.

## Read first
- games/sample-3d/src/scenery.ts: `buildScenery`. The "Trees beyond the west, east and south fences" block builds two
  InstancedMeshes (`trunks`, `canopySpheres`), the "Hedges" block builds `hedgeBodies`/`hedgeTops`; there may be
  neighbour houses and other blocks too. `setTheme(_theme: WorldTheme)` stub is in the returned object.
  `makeRng(seed)` and `place(mesh, i, x, y, z, sx, sy, sz)` are helpers at the top. TREE_BAND_MIN/MAX, ARENA_HALF.
- games/sample-3d/src/house.ts: `buildHouse`; `siding = 0xf4e8d0` and the `std(color, opts)` material cache. The
  `setTheme(_theme: WorldTheme)` stub is in the returned object.

## Change
- games/sample-3d/src/scenery.ts:
  - Build a desert backdrop group once (hidden by default, `visible = false`, added to the scene), with its own
    `makeRng(777)` so the existing scenery's random sequence is unchanged:
    - 12-18 mesas in the same bands as the trees (west, east, south, distance TREE_BAND_MIN+40 .. TREE_BAND_MAX+250):
      flat-topped CylinderGeometry with 6-8 radial segments, radius 30-80, height 25-70, terracotta 0xc8703f with a
      lighter 0xd99a62 cap band; one InstancedMesh or a few meshes, frustumCulled = false.
    - 60-80 saguaros in the tree bands: an InstancedMesh of trunk cylinders (radius 1.5-2.5, height 20-35,
      0x4f8f4a) plus an InstancedMesh of arm cylinders (two per cactus, upright, offset sideways ~3, height 8-12).
  - `setTheme(theme)`: desert = hide trunks, canopySpheres, hedgeBodies, hedgeTops (keep references to them) and show
    the desert group; also tint the hedge material to a dry 0xa08a5a if you keep hedges visible instead (choose one,
    hiding is fine). lawn = the reverse. Leave sky, stars and clouds alone (the day/night palette is handled elsewhere).
- games/sample-3d/src/house.ts:
  - Keep a reference to the siding material and any roof/trim material you can find. `setTheme('desert')` sets the
    siding colour to adobe 0xe0b083 and the roof to 0xb5523b (terracotta); `setTheme('lawn')` restores the original
    hex values. Use `material.color.setHex(...)`. If the patio/lawn-coloured parts exist, you may leave them.

## Contract
```ts
// config.ts (do not edit)
export type WorldTheme = 'lawn' | 'desert';
export interface Scenery { update(dt: number, focus: THREE.Vector3): void; setSky(s: DayNightState): void; setTheme(theme: WorldTheme): void; }
export interface HouseLights { setNight(night01: number): void; setTheme(theme: WorldTheme): void; }
```
`buildScenery(scene: THREE.Scene): Scenery` and `buildHouse(scene: THREE.Scene): HouseLights` keep their signatures.
Lawn mode must look exactly as before.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/sample-3d` succeeds.
- setTheme('desert') shows mesas and saguaros and hides the leafy trees; setTheme('lawn') restores them.

## Out of scope
Every file except games/sample-3d/src/scenery.ts and games/sample-3d/src/house.ts.
~~~~

~~~~text
Epic: 1 Desert content
Depends on: none
Issue: 1D lobby world picker and results text

## Environment
Repo root /home/user/lawn-gnome-panic, game games/sample-3d (TypeScript, plain DOM UI). Other workers are editing
other files of this game at the same time (mowerModels.ts, props.ts, scenery.ts, house.ts): touch only the two
files below. Do not run git commit. Do not run vite build or a dev server.

## Goal
SOLO_LEVELS now has 6 entries: World 1 (levels 1-1, 1-2, 1-3, the lawn) and World 2 (2-1, 2-2, 2-3, the desert).
The lobby's level picker and the results screen still assume 3 levels named "LV 1..3". Show them as two worlds.

## Read first
- games/sample-3d/src/config.ts: `LevelDef` and `SOLO_LEVELS` (fields `world: 1 | 2`, `theme`, `label` like '2-1',
  `name`, `bossCount`), `enemyName`, `RunSummary` (`soloLevel` is the 1-based index into SOLO_LEVELS, `unlockedLevel`
  likewise, `killedByText` already carries the desert enemy name when relevant).
- games/sample-3d/src/ui/lobby.ts: lines ~480-535, the "Solo level picker" (`levelWrap`, `levelRow`, `levelBtns`,
  `applyLevels`, `setLevel`, `syncLevels`); CSS for `.lb-mode`, `.lb-mode-cell`, `.lb-mode-btn`, `.lb-level-cap` is
  in the same file (search for them).
- games/sample-3d/src/ui/results.ts: lines ~125-160, the victory title and stats.

## Change
- games/sample-3d/src/ui/lobby.ts:
  - Build one `lb-mode` row per world inside `levelWrap`, each prefixed by a small label cell `WORLD 1` / `WORLD 2`
    (new class `lb-world-tag`, small bold text, add its CSS next to the other lb- rules). Buttons read the level's
    `label` (e.g. `1-1`, `2-3`) instead of `LV n`, with the lock emoji prefix when locked, as now.
  - Keep `levelBtns` indexed by SOLO_LEVELS index so applyLevels/syncLevels logic is unchanged.
  - Locked toast: `Beat ${SOLO_LEVELS[i - 1].label} to unlock.` (i is the index of the clicked level).
  - Caption: `${name} · Boss: ${n} ${bossNoun}` where bossNoun is `combine(s)` for theme 'lawn' and
    `giant armadillo(s)` for 'desert' (plural when n !== 1). `name` is the text after the first ': ' in def.name as now.
  - The rows must fit on a 360px wide phone screen (6 short buttons in two rows of 3 plus a tag).
- games/sample-3d/src/ui/results.ts:
  - Victory: let def = SOLO_LEVELS[lvl - 1]. Final (lvl === SOLO_LEVELS.length): title 'THE DESERT IS YOURS', line
    'Two worlds, ten giant enemies, one sunburnt gnome.'. Last level of a world (the next level has a different
    world): title `WORLD ${def.world} CLEAR`, line `WORLD ${next.world} UNLOCKED. Pick it in the lobby. Bring water.`
    (or the "You have done this before" line if unlockedLevel is null). Otherwise title `LEVEL ${def.label} CLEAR`
    and the unlock line uses `SOLO_LEVELS[s.unlockedLevel - 1].label` instead of the number.
  - Stats: `Level ${s.soloLevel}` becomes `Level ${SOLO_LEVELS[s.soloLevel - 1].label}`; 'Mowers destroyed' becomes
    'Critters stopped' when that level's theme is 'desert'.
  - Import SOLO_LEVELS from '../config'.

## Contract
Do not change exported function signatures in lobby.ts or results.ts, or anything in config.ts. Online and royale
results (soloLevel null) behave as before.

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/sample-3d` succeeds.
- The lobby in SOLO shows two labelled rows (WORLD 1: 1-1 1-2 1-3, WORLD 2: 2-1 2-2 2-3), locked ones with a lock.

## Out of scope
Every file except games/sample-3d/src/ui/lobby.ts and games/sample-3d/src/ui/results.ts.
~~~~

## Epic 2: desert powers (World 2 only)

Foundation (done directly): `desertOnly` on WeaponDef/PassiveDef, three weapon ids and level tables, passives `pricklyPear` and `boloTie` in stats.ts, `rollChoices(run, count, theme)`, weapon stubs registered in weapons/index.ts. Also per-world unlocks and the SEASON 2 lobby badge.

~~~~text
Epic: 2 Desert powers
Depends on: none
Issue: 2A Saguaro Spine Burst

## Environment
Repo root /home/user/lawn-gnome-panic, game games/sample-3d (Lawn Gnome Panic; three.js 0.187, TypeScript). Other
workers are editing other files of this game at the same time: touch only the one file below. Do not run git commit,
vite build or a dev server.

## Goal
A desert-only weapon: every cooldownS the gnome bursts `count` cactus spines outward in a ring (evenly spaced angles,
starting angle rotated a little each burst so gaps move). Each spine flies straight along the ground plane at `speed`,
hits critters it touches (distance to e.pos < e.radius + 0.3), damages each critter at most once, passes through
`pierce` extra critters, and is removed after hitting pierce+1 critters or flying `range`.

## Change
- games/sample-3d/src/weapons/saguaroSpines.ts: replace the stub. Spine mesh: a thin green-tan cone
  (ConeGeometry(0.05, 0.5, 5), colour 0xcdbf7a) rotated to point along its flight direction, at y = ctx.player.y + 0.6.
  Share one geometry and one material across spines (create once in the factory, dispose in dispose()).
  Play 'shoot' once per burst. Use the table:
  ```ts
  export interface SaguaroSpinesLevel { cooldownS: number; count: number; damage: number; speed: number; range: number; pierce: number }
  export const SAGUARO_SPINES_LEVELS: readonly SaguaroSpinesLevel[];
  ```

## Read first
- games/sample-3d/src/weapons/saguaroSpines.ts: the stub you replace (keep the exported function name and `id`).
- games/sample-3d/src/weapons/leafPileFireball.ts and games/sample-3d/src/weapons/stormOfDaggers.ts: the weapon pattern.
  A factory `(scene) => Weapon` keeps `level` (1..5) set by setLevel (clamp to the table length), a cooldown `timer`,
  and in update(ctx) damages with `ctx.damage(e.id, amount * ctx.stats.damageMult)`, slows with
  `ctx.slow(e.id, factor, seconds)`, multiplies cooldowns by `ctx.stats.cooldownMult`, plays `ctx.playSfx(name)`.
  dispose() removes and disposes everything it added to the scene.
- games/sample-3d/src/config.ts: `interface WeaponContext`, `interface EnemyView` (id, tier, pos (y = 0, use heightAt
  for the ground), radius, hp), `type SfxName`, and the level table named below.
  Table: SAGUARO_SPINES_LEVELS / SaguaroSpinesLevel.

## Contract
```ts
export function createSaguaroSpines(scene: THREE.Scene): Weapon;   // returned weapon has id: 'saguaroSpines'
export interface Weapon { readonly id: WeaponId; setLevel(level: number): void; update(ctx: WeaponContext): void; dispose(): void }
```
Do not edit config.ts or weapons/index.ts (already registered).

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/sample-3d` succeeds.
- The weapon damages critters as described, and dispose() leaves nothing in the scene.

## Out of scope
Every file except games/sample-3d/src/weapons/saguaroSpines.ts.
~~~~

~~~~text
Epic: 2 Desert powers
Depends on: none
Issue: 2B Pocket Haboob

## Environment
Repo root /home/user/lawn-gnome-panic, game games/sample-3d (Lawn Gnome Panic; three.js 0.187, TypeScript). Other
workers are editing other files of this game at the same time: touch only the one file below. Do not run git commit,
vite build or a dev server.

## Goal
A desert-only weapon: a dust storm that always surrounds the gnome. Every tickS, every critter within `radius` (+ its
own radius) of the gnome takes `damage` and is slowed with ctx.slow(id, slowFactor, slowS). No cooldown otherwise.

## Change
- games/sample-3d/src/weapons/haboob.ts: replace the stub. Visual: a THREE.Group following the gnome (position =
  ctx.player each frame) holding 40-60 small dust puffs (one shared SphereGeometry(0.25, 6, 4), one shared
  MeshBasicMaterial colour 0xc9a26b, transparent, opacity 0.45, depthWrite false) that orbit at random radii up to
  `radius` and heights 0.2-1.8, angular speed ~1.5-3 rad/s, with a small bob. Puff orbit radii scale when the level
  changes (store each puff's radius as a 0..1 fraction). Plus a faint ground ring (RingGeometry(radius*0.95, radius, 32)
  rotated flat, same colour, opacity 0.25) rebuilt when the radius changes. No sfx per tick (too noisy).
  Use the table:
  ```ts
  export interface HaboobLevel { radius: number; tickS: number; damage: number; slowFactor: number; slowS: number }
  export const HABOOB_LEVELS: readonly HaboobLevel[];
  ```

## Read first
- games/sample-3d/src/weapons/haboob.ts: the stub you replace (keep the exported function name and `id`).
- games/sample-3d/src/weapons/leafPileFireball.ts and games/sample-3d/src/weapons/stormOfDaggers.ts: the weapon pattern.
  A factory `(scene) => Weapon` keeps `level` (1..5) set by setLevel (clamp to the table length), a cooldown `timer`,
  and in update(ctx) damages with `ctx.damage(e.id, amount * ctx.stats.damageMult)`, slows with
  `ctx.slow(e.id, factor, seconds)`, multiplies cooldowns by `ctx.stats.cooldownMult`, plays `ctx.playSfx(name)`.
  dispose() removes and disposes everything it added to the scene.
- games/sample-3d/src/config.ts: `interface WeaponContext`, `interface EnemyView` (id, tier, pos (y = 0, use heightAt
  for the ground), radius, hp), `type SfxName`, and the level table named below.
  Table: HABOOB_LEVELS / HaboobLevel.

## Contract
```ts
export function createHaboob(scene: THREE.Scene): Weapon;   // returned weapon has id: 'haboob'
export interface Weapon { readonly id: WeaponId; setLevel(level: number): void; update(ctx: WeaponContext): void; dispose(): void }
```
Do not edit config.ts or weapons/index.ts (already registered).

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/sample-3d` succeeds.
- The weapon damages critters as described, and dispose() leaves nothing in the scene.

## Out of scope
Every file except games/sample-3d/src/weapons/haboob.ts.
~~~~

~~~~text
Epic: 2 Desert powers
Depends on: none
Issue: 2C Monsoon Lightning

## Environment
Repo root /home/user/lawn-gnome-panic, game games/sample-3d (Lawn Gnome Panic; three.js 0.187, TypeScript). Other
workers are editing other files of this game at the same time: touch only the one file below. Do not run git commit,
vite build or a dev server.

## Goal
A desert-only weapon: every cooldownS, lightning strikes up to `strikes` different critters within `range` of the
gnome (pick randomly among those in range; if none are in range, retry after 0.25 s). Each bolt deals `damage` to its
target and to every other critter within `splashRadius` of the target. Then it chains: up to `chains` times it jumps
to the nearest not-yet-hit critter within `chainRange` of the last one, dealing 60% damage.

## Change
- games/sample-3d/src/weapons/monsoon.ts: replace the stub. Visual per bolt: a jagged line from 25 units above the
  target down to the ground (THREE.Line with BufferGeometry of 8-10 points with random x/z jitter of ±0.6, colour
  0xfff6a8, LineBasicMaterial), plus a short line for each chain jump between critters at y = 0.6, and a flat flash
  disc (CircleGeometry(splashRadius, 16), MeshBasicMaterial 0xfff6a8, transparent, additive blending) on the ground.
  Each visual fades out over 0.25 s (opacity) and is then removed and disposed. Ground y: heightAt(x, z) from
  '../terrain'. Play 'boom' once per volley.
  Use the table:
  ```ts
  export interface MonsoonLevel { cooldownS: number; strikes: number; damage: number; range: number; chains: number; chainRange: number; splashRadius: number }
  export const MONSOON_LEVELS: readonly MonsoonLevel[];
  ```

## Read first
- games/sample-3d/src/weapons/monsoon.ts: the stub you replace (keep the exported function name and `id`).
- games/sample-3d/src/weapons/leafPileFireball.ts and games/sample-3d/src/weapons/stormOfDaggers.ts: the weapon pattern.
  A factory `(scene) => Weapon` keeps `level` (1..5) set by setLevel (clamp to the table length), a cooldown `timer`,
  and in update(ctx) damages with `ctx.damage(e.id, amount * ctx.stats.damageMult)`, slows with
  `ctx.slow(e.id, factor, seconds)`, multiplies cooldowns by `ctx.stats.cooldownMult`, plays `ctx.playSfx(name)`.
  dispose() removes and disposes everything it added to the scene.
- games/sample-3d/src/config.ts: `interface WeaponContext`, `interface EnemyView` (id, tier, pos (y = 0, use heightAt
  for the ground), radius, hp), `type SfxName`, and the level table named below.
  Table: MONSOON_LEVELS / MonsoonLevel.

## Contract
```ts
export function createMonsoon(scene: THREE.Scene): Weapon;   // returned weapon has id: 'monsoon'
export interface Weapon { readonly id: WeaponId; setLevel(level: number): void; update(ctx: WeaponContext): void; dispose(): void }
```
Do not edit config.ts or weapons/index.ts (already registered).

## Done when
- `cd /home/user/lawn-gnome-panic && npx tsc --noEmit -p games/sample-3d` succeeds.
- The weapon damages critters as described, and dispose() leaves nothing in the scene.

## Out of scope
Every file except games/sample-3d/src/weapons/monsoon.ts.
~~~~

