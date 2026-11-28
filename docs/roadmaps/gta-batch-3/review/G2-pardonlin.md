# R1 editorial review, G2: Pardonlin

Editor: G2 (Opus), round 1. Branch `gta-batch-3` at 6d217da8. Dev server on port 5402; screenshots with
`node tools/gta-shots.mjs` (desktop 960x600 and phone 390x844, day, golden hour and `?time=night`, two interiors) are in
[shots/G2/](shots/G2/). Names below are `shots/G2/<name>.png`. Data counts come from `pardonlinPlans()` loaded in the
browser.

## Verdict

The *writing* is here and has the right voice: the shop and street signs, the cast's lines, Radio Adagio's 13 titles
("Minuet for a Queue That Does Not Move"), Café Pardon's interior and Teacup Row's café lane (`terrace`, `tq1`) are
charming, and they fit the lore. The *town* is not here yet. The user asked for "closer buildings and ambling paths". What
shipped is E28's grid of straight two-lane roads with ~130 m blocks. Kit buildings stand in a single row 8 m off each
road centre, behind a strip of lawn, and every block interior is open grass (`ot1`, `lb2`, `lb3`, `marketin`). Half the
named places read as a large lawn with props on it: the Beetle Market, the Basin, the backyards and the Jardin beyond
the parterre. The river Thymes looks like a painted road. The best running joke (Pardonlin queues for everything) has
no-one standing in its queues. None of this is about the charm, which is good. The *ground* of the town needs a second,
hand-crafted pass: pavements and cobbles, lanes through the blocks, a real river, and people in the queues. Until then
it does not meet the brief.

Counts: 30 findings. 5 blockers, 21 polish, 4 nits. 8 spirit, 19 craft, and 3 that are both (1, 4 and 16).

## Findings

### 1. The streets have lawn verges, not pavements
- **What:** Every street in town runs between grass strips about 3–4.5 m wide. The shopfronts, café tables, plane trees
  and lamps stand on lawn. Paving exists only as patches of tiles in the squares and Teacup Row. A European town is wall
  to wall: kerb, pavement, then façade.
- **Where:** `ot3` (Rue Haute), `rueouest`, `pontneuf`, `tq2`, `warden2`, `hatwheel`. Cause: rows at `off: 8` from a
  7 m road (`districts/*.ts ROWS`), with nothing laid between the road edge and the fronts.
- **Why:** It is the single biggest reason the town reads as "kit houses on a lawn" and not as Pardonlin. It is
  visible in every street shot.
- **Fix:** Lay a pavement band along both sides of every road in town: a kerb line plus a flat paving or cobble strip
  out to the building fronts. Use a flat decal on `LAYER` (or a ground-paint pass on the terrain mesh for the town
  rect), not thousands of tile props. Make the squares cobbled or gravel where the lore says so. Keep grass only in the
  Jardin, the gardens and the backyards.
- **Severity:** blocker. **Type:** spirit (the brief) + craft.

### 2. No ambling paths: big grid blocks with lawn inside
- **What:** Pardonlin is 23 straight roads (most have 3 points) plus 4 footpaths. Two of the footpaths are the river
  walks and two are in the Jardin. The blocks are about 115–140 m on a side, built only along their frontages, so the
  inside of each block is an empty field. There are no lanes, passages, stairs, courtyards, arcades or dead-ends.
- **Where:** `src/data/levels/pardonlin.level.json` paths. Block interiors at `ot1` (-1520,-318), `lb3` (-1740,600) and
  behind the Rue Haute rows.
- **Why:** The user asked for "closer buildings and ambling paths" and "be ambitious". The layout is a wide-street
  American grid wearing European façades.
- **Fix:** Cut each block with 1–3 crooked pedestrian lanes (3–4 m wide, cobbled, bending, sometimes stepped) and
  build both sides of each lane with kit buildings at 0–1 m gaps (`frontage()` already takes footpaths). Put small
  courtyards and passages through the rows. Keep the big roads for traffic. Lanes are walk-only and add no traffic
  cost. Add the lanes as `trail/pl-*` footpaths so the clearance test still holds. Start with the Old Town and the Left
  Bank.
- **Severity:** blocker. **Type:** spirit.

### 3. The Grand Platz is huge and bare
- **What:** The town's heart is about 100 x 120 m of identical tiles. The bandstand, the mime and the boules sit far
  apart, with acres of empty paving between them. At gnome scale it reads as a car park.
- **Where:** `ot2`, `platzc`, `groan`, `odile` (-1500,-200 facing north). Lead's own note in the E30 roadmap: "the Grand
  Platz centre was bare".
- **Why:** The landmark square should be the densest, most lived-in place in the game.
- **Fix:** Shrink the paved square to about 40–50 m: give the rest to a plane-tree quincunx with benches and gravel, a
  market corner and café terraces spilling 10 m out. Or keep the size and fill it: a carousel, a flower market,
  newspaper kiosks, more terraces, a crowd round the mime, and children's boats in the fountain. Move the cellar
  entrance to a building edge (see 15).
- **Severity:** blocker. **Type:** spirit.

### 4. The Thymes reads as a painted road
- **What:** The river is a flat teal strip with a light kerb edge, level with the lawn on both sides. It has no quay
  walls, no drop, no steps down, no moored boats, no barges, no bookstalls on the parapet and no visible swans. The
  bridges are flat grey slabs. In the Jardin it looks exactly like a road (`jardinfountain`).
- **Where:** `thymes` (-1597,-100), `jardinfountain` (-1600,-690), `tq2`. Water config from E28. Quay props are kept
  12.5 m from the centre line (`RIVER_KEEP`).
- **Why:** The Thymes is the town's spine and a named lore place. "The river is decorative" is a sign joke, not a
  design brief.
- **Fix:** Sink the channel 1.5–2 m between stone quay walls with railings and stair cuts. Moor 6–10 boats (a
  houseboat, a péniche with washing on it, a sunk rowing boat with a "for sale" sign). Put bouquiniste boxes on the
  parapet along the Thymes Walk. Make the swans visible. Give the bridges parapets, lamps and a padlock-railing
  vignette.
- **Severity:** blocker. **Type:** craft + spirit.

### 5. Nobody is in the queues
- **What:** The Bean Tower switchback, the Grand Platz "QUEUE HERE. For what: see the front of the queue." line and
  the bakery queue are rope posts with nobody in them. The activity tells you "You join the queue. It is long." and you
  are the only gnome in it. The only queue with people is Café Pardon's interior.
- **Where:** `towerqueue` (-1508,-335), `platzqueue` (-1484,-188). `oldTown.ts` has 122 `pl-queue-post`s and 5 residents.
  `activities.ts:83`, `activityLogic.ts QUEUE_LINES` ("A gnome ahead checks a clipboard...").
- **Why:** Queueing is Pardonlin's defining joke in the lore (`pardonlin-queueing.md`, "queue for everything"). Empty
  ropes undercut it and make the activity's lines untrue.
- **Fix:** Stand 8–15 ambient gnomes in each queue, with idle variety (newspaper, checking a watch, a picnic in the
  line, a dog). For "Queued for Nothing", put gnomes ahead of the player who step forward as the queue moves and leave
  at the front. Add a queue of 4–6 outside Brigitte's bakery at dawn.
- **Severity:** blocker. **Type:** spirit.

### 6. A thin population, and no cyclists in the streets
- **What:** The Old Town has 5 residents for 435 buildings and the Left Bank 5 for 848. The 9 strollers and cyclists in
  `life.ts` only use the two riverside walks. The lore says Continentals "cycle everywhere" and go round the Hatwheel
  "once more than strictly needed", but no bicycle rides a street or the Hatwheel.
- **Where:** `pardonlin/life.ts:342-360` (`walkPaths` = thymes-walk, rive-gauche). Resident counts are from
  `pardonlinPlans()`.
- **Why:** The town looks deserted away from the set-piece spots (`ot3`, `rueouest`). Lived-in is the acceptance bar.
- **Fix:** Add cyclists that lap the Hatwheel 1–3 times before leaving, using the existing ring path. Add more strollers
  on the Rue Haute pavements and the new lanes, and window-leaners, shopkeepers in doorways and a street sweeper. Aim for
  12–15 visible Continentals per district.
- **Severity:** polish. **Type:** spirit.

### 7. The Beetle Market is bare stall frames on a lawn
- **What:** 61 `market-stall`s in a uniform grid, standing on grass with one tile aisle. They have no canopies and few
  goods, and the stalls cannot be told apart. From the street it reads as an empty frame yard.
- **Where:** `lb2`, `marketin`, `stall` (-1733,124..160). `leftBank.ts`.
- **Why:** It is one of the four headline places, and a flea market is a natural spot for dense storytelling.
- **Fix:** Cobble the market square. Give the stalls striped canopies (tinted per stall) and pile goods by trade:
  cheese, bric-a-brac, books, beetles. Break the grid into crooked rows, add 4–6 stallholders and shoppers, and put a
  haggling vignette at every few stalls.
- **Severity:** polish. **Type:** craft.

### 8. Basin Quay and the Basin are empty
- **What:** Basin Quay is a large lawn with a distant boathouse and a pedalo on the grass. The Basin is an open sheet of
  water with one boat, and the world wall is right behind it.
- **Where:** `gd3` (-1495,1045 facing west), `basin` (-1560,1040).
- **Why:** It is a named district ending. The Captain and the angler stand in a void.
- **Fix:** Build a stone quay edge with bollards and moored boats. Add a harbourmaster's hut with notices, crates and
  nets, a short pontoon and two or three boats on the water. Plant trees or a terrace row to hide the world wall.
- **Severity:** polish. **Type:** craft.

### 9. The Jardin stops being a garden past the parterre
- **What:** The parterre square works (`gd1`). Beyond it there are only lawns and straight tree rows, crossed by the
  flat river. The lore calls for "gravel walks, clipped limes, terracotta pots, a long ornamental rill".
- **Where:** `gd1`, `jardinfountain`. `gardens.ts`. Lore: `pardonlin.md`, `the-jardin.md`.
- **Fix:** Gravel the walks (paint, not props). Use pleached limes on the axis, put pots on the balustrades and add an
  ornamental rill or a basin on the cross axis. Make the river edge a stone bank here (see 4).
- **Severity:** polish. **Type:** craft.

### 10. Paving: grass in the seams, tiles that look like wood, raised slab edges
- **What:** (a) Tiles 2.94 m wide on a 3 m grid leave 6 cm gaps that show grass. The seam under the camera reads as a
  green line across every square (`ot2`, `platzc`, `towerqueue`, `platz-nodebug` without `&debug`). (b) The tile
  texture is streaky and reads as timber decking, not stone. (c) At the edges of each patch the 0.12 m slabs end as a
  visible step over the grass (`tq3`, `adagiofront`).
- **Where:** `oldTown.ts TILE / TILE_SCALE`, the equivalents in the other districts, and the `euro-paving-tile` prefab.
- **Fix:** Put one flat stone-coloured decal under each paved area (`flatLayer`, decal layer) so the seams show stone.
  Change the tile texture to stone flags or setts. Finish patch edges with a kerb prop, or feather them with a
  border strip. This combines well with finding 1.
- **Severity:** polish. **Type:** craft.

### 11. Poster boards are blank from behind
- **What:** Free-standing `euro-poster-board`s have text on one face only. From the other side they are a blank grey
  panel. In open squares, half the approaches see a blank board.
- **Where:** `gd1` (Jardin), `boules` (Platz), `marketin` (the chalkboards at the market).
- **Fix:** Print double-sided signs for free-standing boards (a second text plane at yaw+π, which can carry a second
  joke). Or stand them against walls, facing the approach.
- **Severity:** polish. **Type:** craft.

### 12. Long sign texts are unreadable; Radio Adagio's own banner can't be read
- **What:** Each sign gets a 256 px atlas cell (`town.ts CELL = 256`), so long jokes on banners and plaques shrink to a
  blur. The Opera Hall's roof banner ("RADIO ADAGIO 96.1 — Now broadcasting: silence (scheduled)") and the door plaque
  are unreadable from the forecourt.
- **Where:** `operabanner`, `adagiofront` (-1700,-100). `town.ts plate()/paint()`.
- **Why:** The jokes are the town's best asset, and the station's home doesn't say what it is.
- **Fix:** Use 512 px cells (or a cell size scaled to the plate's width) for banners and plaques. Make the Opera banner
  larger and lower, over the door, with the long joke on a separate poster at eye level. Cap the length of text that
  goes on high banners.
- **Severity:** polish. **Type:** craft.

### 13. Shop names repeat street after street
- **What:** Each building type cycles through 1–3 names. In Teacup Row and the Quays, "ANTIQUES (NEW STOCK: OLD)" and
  "THE ALMOST INN" appear 11 and 10 times. In the Old Town, "BISTRO. Lunch begins at ten" and "BISTRO. Soup of the
  day: yesterday." appear 8 times each. On the Left Bank, "STUDIO Noisy genius, 3rd floor" appears 10 times. Old Town:
  83 signs, 48 unique. Teacup Row and the Quays: 161 signs, 58 unique.
- **Where:** `teacupQuays.data.ts:10-17`, `oldTown.ts SHOP_NAMES`, the Left Bank menu boards.
- **Why:** Copy-paste repetition kills the "hand-crafted" feeling. A joke seen three times on one street stops working.
- **Fix:** Write a pool of 8–12 names per building type per district (unique per street), or put names only on every
  2nd–3rd shop and leave the others as plain "BOULANGERIE"-style lettering, which also reads as more real.
- **Severity:** polish. **Type:** craft.

### 14. Too many shops of too few types, in the wrong places
- **What:** The whole town uses 11 kit buildings. The Left Bank has 133 antiques shops, 106 bistros and 62 bakeries
  among 848 buildings, and shopfronts face the backyards and quiet side streets. Shop types should cluster on the Rue
  Haute, Teacup Row and the market; side streets should be homes with doors, shutters and window boxes.
- **Where:** `leftBank.ts` mixes; `oldTown.ts SIDE_MIX/BACK_MIX` (antiques and bakery on side streets).
- **Fix:** Use residential-only mixes for back and side rows. Ration shopfronts to the high streets and squares. Vary
  tint and trim more per row. If budget allows, add 2–3 new kit pieces: a narrow 2-bay house, a corner house with a
  turret, and an arcade or covered passage that a lane from finding 2 can pass through.
- **Severity:** polish. **Type:** spirit.

### 15. Le Petit Groan is a grey hole in the middle of the Platz
- **What:** The comedy cellar is meant to be "off the Grand Platz". Instead it is a free-standing grey stair well in
  the open square at (-1498,-209), with no readable name over it, and its chalkboard shows no text. The lore entry
  still says "In the games: Planned (E24)".
- **Where:** `groan`, `ot2`. `workplaces/comedy/club.ts CLUB_DOOR`. `docs/lore/entries/apocrypha/le-petit-groan.md`.
- **Fix:** Move the door to a cellar hatch or doorway in a Platz-side building front, with a hanging sign ("LE PETIT
  GROAN. Laughter by appointment") and tonight's bill on the chalkboard. Update the lore's "In the games" section.
- **Severity:** polish. **Type:** craft.

### 16. The race meet's crowd always stands on the Opera forecourt, using Turfton's lines
- **What:** The Quai de la Boucle meet (centre (-1724,-91)) shares the Boulevard with the Opera Hall. Its spectators
  stand there all day, shouting generic street-race cheers, including "Wave the flag, Wick!" (Wick is Turfton's
  flagger; Pardonlin's is Odette Marchand) and "My nan could go faster, and she is in a wheelchair. Well, a pram."
- **Where:** `lb1` (-1712,-100). `streetRace/meets.ts:23-33`, `streetRace/meetScene.ts:25-31` `CHEERS`.
- **Why:** The approach to Radio Adagio's home is a race crowd heckling about lowriders. It breaks both places' voices
  and gets a name wrong.
- **Fix:** Give each meet its own cheer list, with the flagger's name taken from `cast.ts`. Give Pardonlin's cheers a
  Continental flavour ("Pardon! Pardon! Faster, pardon!"). Move the meet's crowd 20–30 m south along the Boulevard so
  the Opera forecourt belongs to the Opera, or show the crowd only when a race is offered. Flag this to G8 too.
- **Severity:** polish. **Type:** craft + spirit.

### 17. The steeple bell is in the wrong place and rings every 90 seconds
- **What:** `sound.ts` says "the steeple bell on the hour". The code tolls three times every 90 s, heard over 400 m,
  from (-1500,-250) on the Grand Platz, where there is no steeple. The steeple church (the Church of the Second
  Helping) is at Place du Pot.
- **Where:** `pardonlin/sound.ts:24,37` `SOUND_SPOTS.bell` `every: [90, 90]`.
- **Fix:** Put the bell at the church's steeple. Ring it on the in-game hour (and the half hour once), with the number
  of tolls set by the hour, and an extra, late toll as a joke ("the bell is on a go-slow").
- **Severity:** polish. **Type:** craft.

### 18. Whole districts have no sound
- **What:** The 10 town sound spots cover the Platz, Teacup Row, the quay accordion and the market's pigeons. The Left
  Bank has no café, market chatter or studio noises. The Jardin, the Little Gardens and Basin Quay have nothing beyond
  the general `continental` bed.
- **Where:** `pardonlin/sound.ts SOUND_SPOTS`.
- **Fix:** Add market haggling and a stall bell, a cello practising badly from the Opera's stage door, shears snipping
  and the fountain in the Jardin, a watering can and a radio at the allotments, rigging and gulls on Basin Quay, and
  bicycle bells on the streets.
- **Severity:** polish. **Type:** craft.

### 19. The town is flat and unlit at night
- **What:** At `?time=night` the Platz and Teacup Row are uniformly blue-dark. The lamp posts cast no pools, the
  windows stay unlit and the café string lights don't glow. The Opera's windows glow by day but the rest of the town
  doesn't at night.
- **Where:** `night-platz`, `night-teacup`. `buildStaticCells(..., { lights: false })` in `town.ts`.
- **Why:** A café town at night is one of the strongest mood shots available, and it goes unused.
- **Fix:** Give a share of windows emissive glow at night, put fake light decals under lamps (flat layer) and on café
  terraces, and add glow to the string lights and the bandstand. Keep real lights at zero.
- **Severity:** polish. **Type:** craft.

### 20. Speech bubbles run off screen and swamp the phone view
- **What:** Resident speech bubbles grow as the player gets close. They are not clamped to the viewport, so they are
  cut off at the screen edge (`terrace`, `marrow`: "Wilhelmina Mar...") and cover the minimap and HUD. At 390x844 the
  Sips' bubble covers about half the screen, and only "table. ... esday." is visible (`phone-teacup`).
- **Where:** the ambient-gnome bubble (`ambientGnomes.ts`). It shows up most in Pardonlin because the residents talk
  most there.
- **Fix:** Clamp bubbles inside the safe area, cap their scale and font size (smaller on phone), and keep them clear of
  the HUD corners. Flag this to G9 (UI).
- **Severity:** polish. **Type:** craft.

### 21. Roundabout islands are generic and look unfinished
- **What:** Place du Pot's island is a brown soil disc with primitive coloured spheres and a big green ball. The
  Hatwheel has the same planter as every Turfton roundabout. Neither says "Pardonlin", and the Hatwheel has no hat.
  The lore asks for a "Place du Pot (Pot Not Included)" sign and a cobbled belt round the ring.
- **Where:** `potfountain` (-1500,450), `hatwheel`. `roundaboutIslands.ts` (`roundabout-planter`).
- **Fix:** Give the Hatwheel a giant bronze hat on a plinth, or a hat-shaped topiary, with "Allow Several Laps" on a
  sign. Give Place du Pot an empty plinth with a plaque, "Pot Not Included". Lay a cobbled belt round both rings.
  Planted-bed islands stay for the other bands.
- **Severity:** polish. **Type:** spirit.

### 22. The Wickets: an empty customs hut and an entrance with no joke
- **What:** The Grand Wicket's customs hut has no officer. The hat-and-stamp prop is still deferred from E28 ("left for
  a later pass"). The wicket signs carry symbols only. Arriving in Pardonlin is a gap in a plank fence.
- **Where:** `wicket` (-1375,-30). `pardonlin/wickets.ts:133`.
- **Fix:** Put a customs gnome in the hut (stamping, asking "Purpose of visit? Lunch?") with the hat and stamp on the
  counter, made from existing prefabs. Add a welcome board on the town side ("PARDONLIN. Pardon?") and a short queue of
  cars and suitcases at the boom.
- **Severity:** polish. **Type:** spirit.

### 23. The lore disagrees with the game about places
- **What:** (a) Odile Easelby is "a Left Bank painter" and `pardonlin.md` lists her under the Left Bank. The game (and the
  E30 cast table) puts her on the Grand Platz in the Old Town. (b) `brigitte-levains-bakery.md` places the bakery off
  the Rue Haute "near x -1462, z -200" as "the start of the Baguette Round". The round starts at Brigitte's spot on Teacup
  Row (-1520.5,128.5), and `pardonlin.md` lists Brigitte in the Old Town. (c) `the-hatwheel.md` says the Hatwheel is "a
  ring of gravel", and that a warden directs it. It is asphalt, and the warden stands at the Rue Haute / Grand Route
  crossing (-1462,-30). (d) `place-du-pot.md` describes a cobbled belt that isn't built. (e) `le-petit-groan.md`
  "Planned (E24)".
- **Where:** `docs/lore/entries/apocrypha/{odile-easelby,pardonlin,brigitte-levains-bakery,the-hatwheel,place-du-pot,le-petit-groan}.md`.
- **Fix:** Bring the lore in line with the game (the cast table is the fixed point), or build what the lore says (the
  cobbled belt, finding 21). Run `npm run lore`.
- **Severity:** polish. **Type:** craft.

### 24. Allotment sheds are post booths, and the Folly is a post booth
- **What:** 19 of the Little Gardens' shed slots use `euro-post-booth`, a yellow post kiosk. The Jardin's "Romantic
  Ruin" folly is a post booth with two ivy walls. Both read as a post office in a vegetable patch.
- **Where:** `gardens.ts:368` and `gardens.ts:270`. `gd2` (yellow booth at right).
- **Fix:** Use `garden-shed` (tinted) or add a small lean-to shed prefab. Build the folly from broken columns and an
  arch (a new `pl-folly` prefab), which fits the sign "Built last Tuesday. Ruined Wednesday."
- **Severity:** polish. **Type:** craft.

### 25. Low-end phone performance was never checked on the densest districts
- **What:** E30 deferred the low-end phone run. The Left Bank alone has 848 buildings and the town 1709 buildings plus
  about 7,500 props. Desktop numbers are fine (7.4 ms at the Platz).
- **Where:** E30 roadmap, "Deferred / known".
- **Fix:** Run `node tools/gta-perf.mjs --cpu 4` at the Platz, Rue Ouest and the market before merge. Pardonlin's
  fixes (pavements, lanes) add geometry, so measure after them too.
- **Severity:** polish. **Type:** craft.

### 26. A wide strip of lawn around the Opera Hall
- **What:** Radio Adagio's Opera Hall sits on a paved forecourt marooned in lawn. Between the Boulevard and the
  forecourt is a 10 m grass strip with no path. Forecourt dressing is light: a horn speaker, a chalkboard and two
  benches, plus the race crowd from finding 16.
- **Where:** `lb1`, `adagiofront`, `operabanner`.
- **Fix:** Pave from the kerb to the steps. Add a ticket kiosk and posters for "the Fifth, Act 1 of 3, of 3", a stage
  door with a queue of one cellist, and the Maestro's parked scooter.
- **Severity:** polish. **Type:** craft.

### 27. Wilhelmina Marrow stands inside an allotment bed
- **What:** She is waist-deep inside a raised bed, clipped through its walls.
- **Where:** `marrow` (-1460,682). `gardens.ts` residents.
- **Fix:** Move her about 1 m onto the path beside the bed, facing the marrow.
- **Severity:** nit. **Type:** craft.

### 28. Brigitte's reward line promises a joke and doesn't deliver it
- **What:** "Brigitte: Five doors, five bakes. Here is your N acorns and a bad joke about rolls." No joke is told, and
  "is" should be "are".
- **Where:** `pardonlin/activities.ts:212`.
- **Fix:** Tell the bad joke, e.g. "Here are your N acorns. Why did the roll stop? It was on a go-slow. ...It is a
  bread joke."
- **Severity:** nit. **Type:** craft.

### 29. The Pardonlin warden wears HOA green in a town that is "not an HOA town"
- **What:** Herr-Monsieur Lupin Pardoux wears the HOA green uniform. R-183 says Pardonlin is not an HOA town and
  `pardonlin.md` says he is "on loan from the Continentals". The warden lore says Pardonlin thinks HOA hats are "too
  short".
- **Where:** `trafficDirectorsView.ts HOA_GREEN`, `trafficDirectors.ts:38`, `warden2`.
- **Fix:** Give the Pardonlin warden a Continental uniform (navy, white gloves) and a visibly taller hat than the
  Turfton wardens: a joke that is already in the lore.
- **Severity:** nit. **Type:** spirit.

### 30. Untextured white squares drift across the sky in "Blustery" weather
- **What:** Small flat white quads float about the sky in many shots (`adagiofront`, `gd1`, `operabanner`). They look
  like weather debris without a texture.
- **Where:** weather particles (E06). Flag this to G9.
- **Fix:** Give the debris a leaf or petal sprite, or tint it, or hide the particles above the horizon line.
- **Severity:** nit. **Type:** craft.

## Keep (do not lose in the fixes)

Teacup Row's café lane (`terrace`, `tq1`). The Rue Ouest's spilling antiques (`rueouest`). Marcel's invisible-box
poster (`mime`). The Gastons' boules quarrel (`boules`). Café Pardon's interior with its umbrella barrels and queue
(`int-cafe`). Radio Adagio's track titles and "ON AIR (slowly)" (`int-adagio`). The Bean Tower as a silhouette.
Anatole's "fourth tune" line (`tq2`). The sign writing in general.
