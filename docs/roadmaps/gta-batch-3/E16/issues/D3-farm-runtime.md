Epic: E16-C (countryside, scenery wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`games/gnome-theft-auto/src/farm/runtime.ts` is the living Windfall Croft: buy it at the For Sale board (E08 property +
loan), pick seeds, plant, water, watch the plants grow stage by stage on game time (and while the game was closed,
capped), harvest into the bag (overflow into the croft crate), sell at the stall, plant the oak and shake acorns from it
much later; saved locally; every action on the E / touch action button.

## Read first
- `games/gnome-theft-auto/src/farm/types.ts` (`CROPS`, `cropDef`, `BED_CROPS`, `FARM`, `BEDS`, `BED`, `CROFT`,
  `FarmState`, `FarmEvent`) and `games/gnome-theft-auto/src/farm/state.ts` (the finished pure simulation: `newFarm`,
  `bedStatus`, `plantCrop`, `waterBed`, `harvest`, `plantOak`, `oakReady`, `shakeOak`, `stepFarm`, `applyOffline`,
  `bedSecondsLeft`, `oakSecondsLeft`, `serializeFarm`, `parseFarm`).
- `games/gnome-theft-auto/src/farm/runtime.ts` (the stub: keep `FarmRuntime`, `farmState()`, `installFarm(deps)`) and
  `games/gnome-theft-auto/src/farm/events.ts` (`emitHarvest`).
- `docs/roadmaps/gta-batch-3/E08/contracts.md` sections "Properties" and "Inventory"; in code
  `src/ownership.ts` (`registerProperty`, `buyProperty`, `ownsProperty`, `onPropertyChange`, `PropertyDef` incl.
  `buyHint`) and `src/inventory.ts` (`registerItem`, `addItem` (returns how many fitted), `count`,
  `activeInventory()?.remove(id, n)`).
- `games/gnome-theft-auto/src/jobs/types.ts` `JobsDeps` (`scene`, `economy` (`spend(n, reason): boolean`,
  `earn(n, reason)`), `hud` (`toast`), `player`).
- `games/gnome-theft-auto/src/homes/pieces.ts` `textPlate`; `@lawn/prefabs` `buildPrefab(id, { lights: false })`;
  `src/sound/bus.ts` `playAt`.

## Change
`src/farm/runtime.ts` (replace the stub body; keep the exported names and `FarmRuntime` interface):
- At install: `registerProperty({ id: FARM.propertyId, name: FARM.name, price: FARM.price, down: FARM.down, interest:
  FARM.interest, blurb: FARM.blurb, buyHint: FARM.buyHint })` (the Ledger app then lists it too). For each crop with an
  `item`: `registerItem({ id: c.item, name: <singular: 'Radish', 'Carrot', 'Cabbage', 'Pumpkin'>, prefab: c.produce,
  kind: 'snack', heal: c.heal, blurb: c.blurb })` (no `price`: the bag shop must not sell them).
- State: `parseFarm(localStorage.getItem(FARM.saveKey), Date.now())` (wrap storage in try/catch), then
  `applyOffline(state, Date.now())`. Save (`serializeFarm(state, Date.now())` to `FARM.saveKey`, try/catch) after every
  action, every 15 s of play, and on `visibilitychange` to hidden. `owned()` = `ownsProperty(FARM.propertyId)`.
- `update(dt)`: `stepFarm(state, dt)` only while owned; turn events into visuals (rebuild that bed's plants / the oak),
  a soft `farm-harvest`-free notification: on `thirsty` toast at most once a minute "Windfall Croft: the <crop> want
  water." only when the player is within 150 m; on `oak-ready` toast "Windfall Croft: the oak is heavy with acorns."
- Visuals (one `THREE.Group` per bed and one for the oak, added to `deps.scene`; `visible` only while the player is
  within 220 m of the croft; nothing rebuilt per frame unless a state changed):
  - A bed with a crop shows `BED.plants` (8) of `cropDef(crop).prefabStages[stage]` in 2 columns x 4 rows (x offsets
    ±0.75, z offsets -3, -1, 1, 3 from the bed centre), standing at `heightAt + 0.22` (the soil top).
  - A wet bed shows a dark wet-soil plane over the soil (2.8 x 7.8, `flatLayer(material, LAYER.decal)`, at
    `heightAt + 0.235`, its own material); hidden when dry.
  - The oak: `prefabStages[oak.stage]` at `CROFT.oak` when planted; when `oakReady`, six `acorn` prefabs lie round its
    foot (radius 2-4 m).
  - The For Sale board's text: a `textPlate` 0.04 m in front of the board face (the board stands at `CROFT.forSale`
    facing west, face 0.05 m west of its centre: plate at x = forSale.x - 0.09, y ground + 1.7, facing yaw -PI/2,
    w 1.5, h 0.9): "FOR SALE\nWINDFALL CROFT\n2,200 ACORNS\n300 DOWN, THE BANK DOES THE REST" when not owned, "SOLD\nTO A
    GNOME WHO SHOULD KNOW BETTER" when owned (swap the plate on `onPropertyChange`).
- `prompt(x, z)` (first match wins; return null when nothing applies) and `interact(x, z)` (do it, return true):
  - Within 2.2 m of the point 1.5 m west of `CROFT.forSale`: not owned → "Buy Windfall Croft (300 down)" →
    `buyProperty(FARM.propertyId)`: ok → toast "Windfall Croft is yours. So is the loan. And the weeds.", rebuild the
    board; error → toast the error. Owned → "Read the board" → toast "SOLD. The bank holds the rest, at ten per cent."
  - Everything below only when owned (else null):
  - Inside a bed's rectangle grown by `BED.reach`: by `bedStatus`: 'empty' → `Plant ${name} (${seedCost})` (name from
    `cropDef(state.seed).name`): `deps.economy.spend(seedCost, 'Seeds')` false → toast "Not enough Acorns for seed.";
    else `plantCrop`, `playAt('farm-plant', bed)`, toast "Planted. Now water them." / 'dry' → `Water the ${name}` →
    `waterBed`, `playAt('farm-water')` / 'growing' → `Check the ${name}` → toast "<Name>: growing, about m:ss to go."
    (`bedSecondsLeft`) / 'ripe' → `Harvest the ${name}` → `harvest`; `addItem(item, n)` = fitted, the rest into
    `state.crate[crop]`; `playAt('farm-harvest')`; `emitHarvest({ crop, n, bed })`; toast "+n <name> (m in the crate)".
  - Within 2 m of the point 1.5 m west of `CROFT.seedRack`: `Pick seeds: ${cropDef(state.seed).name}` → next id in
    `BED_CROPS` (wrap) and toast "Seeds: <Name>. <seedCost> Acorns a bed, about <minutes> min to grow." (`growS`).
  - Within 2 m of the point 1.5 m west of `CROFT.stall`: when any produce is held (bag `count(item)` + crate) →
    `Sell produce (${n} for ${acorns})` → `sellAll()`; else "Check the stall" → toast "Nothing to sell. Grow something."
  - Within 4 m of `CROFT.oak`: not planted → `Plant an oak (${cropDef('oak').seedCost})` (spend, `plantOak`, sound
    `farm-plant`, toast "An acorn in the ground. Come back in forty minutes. Or forty years."); growing → "Check the oak"
    → toast "The oak: about m:ss to the next stage." (`oakSecondsLeft`); grown, not ready → "Check the oak" → toast
    "No acorns yet: m:ss."; ready → "Shake the oak" → `shakeOak` → `deps.economy.earn(n, 'Oak')`,
    `playAt('farm-oak-shake')`, `emitHarvest({ crop: 'oak', n, bed: null })`, toast "+n Acorns from your oak."
- `sellAll()`: for every crop with an item: bag n = `activeInventory()?.remove(item, count(item)) ?? 0`, plus the crate;
  Acorns = (bag + crate) * `sell`; empty the crate; `stats.sold += n`, `stats.earned += acorns`; `earn(acorns,
  'Windfall Croft stall')`; `playAt('farm-sell')`; save; return acorns (toast in the caller: "Sold n produce for N
  Acorns.").
- `blips()`: when owned, one blip at the croft centre `{ x: 100, z: 535, color: FARM.blip, label: 'Windfall Croft',
  kind: 'home' }` (check `Blip.kind` values in `src/types.ts`; use 'home' if valid, else omit `kind`); when not owned, a
  blip at the For Sale board `{ color: '#c9a227', label: 'Croft for sale' }` only after the player has been within 60 m
  of it once.
- `state()`, `owned()`, `selectSeed(crop)` (only BED_CROPS; saves), `sellAll()`; set the module-level `current`.

New test `src/farm/runtime.test.ts` (vitest; mock `../sound/bus` `playAt`; fake `JobsDeps` with a scene, an economy
stub that tracks Acorns, a hud with `toast`; install an inventory with `installInventory(createInventory(memoryStorage))`
and an ownership the same way: see `src/ownership.test.ts` / `src/inventory.test.ts` for how they build them): not
owned → bed prompts are null and the board offers "Buy Windfall Croft"; after buying: plant (Acorns drop by the seed
cost), water, `update(45)` makes the radish stage 1 and dry, water, `update(45)`, harvest adds 4 radishes to the bag,
`sellAll` earns 16; the oak plants and reports its time.

## Contract
Keep `FarmRuntime` (`state`, `owned`, `selectSeed`, `sellAll`, plus `CountryPart` hooks), `farmState()`,
`installFarm(deps): FarmRuntime`. Save key `FARM.saveKey` ('gta-farm-v1'). Prompts start with a verb.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/farm` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/farm/`.

## Out of scope
`src/farm/types.ts`, `src/farm/state.ts`, `src/farm/farmApp.ts` (another worker), `src/country/*`, `src/ownership.ts`,
`src/inventory.ts`, every other file.
