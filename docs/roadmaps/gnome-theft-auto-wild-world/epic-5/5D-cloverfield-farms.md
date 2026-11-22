Epic: 5 (Terrain variation per region), issue 5D: Cloverfield Farms landforms
Depends on: none

## Goal

Cloverfield Farms (the south region of Gnome Theft Auto's map) gets gentle rolling hills that sink toward the Puddle
Sea, two terraced fields, a raised farmyard at Granny's farm, muddy pens and a sandy beach by the Puddle Sea, authored as
the region document's `data.terrain` and `stamps` plus its generator `src/landforms/cloverfieldFarms.ts`.

## Read first

- `games/gnome-theft-auto/src/landforms/cloverfieldFarms.ts`: the stub you replace.
- `games/gnome-theft-auto/src/landforms/types.ts` and `noise.ts`: the contract and helpers (pasted below).
- `games/gnome-theft-auto/src/landforms.test.ts`: the checks (read the `describe.each` block).
- `games/gnome-theft-auto/src/data/levels/cloverfield-farms.level.json`: the document (origin x 0, z 400: region-local
  = world minus (0, 400), i.e. local z = world z - 400).

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it). Git Bash on
  Windows. If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Run the game's commands from
  `games/gnome-theft-auto` (`cd /c/Users/cpsai/orca/workspaces/lawn-gnome-panic/pomfret/games/gnome-theft-auto`).
- Five other workers are filling the other regions' landform files right now, and two other sessions (water and
  wildlife) are editing `water.ts`, `terrain.ts`, `surfaces.ts`, `config.ts`, `critters*` and other files of this game.
  Touch ONLY the files listed under Change. If `npx tsc` or a test reports errors in files you do not own, ignore them.
  If a run crashes inside another file (mid-edit), wait a minute and run it again.
- Do not commit, push, start a dev server, run `npm run build` or regenerate `layout.golden.json`.
- Repo rules that apply: assets are code-generated only; anything new to see goes through the prefab library (reuse an
  existing prefab); no player-visible names are added here (feature ids are internal).

## How the ground is built (already in place; read, do not change)

All in metres, +z is south, north is -z. For every point:

1. natural = amplitude x ( tiltAt(x, z) + mask(x, z) x yourRelief(x, z) ), then the region documents' `stamps`
   (`gauss` / `flatten`, applied in list order, NOT masked).
2. Highways, then trails, are flattened across, following the natural height of their centre line along their length.
3. Flat sites: Fort Sandpit, the airfield, and every `reserve` marker rectangle are made flat at the natural height of
   their centre. Then Turfton (the square |x|, |z| <= 215) is exactly 0.
4. The water session carves the river, canal, loch and Puddle Sea into the result.

- `mask` is 0 on every inner region border, fading in to 1 over 50 m, and 0 within 10 m of a river or canal bank, back
  to 1 at 40 m. So your relief never has to fade itself at borders or rivers, and it can be large right up to them.
- `tiltAt`: 0 for |z| <= 263, then +0.004 m per m going north (+2.5 m at z = -900) and -0.004 per m going south.
- Your `relief(x, z, input)` gets WORLD coordinates, and `input.features` already moved to WORLD coordinates. In the
  region DOCUMENT (stamps, paths, features, props) everything is REGION-LOCAL: world minus the region origin.
- Stamps are not masked: keep every stamp at least 60 m (centre to highway) plus its `outer`/`2*sigma` from highways
  and at least 40 m from rivers.
- Steep ground (rise over run >= 0.8) is painted rock automatically. A trail (below) is painted dirt automatically.
  Ground within 6 m of a river bank is mud unless your `paint()` says otherwise.

## The contract (`src/landforms/types.ts`, verbatim; do not change it)

```ts
export type PaintKind =
  | 'rock' | 'dirt' | 'gravel' | 'mud' | 'ice' | 'snow' | 'sand' | 'grass' | 'farm' | 'forest' | 'moss' | 'meadow';
export interface LandformFeature { id: string; kind: string; points: [number, number][]; r?: number; h?: number }
export interface LandformInput { params: Readonly<Record<string, number>>; features: readonly LandformFeature[] }
export interface GroundFacts {
  height: number;     // heightAt, metres (after roads and sites are flattened)
  slope: number;      // rise over run
  riverDist: number;  // metres from the nearest river or canal bank, 0 on the water
  waterDist: number;  // metres from any water (river bank, loch or Puddle Sea edge), 0 inside a loch/sea
  region: RegionId;
}
export interface Landform {
  id: string;        // must equal the document's data.terrain.relief.id
  version: number;   // must equal data.terrain.relief.version
  relief(x: number, z: number, input: LandformInput): number;   // metres, world x/z; must be cheap (runs ~1M times)
  paint?(x: number, z: number, g: GroundFacts, input: LandformInput): PaintKind | null;   // null = not mine
}
```

`forest`, `moss` and `meadow` paint drive like grass and show those textures; `farm`, `sand`, `snow`, `mud`, `ice`,
`gravel`, `dirt`, `rock` drive and look as named. Unpainted ground (null) keeps the region's own texture and surface.

Helpers you may import (and nothing else from the game):

```ts
import { fbm, ridged, valueNoise, distToPolyline, nearestOnPolyline, smoothstep, clamp } from './noise';
// valueNoise(x, z, seed) in [-1, 1], one feature per unit: scale the input, e.g. valueNoise(x / 80, z / 80, 3)
// fbm(x, z, seed, octaves = 4, gain = 0.5, lacunarity = 2) about [-1, 1]
// ridged(x, z, seed, octaves = 3) in [0, 1], 1 on winding crests
// distToPolyline(x, z, points) metres; nearestOnPolyline(x, z, points) -> { d, s (metres along), len }
// smoothstep(a, b, v) 0..1; clamp(v, lo, hi)
import { roadDistAt, riverDistAt, waterDistAt } from './fields';
// metres from the nearest highway centre line / river bank / any water (4 m accuracy fields, cheap lookups)
import type { Landform, LandformInput, GroundFacts, PaintKind } from './types';
```

Keep relief cheap: at most 4 octaves of noise in total per call, plus one loop over `input.features`.

## The document block you add

In your region's document, add `data.terrain` as the LAST key of `data` (after `border`):

```json
"terrain": {
  "relief": { "id": "<your generator id>", "version": 1, "params": { "<name>": <number>, ... } },
  "features": [ { "id": "<id>", "kind": "<kind>", "points": [[x, z], ...], "r": <number>, "h": <number> } ]
}
```

`params` values must all be numbers. Features: `points` at least one `[x, z]` (region-local), `r` and `h` optional
numbers. Read every tuning number from `input.params` (with the same defaults in code is fine) and every shape from
`input.features`, so the numbers live in the document, not in the code.

Trails (off-road dirt tracks) are paths in the same document: `{ "id": "trail/<region>-<name>", "kind": "road",
"points": [[x, z], ...], "width": 4 }`, region-local. They get no traffic and are not highways; they are flattened across
and painted dirt. Add trails at the END of `paths`; never change or reorder existing paths.

**How to edit the document.** The level editor test requires the file to be exactly `JSON.stringify(doc, null, 2) +
"\n"` with its key order kept. Do not hand-edit the JSON. Write a small Node script in your scratch folder (NOT in the
repo), for example `C:/Users/cpsai/AppData/Local/Temp/claude/580443193e58038f/4ef1f3a1-2e4b-4e06-b989-b484b67e0320/scratchpad/epic5-<region>/edit.mjs`
(create the folder):

```js
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'C:/Users/cpsai/orca/workspaces/lawn-gnome-panic/pomfret/games/gnome-theft-auto/src/data/levels/<region>.level.json';
const doc = JSON.parse(readFileSync(file, 'utf8'));      // read right before writing: other sessions edit this file too
doc.data.terrain = { relief: { id: '...', version: 1, params: { /* ... */ } }, features: [ /* ... */ ] };
doc.stamps = [ /* yours */ ];                             // stamps start empty in every region; you own them
doc.paths = doc.paths.filter((p) => !p.id.startsWith('trail/')).concat([ /* your trails */ ]);
writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
```

Run it with `node <path>/edit.mjs` every time you change numbers. Never touch `markers`, `water` paths, highways,
`base`, `bounds` or the other `data` keys: other sessions own them.

## Checks (all from `games/gnome-theft-auto`)

- `npx vitest run src/landforms.test.ts -t <region-id>` : your region's block passes. Its rules:
  - `data.terrain` present, relief id equals your generator's id, and the relief plus stamps have a standard deviation
    above 0.5 m over the region;
  - every height in the region between -30 and 40 m;
  - every highway and trail, where it runs through your region, climbs at most 0.16 (highways) / 0.30 (trails) rise
    over run along its length (sampled every 2 m);
  - at most 8 % of the region's land steeper than 0.6;
  - along every river, the natural height never rises more than 1.5 m above its lowest point upstream;
  - every `reserve` site (and the fort and airfield) stays flat to 0.05 m;
  - every building-sized collider (both sides >= 2.5 m) has at most 1.2 m of height difference under its footprint;
  - the promised paint kinds appear somewhere in the region.
  A failure message names the place (coordinates): move or shrink the landform there and run again.
- `npx vitest run src/levels.test.ts` passes (the document validator).
- `npx tsc --noEmit -p .` shows no errors in your files (`src/landforms/<yours>.ts`).
- From `tools/level-editor` (`cd ../../tools/level-editor`): `npx vitest run src/adapters/gtaLevel.test.ts` passes (the
  document round-trips byte for byte).

## The region (world coordinates)

- Region id `cloverfield-farms`, origin (0, 400). Border: (-215,215) (215,215) (900,900) (-300,900) (-300,600)
  (-600,600). The edge z = 900 is the world's edge; the others are inner borders. On the east side the region is the
  points south of the diagonal (z > x).
- Highways through it: `south` (0,180) (0,260) (-40,320) (10,390) (60,450) (40,570); `ring-se` (60,450) (200,400)
  (320,250) (300,40); `south-outer` (40,570) (30,660) (-10,760) (0,870); `ring-sw` (from Mossy Wood's document)
  (-300,150) (-200,290) (-40,320).
- Water you must not edit: the canal (-190,230) to (190,230); the farm river (`river-farm`, width 12) (190,230)
  (260,330) (330,460) (440,600) (560,720) (660,800); the Puddle Sea, a still-water rectangle x 490..890, z 770..890.
- Flat sites (`reserve` markers, already flat at their centre's height): Granny's farm (-80,340) half 20; Biscuit's nap
  (80,380) half 22; the canal banks; Brenda's throne (-48,222); dew stations (78,466) and (20,282).
- Building-sized colliders (rounded to 20 m) you must keep on level ground: (-100..-80, 340) (80,380) (80,460) (20,280)
  (-40,220) (60,240) (-280..-240, 540..560) (160..200, 340..360) (320..360, 480..500) (360..380, 700..720).

## Change

- `games/gnome-theft-auto/src/landforms/cloverfieldFarms.ts`: replace the stub. Keep `export const landform: Landform`
  with `id: 'gta-farms-relief'`, `version: 1`. Implement:
  - **Rolling hills**: `hills * fbm(x / hillScale, z / hillScale, 41, 3)` (params `hills` 3.5, `hillScale` 200), times
    `(1 - 0.8 * smoothstep(560, 760, z))` so the land flattens toward the Puddle Sea, and minus
    `seaDip * (1 - smoothstep(0, 160, waterDistAt(x, z))) * smoothstep(600, 740, z)` (param `seaDip` 2) so the shore
    falls to the sea.
  - **Calm spots**: for every feature of kind `calm` (one point, `r`), multiply the hills by `smoothstep(r, r + 40, d)`.
    Add calm features wherever the building check fails (start with (180,350) r 50 and (340,490) r 50).
  - **Terraces**: for every feature of kind `terrace` (one point, `r`, `h`), with `f = 1 - smoothstep(0, r, d)`,
    `level = h * f`, add a stepped hill: `step * (Math.floor(level / step) + smoothstep(0.7, 1, level / step - Math.floor(level / step)))`
    (param `step` 1.5). Two terraces: (-120,700) r 60 h 6; (250,620) r 55 h 6.
  - **Pens**: features of kind `pen` (one point, `r`) are paint only (no height).
  - **Paint**: `paint()` returns `'mud'` inside a pen (d < r); `'farm'` on a terrace (d < r of a terrace feature);
    `'sand'` where `g.waterDist < 14 && z > 740` (the Puddle Sea beach); else null (unpainted is the farm ground).
- `games/gnome-theft-auto/src/data/levels/cloverfield-farms.level.json` (through your edit script only): add
  `data.terrain` with the params above and the features (region-local: subtract 400 from every z), with pens at world
  (-60,368) r 10, (100,412) r 12, (180,378) r 10, (345,522) r 10, (372,742) r 10. Set `stamps` to one raised farmyard:
  `{ "op": "gauss", "x": -80, "z": -60, "sigma": 40, "amount": 2.5 }` (region-local for Granny's farm at world
  (-80,340): the flat-site pass then holds the yard flat on top of the rise).

Tune the numbers (or move a terrace or pen up to 60 m, staying inside the border) until the checks pass. Keep the
landforms visible: the relief standard deviation must stay above 0.5 m.

## Done when

- `npx vitest run src/landforms.test.ts -t cloverfield-farms` passes (promised paint here: `mud`, `farm`).
- `npx vitest run src/levels.test.ts` passes.
- `npx tsc --noEmit -p .` reports nothing in `src/landforms/cloverfieldFarms.ts`.
- `npx vitest run src/adapters/gtaLevel.test.ts` passes in `tools/level-editor`.

## Out of scope

Every other file. In particular: `src/landforms/index.ts`, `fields.ts`, `noise.ts`, `types.ts`, `terrain.ts`,
`terrainPaint.ts`, `config.ts`, `water.ts`, the other regions' documents and landform files, and the document's
markers (including the `water` markers), highways, water paths, props and `base`.
