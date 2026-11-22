Epic: 5 (Terrain variation per region), issue 5B: Mossy Wood landforms
Depends on: none

## Goal

Mossy Wood (the west region of Gnome Theft Auto's map) gets a rolling forest floor, a ravine (raised banks either side
of the river that runs through it), mossy boulders, and forest-floor paint with mud along the river, authored as the
region document's `data.terrain` plus its generator `src/landforms/mossyWood.ts`.

## Read first

- `games/gnome-theft-auto/src/landforms/mossyWood.ts`: the stub you replace.
- `games/gnome-theft-auto/src/landforms/types.ts` and `noise.ts`: the contract and helpers (pasted below).
- `games/gnome-theft-auto/src/landforms.test.ts`: the checks (read the `describe.each` block).
- `games/gnome-theft-auto/src/data/levels/mossy-wood.level.json`: the document (origin x -400, z 0: region-local =
  world minus (-400, 0), i.e. local x = world x + 400).

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

- Region id `mossy-wood`, origin (-400, 0). Border: (-215,-215) (-215,215) (-600,600) (-600,300) (-900,300) (-900,-300)
  (-600,-300) (-600,-600). The edge from (-900,-300) to (-900,300) is the world's edge; every other edge is an inner
  border.
- Highways through it: `west` (-180,0) (-250,-20) (-320,20) (-400,0) (-470,-30) (-570,-30); `ring-sw` (-320,20)
  (-300,150) (-200,290) (-40,320); `west-outer` (-570,-30) (-650,-20) (-720,-30) (-870,-30); and, from other regions'
  documents but running through here, `ring-nw` ending (-340,-190) (-400,0), `loch-spur` (-720,-30) (-735,-150)
  (-710,-280), `commons-spur` (-720,-30) (-705,110) (-735,240).
- The river (`river-ravine`, width 10, a water path you must not edit): (-600,-570) (-590,-420) (-550,-260) (-500,-130)
  (-482,-30) (-440,70) (-380,150) (-300,205) (-260,230) (-190,230). Highways cross it at (-482,-30) and about
  (-243,230): bridges go there, so keep the banks low near those two points.
- Flat sites (`reserve` markers, already flat): (-255,-60) half 22; (-360,40) half 16; (-290,-28) half 9; (-560,40) half
  15; (-590,-120) half 8.
- Building-sized colliders (rounded to 20 m) you must keep on level ground: (-240..-280, -80..20) (-340..-380, 20..100)
  (-560, 40..100) (-580,400) (-520,460) (-440,140) (-380,-360) (-520,80) (-280,-260) (-480,-80) (-400,260) (-480,400)
  (-240,80) (-420,220) (-400,-400) (-420,200) (-460,-80) (-400,-340) (-640,140) (-660,-80) (-760,-260) (-780,-120)
  (-760,-180) (-860,260) (-780,20) (-420..-400, -100..-80).

## Change

- `games/gnome-theft-auto/src/landforms/mossyWood.ts`: replace the stub. Keep `export const landform: Landform` with
  `id: 'gta-mossy-relief'`, `version: 1`. Implement:
  - **Rolling floor**: `floor * fbm(x / floorScale, z / floorScale, 21, 3)` (params `floor` 3.5, `floorScale` 180).
  - **Ravine banks**: `bank * (1 - smoothstep(bankReach, bankReach + bankFall, riverDistAt(x, z)))`, calmed near
    highways (`* smoothstep(20, 120, roadDistAt(x, z))`, so the two bridge approaches stay gentle). The caller's mask
    already holds the ground at river level within 10 m of the bank and lets the bank rise until 40 m out, so the river
    runs in a trough. Params `bank` 7, `bankReach` 40, `bankFall` 60.
  - **Calm spots**: for every feature of kind `calm` (one point, `r`), multiply floor and banks by
    `smoothstep(r, r + 40, distance)`. Add calm features wherever the building check fails (start with (-260,-40) r 50
    and (-370,60) r 50).
  - **Paint**: `paint()` returns `'mud'` when `g.riverDist < muddy` (param `muddy` 14), `'moss'` where
    `fbm(x / 90, z / 90, 5, 2) > 0.35`, else `'forest'` (forest floor that drives like grass).
- `games/gnome-theft-auto/src/data/levels/mossy-wood.level.json` (through your edit script only): add `data.terrain`
  with the params above and the calm features (region-local: add 400 to every x), and append to `props` (the existing
  props stay first, unchanged) 12 mossy boulders: `{ "prefab": "garden-rock", "x": <local x>, "z": <local z>,
  "rot": <0..6.28>, "scale": <6..9>, "solid": true }`. Put each boulder at least 30 m from every highway centre line
  listed above, at least 25 m from the river line, at least 30 m from every flat site and building position listed
  above, and inside the border. Good world spots to start from: (-650,-200) (-700,-120) (-820,-200) (-850,120)
  (-700,200) (-640,250) (-520,-300) (-460,-420) (-330,-120) (-530,300) (-330,330) (-450,520). `garden-rock` is an
  existing prefab (a rounded boulder with moss on top), so no new prefab is needed.
- `stamps` stay `[]`.

Tune until the checks pass (boulders count as buildings in the level-ground check: on a slope, move them). Keep the
landforms visible: the relief standard deviation must stay above 0.5 m.

## Done when

- `npx vitest run src/landforms.test.ts -t mossy-wood` passes (promised paint here: `mud`, `forest`).
- `npx vitest run src/levels.test.ts` passes (it also checks that every prop is a known prefab).
- `npx tsc --noEmit -p .` reports nothing in `src/landforms/mossyWood.ts`.
- `npx vitest run src/adapters/gtaLevel.test.ts` passes in `tools/level-editor`.

## Out of scope

Every other file. In particular: `src/landforms/index.ts`, `fields.ts`, `noise.ts`, `types.ts`, `terrain.ts`,
`terrainPaint.ts`, `config.ts`, `biomes.ts`, the other regions' documents and landform files, and the document's
markers, highways, water paths and `base`.
