Epic: FX12 · Issue B1: Snowdrop Slope becomes a place (piste dressing, run-out corral, the lodge on a pad)
Depends on: none
Model: Sonnet (dressing, taste)
Port: 5522

(Paste of `_env.md` goes here when launched.)

## Goal
Snowdrop Slope stops being an empty white plane (G4#7) and the Woolly Sock Lodge stops sinking into it (G4#6): piste
poles along both runs, a top station hut at the tow top, an orange snow fence along the Tea-Tray lane, corduroy groomer
stripes on the Wool Run, pine clumps instead of single framing pines, a curved hay-bale/snow-fence corral as the
run-out before the band road (G4#9's scenery half), and the lodge standing level on its pad.

## Read first
- `src/winter/hill.ts` (all of it: `buildSnowdropSlope`, `HomePiece` list, `buildPieces`, `plateOn`, `skiTrack`, the
  framing pines, Gentian and the learners).
- `src/winter/types.ts`: `LODGE`, `TOW`, `RUNS`, `WOOL_RUN`, `NURSERY_RUN`, `TEA_TRAY_RUN` (read only).
- `src/winter/hill.test.ts` (keeps gates, lines, porch spots and the tow line clear of colliders).
- `src/homes/pieces.ts` (`HomePiece`, `buildPieces`, `prefabBox`, `textPlate`).
- `src/data/levels/north-highlands.level.json`: the marker `reserve/woolly-sock-lodge` (region-local: world = local +
  (0, -1150)); a `reserve` marker flattens the ground within 6 m of its rectangle and blends over 30 m.

## Change
- `src/winter/hill.ts` (you own it, except the two `slopeLife` lines the lead added: keep `buildSlopeLife(life)` and
  `slopeLife.update(...)` as they are):
  - Gates: another worker is moving the Wool Run to start at the summit with 10-12 wide gates and adding the Nursery
    (`NURSERY_RUN`, the old 6-gate course). Place slalom flags for **every gate of every skis run in `RUNS`**, read at
    build time (Wool Run blue/red as now; the Nursery smaller, e.g. scale 0.8, yellow/green), a start hut at each skis
    run's start (`WOOL_RUN.start`, `NURSERY_RUN.start`), finish banners at each distinct finish. The Wool Run hut sign
    must not hard-code "SIX GATES": use `WOOL_RUN.gates.length` in words or digits; the Nursery gets a
    "THE NURSERY / LEARNERS. GENTLE. PROBABLY." style plate (keep the deadpan sign voice).
  - Top station: a hut at `TOW.top` (reuse the `start-hut` prefab, tinted, with a "TOP OF THE BOOTLACE" plate), clear
    of the tow line (hill.test checks it).
  - Piste poles every ~30 m along both edges of the Wool Run corridor and the Tea-Tray lane: prefab `piste-pole`
    (being added to `@lawn/prefabs` by another worker right now; guard with `getPrefab('piste-pole')` like the
    existing `front()` does, so the build never breaks; tint blue for the Wool Run, red for the Tea-Tray Run).
    Not solid.
  - Snow fence: prefab `snow-fence` (also being added; ~4 m long section along local x, orange mesh on two stakes;
    guard with `getPrefab`) along the west side of the Tea-Tray lane (x ≈ `TEA_TRAY_RUN.start.x - 12`), every 4 m, not
    solid.
  - Corduroy: groomer stripes on the Wool Run fall line, a flat mesh following the ground (like `skiTrack`, which uses
    `flatLayer(m, LAYER.marking)`), faint (a slightly bluer white, low contrast, maybe 0.25 opacity with
    `transparent: true`), in parallel bands a metre apart, 8-12 m wide, from the start down to the finish.
  - Run-out corral: a curved line of `hay-bale`s (solid) and `snow-fence` sections south of both finish lines,
    between z ≈ -1000 and -975, bowed toward the slope, ending well north of the band road (z ~-958) and leaving the
    road-side approach and the lodge porch open. A rider braked after the finish (another worker adds the brake) will
    stop before it; nothing solid north of z -1000 on the run lines (hill.test).
  - Pines: replace the 11 single framing pines with 5-7 clumps of 3-5 `snow-pine`s (varied scale and yaw), still clear
    of the runs, the tow and the lodge.
  - Gentian's class: move her and the two learners onto the Nursery strip near its foot (beside the Nursery's lower
    gates), still within 250 m of the update gate. Keep her door registration as is.
  - The lodge: check it stands level on the pad. If the ground still climbs its east wall or buries the porch, tune the
    `reserve/woolly-sock-lodge` marker (`x`, `z`, `hw`, `hd` only) in the level JSON. Add a short snow berm on the
    uphill (north) side with 2-3 low lumps (the `snowman` prefab scaled ~0.25 with tint 0xf4f8ff is what Mittenholt uses
    as a snow lump) if it helps.
- `src/winter/hill.test.ts`: extend for the new pieces (gates of every run clear of colliders; corral north of z -958;
  a top hut near `TOW.top`).

## Contract
- Prefab ids `piste-pole` and `snow-fence` (exact). Read run and tow positions from `types.ts` at build time; never copy
  numbers.
- Only the `reserve/woolly-sock-lodge` marker in the level JSON is yours.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files; `cd games/gnome-theft-auto && npx vitest
  run src/winter/hill.test.ts src/winter/places.test.ts` passes.
- Shots on port 5522 (960x600, and one at `--size 390x844`): `slopeFoot` (-360,-985,3.14), `slopeTop` (-350,-1300,0),
  `slopeSide` (-480,-1150,1.57), `lodge` (-420,-1010,-1.57), `lodgeNorth` (-449,-1045,0). Compare with the editor's
  `slopeFoot.png`, `slopeTop.png`, `lodge.png`: the slope reads as a groomed piste with markers, the lodge is level.
- `npm run zfight -- "http://localhost:5522/?at=-360,-1100,3.14"` (from the repo root) reports no z-fighting in your
  meshes (if it times out, say so).

## Out of scope
`types.ts`, `runtime.ts`, `slopeLife.ts` (skiers, lights, smoke: another worker), the prefab catalog, the pond, bears.
