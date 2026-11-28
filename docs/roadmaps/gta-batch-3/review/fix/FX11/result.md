# FX11 result (R1 fix round): the coast

Branch `fix/FX11`. Plan: [roadmap.md](roadmap.md) (lead foundation, epic A: 15 parallel issues, epic B: 6 issues; Sonnet
for taste work, Haiku for mechanical). Shots: `docs/roadmaps/gta-batch-3/review/shots/FX11/` (git-ignored, local),
dev server on port 5511. Compare with the editors' `review/shots/G3/`.

## Shared pieces added

- `coast/deckKit.ts` (deck helpers split out of boardwalk.ts), `coast/pier.ts`, `coast/stalls.ts`, `coast/promenade.ts`,
  `coast/dunes.ts`, `coast/beachScenes.ts`, `coast/ambience.ts`, `coast/nightLights.ts` (night-glow materials, light
  pools, an eased night factor from the sky's time label, stepped by `coast/index.ts`).
- `coastSign()` now prints both faces with FX01's `textPlate` (D58); `back` option for a second joke.
- Prefab catalogs `gta-coast-town.ts` (16), `gta-coast-fair.ts` (9), `gta-coast-beach.ts` (15), and the reworked
  `bathtub-queen`.
- Terrain: south-shore sand for |x| <= 460 from z 1000 (JS paint + Wasm kernel, rebuilt), 55 dune stamps, the Saltcut
  bent. `layout.golden.json` regenerated on purpose (new coast colliders).

## Per finding

| ID | Status | What landed | Evidence |
|---|---|---|---|
| G3#4 | fixed | Bilge stands at the head of the pier (300, 1168) on the handle deck by a `chalk-tour-board` (PIRATE TOURS / Noon. Also noon. ...); she is hidden while the player is in her cabin (own layer). | `life.test.ts`; `pier.ts`; R-245 |
| G3#5 (D14) | fixed | Giant bucket: two galvanised rim arcs (r 20) breaking the sand round the spur, the handle arching 14 m over the road as the gateway, the Tall One's spade in a dune; dune band z ~1026..1062 (moved north of the boardwalk site's 30 m fade, which flattened it), 500 marram tufts, weathered dune fence; sand under and round the boardwalk and the wheel (also fixes the minimap, G3#25). The rim arcs read more as tin wall pieces than a full ring from the road. | `a01-entr`, `a04-bwwest`, `a05-wheel`, `b02-pickle`; `dunes.test.ts`; R-242, R-243 |
| G3#6 (D14) | fixed | Deck narrowed to 30 m (z 1102..1132; west end trimmed to x -200 so no plank sinks, FX06 hand-off); 0.3 m boards with soft seams; south row (helter-skelter, Punch booth, carousel, ice-cream kiosk, shell grotto), telescopes, bins, deckchair stack, bunting with bulbs on both lamp rows, 7 promenade folk. | `a02-bwmid`, `a03-bweast`, `p01-phone-bw`; `promenade.test.ts`, `boardwalk.test.ts` |
| G3#7 | fixed | Each stall dressed (pickle barrel, cone buckets, fortune shell, ledger shelf, rubber seagull), its lore sign, and a keeper: Gil Brinewater, Tam Tinsley, Dot Scoopwell, Madame Limpet, Penny Stubbs. | `b02-pickle`; worker shots `fx11-b2/scoop.png`, `office.png`; `stalls.test.ts`; R-244 |
| G3#8 | fixed | Polished silver handle on a lit underside body, rounded rims both edges, a rounded handle end sloping into the sand north of the spur, planks on the spur only, bowl lip ring + dish band, silver rails; `undersideMat` under the pier (FX01 hand-off). From far out it reads as a pale strip; close up as a spoon. | `a07-pierbeach`, `b01-ship`; worker shots `fx11-A13/`; `pier.test.ts` |
| G3#9 | fixed | `bathtub-queen` rebuilt: rounded toy hull with roll-top rim, billowed sails turned to the beach with the skull, rubber-duck figurehead with bill, eyes and bandana, Jolly Roger and pennant, plug-chain; stern windows and lanterns glow at night. | `a07-pierbeach`, `b01-ship`, `c02-night-pier` |
| G3#12 | fixed | Night: lamp light pools on the deck, bunting bulbs, the Spokewheel's chasing rim and spoke bulbs, Marram's hut window, the Queen's stern windows, lanterns and dressing lights from bow over both mastheads. | `c01-night-bw`, `c02-night-pier`, `c03-night-wheel` |
| G3#13 | fixed | 10 beach scenes + 4 groynes outside the town (winch and boat, rock pool and crabs, windbreak picnic, wreck rib, upturned boat, headland nets, ...), 13 lifebuoy posts every ~150 m, Dunelow's deckchair hire with attendant; residents Hessian Nap, Old Skerrick, Winkle Pennant. | `a10-beachW`; worker shots `fx11-b5/`; `beachScenes.test.ts`; R-249 |
| G3#14 | fixed | The X (decal strips), a dug hole, marker post and a boot at `CHART_X`; chest moved to the foot of Bilge's bed; the "tourists" line is silent on the quest's chest step, a new line once done; step text updated. | `beachScenes.test.ts`, `pirateShip.test.ts` |
| G3#15 | fixed | The pickle keeper is Gil Brinewater (quest line and toast); the wheel is free after "The Wobbly Gondola" (prompt says free). | `coastQuests.ts`, `spokewheel.ts` |
| G3#16 | fixed | Retitled "The Buoy Run", "out past the boardwalk". | R-246 |
| G3#17 | fixed | Brass bell on the platform, rung at boarding and at the end (`ringSpokewheelBell(times)` exported for m43's three bells, not wired: m43 is another epic's scene); rider set down on the platform facing the boardwalk (no ragdoll); four leg colliders + bell post; rope queue, stool, fare tin. A full ride was not driven end to end. | `spokewheel.test.ts`; worker shot `fx11-a8/plat.png` |
| G3#18 | fixed | `tow-ski` stands (`stand: true`); `skiPose` bends the knees, reaches the arms to the handle and shows the lean in the legs. Not seen in a browser (the shot tool spawns on foot). | `skiPose.test.ts` |
| G3#19 (D58) | fixed | The Last Tube faces the sea, tinted driftwood, lawn-shark fin on the roof, driftwood pile, net, oars; price board two-faced ("Driftwood tows. Driftwood is not sorry." on the back), "Refunds: stories only.", "NO TUBES IN THE BOWL", "IF YOU LOSE YOUR HAT, I'LL LOOK FIRST", "I TOW. YOU HOLD ON.", rack tags. | `a09-lasttube` |
| G3#20 | fixed | Bubbles swapped to unused lore lines (Driftwood "I tow. You hold on.", Bev Nell "Driftwood has a hut now...", Marram, Sal). | `life.ts` |
| G3#21 | fixed | Dropped candyfloss with squabbling gulls, souvenir rack with rubber seagull and an "Authentic" hat, rope stanchions, wellies. | `life.test.ts` (prefab ids exist) |
| G3#22 | fixed | LOST PROPERTY plate on the office counter, hats piled against it. | worker shot `fx11-B4/office.png` |
| G3#23 | fixed | Pier: "FISHING FROM THE HANDLE ONLY...", "PLEASE DO NOT STIR"; wheel: "Children free. Gulls not.", "MARRAM'S WHEEL, MARRAM'S RULES", "THE TOP IS FOR LOOKING...", "DO NOT RISE FROM YOUR TEACUP"; tide table with "(approx.)" on a beach hut. | `pier.ts`, `spokewheel.ts`, `boardwalk.ts` |
| G3#24 | fixed | Continuous surf bed by distance to the shore with swells, waves landing near you, boardwalk murmur, calliope organ at the wheel, wheel creak, halyard ticks and timber creaks at the Queen, buoy bells, gulls; cabin ambience 'coast'. Not listened to (headless). | `ambience.test.ts` |
| G3#26 | fixed | Saltcut bends (S-curve after the bridge), reeds and mooring posts on both banks, a beached dinghy, a red-and-white daymark at the mouth with "Where the Puddle Sea learned to run downhill." | `a12-saltcut`; R-248 |
| G3#29 | fixed | Beach dressing hand-placed: huts at different spacing and yaw, one set back, a towel line; chairs in pairs and a family with a windbreak; sandcastles each with their own bucket, one knocked over. | `boardwalk.ts`; worker shot `fx11-a15/beach2.png` |
| G3#30 | fixed | Saltcut boat ends at (450, 1330); a fishing smack works the horizon at z 1560 (pure function of time, same for every client). | `boatTraffic.test.ts` |
| G3#31 | fixed | The patrol stop is on the pier bowl by the gangplank (300, 1250) with the text to match (KNOWN_STATIC entry: a deck over water). A Hat Watch dinghy for the step: carried over (could). | `checks.sim.test.ts` |
| G3#32 | fixed | `COAST_UNLOCK_AFTER` deleted. | - |

Counts: 24 fixed, 0 partly, 0 carried over (two small extras carried: G3#31's patrol dinghy, G3#17's m43 triple bell call).

## Checks

- `npm run build -w games/gnome-theft-auto`: OK.
- `npm test -w games/gnome-theft-auto`: 537 files pass; the golden layout failed only because of the new coast colliders and was regenerated on purpose; `landforms.test.ts` "builds the height grid in reasonable time" timed out once under load and passes alone.
- `npm test -w packages/prefabs`: 4204 pass. `npm run lore`: OK (rulings R-241..R-249, 14 new person entries).
- `npm run cutscene-report -w games/gnome-theft-auto`: 297 pass.
- `bash tools/smoke.sh http://localhost:5511/ gta-gnomlet`: SMOKE OK.
- `npm run zfight -- "http://localhost:5511/?at=0,1115,0"`: did not finish (puppeteer protocol timeout inside the scan on the loaded machine, as in FX06). New flat things all use `flatLayer(..., LAYER.decal)` (X strips, light pools, bowl dish band).
- Perf (GR9): see below.
- Perf (`node tools/gta-perf.mjs --legs boardwalk x -190..200 z 1117, dunes z 1050`, 390x844 @2x): after FX11, at `--cpu 2`
  (the `--cpu 4` runs never finished loading inside the tool's 90 s on the loaded machine): boardwalk avg 49.3 ms,
  p50 41.9, p95 90.2, 286 draw calls avg (356 max); dunes avg 42.3 ms, p50 41.6, 195 draw calls. The baseline run (the
  branch base in a temporary worktree) timed out loading three times, so the GR9 before/after comparison is **not
  done**: re-measure both on a quiet machine before merge. Density is merged (bunting, bulbs and deck per 60 m chunk;
  marram and fence instanced; beach scenes static-batched), no real lights added.

## Decisions taken by the lead

- Keeper names (new lore people): Gil Brinewater, Tam Tinsley, Dot Scoopwell, Madame Limpet, Penny Stubbs.
- The dune band sits at z ~1026..1062, not 1060..1090: the boardwalk site's flatten fade (siteMargin 6 + siteFade 30)
  levels anything south of z ~1054. Sand reaches z 1000 within 460 m of the spur so the bucket stands in sand.
- The deck's west end was trimmed to x -200 (ground rose above the planks there).
- G3#31's stop sits on the pier deck over water; recorded in `questSim/checks.sim.test.ts` KNOWN_STATIC.
- Lore rulings R-241..R-249 (renumber at merge).

## Carried over

- G3#31: a Hat Watch dinghy spawning by the Queen for the patrol step (could).
- G3#17: m43's three bells (`ringSpokewheelBell(3)` exists; the m43 scene is another epic's).
- Not seen in a browser: the ski pose, a full Spokewheel ride, the ambience by ear, the cabin chest.
