# Content data: reference

Every piece of game content lives under this folder and is merged by `src/content.ts` once at import time.

- Packs live in `packs/<id>.ts`, each exporting `PACK: ContentPack`. Zones live in `zones/<id>.ts`, each exporting `ZONE: ZoneDef`.
- `src/content.ts` merges every pack and zone into the game's tables, and throws on a duplicate id, so two packs can never silently overwrite each other.
- Every new id is prefixed with its pack's prefix: `mb-` (mossbottom), `c2-` to `c8-` (chapter packs), `s01-` to `s14-` (storyline packs). Canonical ids below are the ones other packs reference before they exist.
- Coordinates are local to the zone: `x, z, r`. Negative z is north.

## Packs

| Pack | Prefix | File |
|---|---|---|
| Mossbottom (chapter 1) | `mb-` | `packs/mossbottom.ts` |
| Thatchford (chapter 2) | `c2-` | `packs/ch2-thatchford.ts` |
| Keep (chapter 3) | `c3-` | `packs/ch3-keep.ts` |
| Cloverfield (chapter 4) | `c4-` | `packs/ch4-cloverfield.ts` |
| Hedgewood (chapter 5) | `c5-` | `packs/ch5-hedgewood.ts` |
| Rockery (chapter 6) | `c6-` | `packs/ch6-rockery.ts` |
| Verge (chapter 7) | `c7-` | `packs/ch7-verge.ts` |
| Finale (chapter 8) | `c8-` | `packs/ch8-finale.ts` |
| Dandelion idol (storyline 1) | `s01-` | `packs/s01-dandelion-idol.ts` |
| Neat chapel (storyline 2) | `s02-` | `packs/s02-neat-chapel.ts` |
| Heir of the heap (storyline 3) | `s03-` | `packs/s03-heir-of-the-heap.ts` |
| Queen outside (storyline 4) | `s04-` | `packs/s04-queen-outside.ts` |
| Seven kiln-born (storyline 5) | `s05-` | `packs/s05-seven-kiln-born.ts` |
| The forty (storyline 6) | `s06-` | `packs/s06-the-forty.ts` |
| Straw king (storyline 7) | `s07-` | `packs/s07-straw-king.ts` |
| Range war (storyline 8) | `s08-` | `packs/s08-range-war.ts` |
| White cricket (storyline 9) | `s09-` | `packs/s09-white-cricket.ts` |
| Hedgewrights (storyline 10) | `s10-` | `packs/s10-hedgewrights.ts` |
| Finishing the unfired (storyline 11) | `s11-` | `packs/s11-finishing-the-unfired.ts` |
| The damp (storyline 12) | `s12-` | `packs/s12-the-damp.ts` |
| The king's cart (storyline 13) | `s13-` | `packs/s13-the-kings-cart.ts` |
| The smith's road (storyline 14) | `s14-` | `packs/s14-the-smiths-road.ts` |

Zones: `zones/mossbottom.ts`, `zones/thatchford.ts`, `zones/keep.ts`, `zones/deeps.ts`, `zones/cloverfield.ts`, `zones/hedgewood.ts`, `zones/rockery.ts`, `zones/verge.ts`.

## Canonical ids

| Kind | Ids (owner pack) |
|---|---|
| NPCs | `fernwick bramble tansy pip thistle` (mossbottom) · `burlap stoutpot twitchett dimm puddleby grindwell nettle sedge clementine` (ch2) · `marigold potsworth inkcap ironsod ida sedgewick wren` (ch3) · `haybale fallow muckle mabel kree` (ch4) · `splitwell juniper burdock fen lichen` (ch5) · `hammerclod sedum grout cobalt mudtooth` (ch6). Verge appearances of canon NPCs use `placements`, not new NPCs. |
| Enemies | mossbottom: `slug mole pond-frog feral-gnome feral-brute beetle mole-king` · ch2: `water-beetle hose-leech muck-sprite brown-rat magpie-thief earthworm heap-rat grub-swarm rotgut` · ch3 (Gutters): `gutter-rat pipe-leech clogmaw` · ch5 (Cistern): `cistern-eel drowned-toad mother-vesh` · ch6 (Backflow): `rust-crab drowned-pipewright gromwell` · ch4: `aphid ladybird runaway-snail field-mouse red-ant-worker red-ant-soldier grasshopper straw-wight ant-queen old-gleaner` · ch5: `cricket centipede wildling-scout hedgewright-thug web-spider weaver-below paper-wasp wasp-drone queen-vespa` · ch6: `earwig gem-beetle rock-louse rockery-centipede deep-mole dowager-mudtooth kiln-guardian unfired kiln-warden` · ch7: `even-cut-clipper even-cut-acolyte shorn-hound rust-rat oil-slug grass-bag-moth edger-knight high-edger` · ch8: `mower-wheel mower-deck mower-heartspark mower-rope` |
| Quest items | `tremor-tally` (ch2) · `gnorwin-ledger gromwell-notes` (ch3) · `snailcart-writ` (ch4) · `heartwood-stake valve-maps` (ch5) · `stopping-stone valve-key gnorwins-trowel` (ch6) · `kings-signet` (ch7) · `mole-crown` (mossbottom) |
| Consumables | `glaze-pot salt-pinch` (ch2) · `honeydew-flask snailcart-ticket` (ch4) · `rust-oil` (ch7) · `rose-draught sky-tonic` (ch3) · `ruby-draught spigot-water` (ch6) |
| Main flags | `sedge ants gleaner hedge mudtooth potsworth` (values in quests.md) |
| Side quests, flags and NPC copies other packs depend on | `mb-feral-totem mb-moss-statue mb-soggy-letter` (mossbottom) · `c2-sedge-pamphlets c2-postage-due` and flag `c2-forty-list` (ch2) · `c3-letter-from-puddlemere` (ch3) · `c4-straw-king` (ch4) · `c6-brambles-old-master` (ch6) · `c7-ironsod c7-marigold c7-wren` (ch7 Verge copies of canon NPCs) · flag `c8-phase` (ch8 and mower.ts) |
| Main quests (in quests.md order) | ch1 (mossbottom): `slime-time feral-trouble shells mole-king mb-what-moles-know` · ch2: `c2-word-to-the-reeve c2-calling c2-tremor-tally c2-pressures-wrong c2-the-heap c2-letter-for-the-queen` · ch3: `c3-an-audience c3-three-accounts c3-queen-in-archive c3-into-the-gutters c3-ledger` · ch4: `c4-royal-warrant c4-rustlers c4-runaway-snails c4-granary c4-antenna-sister c4-old-gleaner c4-great-haul` · ch5: `c5-elder-privet c5-neutral-ground c5-mill-raid c5-weaver-below c5-fens-two-families c5-paper-spire c5-heartwood c5-valve-maps` · ch6: `c6-new-stopping-stone c6-humming-seam c6-honest-words c6-the-unfired c6-kiln-warden c6-firing-the-stone c6-down-the-drains c6-clay-seals c6-who-holds-the-valve` · ch7: `c7-wings-to-the-front c7-muster c7-no-hats c7-same-table c7-queens-judgement c7-the-level` · ch8: `c8-turning-blade` |

## Zone layouts

Coordinates are `x, z, r`. Negative z is north. Quest ids gating exits are canonical (they're defined in the chapter packs).

| Zone (half) | Shrine | Regions (id x,z,r) | Exits (to @ x,z → arrive x,z; when) |
|---|---|---|---|
| mossbottom (120) | Mossbottom well 0,0 | as today; lake `puddlemere` 50,-45,20 | thatchford @ 10,-112 → 0,105; when `mole-king` done |
| thatchford (120) | Thatchford fountain 0,0 | `thatchford-town` 0,0,28 · `hose-banks` -40,20,22 · `spinning-fountains` -55,-35,24 · `crowfoot-hill` 60,-40,20 · `compost-heap` 65,45,18 · `neat-chapel` 35,10,14 · `long-bank` 35,-15,10 · `tipsy-toadstool` -8,6,4 · `guildhall` 10,-10,5 · `mill` -15,-20,5. The Hose = lakes at (-6,-80,10) (-4,-50,10) (-2,-25,9) (4,30,9) (8,60,10) (10,95,10); the ford is the dry gap at z≈0 | mossbottom @ 0,112 → 10,-105 · keep @ 0,-112 → 0,70; when `c2-letter-for-the-queen` done |
| keep (80) | Pedestal Ward square 0,20 | `pedestal` 0,-30,22 · `pedestal-ward` 0,25,24 · `archive` -18,-28,6 · `throne-hall` 0,-34,6 · `robin-roost` 22,-46,6 · `deeps-stairs` -30,30,4 · `guild-halls` 25,25,8; lake `basin` 0,-50,10 | thatchford @ 0,76 → 0,-105 · deeps @ -30,32 → 0,92; when `c3-into-the-gutters` active or done · cloverfield @ -76,0 → 118,0; when `c3-ledger` done · hedgewood @ 56,-56 → -104,104; when `c4-great-haul` done · rockery @ -56,-56 → 104,104; when `c5-heartwood` done |
| deeps (100, indoor) | Gutter landing 0,90 | `gutters` 0,65,25 · `clogmaw-den` 0,42,9 · `cistern` 0,8,26 · `vesh-pool` 0,-14,9 · `backflow` 0,-55,24 · `great-valve` 0,-86,9. Walls: solid at z=30 and z=-24 (x -100..100); only the hatches cross them | keep @ 0,97 → -30,26 · hatch deeps @ 0,33 (r 1.5) → 0,24; when `c5-valve-maps` active or done · hatch deeps @ 0,-21 (r 1.5) → 0,-30; when `c6-down-the-drains` active or done (and reverse hatches at 0,27 → 0,36 and 0,-27 → 0,-18, r 1.5, no condition) |
| cloverfield (130) | Sodbury pump 0,0 | `sodbury` 0,0,26 · `granary` 10,-16,6 · `honeydew-ranch` -60,-40,22 · `snail-pens` 25,30,12 · `pettigrew-ranch` -70,40,18 · `red-anthills` 50,60,24 · `scarecrow-rise` -60,95,18 · `crows-perch` 80,-70,16; lake 30,-60,10 | keep @ 126,0 → -70,0 |
| hedgewood (120) | Clippings sawpit 40,40 | `clippings` 40,40,22 · `barkhollow` 80,-20,16 · `sawdust-mill` 0,60,16 · `webhollow` 60,-70,20 · `burdocks-tangle` -40,-20,22 · `elder-privet` -50,-55,14 · `paper-spire` -80,40,16 · `cricket-hedge` 20,-40,12 | keep @ -110,110 → 52,-52 · verge @ 0,-115 → 60,100; when `c6-who-holds-the-valve` done |
| rockery (120) | Flintdelve forge 0,20 | `flintdelve` 0,20,22 · `spigot` -90,-60,14 · `marble-pits` -80,40,18 · `shard-mine` 40,-20,20 · `mudtooth-deeps` 60,50,18 · `kiln` 0,-80,18 · `kiln-back` 0,-102,8 · `raft-dock` -40,40,5 | keep @ 110,110 → -52,-52 · verge @ -60,-115 → -80,100; when `c6-who-holds-the-valve` done |
| verge (140) | Last Tuft banner 0,80 | `last-tuft` 0,80,24 · `shorn` -40,20,40 · `kings-cart` -60,-10,8 · `the-level` 60,0,22 · `battlefield` 0,-60,35 · `fence-line` 0,-100,30 · `the-shed` 0,-125,14 | hedgewood @ 60,136 → 0,-108 · rockery @ -80,136 → -60,-108 |

Robin flights (Keep ⇄ Last Tuft) and the leaf raft (Flintdelve → Thatchford) are dialogue `travel` actions, not exits.
