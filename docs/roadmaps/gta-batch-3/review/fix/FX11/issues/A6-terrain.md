Epic: FX11 A (coast fixes, parallel) · Issue A6: sand round the town, a dune band, a bending Saltcut (G3#5 c, D14; G3#26 shape)
Depends on: none · Agent: Sonnet · Dev port 5526

(The Environment section the lead gave you applies.)

## Goal
Decision D14 (final): "Sand paint under and around the boardwalk and the wheel. A dune band at z about 1060-1090." Today the boardwalk sits on bright mown lawn: the coast region paints sand only for z > 1130 and grass inland. After this issue:
1. The ground is sand (not lawn) round the whole town: for |x| <= 460 from z 1040 south (under the boardwalk, round the Spokewheel at (-260, 1100), the coast spur's last 20 m, the pier spur), and as before for z > 1130 everywhere. Further than 460 m east or west, the lawn still comes down to z 1130 (Dunelow at (-560, 950) keeps its grass).
2. A band of real dunes (terrain, so the player walks over them) at z about 1058-1092 across x -1000..1000, made of hand-placed gauss stamps in the region document, with gaps where they must not be (below).
3. The Saltcut (water path `saltcut`) bends gently once or twice on its way to the sea instead of running ruler-straight; the road bridge over it stays where it is.

## Read first
- `games/gnome-theft-auto/src/landforms/southShore.ts` (the region's relief and `paint(x, z, g)`: today `z > 1130 ? 'sand' : 'grass'`).
- `games/gnome-theft-auto/assembly/kernel.ts` around line 1156: `if (reg == 8) return z > 1130.0 ? 7 : 8; // south-shore` (the Wasm mirror of the same rule; 7 = sand, 8 = grass; check `x` is in scope in that function, it is used by the rules above it).
- `games/gnome-theft-auto/scripts/build-wasm.mjs` (`npm run build:wasm -w games/gnome-theft-auto` regenerates `src/wasm/kernelBytes.ts` from kernel.ts; commit-ready output, do not hand-edit kernelBytes.ts) and `src/wasm/gtaWasm.test.ts` (the parity test: JS paint and Wasm paint must agree).
- `games/gnome-theft-auto/src/data/levels/south-shore.level.json`: `stamps` (empty today), `paths` (the `saltcut` water path, width 14), `markers` (slots). Region-local coordinates: world x = local x, world z = local z + 1150 (the `boardwalk` slot at local z -35 is world z 1115). Stamp format (`packages/level/src/types.ts`): `{ "op": "gauss", "x": <local x>, "z": <local z>, "sigma": <m>, "amount": <m> }`. Heights are `amplitude` (1) x (relief + stamps); flat sites (`boardwalk` z 1090..1140, `ferris-wheel` x -290..-230 z 1070..1130) and roads are flattened over them.
- `games/gnome-theft-auto/src/coast/config.ts` (`COAST.dunes`, `COAST.bucket`, `COAST.spokewheel`) for the places to avoid.
- Tests that read this ground: `src/levels.test.ts` (Saltcut: first point in the Puddle Sea, last in the Saltwater), `src/water.test.ts` (the `saltcut x south-band-east` bridge; every Saltcut sample at least 1.2 m deep), `src/wasm/gtaWasm.test.ts`, `src/terrainPaint.test.ts`, `src/coast/*.test.ts`, `src/tubing/*.test.ts`.

## Change
1. `src/landforms/southShore.ts` `paint`: `return z > 1130 || (Math.abs(x) <= 460 && z > 1040) ? 'sand' : 'grass';` (rename `_x` to `x`), and update the file's top comment.
2. `assembly/kernel.ts`: the same rule for reg 8 (`z > 1130.0 || (Math.abs(x) <= 460.0 && z > 1040.0) ? 7 : 8`, AssemblyScript: use `abs<f64>(x)` or `Math.abs` as the file already does elsewhere), then `npm run build:wasm -w games/gnome-theft-auto`.
3. `src/data/levels/south-shore.level.json` `stamps`: 40-70 hand-placed gauss stamps making an irregular dune ridge line along local z -92..-58 (world 1058..1092): sigma 5-10, amount 1.0-3.2, centres jittered in z by +-8 m and spaced 12-30 m apart in x so it reads as a chain of dunes with saddles, taller in the middle of each group. Keep every stamp centre at least 2 x sigma away from: the coast spur's path |x| <= 9 (world (0, 1060..1102): the walk to the boardwalk); the Spokewheel site (x -300..-220 for any z > 1050); the boardwalk rect (world z >= 1100 for |x| <= 215); the bucket ring (centre world (0, 1028), radius 20: keep stamps out of x -30..30 for z < 1066); the Saltcut channel (x 680..800); the south-band roads (world z < 1010). Order the stamps west to east in the file. Then check the heights with a small script or test: `heightAt` along z 1075 every 10 m from x -1000 to 1000 should rise and fall by 1-3 m; at (0, 1075), (0, 1100), (-260, 1100), (150, 1150) it must be unchanged (flat sites, path) within 0.05 m of before.
4. Same file, the `saltcut` path: keep its first three points `[700, -268], [715, -200], [735, -120]` (the south-band-east road crosses between the 2nd and 3rd: the bridge must not move) and replace the rest with a gentle S-bend ending in the sea: `[752, -75], [748, -30], [732, 15], [728, 55]`. Width stays 14. (World: the mouth is about (730, 1190); the east bank by the mouth is about (746, 1186).) If a test says a sample is too shallow, nudge the middle points (keep the bend) until it passes.
5. Update tests only where they encode the old ground on purpose (an exact old paint value or height in the region); never loosen an unrelated assertion. If a golden layout file fails only because ground heights in the south band changed (scenery on the new dunes), regenerate it the way its test file says, and list it in your report.

## Contract
`landform.paint` signature unchanged. The Saltcut's world mouth is about (730, 1190); the quest stop and the daymark are placed by other workers at the east bank about (746, 1186): make sure that point is dry ground (`waterDepthAt(746, 1186) === 0`) and within 25 m of the channel; if your bend moves the mouth, report the exact dry east-bank point you checked instead.

## Done when
- `npm run build:wasm -w games/gnome-theft-auto` ran and `src/wasm/kernelBytes.ts` changed.
- `cd games/gnome-theft-auto && npx vitest run src/wasm src/terrainPaint.test.ts src/levels.test.ts src/water.test.ts src/landforms.test.ts src/coast src/tubing src/boatTraffic.test.ts` passes (rerun a file alone if it times out under load).
- `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Look at it: dev server on port 5526, shots `entr:0,1040,0 bwwest:-200,1096,1.4 wheel:-230,1060,-0.6 dunes:-120,1050,0.3 saltcut:760,1120,0.2 dunesP:0,1040,0 --size 390x844` (one run per size; the last at phone size). Compare with the editors' `a01-entr.png`, `a04-bwwest.png`, `a05-wheel.png`, `a12-saltcut.png`. Sand must reach the boardwalk and the wheel, the dunes must read as dunes, the Saltcut must bend. Iterate on the stamps until the line of dunes looks natural (not a row of identical bumps).

## Out of scope
`src/coast/*.ts` (other workers), `src/boatTraffic.ts` (another worker moves the Saltcut boat's end point), the minimap code.
