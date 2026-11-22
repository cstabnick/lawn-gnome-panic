Epic: 5 (Terrain variation per region), issue 5A: Dust Flats landforms
Depends on: none

## Goal

The Dust Flats (the east wedge of Gnome Theft Auto's map) stop being flat: a gentle sandy swell with dune fields, three
mesas with rock sides, a dry canyon, and two dirt tracks, all authored as the region document's `data.terrain`, plus
its generator `src/landforms/dustFlats.ts`. Fort Sandpit and the airfield stay flat (already guaranteed by the flat-site
pass).

## Read first

- `games/gnome-theft-auto/src/landforms/dustFlats.ts`: the stub you replace.
- `games/gnome-theft-auto/src/landforms/types.ts` and `noise.ts`: the contract and helpers (pasted below).
- `games/gnome-theft-auto/src/landforms.test.ts`: the checks (read the `describe.each` block).
- `games/gnome-theft-auto/src/data/levels/dust-flats.level.json`: the document (origin x 400, z 0: region-local =
  world minus (400, 0)).

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

- Region id `dust-flats`, origin (400, 0). Border: the wedge (215, -215) (900, -900) (900, 900) (215, 215), i.e. the
  points with x >= |z| and x >= 215. The two diagonal edges and the Turfton edge x = 215 are inner borders (relief fades
  out over 50 m there); x = 900 is the world's edge (no fade).
- Highways: `east` (180,0) (250,0) (300,40) (374,70) (450,70) (520,30) (570,30); `fort-gate` (374,70) (374,34);
  `airfield-spur` (450,70) (450,-70) (500,-70); `ring-ne` (300,40) (335,-90) (250,-230) (40,-330); `east-outer`
  (570,30) (650,20) (760,50) (870,50).
- Flat sites: Fort Sandpit x 340..408, z -34..34; the airfield runway x 395..565, z -119..-101 plus its apron; dew
  stations at (374, 88) and (452, 88). They stay flat by themselves.
- No rivers run through the Dust Flats.
- Building-sized colliders (rounded to 20 m) you must keep on level ground: (340..420, -160..240) around the fort and the
  village north of it, (560,-460) (540,-540) (300,280) (280,180) (440,180) (420,200) (560,240) (420,-280) (580,-120)
  (560,100) (560,-80) (560,-20) (220,-220) (760,-300) (700,-380) (840,-540) (880,-320) (620,-180) (720,320) (780,140)
  (720,140) (740,120) (800,760) (800,-680).

## Change

- `games/gnome-theft-auto/src/landforms/dustFlats.ts`: replace the stub. Keep `export const landform: Landform` with
  `id: 'gta-dust-relief'`, `version: 1`. Implement:
  - **Swell**: `swell * fbm(x / swellScale, z / swellScale, 11, 2)` (params `swell` 3, `swellScale` 240).
  - **Dunes**: rotate (x, z) by `windAngle` (u = x cos a + z sin a, v = -x sin a + z cos a), then
    `duneHeight * ridged(u / duneLength, v / duneSpacing, 7, 2)`, faded where the dune field is thin
    (`smoothstep(-0.1, 0.3, valueNoise(x / 420, z / 420, 5))`) and calmed near highways
    (`0.3 + 0.7 * smoothstep(15, 70, roadDistAt(x, z))`). Params `duneHeight` 1.4, `duneSpacing` 60, `duneLength` 240,
    `windAngle` 0.6.
  - **Calm spots**: for every feature of kind `calm` (one point, `r`), multiply swell and dunes by
    `smoothstep(r, r + 40, distance)`. Add calm features wherever the building check fails (start with one at the
    village (380, 180) r 70 and one at (560, -40) r 60).
  - **Mesas**: for every feature of kind `mesa` (one point, `r` top radius, `h` height), add
    `h * (1 - smoothstep(r, r + h * 1.2, d))` (d = distance to the point): a flat top and sides about 0.8-1.2 steep, so
    they paint rock. Three mesas: (680, -280) r 26 h 10; (650, 420) r 22 h 9; (480, -400) r 20 h 8.
  - **Canyon**: for every feature of kind `canyon` (a polyline, `r` half width at the rim, `h` depth), subtract
    `h * (1 - smoothstep(r * 0.35, r, distToPolyline(x, z, points)))`. One canyon: (560,360) (660,470) (760,620)
    (780,660), r 16, h 7.
  - **Paint**: `paint()` returns `'gravel'` on a canyon floor (distance < r * 0.35 of a canyon feature), else null
    (unpainted is sand). Rock and dirt come from the shared rules.
- `games/gnome-theft-auto/src/data/levels/dust-flats.level.json` (through your edit script only): add `data.terrain`
  with the params above and the features (region-local: subtract 400 from every x), and two trails at the end of
  `paths`:
  - `trail/dust-mesa` world (650,22) (665,-80) (680,-180) (680,-240), width 4;
  - `trail/dust-canyon` world (530,30) (520,140) (530,250) (545,335), width 4.
  `stamps` stay `[]` (the mesas are features, not stamps).

Tune the numbers (or move a mesa, canyon point or trail up to 60 m) until the checks pass. Keep the landforms visible:
the relief standard deviation must stay above 0.5 m, and mesas and the canyon must still produce some rock.

## Done when

- `npx vitest run src/landforms.test.ts -t dust-flats` passes (promised paint here: `dirt`, `rock`).
- `npx vitest run src/levels.test.ts` passes.
- `npx tsc --noEmit -p .` reports nothing in `src/landforms/dustFlats.ts`.
- `npx vitest run src/adapters/gtaLevel.test.ts` passes in `tools/level-editor`.

## Out of scope

Every other file. In particular: `src/landforms/index.ts`, `fields.ts`, `noise.ts`, `types.ts`, `terrain.ts`,
`terrainPaint.ts`, `config.ts`, the other regions' documents and landform files, and the document's markers, highways,
props and `base`.
