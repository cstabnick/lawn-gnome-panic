# Gnome Theft Auto: story environments (stage spots)

Goal: every place the main story and the side quests happen is written down, placed on the real map as typed stage
data (`games/gnome-theft-auto/src/quests/stages.ts`, checked by `stages.test.ts`), dressed in the world where it did not
exist yet, and described for the writers (`docs/design/gnome-theft-auto/environments.md`), so the later cutscene work
(main story, side quests) can stage scenes in the world: where people stand, where the camera goes, what they do while
idle, which vehicle each character drives, where it is parked and how it drives in and out.

Planner-written foundation (before epic 1): `src/quests/stages.ts` (CAST with vehicles and glaze looks, STAGES join,
lookups, `stageSetBoxes`), `src/quests/stages/kit.ts` (types and helpers), the `bus-stop` example stage,
`src/quests/stages.test.ts` (the validator), `src/quests/stages.probe.test.ts` (ASCII map tool, `PROBE=...`), and the
`gta-windmill` prefab (`packages/prefabs/src/catalog/gta-world-green.ts`).

Online: stage spots are static data and set dressing is built the same in every browser, so nothing to sync.
Mobile: no new controls. Party slice: unchanged (`gta-getaway` does not use stages).

| Epic | Done when | Issues |
|---|---|---|
| 1. Stage data, set builder, lore | `npm test -w games/gnome-theft-auto` (stages.test.ts all green), build, `npm run lore` | 7 parallel: 1.1-1.5 region data, 1.6 set builder, 1.7 lore |
| 2. Environment write-up (planner) | `docs/design/gnome-theft-auto/environments.md`: hand-written head + a section generated from the data (`WRITE_STAGE_DOC=1 npx vitest run src/quests/stages.doc.test.ts`); zfight + smoke | 0 (done by the planner: generating the doc from the data was cheaper than 4 prose issues and cannot drift) |

Issue files: `docs/roadmaps/gta-environments/epic-1/*.md` (1.6 was done by the planner); the region data issues share
`docs/roadmaps/gta-environments/_stage-common.md`.

## Lore decisions

The facts the stage data commits to (issue 1.7 records them in `docs/lore/`):

1. **Turfton City Hall** is the civic block north-east of the x = 0 / z = -60 crossing. Its forecourt on the z = -60
   road has a press podium, two flagpoles and a CITY HALL plaque; Councilwoman Juniper Vance gives her noon statement
   there and Mayor Mulch's candy-red Ride-On is parked on the forecourt (stage `city-hall-steps`).
2. **The Route South Acorn Diner** stands on the east side of the South Highway just south of the canal bridge in
   Cloverfield. Fence-Post Frank eats every meal at its counter and his hand-painted sign stands across the road;
   Vesper Thorne holds "casual" meetings at its outdoor booth (stage `south-highway-diner`, chapter 2 "Order Over
   Chaos").
3. **The Overlook** is the crew's Dust Flats safehouse: an adobe hut, a command tent and a map table on the rise where
   the east highway bends at (300, 40), looking east to Fort Sandpit. From chapter 3 Tansy runs the crew from here; the
   Whirligig lands beside the hut (stage `dust-safehouse`).
4. **The Squall-Box Windmill**: Rooster Weatherby's rusted Cloverfield windmill, red blades and a lookout platform he
   shouts prophecies from, in the fields beside the silo-haul route (stage `rooster-windmill`, new prefab
   `gta-windmill`).
5. **Cloverfield South Barn**: a barn and silo at the south end of the farmland where Granny's armored silo is hidden
   (stage `south-barn`).
6. **88.7 Fescue Public Radio booth**: Sorrel Tillbrook broadcasts from a booth of crates, a tape bank and a dish
   beside Unmowed Hollow (stage `sorrel-radio-booth`).
7. **Vesper's Patio Heights gallery**: an open-air row of plinths along the compound's north wall, with a porcelain cat,
   a golden remote and the Replica Stopping Stone propping a painting; Vesper inspects the astroturf here at 06:00
   (stage `patio-gallery`). **The Putting-Green Country Club** is the north-east corner block beyond the Patio Heights
   roads (stage `putting-green`).
8. **Shelldon's dumpster alley** is the grass strip behind Bodega & Sons; he lives in a retired snail-coach parked
   there. **The downtown slug paddock** is a picket-fenced pen between Thorne Tower and the z = 0 road where the
   Espresso-Fed Slug syndicate takes bets (stages `shelldon-alley`, `snail-paddock`).
9. **Driftwood's lawn-boat trailer**: a walnut dinghy on a cart in the southern fields where he waited six months
   (stage `driftwood-trailer`).
10. **Who drives what** (CAST in `stages.ts`): Pip a red primer Zero-Turn; Tansy the smoking orange Zero-Turn; Vesper a
    pearl-white Lowrider with gold spinners; Don Compost a gloss-black Lowrider with whitewalls; Granny a lilac Ride-On
    with a hay seat and cowcatcher; Juniper a navy pearl Ride-On with a flag; Mayor Mulch a candy-red Ride-On; Reginald
    an HOA Code-Enforcement Van; Diggs an olive Zero-Turn with a roo-bar; Father Loam's "snowmobile" is a Ride-On on
    spiked tyres with candle lamps and a bell; Wally owns the Crop Duster; Driftwood a walnut dinghy; John Bodega a
    delivery Push-Mower Bike; Big Lou a matte-black Lowrider; Brenda a glitter-gold Push-Mower Bike; Clara the
    shock-absorbed pearl Lowrider; Burt a decommissioned primer HOA van; Cedric a glitter Mulch-Spreader; Bramble the
    Buck-Iron Combine; Shelldon a retired snail-coach he lives in; Nina a fairy-lit Push-Mower Bike; Turncoat Cam a
    chameleon Zero-Turn bought with his reward. **Elder Bracken, Sorrel and the Unmowed ride nothing with an engine.**
