# E16 Countryside, fauna and the farm: roadmap

Brief: [../E16-countryside-fauna-farm.md](../E16-countryside-fauna-farm.md) (L12 construction sites, L37 vineyard and
mansion, L39 fauna and deer, L69 buy a farm and grow produce or an oak, L72 hunter shacks and tents in the sparse
country), adjusted to the merged contracts: E01 sites `construction-1..3`, `vineyard`, `mansion`, `farm-plot`; E08
`registerProperty` / `buyProperty` (loan beside the Kiln-Debt, R-169), `registerItem` / `addItem`; E05 `defineInterior`
and rooftops; E07 `registerGnomletApp`; E09/sound-bus `registerSound`; E10 `registerHome`; E29 European garden plants;
E31 (running in parallel) owns the other new animals (hare, fox, duck...), the Unmown and the hamlets, so E16 adds only
deer and goats and keeps its camps out of E31's places. Contracts: [contracts.md](contracts.md).

## Decisions

- **Two contract files**, `src/country/types.ts` (Even-Estates sites computed from one local plan turned per site,
  `VINEYARD`, `MANOR`, camps, herds, achievement/quest/sound ids, `CountryPart`) and `src/farm/types.ts` (`CROPS`,
  `FARM`, `BEDS`, `CROFT`, state types). world.ts calls `buildCountryside(scene, boxes)` (static scenery), app.ts
  `installCountryside(jobDeps)` (living parts, prompts and E, blips), one module per part.
- **Deer are one animal in two systems** (brief decision "both"): ambient herds (`CritterKind` 'deer' | 'stag' |
  'fawn', plus 'goat') in six places, and a Tuft & Tally quarry `deer` ("Trellisdown Red Deer") at two other Trellisdown
  spots, all with the same `deer-hind` / `deer-stag` / `deer-fawn` prefabs. Herds flee as one, from feet, vehicles and
  gunshots (new optional `CritterCtx.ammo`). Six herds of five (30 deer), slightly above the brief's 4 x 6 cap: meshes
  only build near the player, so the cost is in the sim, which skips herds 250 m away.
- **Farm**: buy at the For Sale board or in the Ledger (2,200; 300 down; 10%); four bed crops (radish 1.5 min,
  carrot 3, cabbage 6, pumpkin 12) that each need watering per stage, and the oak (40 min to grown, then 40 Acorns per
  shake every 10 min). Growth runs on game time; while closed, on the wall clock capped at 2 h (a dry bed never grows,
  so offline is at most one stage per watering). Produce goes in the bag (snacks that heal); overflow waits in the croft
  crate; the stall sells both. Save `gta-farm-v1` (newer side wins on cloud merge). Per player, not relayed.
- **Construction sites** are always up (W02's timing is the story epics' job): hoardings with joke signs, identical
  empty show-homes that all leave the same window lit and are all number 1, a half-built house of mushroom-stem girders,
  a bucket crane, crews in acorn-cap hard hats, Chard at Plot 1. **Manor**: the front knocker nobody answers; the way in
  is the back door into the tasting hall (Footman Pell; the ledger room is locked for the story epics).
- **Camps**: 26 in eight outer regions (none in the Unmown/Pardonlin/E31 hamlets; Frostbite Fells and Mossy Wood have
  none: the Fells is bear country and the Wood has the lodge itself), loot refilled after 30 min (`gta-camp-loot-v1`).
- Side quests `sq-levelright-night-shift` and `sq-windfall-croft-deed` unlock after existing story quests until E20
  builds #7 / #31. Lore R-203..R-207.
- Online: nothing on the wire. Critters are per browser (as cows), the farm and camp tins are per player, the scenery is
  deterministic. Mobile: every action is an E prompt (the touch action button), the Farm app is a tablet screen.

## Shape

| Epic | Issues | Done when |
|---|---|---|
| E16-0 foundation (lead) | contract files, stubs for every module, wiring in world.ts/app.ts, CritterKind + specs, save keys, prefab catalogue stubs, giver markers | tsc, save/critter/sites tests |
| E16-A prefabs (8) | P1 deer, P2a/P2b crops + oak, P2c croft, P3 site kit, P4a vineyard, P4b manor, P5 camp kit | prefab tests |
| E16-B systems (8) | P6 rewards + achievements, D1 farm sim, F1 camps data, G2 lore, E2 herds, E3 hunting deer, G4 sounds, C3 manor interior + homes | per-issue tests |
| E16-C scenery (8) | B1 estates, B2 estates life, C1 vineyard, C2 manor, C4 Trellisdown life, D2 croft, D3 farm runtime, F2 camps build | per-issue tests |
| E16-D (3) | D4 Farm app, G3 side quests, G5 achievements runtime | per-issue tests |
| E16-E integration (lead) | fixes, screenshot pass, smoke, zfight, contracts, AGENT_INDEX | all checks |

27 worker issues. Issue files (the full text each worker got) are in [issues/](issues/); shared environment:
issues/_env.md.

## AC evidence

Storytelling and the 3-spot screenshot pass per area: [screenshot-pass.md](screenshot-pass.md), images in
[screens/](screens/).
