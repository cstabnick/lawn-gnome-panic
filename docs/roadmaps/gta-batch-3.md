# Gnome Theft Auto, batch 3: the laundry list

The master plan and tracking document for the third big Gnome Theft Auto batch: a single user list of about 92
requests (fixes, engine work, new places, activities, a 70-quest main story) grouped into 22 epics and run in waves of
at most 3 parallel workstreams. Process: [docs/process/big-batch-orchestration.md](../process/big-batch-orchestration.md).
Epic briefs: [gta-batch-3/](gta-batch-3/). Each workstream lead adds its own decompose roadmap and issue files under
`gta-batch-3/<epic-id>/`.

- **Branch:** `gta-batch-3` on `cstabnick/lawn-gnome-panic`. Every epic merges here. The branch merges into `main`
  once, as one large feature PR.
- **Game:** `games/gnome-theft-auto` (shared packages as the briefs allow; `gba-gjam`, `aether-board` and `gnome-golf`
  only through extracting shared code into a package, which the user asked for: "share code if possible").

## Next session starts here

All 33 epics merged (+ F1, F2, main). **R1 round 1 done**: 12 editors (~375 findings `review/G*.md`), decider
(`review/decisions.md`, GR1–GR10, 59 rulings), triage into 24 fix epics in 8 waves (`review/fix-plan.md`,
`review/fix/FXnn-*.md`). Now running the fix waves (branches `fix/FXnn`, lead prompt template `review/fix-lead-prompt.md`): wave 1 = FX01,
FX02, FX03 running; then re-review
until only nits remain. Then **R2**: an audit of every source item L01–L118 against what shipped (met / partly / not,
with evidence), and fix epics for the gaps. Then the finish: demos (media-upload MCP), the PR description, a final merge-conflict check.

## Tracking

Status: `planned` → `running` (lead started) → `review` (lead branch done, not merged) → `merged` / `partial` (merged
with deferred items listed).

| Epic | Name | Kind | Wave | Depends on | Status | Branch | Merge | Notes / deferred |
|---|---|---|---|---|---|---|---|---|
| E01 | World expansion and site plan | Engine | 1 | – | merged | epic/E01-world | 242187e3 | worldHalf 1400, four bands (Snowcap Rise N, Saltbucket Shore S, Rootwell E, Trellisdown W), `src/sites.ts` 43 slots, POS_BOUND 1450, Founders' Green + Double Pot; R-168 records placement differences vs the spine; the Wasm kernel (from main) is fixed-size for worldHalf 900, so it is switched off above that (`KERNEL_MAX_WORLD_HALF`) until E28 resizes it |
| E02 | Vehicle feel, combat and camera | Fix + Engine | 1 | – | merged | epic/E02-vehicles | 9fe85adb | all 12 items; canal raft collider left to E03 (expected-fail case in canalCruise.test.ts); first-person on F5; traffic.test "keep moving" flaky under full-suite load (passes alone); contracts: Box.shape round, SIM_AIR, createNpcChassis, chase.setFirstPerson, traffic.crackDriver |
| E04 | Story bible and world writing | Story (docs) | 1 | – | merged | epic/E04-story | c9a94025 | names final (see E04/spine.md); new objective types needed (golf-hole, jam-game, skate-line, ski-run, tow-ski, ride-passenger, dig, interior-visit) each with a fallback; E18 builds the journal 'Later' shelf; rulings R-158..R-167 taken |
| E03 | Bugs and quest reliability sweep | Fix | 2 | – | merged | epic/E03-bugs | 20977fd6 | all 13 items + L96, L97, L100; quest sim 55/58 (city-glow-band-express timed gates, city-skyway-robbery deck ramp: bot limits for E23; nc-party needs relay); L88 fix in deploy/nginx.conf takes effect on next deploy; no real-device run | | |
| E05 | Interiors and rooftops | Engine | 2 | E01 | merged | epic/E05-interiors | b7646a33 | `src/interiors/` (`defineInterior`, rooms off-map x>=5000, up to 600x600 m cells for E17), quest `interior` gate; showcase: Bodega & Sons, Mulch Club lobby, Flat 3B shell (E10 fills it), Thorne Even-Estates sales floor + lift; walkable tower roofs + Thorne Helipad, aircraft land on roofs (live copter landing not yet flown); deferred: weapons away indoors, saving 'inside', shared rooms online, roof clutter colliders |
| E08 | Economy, ownership and inventory | Engine | 2 | – | merged | epic/E08-economy | b5bbef96 | loans sit **beside** Kiln-Debt (R-169), not inside it (E10 must follow); `DEALER_SITES` are fallback spots, move to E01 sites; deferred: 3D showroom, per-vehicle boat/aircraft looks, glaze/Pebblewick/hunting/taxi price tables, real-phone pass | | |
| E06 | Sky, weather and time | Engine | 3 | – | merged | epic/E06-weather | dde5c9e4 | `src/weather/` (clear/cloud/mist/rain/snow by region climate, per-tier budgets, Options row, deterministic per browser, not relayed); cutscene time-lapse (badge + sky race, never changes world time; `advanceWorldTime` for deliberate changes); staggered headlights, fewer particles, wandering flocks, intermittent planes, events 160 s / street 45-90 s; R-178; deferred: rain sound (E09), puddles/snow cover, synced clock; density not checked in a real browser |
| E07 | Map, options, mobile UI and loading | Polish | 3 | E01 (map extent) | merged | epic/E07-ui | see log | Gnomlet tablet replaces More menu + phone (`registerGnomletApp`, `phone.addApp` shim; Tab/View/P open it, O/Start → Options); Gnomey Bird + Flappy Gnome achievement; Options/More tap bug fixed (pointer-events under #ui); big map zoom/pan/pinch; options registry `registerOption` (E06 weather row migrated at merge); bird toggles; low quest beams + option; position save `gta-position-v1`; loading screen; phone-sized comms; smoke checks should use `gta-gnomlet`, not `gta-options`; deferred: 3D buildings on the big map; open: telescope button over big map, soft minimap on hi-DPI, no real touch device |
| E09 | Sound, voice, animation and direction | Polish | 3 | – | merged | epic/E09-sound | see log | sound bible `docs/design/gnome-theft-auto/sound-design.md`; quieter steps; cutscene beds + foley everywhere; radio/comms in own voice via mutter `radio` filter + Radio voice option; 15 anim variants; shot-variety helpers + report flags (0 faults); **intro cards** `{ do: 'intro', who }` / `showCharacterIntro` for 28 cast (E20 places them); deferred: mount/aim/jump variants (mount.ts, gnome package); open: intro card covers top HUD on 390 px portrait outside cutscenes; nothing listened to in a real browser |
| E10 | Homes and downtown life | Content | 4 | E01, E04, E05, E08 | merged | epic/E10-homes | see log | quest `m02-roof-on-credit` (bank loan → Flat 3B; `first-contract` prereq left to E20); Decorate floor-plan editor (touch), furniture shop, sleep spot, Home app, `gta-home-v1`; `homes/data.ts` home+work per character (`homeOf`/`workOf`, `registerHome` for area epics); Saucer Court rebuilt; 7 homes built (2 walk-in), taxi/courier destinations, map pins after first visit; R-180/R-181; deferred: home-08..12, homes on area sites (their epics call `registerHome`); Saucer wings 14 m tall |
| E11 | Coast and boardwalk | Content | 4 | E01 | merged | epic/E11-coast | see log | the Saltwater + Saltcut channel (Loch Moss → open sea), boardwalk, Long Spoon Pier, Spokewheel ride, water-ski mode + slalom + ramp (Last Tube rentals, Driftwood tows), Bathtub Queen (moored, cabin interior), 4 coast quests, 5 achievements, 22 prefabs, R-185 (renumbered); not hand-played; skier rides seated; Driftwood's boat local only; wheel legs lack colliders |
| E12 | Winter sports | Content | 4 | E01, E06 | merged | epic/E12-winter | see log | Snowdrop Slope snow paint (JS + Wasm), tea-tray sled + skis (`src/winter/slideRider.ts`), rope tow, Wool Run + Tea-Tray Run with bests, Hot Cocoa, Snowdrop app; ice fishing at Pail Pond (4 species); 4 more chill bears + BEAR DECK; 25 prefabs, 5 achievements, 2 side quests (temporarily after `ch3-tundra-drift-run`; E21 moves them to m38/m39), R-186..R-188 (renumbered); fixed: ground vehicle chassis froze mesh+rider; runs are 15–20 s (slope ~280 m); demo GIFs saved in the session scratchpad `demos/` (winter-ski-run.gif, winter-sled-run.gif) for upload; `sq-capwood-cap-count` left for E14 |
| E13 | Campus and skyline | Content | 5 | E01, E05 | merged | epic/E13-campus | see log | Rootwell University (13 buildings, 3 walk-in rooms, roofs + helipad), the Anthill (spiral road, observatory + telescope room, Dean's Leap ~47 m at 24 m/s), Rootwell Field 420 m runway (`ROOTWELL_AIRFIELD`; aircraft storage still desert only), Pinwheel Ridge (10 giant pinwheels); 5 achievements, 2 side quests (temp unlock after `ch4-spade-truce`; E21 → m47/m48), R-199..R-202 (renumbered); deferred: `sq-pinwheel-linemen`; 'Dr Clod Furrow' needs a lore entry; pinwheel vanes boxy up close |
| E14 | Dirt, rally and toadstools | Content | 5 | E01, E02 | merged | epic/E14-dirt | see log | **TrackDef registry** `raceTrack/tracks.ts` (+ `defs/`) for E26; Rutbottom Dirt Bowl 1.22 km banked circuit + `dirt-bike` Knobbly Dirt-Mower (dealer 650); Capwood ~140 toadstools + Great Ring; Capwood Run 2.73 km rally (shorter than the 3–4 km asked: small mountain) with fords capped at `WATERLOG.fordCap` 0.3; 4 quests (unlocks temporarily after ch2/ch4/ch5 quests — E21 re-times to #40/#42), 6 achievements, R-189..R-192 (renumbered); deferred: rally free-roam timer, mixed-kind races, glaze for the Knobbly, demo GIF |
| E15 | Golf course | Content | 5 | E01, E05 | merged | epic/E15-golf | a2d6abde | Hedgeworth Links: Kicked Board (breaks, saved), 4 holes numbered 1,2,3,9 (par 16), drive-through hedge arches, real golf (swing meter, clubs, lies, scorecard, golf cam, touch), clubhouse interior, Peony/Basil/Thrift + 4 side quests (temporarily after existing story quests), 6 achievements, 32 prefabs; new package **@lawn/golf** (Gnome Golf re-exports it; 25-shot golden test unchanged); shared `golf-flagstick` flag moved off the pole; R-193..R-195 (renumbered); deferred: reseed quest (needs E21's mown scar), online balls; hedges ~2.8 m thick; phone: hole strip overlaps weather chip |
| E16 | Countryside, fauna and the farm | Content | 6 | E01, E08 | merged | epic/E16-country | see log | 3 Even-Estates building sites, Trellisdown Vineyard + Brassknock Manor (tasting-hall interior), 6 deer herds + 2 goat flocks (+ hunting quarry), Windfall Croft farm (loan, 4 crops, oak acorns, Farm app, offline growth capped 2 h), 26 hunter camps; 2 side quests (temp unlocks; E20 → #7/#31), 6 achievements, 70 prefabs, R-210..R-214 (renumbered); deferred: hoardings timing W02/W17, manor ledger room; no camps in Fells/Mossy Wood; vines thin from afar |
| E17 | Underground societies | Content | 6 | E01, E05, E04 | merged | epic/E17-societies | see log | `src/societies/`: the Underspan (Hogweed Sprocket, workshop + Updraft to the Roost), Wader's Rest (Flock of the One Leg, flamingo, big tent, sermon), Loamdeep (6 underground halls, 4 mole jobs, DJ Moleman + Under-Chorus); 7 side quests (temp unlocks; E20/E21 move them), 6 achievements, ~61 prefabs, save `gta-societies-v1`, R-218..R-222 (renumbered); deferred: world changes W06/W13 (Burrow Door lantern, moles on the surface); hold games use Space/touch, not E |
| E19 | Courts and skate park | Content | 6 | E01 | merged | epic/E19-courts | see log | Drainpipe Court 2v2 pickup basketball on GJAM's sim (+ shootaround), the Gutter Bowls (half-pipe, bowl, street), `skateboard` vehicle kind with GTA controller scored by Aether Board tricks, 4 skate lines; packages **@lawn/jam**, **@lawn/trickboard** (both source games' goldens unchanged); 2 side quests (temp after `ch1-founders-boot`; E20 → after #14/#15), 6 achievements, R-215..R-217 (renumbered); local only online (board relays); landscape court buttons may overlap |
| E18 | Activities and side-quest pacing | Content | 7 | E04, E05, E08 | merged | epic/E18-activities | see log | offer caps (3/4/6 by act), journal Later shelf + Active/Open/Later/Done, chain queue, all unlocks re-timed; **43 unlocks carry `planned` story rows** (E20 21, E21 19, E22 3; table in `E18/contracts.md`; the test fails once a planned row exists until `after` moves onto it); hobby intros by Wenna/Hazel/Dunnock with intro cards; `bubble-mobile` Dewdrop + `sq-dewdrop-1..3`; world changes `src/worldChanges/` (props W01–W06, W08–W13, W15, W17, W18; W07/W14/W16 need props from E20–E22); R-227, R-228 (renumbered); Peony's Promise unlock appended at merge (no planned row); deferred: 6 schedule quests unwritten (incl. `sq-chef-first-shift`, `sq-hyssop-stairwell`); zfight timed out, no eyeball pass |
| E20 | Story acts I–II (quests 1–35) | Story | 7 | E04, E10 | merged | epic/E20-story12 | f0bcef0a | rows #1–#35 all built (23 new m05–m34, extended #15/#35 with parts keeping old ids), one file per row `src/quests/story/`, objective kinds `passenger` + `inspect`, intro cards at first appearances, `sq-on-the-house` free repairs, 21 planned unlocks moved, W01–W08/W18 wired, 12 achievements, R-229; open: no API to unlock map markers (rows 17,24,25,26,29,32), row 30 Speedway entry, row 31 clinic quick-heal, row 32 journal item; Tattler building missing (Hedda at a street desk); Vesper pronouns disagree lore vs bible; `sq-hyssop-stairwell`, `sq-chef-first-shift` still unwritten |
| E21 | Story act III (quests 36–53) | Story | 8 | E11–E17, E20 | merged | epic/E21-story3 | see log | rows #36–#53 all built (extended #46 and #52 in 3 parts + final), 14 intro cards, W09–W14 (mown scar at Hedgeworth; Wader's Rest side not built), 19 unlocks moved, `src/quests/storyMarks.ts` map markers + journal Items tab (closes E20's gap), shooting-target snap ≤30 m, R-233 (renumbered); reduced to dialogue only: lodge save/wardrobe, Ragwort's shop, student badge, keeping the dirt bike (no grant-vehicle API), waiter outfit; `sq-pinwheel-linemen`, `sq-trellisdown-pickers` unwritten; scenes can't play inside interiors (staged as sets beside them) |
| E22 | Story act IV (quests 54–70), lore and finish | Story + Finish | 9 | everything | merged | epic/E22-story4 | see log | rows #54–#70 built (#64, #70 in 4 parts; finale keeps `ch5-even-cut`, both endings; Cam's choice in #62), story complete at 70; lore pass ~110 entries added, ~90 corrected, 'Everyday' sections, Vesper 'he', R-234..R-236; scope moved: demos + PR description now after R1; open: 1/24 fuzz runs Granny doesn't board in #68 after the car is destroyed; nobody can stand on the moving Combine in scenes; Vesper has no bare-headed model; ~20 suggested signs written in lore but not built; lead's browser smokes never finished (stopped; orchestrator committed after build/tests/lore/cutscene-report passed) |
| E23 | Quest robustness, fuzzing and HOA balance | Engine + Fix | 3 | E03 | merged | epic/E23-quests | 5d56c186 | pinned quest rides + checkpoint auto-retry; `npm run quest-fuzz` (10 disruptions, 0 open bugs on seeds 1-2); sim 57/58 (nc-party needs relay); HOA: 1-hat cap on shooting steps, delayed arrival, LOS cooling, search circle + evade meter (not checked at 390x844) | | |
| E24 | Jobs II: chef, mechanic, comedy stage | Content | 5 | E05, E08 | merged | epic/E24-jobs2 | see log | workplace jobs (`src/workplaces/`, `finishShift` + shift card reusable by E25): Chef at the Acorn Diner (8 dishes, touch steps, rushes, dishes heal), Mechanic at Pay 'n' Glaze (16 briefs, client mode, scored), Comedy at Le Petit Groan in Pardonlin (5 awful sets, Double Down, tomatoes); 9 achievements; R-196..R-198 (renumbered); no shift played to the end in a browser; deferred: Gnoma guest lesson, `sq-chef-first-shift`, client driving off; comedy crowd mostly off camera |
| E25 | Jobs III: garbage truck, firefighting, Gnomazon warehouse | Content | 5 | E08 | merged | epic/E25-jobs3 | see log | Bin crew (Bin Depot, Mags Wheelie, `bin-lorry`, lift minigame, `?binround`), Firefighter (Fire Station No. 1, Chief Pumpwell, `fire-engine`, hose + hydrants + ladder rescues, `?firecall`), reusable fire system `src/fire/` (`?firedemo`), Gnomazon FC-1 packing minigame with KPI-9 (`?gnomazonshift`); 9 achievements; R-207..R-209 (renumbered); fires per player; Gnomazon party slice in backlog; fire station house prefab has no back wall; no shift played to the end |
| E26 | Street racing and race modes | Content | 6 | E14 | merged | epic/E26-streetrace | see log | 5 street routes (Kerb Row, Skyway Sprint, Ring Road Run, La Boucle, Saltbucket Dash), 3 meets, 5 `sr-*` quests vs Sable Throttlewick, pickup races with wagers, time trials + ghosts on every track, online player races (`tools/gta-race-e2e.mjs`), Race Club app, rivals avoid traffic; R-223..R-225 (renumbered); `sr-kerb-row` moved to ch1-tax-break-in at merge; deferred: spectating, AI in online races, E20 m05 scene at `MEETS['skyway-foot']`; regenerating `environments.md` drops a hand-written landscape section |
| E27 | Physics follow-ups: bushes, water skipping | Fix | 3 | E02 | merged | epic/E27-physics | see log | little bushes (mowable, <= 1.8 m) flatten, hedges/trees solid; `src/skim.ts` water skimming >= 13 m/s on >= 0.6 m water; traffic tests deterministic (game-time crash limiter, warden clock reset, seeded RNG) — two full suites green in a row after merge; known rare real jam in 'pull out' on 3/16 seeds (traffic code, not fixed); lore R-179 (renumbered); skim never driven in a browser |
| E28 | World expansion II: the European yard, nature preserve, roundabouts | Engine | 2 | E01 | merged | epic/E28-world2 | see log | worldHalf 1800, POS_BOUND 1850; **Pardonlin** (river Thymes, the Wickets), **the Unmown** preserve; roundabouts (Hatwheel, Place du Pot, Trellis Cross, Anthill Ring) + 4 HOA-hat traffic wardens; 18 sites for E30/E31 (Bean Tower, Grand Platz, Teacup Row, Radio Adagio, Beetle Market...); Wasm kernel sized from the world, parity tests back on; lore R-172..R-177 (renumbered at merge); Thymes bridges are low canal bridges (shallow); deferred: settlements in new regions, customs-counter prop, real phone |
| E29 | European kit: buildings, vehicles, plants, backyard styling | Engine (prefabs) | 3 | – | merged | epic/E29-eurokit | f758721b | 51 `euro-*` prefabs (16 buildings, 13 street furniture, 14 plants/backyard, rides + 3 reward gear); 5 rides (euro-hatch Petit Pois, deux-pots, wespa, baguette-trike, crepe-van) online, dealer, traffic (`setEuroZone` → 70% euro); `planStreetRow` in `src/eurokit/` for E30; deferred: glaze mounts for the rides, tram, parked spots |
| E30 | The European town: build-out, storytelling, classical radio | Content | 4 | E28, E29 | merged | epic/E30-pardonlin | see log | 4 districts (Old Town, Teacup Row & Quays, Left Bank, Jardin & Basin), 33 vignettes, 400+ signs, 22 residents, Radio Adagio 96.1 (13 pieces, Maestro Ottavio Lento), Café Pardon + radio foyer/studio, 4 town activities, 5 achievements, screens in E30/; rulings renumbered R-182..R-184; at merge: Left Bank allotment beds lost their colliders (E27 made them mowable), duplicate import fixed; open: Left Bank 848 buildings — check low-end phones; deferred: story quests with residents (E20–E22), tram, online town state |
| E31 | Living world: nature preserve, birds and animals, pushing existing places out | Content | 5 | E28, E29 | merged | epic/E31-living | see log | the Unmown (ranger station walk-in, Reedmere marsh boardwalk, 3 hides, checklist app), 8 bird species (36 total), 8 small animals, 3 vehicles (Ranger Buggy, Snail-Shell Camper, Cone Van), regional traffic + boat routes + 3 flights, band-road houses, hamlets Espalier End/Mittenholt/Dunelow, High Tarn; perf flat at 7.5 ms avg on phone viewport; R-203..R-206 (renumbered); hides are solid boxes (camera inside); deferred: guided walk, white hares, Turfton duck pond |
| E32 | Hedgeworth to nine holes | Content | 6 | E15 | merged | epic/E32-golf9 | see log | nine holes, par 34: site extended 145 m south into the Bottom Garden via the Turn Gate; holes 4 Peony's Promise, 5 The Maze, 6 The Drip, 7 The Potting Shed (roof tee), 8 The Rhubarb Patch; old 4-hole saves kept; thinner hedges, mole pops, phone HUD fix; `nine.test.ts` plays all 9; R-226 (renumbered); Peony's Promise unlock moved to ch5-even-cut at merge; Reedy Blind camp moved |
| E33 | Mountain routes | Content | 6 | E12, E14 | merged | epic/E33-mountains | see log | the Hatbrim range (the Bobble ~105 m, Old Pate, Brim Gap): Brim Gap Road (1.77 km pass road, Top Hat café), the Hatband (0.49 km gravel shelf, World's Edge lookout), the Brim Walk (1.65 km footpath, Summit Register), the Spine Cut (gorge road under the Keyhole arch); drive-along tests; perf flat; R-230..R-232 (renumbered); no coastal clifftop road (terrain can't make cliffs near water), no real tunnels; Brim Walk crosses the band road twice; hairpin chevrons one-way |
| R1 | Editorial review and polish (editors by content group, decider for disputes, iterate) | Review | 10 | everything | running | review/ |  |  |
| R2 | Requirements audit: every source item L01–L118 checked against what shipped | Review | 11 | R1 | planned | | | |

## Cross-cutting cleanup

- Done (F1): 40 wearables' `wear` mounts fixed; `npm test -w packages/gnome` green. Neck items (house-key-necklace hangs
  low, windsock-quiver shrunk to 0.68) were not eyeballed on a gnome: check in the equip lab during R1.
- Done (F2, 23885abc): the load-flaky traffic tests are deterministic (four full suites in a row green); the Gnome
  Theft Auto row of `AGENT_INDEX.md` rewritten cleanly. Merge tip: when an epic edits that row, re-splice with the
  usual helper and re-read it.
- After merging an epic that adds a workspace package, run `npm install` at the root before building.

## Side-quest load (for E18)

After E26 there are about 80 side quests, tutorials and races unlocking off 17 story beats; most area epics placed
theirs on existing chapter quests as a stop-gap. E18 owns the pacing rework (L67): the schedule in
`docs/design/gnome-theft-auto/side-quest-schedule.md`, the journal "Later" shelf, the open-offer cap, and re-timing
every temporary unlock it can before E20 builds the new story rows (E20/E21 then move the rest onto their rows).

## Engine work (built first, others build on it)

- **E01 World expansion:** grows the world past `worldHalf` 900, adds region documents for the new areas, and a
  **site registry** of reserved footprints (coast, campus + observatory mound, golf yard, dirt track, rally route,
  toadstool forest, ski hill, vineyard + mansion, new runway, wind farm, cult camp, mole entrance, construction sites,
  basketball court, skate park, character homes) so content epics fill a slot instead of fighting for ground. Also the
  downtown restructure (3 blocks → one park; a 2x1 mega block with a tunnel).
- **E05 Interiors and rooftops:** a generic way to enter a building and be in a furnished interior (and leave), plus
  walkable rooftops and helicopter landing on them. Homes, clubhouse, university, mansion, mole tunnels and shops use it.
- **E08 Economy, ownership and inventory:** a purchase/ownership framework (vehicle shops, insurance, repair, garage
  with many of one type, property purchase with debt), an inventory with consumables, and the money rebalance. Home,
  farm, chef job and shops use it.
- **E06 Sky, weather and time:** weather states (rain, snow, clouds) with an Options switch, a time-lapse transition into
  cutscenes set at another time of day, and the sky/world-life cadence (headlights, intermittent planes, bird paths,
  event frequency). Winter sports and the story's cutscenes use it.
- **E02** includes camera work (first-person mode, the camera-jump fix) and vehicle physics (landing, collision) that the
  dirt/rally tracks build on.

## Dependency graph

```
E01 ──┬─> E05 ──┬─> E10 ──> E20 ──> E21 ──> E22
      │         ├─> E13         ^       ^
      │         ├─> E15         |       |
      │         ├─> E17         E04 ────┘ (story bible feeds every story epic)
      │         └─> E18 <── E08
      ├─> E11, E12 (<─ E06), E14 (<─ E02), E16 (<─ E08), E19
      └─> E07 (map extent)
E08 ──> E10, E16, E18
E11..E17, E19 ──> E21 (act III visits the new areas)
```

## Waves

| Wave | Epics | Why together |
|---|---|---|
| 1 | E01, E02, E04 | world engine, vehicle/camera code and pure writing touch different files |
| 2 | E03, E05, E08 | bug sweep after the vehicle pass; interiors need E01; economy is independent |
| 3 | E06, E07, E09 | sky/world cadence, UI/options, audio/animation: separate modules |
| 4 | E10, E11, E12 | first content wave, uses all engines |
| 5 | E13, E14, E15 | |
| 6 | E16, E17, E19 | |
| 7 | E18, E20 | activities and the first story build after the homes exist |
| 8 | E21 | story act III, visits all new places |
| 9 | E22 | final story act, lore pass, full checks, demos |

**After session 3:** E32 (nine holes) and E33 (mountain routes) join wave 6. After E22, phase **R1** runs the
editorial review (process doc, "Editorial review"); the batch PR merges only after R1.

**Revised order after session 2 (supersedes the table above where they differ):** E28 (world II engine) runs in wave 2
next to E05; E23, E27 and E29 join wave 3 with E06, E07 and E09 (at most 3 leads at once, so wave 3 runs in two
halves); E30 joins wave 4; E24, E25 and E31 join wave 5; E26 joins wave 6. Story epics E20–E22 stay last and also visit
the European town and the nature preserve.

## Epic map (every source item has one owner)

| Epic | Source items |
|---|---|
| E01 | L92, plus site slots for L12, L17, L35, L37, L43, L51, L52, L56, L58, L59, L61, L74, L81, L82, L85, L40, L50 |
| E02 | L01, L13, L14, L18, L53, L55, L57, L76, L77, L78, L91, L93 |
| E03 | L96, L97, L100, L03, L07, L08, L09, L10, L16, L23, L24, L41, L49, L79, L80, L88 |
| E04 | L04, L83, L84 (writing: docs, direction, characters, 70-quest outline), L86 (first pass), L58 (who lives where), L67 + L68 (design) |
| E05 | L36, L75 |
| E06 | L02, L05, L06, L11, L19, L20, L71 |
| E07 | L26, L27, L34, L48, L65, L70, L87, L89, L94 |
| E08 | L15, L25, L29, L32, L33, L90 |
| E09 | L31, L46, L47, L63, L64, L73 |
| E10 | L21, L22, L58 (build homes and workplaces) |
| E11 | L35, L51 |
| E12 | L38, L42, L43, L44 |
| E13 | L52, L74, L82 |
| E14 | L17, L56, L81 |
| E15 | L85 |
| E16 | L12, L37, L39, L69, L72 |
| E17 | L28, L40, L50 |
| E18 | L54, L66, L67, L68 (chef L30 moved to E24) |
| E19 | L59, L60, L61, L62 |
| E20 | L95, L105, L106, L04 (applied), L45, L58 (quest pickups/drop-offs at homes), L84 quests 1–35 (rewrites the existing 17 main quests in place where the bible says so) |
| E21 | L95, L45, L83, L84 quests 36–53 |
| E22 | L95, L84 quests 54–70 with the extended pivotal quests, L86 final lore pass, batch finish |
| E23 | L101, L102, L103 |
| E24 | L30, L110, L111 |
| E25 | L107, L108, L109 |
| E26 | L112 |
| E27 | L113, L114 |
| E28 | L99 (land, reslotting, nature-preserve ground, roundabouts and traffic-director hats, pushing existing edges out), Wasm kernel resize |
| E29 | L99 (European buildings, vehicles, plants and backyard prefabs) |
| E30 | L99 (the town itself, environmental storytelling, classical radio station, its quests and people) |
| E31 | L99 (nature preserve, more birds and animals everywhere, more vehicles in traffic, detailing existing places) |
| E32 | L115 |
| E33 | L116 |
| R1 | L117 |
| R2 | L118 |

## Source list (verbatim)

- L01 fix collission in vehicles again. driving around circular or just larger prefabs is hard. i cannot getm y vehicle close to them without getting stuck. another example is clog cruiser cannot get through the little canal entrance
- L02 when headlights come on, stagger them so they don't ll turn on at once.
- L03 make sure very follow quest is completable. many times they get stuck
- L04 make sure dialog is written in such a way that player has enough context
- L05 reduce the ambient particles a little bit
- L06 add weather and snow and such. clouds are a bonus too. add option to disable in options
- L07 the plane with the ad gets stuck in cutscene but banner keeps moving
- L08 birds also stay stuck floating in cutscenes
- L09 when doing a quest, spawn players vehicle naerby so they are good to drive
- L10 the little sprinkler things in the starting area are glitchy and ahve tall water cone shooting out of them
- L11 add a neat transition where time sepeds up rapidly and when a cutscene is expected to start during a different time of day. this shouldn't effect the overall world unless intentional
- L12 add some construction sites. make them gnome themed and lore appropriate
- L13 reduce the amount of screenshake
- L14 allow slowly backing up in planes
- L15 add insurance, so that I can reclaim my vehicle for a price
- L16 i cannot jump over the wall into the sandpit. there is invisible wall above the ramp
- L17 add a toadstool forest somewhere
- L18 fix gnome not staying put in vheicle while driving fast. they often clip through
- L19 more variation in bird flying path. don't just have follow static route
- L20 make some of the world stuff like the planes not always present and sometimes make appearances
- L21 introduce the player's own home. make it one of hte earlier quests and have it be loaned to them increasing their debt
- L22 allow player to customize it. for now just make an apartment in the downtown available but we will have future options like for those out in the field
- L23 fix bridges - they go all the way to the bottom of hte canal atm. can drive through though, but visually fucked
- L24 give way around the raft int he canal it's annoying s hell
- L25 garage and persoanl vehicle - personal vehicle shouldn't be very car of same type. allow storage of multiple cars of same type. also mark it on map where to store
- L26 add option to zoom in on map and navigate around it. google maps style. bonus for 3d building option (but much lower res)
- L27 the key on the map on mobile takes up the entire map making it unusable
- L28 build a society underneath the highway. give a quest or two. make them a bit crazy and radical but brilliant
- L29 give a shop where i can buy new cars. new shop for boats too. new shop for aircraft
- L30 add a chef job, so that players can cook and make some dishes. should be fun.
- L31 ake footsteps a little quieter
- L32 rebalance money a little. equipment should be a bit more expensive. make sure we have soem gridn but don't have to endlessly grind
- L33 introduce an inventory for snacks that heal and maybe some other fun things
- L34 add option to hide bird popup sound
- L35 add an ocean region with skiing and tubing so that gnomes can have fun. not sure hwo this will reconcile with the world but surely it won't matter. add some new quests, maybe tie in to some other quests. boardwalk too for sure. ferris wheel as well.
- L36 start developing the interiors of some of these buildings
- L37 add a vineyard and mansion somewhere appropriate
- L38 make sure we do have polar bears and they are really chill
- L39 make sure we have more fauna and deer
- L40 add a cult somewhere.
- L41 fix the fac that a amillion gnomes sometimes are just chilling in one area
- L42 add the option to go sledding
- L43 add a ski hill and skiing
- L44 add ice fishing
- L45 add some more quests to the main story that interact with these nwere areas so they are all tied in. ensure same quality with cutscnes and character development
- L46 try and add more sound in cutscenes
- L47 add charactger voices using the shared voice pack. kind of implemented but could be better. maybe make it so radio text is read out at text speed and a little bit more on the screen. don't actually read it using the `news bulletin` voice just the gnome voice, but more radio sounding.
- L48 reduce the height of quest markers, add option to make them higher again in options
- L49 big lous car loses its mods after the cutscene
- L50 add an underground society. this will have a small mini-questline for moles and doing mole jobs. amke them fun innocent little fellas that are rather cute but misunderstood broadly by gnomes and tall ones. make dj moleman make an appearnace.
- L51 add a pirate ship somewhere
- L52 add a research university somewhere. should have a good number of buildings. may require map extension to support. also ensure it has an observatory. observatory should be on a giant hill (perhaps giant ant hill or termite mound?) and have a ramp that allows players to drive off it
- L53 add more ways for vehicles to break and lose parts. doesn't need to be fulyl realistic for dynamic, but the more parts we lsoe the better
- L54 add a bubble-boy style vehicle quest where the player unlocks the bubble-mobiel or ability to unlock one. should just allow them to roll around hamster style
- L55 improve the vehicle gravity situation when we go off ramps. it just kind of feels floaty atm. and when we land we bounce a good bit
- L56 add a dirt race track that is rather bumpy with big banked turns. add some new dirt-bike liek vehicle. may require map extension.
- L57 mkaei t so when fire bullets, acorn shells appaer on the ground
- L58 introduce buildings or apartments or stuff wher ethe main characters and side characteres live and work. Right now we have just work in most cses ,but no homes. I'd like to have it be that we can recognize special aplces where people live and groudn us in the world. all characters should have a home. some may never be acknolwedged. some quests should be rew-written or extended to have us pick up or drop people off at homes, places of work, etc.
- L59 add public basketball court
- L60 add ability to play basketball (steal mechanics from GBA GJAMj, share code if possible)
- L61 add public skate park
- L62 add ability to skateboard (ather board tie in)
- L63 add more varitions to existing high-usage animations
- L64 start exploring the sonic deisgn some more. build sound design bible. start adding more sound content.
- L65 add option to disable bird sounds in additon to disabling bird sound icon.
- L66 add quests to introduce player to birding, hunting, fihsing
- L67 rework the side quests available to player so that they aren't overwhelemd. unlock some as game progresses and other characters make sense to appear
- L68 when completing a series of quests, make some change in the world so the player can feel the world devloping
- L69 add the ability to buy a farm and start growing produce/farming/whatever as a way to make money. player can farm and sell stuff or just straightu p grow an oak tree and get acorns (though it takes awhile)
- L70 remember where player is when logging in/out
- L71 make the world events slightly less frequent
- L72 add like little random hunter shacks and tents and other stuff to the more sparse parts of the map so they are less sparse.
- L73 I really like the intent and angles with the directed shots, but review them and add a bit more variation. I like what we are expressing, but want a bit more variety.
- L74 in one of hte new areas added, make an ew runway.
- L75 allow landing on top of buildings in helicopter and letting me run around.
- L76 add first person mode
- L77 fix camera sometimes jumping and turning randomly. I think due to when I turn my camera near close objects or edges/corners
- L78 allow me to crack gnomes who are driving
- L79 the parade float quest foot float is not on orange marker. the whole quest seems bugged.
- L80 golden acorn near spawn near hospital is not accessible
- L81 add a rally race track that goes up and down mountain through toadstool stuff and also has some water crossing parts (but also special water that cannot fully wtaerlog car).
- L82 add wind turbines somewhere
- L83 in general, make it so quests explore the world some and not just the main city.
- L84 add more quests to the main questline. I think we need some more character development. write out the docs, write out the direction, the characters, then start developing. I'm looking for 70 main quests, with a few extended quests at pivotal moments.
- L85 add a golf course. should have a club house interior. player can actually play golf using improted mechanics from gnome golf. will need a lot of new land space. add by breaking through a fence into someone elses yard. with big hedges and tall grass and large plants that line the course. still letp layer drive through it. add some quests and make owenr and pro and groundskeeper fun people with interesting stuff going on.
- L86 take another pass writing out menial lore for the new extended world.
- L87 loading takes a while. figure out a way to show a loaidng screen with some fun faccts and little concept-art like menu pages.
- L88 profiler always attempts to route user to port :8080 which doesn't work (i think is internal pod port but not exteranl)
- L89 TALKING HEAD chat pop ups on mobile take up most of the screen
- L90 add repair option to pay and glaze
- L91 make civilian cars ocassionaly have a mod or two.
- L92 take out 3 of the blocks in the main square and make a contiguous park. then make one mega 2x1 with a tunnel underneath somewhere else.
- L93 (added later) also, fix the npc driving. its pretty shite. they turn like its arcade mode still but we have been liking the casual mode a lot. but they should be able ot drive on all ideally.
- L94 (added later) i am unable to click the optisno on the tab menu, add a phone/tab menu redeisgn where we introduce a gnomlet that is a tablet with apps that give the different optiosn serviced by the phone and tab menu today. this will be more real gta like and is a good way of solving the problem. also include one fun app that is just gnomey bird.
- L95 (added in session 2) I want the story to have more environmental elements. make new vehicles for cutscenes new buildginsn ew people special scripted stuff. I want players to feel connected to he world as they pay through it.
- L96 mobile players cannot enter building. the enter button isn't available but the popup is present
- L97 traffic algorithm seems busted on skyway vs the lower level
- L98 resolve merge conflcits in the pr too (done by the orchestrator)
- L99 add anotehr world expansion too, push into another yard. make it a whole kit and deal and just keep designing it out. The world should feel alive, the player should have the experience to visit a lot of areas. include a nature preserve too somewhere. continuing pushign existing environments out. may need to reslot a bit but yeah just keep it going non-stop. i think that the next yard should have a more european style city with closer buildings and ambling paths and make them a bit stereotypical in the satirical way we are already doing. kind of a parondonlin type of deal. it's a lot moree scope but i think the world will be better for it. adapt whatever we have planned to accomodate this. be ambitious and make sure to spend a lot of time detailing and environmentally story telling (add success criteira for that as part of AC for that task). more birds and animals too. more veicles as well. especially if we can start adopting european type vehicles. this will require another new set of prefabs, so make sure to build those. eorpean platns and backyard styling too. and include a new radio station for them that is just classical music or something. add trafic directing hats and roundabouts too
- L100 the boot on the drive the boot parade float into the ampitheater is still missing. restart step makes it show up though
- L101 if i fail a step stuff despawns. I think we need a way to pin certain vehicle to not depsawn during quests. or way to recover it or reset progress to last checkpoint in quest. just so I don't ahve to manually clcik restart step
- L102 do some fuzzing or add fuzzing tool for quests. so that we test out what happens if vehicle is destroyed, or player teleports away, or things like that so we can handle edge cases either through the framework or via one-off fixes in code.
- L103 audit and make sure that hat can sometimes be disabled on quests that require a lot of shooting as fighting the hat right now is effectively impossible. either that or rebalacne the hat if you think thati s better game design. they currently teleport in really quick and player has no visual aid to see how to lose levels.
- L104 one thing I have to say is that the game is pretty fun already. So don't lose all its charm but grow it and improve it where growing pains appear. (standing decision for every epic)
- L105 also add main character intros at appropriate timings. so players know who they are and what they are doing. keep it fairly short but enough to intro them
- L106 make an early quest that makes it free to repair at pay and galze.
- L107 add garbage truck job
- L108 add firefighting job
- L109 add warehouse gnomazon worker packing minigame job
- L110 add comedy actor job where the entire thing is to just sit there while your character goes through something rather unfunny and gets grilled by the crowd
- L111 add a mechanic job whre you customize a clients car
- L112 add street races. add street race quests and modes f or players to race (as well as racing on the tracks).
- L113 idk if covered already but make little bushes able to be ran over
- L114 allow player to drive over water on jumps
- L115 (added in session 3) add 5 more holes to the course. make it 9 hole.
- L116 Add a few different routes on the mountains and such.
- L118 (added in session 4) once editorial review is done. make a final pass to make sure we met all requirements listed
- L117 once all work is done. make an spawn subagents to act as editors and review all of this and provide feedback. spawn them by group of content. then proceed with addressing feedback. if somethign cuts against hte spirit, send it to a decider agent to evaluate the pros/cons of both and hte lore and make a decision. I want this to come back really polished and clean. I want the world to feel hand crafted and that requires spending a lot of time on the details making iterative adjustments until it all feels just right. otherwise good work keep going

## Standing decisions (leads do not ask about these)

- **Keep the charm (L104).** The game is already fun. Grow it and fix growing pains; do not rewrite systems that work,
  do not flatten its satirical tone, do not trade feel for features.
- **Environmental storytelling is acceptance criteria** for every content epic (E10–E19, E24–E26, E28–E31) and every
  story epic (L95): each new area or quest ships with (a) at least 3 readable story vignettes (props arranged to tell a
  small story without text: an abandoned picnic mid-argument, a half-built thing with its plans blowing away), (b)
  signage and posters with jokes that fit the place's lore, (c) at least one resident seen doing something specific to
  the place, (d) ambient sound and life matching the place, and (e) a screenshot pass at 3 spots per area, recorded in
  the epic's roadmap folder. Story quests also get scripted set pieces and cutscene-only vehicles, buildings and
  people where the outline calls for them.
- **New epics E23–E31 have no brief yet:** their lead writes the brief first (template in the process doc), from this
  plan and the code, then runs decompose on it.

- Today the main story has 17 quests over 5 chapters (`src/quests/chapter1.ts`–`chapter5.ts`). E04 writes the 70-quest
  outline; existing quests are kept, renumbered and rewritten where the outline says so. "Extended" pivotal quests are
  multi-part quests with several cutscenes.
- New land: E01 decides geometry. Planned new areas (names are placeholders until E04/lore settle them): the ocean
  coast with boardwalk, ferris wheel and pirate ship; the research university with an observatory on a giant ant-hill
  mound with a drive-off ramp and a new runway; a neighbour's yard behind a broken fence for the golf course; a dirt
  track and a rally route that climbs the north mountain through a toadstool forest; a ski hill in or beside Frostbite
  Fells; vineyard and mansion in the farm/forest edge; wind turbines on a ridge.
- Shared code from other games (`gba-gjam` basketball, `aether-board` skateboard, `gnome-golf` golf, `cooking-gnoma`
  cooking) is moved into a package and both games import it; the source game's build and tests must still pass. If an
  extraction would need behavioural changes to the source game, the lead copies nothing and writes the GTA version
  against the package API instead, and notes it.
- Every new place and person goes through lore (`npm run lore -- find`), prefabs (`@lawn/prefabs`), achievements
  (`packages/achievements`), mobile controls and the online pattern (`docs/roadmaps/gta-online-sync.md`).
- Cross-epic findings from the briefs (binding):
  - E01 raises the online position bound (`POS_BOUND` in `net.ts`, 950 today) to cover the new land, and reserves the
    off-map interior coordinate block (x >= 5000) that E05 uses; E05 exempts interiors from `clampToWorld`.
  - E01 also reserves sites for the car, boat and aircraft dealerships (E08) and treats the L92 tunnel roof as a
    walkable rooftop for E05. E01 adds `AIRFIELDS[]`; E13 converts consumers that need the second runway.
  - E05's `defineInterior` and the quest `interior:` gate are fixed contracts for E10, E11, E15, E17, E18; E05 states
    whether a large underground cell (mole tunnels) is supported.
  - E08 owns the property-purchase + loan contract (`registerProperty` / `buyProperty`) used by E10 and E16.
  - Save keys (`saveIO.ts`, `cloudSave.ts` MERGES, `saveIO.test.ts`) are additive; merge order follows the waves.
  - Gnomlet (L94, E07) becomes the home for app-like menus; epics before it add phone apps through the existing phone
    registry, E07 migrates them. Shared packages: `@lawn/golf` (E15), `@lawn/jam` + `@lawn/trickboard` (E19); cooking
    shares pure logic only (Cooking Gnoma is Phaser, GTA is three.js).
- Options added by this batch (weather, quest-marker height, bird sounds, bird pop-up sound, first-person) live in the
  existing Options panel; E07 owns the panel layout, the other epics add their own rows through whatever registry the
  panel has (or E07 adds one).
