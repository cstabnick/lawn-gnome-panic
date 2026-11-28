# FX12 result (R1 fix round)

Branch `fix/FX12`. The plan is in `roadmap.md` and the issues are in `issues/`. The lead did the foundation: the D12 paint
rule with its Wasm mirror and parity test, the level data, the run contracts and the lore. Then six Sonnet issues ran in
parallel (A, B1, B2, C, D, P). Shots were re-taken on port 5512 and saved under `review/shots/FX12/` (git-ignored): `p0/`
is the paint alone, `r1/` the desktop re-shoots and `r2/` the phone, night and lodge-slot re-shoots.

| Finding | Status | What changed | Evidence |
|---|---|---|---|
| G4#1 Rise is green (must, D12) | fixed | `landforms/northHighlands.ts` `paint()` (`SNOW_PAINT`), in this order: ice on the pond; a snow apron of r + 30 (±10 fbm) round the pond and the snowfield; gravel above slope 0.45; `thaw` features green inside r with a 28 m patchy frost ring; a 45 m patchy frost band along the region's inner border; snow everywhere else. Mirrored in `assembly/kernel.ts evalRegionPaint` (feature kind `thaw` = 14 in `wasm/gtaWasm.ts`). Level data adds `thaw/capwood` and `thaw/mittenholt-green`. | `landforms/northHighlands.test.ts`: 4,000-cell north-band kernel/JS parity, the pond is ice with a snow apron, Capwood and the green are meadow, ≥ 70 % of the Rise is white. `wasm/gtaWasm.test.ts` passes. Shots `p0/pond`, `p0/roadView`, `p0/capwood`, `p0/mitten`, `r1/fromRoad`, `r2/phonePond` |
| G4#2 how white (must, D12) | fixed | Option (a): snow above the band road, Capwood a spore-thawed hollow with a frost ring, Mittenholt's green kept clear. Ruling R-250; `snowcap-rise.md` updated (look, palette, "In the games"). | `npm run lore` OK; `p0/capwood` |
| G4#4 settling snow (could) | carried over | The Rise is now white, so there is little left to settle on. A region-masked whitening uniform needs the ground material (`terrainMesh`/`textures`) and `weather/`, which FX12 does not own. Handed to the weather/ground owner. | — |
| G4#6 lodge sinks (should) | fixed | A flat child slot `woolly-sock-lodge` (parent `ski-hill`, `flat: true`, in `sites.ts`) levels a pad under the lodge and its porch. A first try with a `reserve` marker broke the rule that no site may cover a reserve. Three snow lumps form a berm on the uphill side. | `r1/lodge`, `r2/lodge`; `sites.test.ts`; golden layout regenerated (scatter shifted around the new keep-out) |
| G4#7 empty slope, ruler edge (should) | fixed | The paint removes the straight snow/meadow edge (the whole hill is white). `hill.ts` adds: piste poles every 30 m (new prefab `piste-pole`); an orange snow fence along the Tea-Tray lane (new `snow-fence`); faint corduroy stripes on the Wool Run (`LAYER.area`); a top-station hut at the tow top; six pine clumps instead of the single pines; flags and huts for every run in `RUNS`; Gentian's class on the Nursery. `slopeLife.ts` adds two skiers and a sledder that thread their runs' gates on loops. | `r1/slopeTop`, `r1/slopeFoot`, `r2/slopeSide`; `hill.test.ts`, `slopeLife.test.ts` |
| G4#8 Wool Run 18 s (should, D26) | fixed | The tow top is at (-325, -1318), speed 10 (≈ 29.5 s up). The Wool Run starts at z -1305 with 11 gates swinging about 52 m across the slope, finishing at z -1045. `BLACK_DIAMOND_S` = 36 (the achievement text says so too). The old course is `NURSERY_RUN` ("the Nursery"), with its own card and `?winter=nursery`. Old saves migrate `best['wool-run']` to `best.nursery` (save `v: 2`) and keep run counts. The Tea-Tray Run stays short. No jump lip: that needs a terrain stamp. | `runtime.test.ts`: a scripted autopilot runs clean in 38.6 s (asserted 35-45 s); `save.test.ts` covers the migration, idempotent |
| G8#22 runs too short (should, D26) | fixed | As G4#8. D26 chose (a), so there is no third run. | as above |
| G4#9 no run-out (should) | fixed | `runtime.ts`: after any finish, a 3 s snowplough brake (2.5 × `brakeMu`) and a "Run-out!" toast. `hill.ts`: a curved corral of hay bales and snow fence at z -976..-996, north of the band road (z ≈ -958). | `runtime.test.ts`: speed < 1 m/s within 4 s, furthest z -1030.6; `r1/slopeFoot` |
| G4#10 plain shed, dark at night (could) | fixed | `woolly-sock-lodge` prefab: windows on every side, and a big striped sock on a boom from the ridge, with heel, toe and bobble. `slopeLife.ts`: `litWindow` panes over the prefab's windows (warm at night), one shared PointLight on the porch at night near the player (or on the tow-base lantern), a `camp-lantern-post` at the tow base, and chimney smoke puffs. | `p1/lodge`, `r1/mug`, `r2/nightLodge` |
| G4#12 empty pond, pail does not read (should) | fixed | `pond.ts`: a light-zinc rim 1.2 m tall with ribs every ~2 m and a rolled lip, and three open crossings with capped ends; a `pail-handle` at size 26 that clears the far rim from the road; the shanties clustered within 18 m of Theo's; a boot-print path; four orange flags; two gnomes jigging on stools. | `r1/fromRoad`, `r1/pondMid`, `r1/shanty`, `r2/phonePond`; `pond.test.ts` (rim ≥ 1 m, shanties within 20 m) |
| G4#13 dead-looking bear (must, D24) | fixed | `critters/snowcap.ts`: the nap bear is curled on its side with its chin down and arms tucked. It has a "Zzz" puff, a new `nap-towel` prefab under it and a folded newspaper beside it. | `r1/napClose`, `r2/phoneNap` (390x844) |
| G4#14 Bear Deck (should) | fixed | `critters/fells.ts`: a new `bear-deck` prefab (22 x 6 m of planks, a rail on three sides, steps at the front) with the chairs and bears on its top, two parasols, and a `bait-cooler` with sardine tins. The sign is 9 m east of the deck centre, angled at the approach, with its text unchanged. | `r1/deckClose`, `r2/phoneDeck`; `snowcap.test.ts` (sign offset) |
| G4#15 invisible mug (could) | fixed | The mug is scaled ×2.4 (the prefab is 0.14 m tall), attached to the bear's right arm, with a steam puff. | `r1/mug`; `snowcap.test.ts` (mug scale) |
| G4#32 lore shops and bounds (could) | fixed | `snowcap-rise.md`: "Shops" names Velma Crown's Top Hat (tea, buns and the view), and the region bounds now read x -1400..1800, z -1800..-900. Recorded in R-250 (5). | `npm run lore` OK |

## Decisions taken by the lead
- "Above the band road" is read as the whole region, since the western band road runs along its southern edge. The
  frost band follows the region's inner border, so the Rise thins to patchy frost where it meets Loch Moss and the east
  and west bands. Next to the Fells it stays mostly white.
- Steep ground turns to gravel from slope 0.45, up from 0.3. The old rule kept high ground white whatever its slope, and
  0.3 would have left grey scars all over a white hill.
- The Nursery keeps the old course and the old bests. `runs['wool-run']` is untouched, so the quest probe
  `winter-ski-runs` still counts only Wool Runs (Nursery finishes do not count).

## Hand-offs and known issues
- G4#5 (the minimap still shows the Rise green): FX19, which samples painted kinds.
- Mittenholt's snow lumps (`living/hamletMittenholt.ts`, not FX12's file) sit on the frost ring round the green.
- The paint grid is 2 m, so the ice edge at Pail Pond shows small square snow cells up close (`r1/pondMid`). This
  predates FX12.
- The ambient riders are small at 50 m and up: no clear close-up was shot.

## Checks
- `npm run build -w games/gnome-theft-auto`: OK.
- `npm test -w games/gnome-theft-auto`: 532 files passed, 4 skipped; 5,554 tests passed. The golden layout was regenerated
  (`UPDATE_GOLDEN=1`) because the lodge slot's keep-out shifts the seeded scatter. The Wasm kernel was rebuilt
  (`npm run build:wasm`), and the parity tests (`wasm/gtaWasm.test.ts`, `landforms/northHighlands.test.ts`) pass.
- `npm test -w packages/prefabs` (4,138) and `npm test -w packages/achievements` (22): OK. `npm run lore`: OK.
- `bash tools/smoke.sh http://localhost:5512/ gta-gnomlet`: SMOKE OK.
- `npm run zfight`: timed out at the pond (puppeteer `protocolTimeout`, as in FX06), and workers B1 and C hit the same at
  the slope, so the new scenery is **not checked for z-fighting**. All the new flat meshes take draw layers: the
  corduroy on `LAYER.area`, the boot prints on `LAYER.marking`. The towel and deck are prefabs whose touching boxes are
  offset, and no flicker showed in the re-shoots.
- `node tools/gta-perf.mjs`: **not measured**, because the machine was loaded by six parallel workers and other epics.
  The density added on the slope (about 40 poles, about 30 fence sections, 3 riders, 1 point light) and on the pond
  (4 flags, 2 gnomes) is small, but GR9's +15 % check is still owed.
- `cutscene-report`: not needed, because no scene changed. Not checked: real touch devices.
- The lodge's striped sock reads from the slope, but from some angles it can read as a striped chimney (`r2/lodge`). It is
  worth a second look in round 2.
