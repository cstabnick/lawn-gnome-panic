Epic: 5 (Terrain variation per region), issue 5F: Loch Moss landforms
Depends on: none

## Goal

Loch Moss (the north-west corner region of Gnome Theft Auto's map, a highland glen around a loch) gets steep rocky glen
walls on the loch's north and west sides, open low ground to the south-east where the river and the spur road arrive,
a rolling moor above the walls, a gravel shingle shore, and a small island in the loch for a later quest, authored as
the region document's `data.terrain` plus its generator `src/landforms/lochMoss.ts`.

## Read first

- `games/gnome-theft-auto/src/landforms/lochMoss.ts`: the stub you replace.
- `games/gnome-theft-auto/src/landforms/types.ts` and `noise.ts`: the contract and helpers (pasted below).
- `games/gnome-theft-auto/src/landforms.test.ts`: the checks (read the `describe.each` block).
- `games/gnome-theft-auto/src/data/levels/loch-moss.level.json`: the document (origin x -600, z -600: region-local =
  world minus (-600, -600), i.e. local = world + 600 on both axes).

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

- Region id `loch-moss`, origin (-600, -600). Border: (-900,-900) (-300,-900) (-300,-600) (-600,-600) (-600,-300)
  (-900,-300), an L shape. The edges x = -900 and z = -900 are the world's edge; the others are inner borders.
- The loch: a still-water rectangle centred (-700, -680), 300 x 240 (x -850..-550, z -800..-560). The water session
  carves it and sets its level from the lowest point of its rim, so high walls do not change the water level.
- Rivers (water paths you must not edit): `river-upper` arrives from the east (-400,-580) (-520,-650) (-570,-665) into
  the loch; `river-ravine` leaves the loch's south-east corner at (-600,-570) going south.
- Highway: `loch-spur` (-720,-30) (-735,-150) (-710,-280) (-720,-480); it ends at (-720,-480), south of the loch.
- No flat sites and no buildings in the region yet. Do not add props: this region's scenery batch cannot hold them yet.

## Change

- `games/gnome-theft-auto/src/landforms/lochMoss.ts`: replace the stub. Keep `export const landform: Landform` with
  `id: 'gta-loch-relief'`, `version: 1`. Implement (params `cx` -700, `cz` -680 are the loch centre in WORLD
  coordinates; store them as params):
  - **Which side**: `open = ((x - cx) + (z - cz)) / (Math.hypot(x - cx, z - cz) * Math.SQRT2 + 1e-6)` (1 toward the
    south-east, -1 toward the north-west), `side = 1 - smoothstep(-0.1, 0.5, open)` (1 on the north and west sides, 0
    on the south-east).
  - **Glen walls**: `wall * smoothstep(wallStart, wallStart + wallWidth, waterDistAt(x, z)) * side` (params `wall` 16,
    `wallStart` 30, `wallWidth` 18): a cliff band that paints rock by itself.
  - **Moor**: `moor * (fbm(x / moorScale, z / moorScale, 61, 3) * 0.5 + 0.5) * smoothstep(20, 80, waterDistAt(x, z))`
    (params `moor` 5, `moorScale` 150), calmed near the road (`* smoothstep(15, 60, roadDistAt(x, z))`).
  - **Island**: for every feature of kind `island` (one point, `r`, `h`), add `h * (1 - smoothstep(r * 0.4, r, d))`. One
    island with id `tessie-island`: world (-760,-720), r 24, h 7 (inside the loch, away from both river mouths).
  - **Paint**: `paint()` returns `'moss'` on an island's top (d < r * 0.4); `'gravel'` where `g.waterDist < shore`
    (param `shore` 14) and the ground is not steep; else null (unpainted is the region's moss ground). Rock comes from
    the shared rule on the walls and the island's sides.
- `games/gnome-theft-auto/src/data/levels/loch-moss.level.json` (through your edit script only): add `data.terrain` with
  the params above and the island feature (region-local: world + 600, so (-160, -120)). `stamps` stay `[]`. No trails.

Tune the numbers until the checks pass (watch the "at most 8 % steeper than 0.6" rule: shorten `wallWidth` less, or
narrow the walled side, if it fails). Keep the landforms visible: the relief standard deviation must stay above 0.5 m,
and the walls must still produce rock.

## Done when

- `npx vitest run src/landforms.test.ts -t loch-moss` passes (promised paint here: `gravel`, `rock`).
- `npx vitest run src/levels.test.ts` passes.
- `npx tsc --noEmit -p .` reports nothing in `src/landforms/lochMoss.ts`.
- `npx vitest run src/adapters/gtaLevel.test.ts` passes in `tools/level-editor`.
- In your report, give the island's world position and top height (`heightAt` there is the water session's business
  once it carves the loch; just report `naturalHeightAt(-760, -720)` from a quick vitest or node check if you can).

## Out of scope

Every other file. In particular: `src/landforms/index.ts`, `fields.ts`, `noise.ts`, `types.ts`, `terrain.ts`,
`terrainPaint.ts`, `config.ts`, `water.ts`, the other regions' documents and landform files, and the document's markers
(including the `water` marker), highways, water paths, props and `base`.
