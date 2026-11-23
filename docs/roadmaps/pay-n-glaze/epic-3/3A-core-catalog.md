Epic: 3 (more parts, nested pivots, suspension, showroom stage)
Depends on: none (this issue runs FIRST in epic 3; the parts workers start after it)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` first. You own only: `packages/glaze/src/ids.ts`, `packages/glaze/src/types.ts` (the Loadout / SlotId / id-type parts ONLY; do not touch `SuspensionState` or `GlazeRig`), `packages/glaze/src/catalog.ts`, `packages/glaze/src/loadout.ts`, `packages/glaze/src/loadout.test.ts`, `packages/glaze/src/catalog.test.ts`.

## Goal
Grow the Pay 'n' Glaze catalogue: at least 3 (here 4) new products on every existing shelf, six NEW shelves (grille, bumper, canopy, mirror, exhaust, horn), more paint swatches and underglow colours, and the `Loadout` fields, text code and pricing that carry them. Other workers then draw the prefabs, paint code, shop panels and horn sounds against the ids you fix here.

## Read first
`packages/glaze/src/ids.ts`, `types.ts`, `catalog.ts` (the helper `m(slot, id, name, blurb, price, withPrefab)` and the existing style of lore names), `loadout.ts` + its test, `catalog.test.ts`. Lore voice: Pay 'n' Glaze is a hot-pink-and-chrome custom paint franchise in a world of fired-clay gnomes and mowers (`docs/lore/entries/apocrypha/pay-n-glaze.md`); names are cheeky garden/garage puns (see the existing ones); blurbs are one short sentence (at most 120 characters).

## Change
- `ids.ts`: **append at the END of each list** (never reorder; codes store indices), exactly these ids:
  - `FINISH_IDS` + `glitter`, `holo`, `patina`, `chrome`
  - `DECAL_IDS` + `moth`, `koi`, `hazard`, `polka`, `sunburst`, `pinstripe`
  - `TYRE_IDS` + `spiked`, `balloon`, `cogs`, `glow`
  - `RIM_IDS` + `gear`, `bottlecap`, `sunflower`, `sawblade`
  - `STEER_IDS` + `ship`, `heart`, `square`, `sprocket`
  - `LAMP_IDS` + `cateye`, `goggle`, `candle`, `spotlight`
  - `BEAM_IDS` + `mint`, `crimson`, `sunset`, `sky`
  - `SPOILER_IDS` + `sail`, `rake`, `watercan`, `butterfly`
  - `SEAT_IDS` + `toadstool`, `barrel`, `teacup`, `hay`
  - `ORNAMENT_IDS` + `bee`, `ladybird`, `dandelion`, `spraycan`
  - `EXTRA_IDS` + `fairylights`, `toolbox`, `cooler`, `windsock`
  - NEW lists: `GRILLE_IDS = ['stock', 'picket', 'wire', 'grin', 'slot']`, `BUMPER_IDS = ['stock', 'chrome', 'cowcatcher', 'log', 'fender']`, `CANOPY_IDS = ['umbrella', 'awning', 'bubble', 'leaf', 'toadstool']`, `MIRROR_IDS = ['wing', 'spoon', 'stalks', 'periscope']`, `EXHAUST_IDS = ['stack', 'twin', 'chimney', 'trumpet']`, `HORN_IDS = ['stock', 'squeak', 'moo', 'trumpet', 'siren', 'bell', 'kazoo']`.
- `types.ts`: id types `GrilleId`, `BumperId`, `CanopyId`, `MirrorId`, `ExhaustId`, `HornId`; `SlotId` gains `'grille' | 'bumper' | 'canopy' | 'mirror' | 'exhaust' | 'horn'`; `Loadout` gains (in this order, after `underglow`): `grille: GrilleId; bumper: BumperId; canopy: CanopyId | 'none'; mirror: MirrorId | 'none'; exhaust: ExhaustId | 'none'; horn: HornId;` with doc comments (grille/bumper 'stock' = leave the vehicle alone; horn is a sound, no model).
- `catalog.ts`: add the products (`m(...)`), same style/prices band as the existing shelves (cheap 25-60, mid 60-110, flashy 110-160). Prefab ids are `glaze-<slot>-<id>` as always (`withPrefab` true) EXCEPT: finishes, decals, beams, horns and the `stock` grille/bumper (no prefab). New arrays `GRILLES`, `BUMPERS`, `CANOPIES`, `MIRRORS`, `EXHAUSTS`, `HORNS`, added to `CATALOG`. New `BEAMS` carry a `color`: mint `0xb8ffe0`, crimson `0xff4a5a`, sunset `0xffa070`, sky `0x9ad4ff`. Names to start from (you may improve the pun, keep the id): finishes Gnome-Glitter Flake / Dew-Drop Holographic / Barn-Rust Patina / Hubcap Chrome; decals Neon Moth Wings / Koi-Pond Scales / Hazard Chevrons / Toadstool Polka / Sunburst Rays / Gold Pinstripe; tyres Burr-Stud Spikes / Balloon Bouncers / Cog Cleats / Glow-Worm Hoops; rims Cog Rims / Bottle-Cap Rims / Sunflower Rims / Saw-Blade Rims; steering Ship's Helm / Heart Wheel / Square Wheel / Sprocket Wheel; lamps Cat-Eye Slits / Goggle Lamps / Candle Lamps / Spotlight Cans; beams Mint Frost / Crimson Menace / Sunset Blush / Sky Blue; spoilers Sail Wing / Rake-Tine Wing / Watering-Can Wing / Butterfly Wings; seats Toadstool Stool / Barrel Seat / Teacup Seat / Hay-Bale Seat; ornaments Brass Bee / Ladybird / Dandelion Clock / Chrome Spray Can; extras Fairy Lights / Little Toolbox / Picnic Cooler / Windsock; grilles Picket Grille / Chicken-Wire Grille / Toothy Grin / Letterbox Slot; bumpers Chrome Bar / Cowcatcher / Log Bumper / Tyre Fender; canopies Garden Umbrella / Striped Awning / Glass Bubble / Leaf Parasol / Toadstool Roof; mirrors Wing Mirrors / Spoon Mirrors / Snail-Eye Stalks / Periscope; exhausts Smoke Stack / Twin Tailpipes / Tin Chimney / Trumpet Pipe; horns Stock Honk / Rubber Duck / Cow Moo / Party Trumpet / Sheriff Siren / Bicycle Ding / Kazoo. Also `PAINT_SWATCHES` + 6 more (e.g. Tangerine, Lavender Mist, Crimson Clay, Slate Blue, Lime Zest, Candle Cream) and `UNDERGLOW_COLORS` + 4 more. Add `PRICES.canopy`-style entries only if you need non-product prices (you should not).
- `loadout.ts`: `defaultLoadout` adds `grille: 'stock', bumper: 'stock', canopy: 'none', mirror: 'none', exhaust: 'none', horn: 'stock'`. `normalizeLoadout`: validate the six new fields (ids in their lists; `canopy`/`mirror`/`exhaust` may be `'none'`). `encodeLoadout` / `decodeLoadout`: append the six fields at the END (indices base 36, `'-'` for none), `FIELD_COUNT` 26, code still starts `g1.` and stays at most 120 characters. `loadoutCostLines`: a changed grille/bumper/canopy/mirror/exhaust/horn whose new id is not stock/'none' costs its `ModDef.price` (label = its name); selling back is free. `sameLoadout`/`isStockLoadout` cover them.
- Tests: update `loadout.test.ts` (round trip with every new field set, 200 random loadouts now include them, cost lines, normalise garbage) and `catalog.test.ts` (`SHELVES` includes the six new shelves and their id lists; every product has name/blurb/price; ids unique; the prefab check still skips products without `prefab`). The prefab-exists assertion will FAIL until the parts workers finish: guard it so it reports missing prefabs but is skipped when `process.env.GLAZE_ALLOW_MISSING_PREFABS` is set (use `it.skipIf`), and say so in a comment; the planner runs it without the variable at the end.

## Contract
The id lists above (exact spelling, exact order within each list: old ids first, then the new ones as listed), the new `Loadout` fields in that order, `GRILLES`, `BUMPERS`, `CANOPIES`, `MIRRORS`, `EXHAUSTS`, `HORNS`. Everything else in the package keeps compiling: `npx tsc --noEmit -p packages/glaze` must pass, and `npx tsc --noEmit -p games/gnome-theft-auto` must pass (other files construct `Loadout` only through `defaultLoadout`/`normalizeLoadout`; if one builds a literal, fix it minimally and say so).

## Done when
- `npx tsc --noEmit -p packages/glaze` and `-p games/gnome-theft-auto` pass.
- `GLAZE_ALLOW_MISSING_PREFABS=1 npx vitest run packages/glaze` passes.

## Out of scope
Every other file (prefabs, paint.ts, decals.ts, fittings.ts, panels, audio belong to later issues).
