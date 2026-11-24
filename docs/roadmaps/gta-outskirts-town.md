# Gnome Theft Auto: Pebblewick, a minor town on the outskirts

Goal (the user): "develop a minor town on the outskirts. give it some stuff. expand map if needed."

## Decisions

- **Where.** No map expansion. The far east of the Dust Flats, south of the east-outer highway between the Mesa trail
  and the Speedway trail, was open sand: x 580..730, z 10..200 (world). Nothing hand-placed stood there, no stage spot
  or setpiece is near, the edge rim starts at x 770 and the dust-east ridge at z ~170 is masked by the town's reserve.
  The map stays 1800 x 1800; no border, rim, water, minimap or cull-cell change.
- **Name and character.** **Pebblewick** (two garden words, house style): about 30 gnomes in flat-roofed adobe, farming
  dry pepper plots along the **Weeping Line**, a buried Tall One tube that weeps a drop every span (a drip line; the
  gnomes never call it that). The last stop before the Lost & Found Speedway: a mower workshop with a Black Dew pump,
  a diner that feeds race crowds on Fizz Cup weekends, a reeve who insists it is "a town, not a stop". Answers two loose
  threads: Route East's "asphalt ends at x 570" (it was asked nicely to keep going, to Pebblewick) and the Dust Flats'
  chrome **Old Combine** that hums at 3 a.m. (it is real, half-buried east of town). Ruling R-154.
- **Shape.** Main Street (`street/pebblewick-main`, x 655) leaves the east-outer highway at its existing vertex
  (650, 20), so it joins the road graph without touching the highway; Weeping Lane (`street/pebblewick-cross`, z 125)
  crosses it at a 4-way junction. Both are ordinary roads with traffic. Road ids starting `street/` get no country
  walls or signature props (one guard in `scenery.ts`). A `reserve/pebblewick` marker (hw 75, hd 95) flattens the
  ground and keeps scatter, settlements and tree belts out; a `calm/pebblewick` feature (r 100) quiets the dunes round it.
- **Content (20 buildings).** Ratchet's Mower & Dew (workshop + pump), Twine's General, The Dry Spoon (diner), the post
  office, the glaze post (clinic), the town hall with its bell tower, the bus shelter, 11 adobe houses, the water tower
  (landmark) and the windmill; market square with a wishing well and four stalls, the Green with the founder statue,
  15 dry plots with wattle fences (the farmland edge), a hen pen, the welcome sign, lamps, benches, notice board.
  Layout is data: `games/gnome-theft-auto/src/outskirts/town.ts`.
- **Life.** Nine named townsfolk on time-of-day schedules with idle rows from `src/anim/` (cap: 9 gnomes + 4 hens,
  no work past 160 m); 10 walk points for ordinary townsgnomes; 2 street events; spot sounds (windmill, chimes, diner,
  hens, the combine's hum at night). No new critters (the online-sync planner is reworking wildlife).
- **Stuff to do.** Three counters on the existing economy (store, diner, workshop repairs), wishing well, town bell,
  water-tower valve, notice board, the Old Combine easter egg, the Pebblewick Hopper bus to and from Turfton's Central
  Bus Stop (the town's Taxi/Bus destination), two side quests with perks (Weeping Line Discount: Pebblewick counters
  -20%; Ratchet's Thanks: free repairs), five achievements with unique cosmetic rewards.
- **Online.** Static town data is identical on every client. Keepers, shops and set pieces are local per browser like
  The Bent Pin and the Tuft & Tally Lodge (each player spends their own Acorns); townsfolk follow the time of day.
  No new net message.
- **Save.** New key `gta-outskirts-v1` (saveIO.ts, cloudSave.ts merge, saveIO.test.ts fixture).
- **Golden layout.** Deliberately regenerated: the new reserve, calm spot, streets, walk points and givers change the
  Dust Flats scatter stream (rejections inside the reserve), the settlements along east-outer near x 580..730, the
  road graph (new nodes appended after the listed highways) and GIVERS. Nothing outside the Dust Flats scatter and the
  east-outer settlements moves.
- **Debug.** `?pebblewick` (bus stop), `?pebblewick=square`, `?pebblewick=combine`; the trainer's World tab lists
  "Pebblewick" (map POI).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | level document, scenery guard, `outskirts/town.ts` data, stubs, facade, app.ts wiring, prefab stub files; tsc clean | planner |
| 1 Town | every module filled; `npm test -w games/gnome-theft-auto`, prefab + achievement tests, `npm run lore`, build | 13 parallel |
| 2 Planner pass | map icon + POI, golden update, smoke, screenshot, zfight, perf | planner |

Hot-file edits (planner, additive): `app.ts` (import, create, boxes, 3 isOpen lists, prompt/interact, update, blips),
`scenery.ts` (street guard), `ambientGnomes.ts` (export `makeBubbleSprite`), `mapIcons.ts` (kind `town`), `mapPois.ts`
(one line), `packages/prefabs/src/catalog/index.ts` (3 files). Workers: `quests/defs.ts`, `quests/unlocks.ts`,
`perks.ts`, `saveIO.ts`, `cloudSave.ts`, `events/catalog/index.ts`, `packages/achievements/src/catalog.ts` (additive).

## Townsfolk (shared by issues 1E and 1M)

| id | Name | Role | Look (GnomeLook overrides) | Lines |
|---|---|---|---|---|
| yarrow | Reeve Yarrow Potsherd | the town reeve; proud, keeps the ledger | hat 0x6a3d9a, shirt 0x3a3f58, beard 0xe8e2d0, glasses | "Pebblewick is a town, not a stop. We have a bell, a bus and a reeve." / "Population thirty-one. I count every morning. Some mornings I get thirty-two." / "The highway was meant to stop at the Flats. We asked it nicely to keep going." |
| marigold | Marigold Skillet | cook at The Dry Spoon; warm, loud | hat 0xe8a33a, shirt 0xf4efe6, beard null, hair { color 0x8b4a2b, style 'bun' } | "Sit down, you look dusty. Everyone looks dusty. That's why it's the Dry Spoon." / "Prickly pear pie, fresh from the oven. The oven is the sun." / "Fizz Cup weekends I feed four hundred. Other days I feed Burnet four times." |
| thistle | Thistle Twine | keeps Twine's General; thrifty | hat 0x2f7d5a, shirt 0xb88a4a, beard 0xbfbfbf, glasses | "If Twine's doesn't sell it, you don't need it." / "Postcards, five Acorns. Stamps are Sorrel's problem." / "I sweep the porch twice a day. The Flats sweep it back three times." |
| burnet | Burnet Ratchet | mower mechanic, Ratchet's Mower & Dew; gruff Speedway veteran | hat 0xc0392b, shirt 0x34495e, beard 0x5a4a3a | "Every racer stops here twice. Once on the way out, once on a tow." / "That pump's Black Dew. Don't smoke near it. Don't sing near it either." / "I can hear a loose carb from the junction. I can hear the Old Combine from my bed." |
| sorrel | Sorrel Stampwell | postmistress; precise, nosy | hat 0x1f5fa8, shirt 0xd9c9a3, beard null, hair { color 0x3a2a1a, style 'braid' } | "Snail post goes out on the Hopper at golden hour. If the snail is ready." / "I never read the postcards. I glance. For the stamps." / "Somebody keeps posting letters to the Old Combine. No return address." |
| comfrey | Doc Comfrey Mortar | runs the glaze post (clinic); calm, dry | hat 0xf4f4f4, shirt 0x6fb7b0, beard 0xdedede, glasses | "Hairline cracks, mostly. The dry wind does it. Glaze twice a day." / "Turfton's Glaze Clinic sends me their overflow. I send them my bills." / "If you're cracked, I'm open. If you're bored, try the diner." |
| purslane | Purslane Furrow | dry farmer at the plots; old, stubborn (side quest giver) | hat 0x7a8a3a, shirt 0xa8743a, beard 0xf0eee6 | "The Weeping Line gives a drop every span. A drop is plenty, if you're a pepper." / "Thirty years I've farmed the edge of the Flats. The Flats never once said thank you." / "Something's drinking from my line out by the canyon. Something with a pump." |
| mallow | Mallow Bucket | a youngster who watches the dunes from the water tower (side quest giver) | hat 0xf2c94c, shirt 0xe06a8a, beard null, freckles, hair { color 0xc96a2b, style 'pigtails' } | "There's a combine in the dunes and it hums at three in the morning." / "I drew a map. It's mostly arrows. The arrows are important." / "When I'm reeve, the water tower's getting a slide." |
| sedge | Old Sedge | busker on the square at golden hour and after | hat 0x4a4a4a, shirt 0x9a5a3a, beard 0xcccccc | "This one's called Dust in the Carburettor. Same as the last one, slower." / "Tips in the hat, not the well. The well has enough." / "I played the Speedway once. They lapped me." |

## Epic 1: Town (13 parallel issues)

Files per issue (no file is under two issues): 1A `packages/prefabs/src/catalog/gta-pebblewick.ts`; 1B
`gta-pebblewick-b.ts`; 1C `gta-pebblewick-gear.ts` + `packages/achievements/src/catalog.ts`; 1D `outskirts/build.ts`
(+test); 1E `outskirts/npcs.ts` (+test); 1F `outskirts/shops.ts`, `outskirts/shopUi.ts` (+test); 1G
`outskirts/sights.ts` (+test); 1H `outskirts/bus.ts` (+test); 1I `outskirts/sounds.ts` (+test); 1J `outskirts/save.ts`
(+test), `saveIO.ts`, `cloudSave.ts`, `saveIO.test.ts`; 1K `quests/outskirtsQuests.ts`, `quests/defs.ts`,
`quests/unlocks.ts`, `perks.ts` and their tests; 1L `events/catalog/pebblewick.ts`, `events/catalog/index.ts`;
1M `docs/lore/**`. Every check is `tsc --noEmit` or a vitest run of the worker's own test files: no ports, no dist/.

~~~~text
ISSUE 1A: Pebblewick civic buildings (prefabs)
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash or switch branches. No dev server.
- Other workers edit other files in packages/prefabs/src/catalog/ at the same time. Edit ONLY the file below.

## Goal
Five life-size building prefabs for Pebblewick, a small adobe town on the edge of a desert, exist in @lawn/prefabs.

## Read first
- packages/prefabs/src/types.ts: PrefabDef, Part, shapes and what `d` means for each.
- packages/prefabs/src/palette.ts: colour names (or use 0xRRGGBB numbers).
- packages/prefabs/src/catalog/gta-houses.ts: `adobe-house` is the model to match (life-size metres, flat roof,
  rounded parapets, `footprint`, `tint`/`trim`).
- packages/prefabs/src/catalog/gta-fish-gear.ts: `bent-pin-shack` (a small shop with an awning).
- docs/roadmaps/prefab-library/_common.md: modelling and examine rules. IGNORE its "Environment" section (it names
  another folder). Exceptions for this issue: these prefabs are life-size (1 unit = 1 metre; a gnome is about 1.4 m),
  category 'prop', uses ['place'], and each has `footprint: { r, h }` (r = half the longer side, h = height); with a
  footprint the size test allows up to 30 m. In examine lines you may name Pebblewick, the Dust Flats and the Speedway.

## Change
- packages/prefabs/src/catalog/gta-pebblewick.ts (exists, exports `GTA_PEBBLEWICK: readonly PrefabDef[] = []`; it is
  already registered in catalog/index.ts). Fill the array with exactly these ids. Each: centred on x and z, lowest point
  y = 0, front (door, sign) facing +z, and EVERY part inside the box x in [-W/2, W/2], z in [-D/2, D/2] given below
  (the game places a collider of exactly that size). 15 to 40 parts. tags include 'pebblewick', 'gta', 'adobe'.
  Adobe walls take `c: 'tint'` (set `tint`), roof parapets / beams take `c: 'trim'` (set `trim`).
  1. 'pebblewick-diner' "The Dry Spoon": W 10, D 7, height about 4.5. Flat-roof adobe body 10 x 5.6 centred at
     z = -0.7; a red-and-cream striped awning (alternating thin boxes) along the front at y about 2.6 reaching to
     z = +3.4, on two thin posts; a serving hatch with a counter shelf at y 1.0 on the front wall; a door; two windows
     (c 'glass'); a big wooden spoon standing on the roof, bowl up (ball squashed + cylinder handle), about 3 m tall.
     tint 0xe0c49a, trim 'clay-dark'. footprint { r: 5, h: 7.5 }.
  2. 'pebblewick-general-store' "Twine's General": W 9, D 7, height 6.5. Body 9 x 5 x 4.5 at z = -1; a tall flat false
     front board on the front wall rising to 6.5 (trim colour); a porch roof on 3 posts across the front reaching
     z = +3.4; a hanging sign board under the porch; a window with a shelf of jars (small cylinders, mixed colours);
     barrels by the door inside the footprint. tint 0xd8b080, trim 0x7a4a2a. footprint { r: 4.5, h: 6.5 }.
  3. 'pebblewick-post-office': W 6, D 5, height about 4.5 (to the weathervane top). Body 6 x 4.4 x 3.2 at z = -0.3; a
     blue door; a fat brass letter drum on a post beside the door (cylinder, c 0xc9a24a, with a dark slot box); a pole
     on the roof with a snail-shell weathervane (stacked shrinking balls or a torus spiral, c 0xd9b38c). tint
     0xe6cfa8, trim 'clay-dark'. footprint { r: 3, h: 4.5 }.
  4. 'pebblewick-town-hall': W 8, D 7, height 9. Hall body 8 x 5 x 4 at z = -1; a bell tower 2.4 x 2.4 centred at the
     front (x 0, z +1.8) rising to 7; an open belfry above it (4 corner posts 7..8.4, a flat cap at 8.6..9) with a bell
     (cone, c 0xc9a24a) hanging inside at about y 7.6; a round clock face (thin cylinder disc, rot [90,0,0], c 'paper')
     on the tower front at y about 5.5 with two dark hands; a double door at the tower foot; two wide front steps
     (boxes 4 wide, heights 0.2 and 0.4) ending at z = +3.5; a bell rope (thin cylinder) hanging down the tower front
     to y 1.0. tint 0xead8b4, trim 0x8a5a3a. footprint { r: 4, h: 9 }.
  5. 'pebblewick-clinic' "the glaze post": W 6, D 5, height about 4. White-washed adobe body 6 x 4.2 x 3.2 at
     z = -0.4 (tint 0xf2efe6); a small teal awning over the door; a teal glaze-drop sign on a bracket (a ball with a
     cone on top, c 0x3fb8b0, glow true); a window; a door. trim 0x3fb8b0. footprint { r: 3, h: 4 }.
- `examine`: 5 lines each, the _common.md voice (look, saying, tip, joke, odd detail). No named characters.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in gta-pebblewick.ts.
- `npm test -w packages/prefabs` passes every test that names one of your five ids.
- Reading the file top to bottom, each prefab matches its description and stays inside its W x D box.

## Out of scope
Every other file (catalog/index.ts is already wired; gta-pebblewick-b.ts and gta-pebblewick-gear.ts belong to others).
~~~~

~~~~text
ISSUE 1B: Pebblewick workshop, water tower, bus shelter, welcome sign, dry plot (prefabs)
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash or switch branches. No dev server.
- Other workers edit other files in packages/prefabs/src/catalog/ at the same time. Edit ONLY the file below.

## Goal
Five life-size prefabs for Pebblewick (a small adobe town on a desert edge) exist in @lawn/prefabs.

## Read first
- packages/prefabs/src/types.ts: PrefabDef, Part, shapes and what `d` means for each.
- packages/prefabs/src/palette.ts: colour names (or use 0xRRGGBB numbers).
- packages/prefabs/src/catalog/gta-houses.ts: `adobe-house`, the model to match (life-size metres, `footprint`, tint/trim).
- docs/roadmaps/prefab-library/_common.md: modelling and examine rules. IGNORE its "Environment" section (it names
  another folder). Exceptions: these prefabs are life-size (1 unit = 1 metre; a gnome is about 1.4 m), category 'prop',
  uses ['place'], each with `footprint: { r, h }` (r = half the longer side, h = height); with a footprint the size test
  allows up to 30 m. Examine lines may name Pebblewick, the Dust Flats and the Speedway.

## Change
- packages/prefabs/src/catalog/gta-pebblewick-b.ts (exists, exports `GTA_PEBBLEWICK_B: readonly PrefabDef[] = []`,
  already registered). Fill it with exactly these ids. Each: centred on x and z, lowest point y = 0, front facing +z,
  every part inside x in [-W/2, W/2], z in [-D/2, D/2]. At most 40 parts. tags include 'pebblewick', 'gta'.
  1. 'pebblewick-workshop' "Ratchet's Mower & Dew": W 10, D 8, height 5. An open-fronted garage: back wall and two side
     walls (adobe, c 'tint', tint 0xc98f5e), a roof of corrugated ribs (several thin boxes side by side, c 0x9aa3a8,
     trim) on top, a front wall only above y 3.5 with a half-rolled door (a fat cylinder lying along x at y 3.6); inside:
     a workbench, a stack of 3 tyres (torus lying flat, c 'rubber' or 0x222222), a hanging wrench sign over the opening
     (box + cylinder). trim 0x9aa3a8. footprint { r: 5, h: 5 }.
  2. 'pebblewick-water-tower': W 6, D 6, height 16. Four legs (cylinders r 0.18) from the ground corners (+-2.4) up to a
     platform at y 10; two rings of cross braces (thin boxes); a tin tank like an upturned bucket (cylinder, top radius
     2.4, bottom radius 2.8, height 4, from y 10 to 14, c 'tint', tint 0xb9c3c9); a conical cap to 16; a flat walkway
     ring at y 10 (a torus rot [90,0,0], thin); a ladder up the front leg (two rails + rungs); at the front a short
     standpipe with a valve wheel (torus facing +z, c 0xc0392b) at about (0, 1.1, 2.8). trim 'wood-dark' for legs.
     footprint { r: 3, h: 16 }.
  3. 'pebblewick-bus-shelter': W 4, D 2, height 2.8. Back wall (z -0.9), two side walls, flat roof with a little
     overhang kept inside D, a bench inside, a timetable board on a pole at the front-right corner (x 1.8, z 0.9), open
     front. tint 0xd9a441, trim 'wood-dark'. footprint { r: 2, h: 2.8 }.
  4. 'pebblewick-welcome-sign': W 6, D 0.8, height 4. Two wooden posts at x +-2.6, a big board between them (box
     5.6 x 1.8 x 0.2 at y 2.6, c 'tint', tint 0xe8c27a) with rounded ends (cylinders along z at its ends), a painted
     sun (yellow disc and short ray boxes on the board's front face, standing proud of it by 0.03), a red pepper motif
     (two red squashed balls with green stems), and a smaller plaque under the board at y 1.3 (blank, c 'paper').
     trim 'wood-dark'. footprint { r: 3, h: 4 }.
  5. 'pebblewick-dry-plot': W 10, D 6, height about 0.9. A furrowed pepper plot: 5 soil ridges along x (boxes
     9.6 x 0.25 x 0.6 at y 0.125, c 0x8a5a3a, spaced along z), pepper plants on the ridges (green balls r about 0.25 at
     y about 0.45, with a few red squashed balls, glow false), and a thin dark tube along the front edge (cylinder
     along x, r 0.06, centre y 0.07, c 0x2a2a2a) with three small blue drops (balls c 0x6fb8e8). NO thin flat slab on
     the ground: every part's bottom is at y >= 0 and every part is at least 0.1 tall (the game must not z-fight with the
     terrain). Use `mirror: true` to save parts. footprint { r: 5, h: 0.9 }.
- `examine`: 5 lines each, the _common.md voice. No named characters. The plot's tube is "the line that weeps"
  (never say hose or drip line).

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in gta-pebblewick-b.ts.
- `npm test -w packages/prefabs` passes every test that names one of your five ids.
- Each prefab matches its description and stays inside its W x D box.

## Out of scope
Every other file.
~~~~

~~~~text
ISSUE 1C: Pebblewick achievements and their cosmetic rewards
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash or switch branches. No dev server.
- Other workers edit other files at the same time. Edit ONLY the two files below.

## Goal
Five Gnome Theft Auto achievements for the town of Pebblewick exist, each rewarding its own new wearable prefab.

## Read first
- packages/achievements/README.md (rules 2 and 5) and docs/cosmetics.md "Rules".
- packages/achievements/src/catalog.ts: the GTA fishing entries 'gta-first-bite' .. 'gta-derby-day' (just before the
  comment `// ---- Cooking Gnoma ----`): copy their shape.
- packages/prefabs/src/catalog/gta-fish-gear.ts: the reward prefabs 'angler-bucket-hat' (head), 'wicker-creel'
  (back), 'lure-necklace' (neck), 'golden-gudgeon' (hand, uses ['hold'] with `grip`). Copy their scale, placement and
  style: these are hand-sized (1 unit = one gnome's height), category 'armor' (or 'weapon'/'trinket' as the examples
  do for hold items), NO footprint.
- packages/prefabs/src/types.ts and docs/roadmaps/prefab-library/_common.md (Modelling rules, Examine voice, Checks;
  ignore its Environment section).

## Change
- packages/prefabs/src/catalog/gta-pebblewick-gear.ts (exists, exports `GTA_PEBBLEWICK_GEAR: readonly PrefabDef[] = []`,
  already registered). Add exactly:
  1. 'pebblewick-sunhat' uses ['wear-head']: a wide-brimmed straw sun hat (tint 0xe3c98a) with a red pepper tucked in
     the band.
  2. 'dry-spoon-ladle' uses ['hold'] with `grip`: a big wooden ladle about 0.5 tall, handle at the bottom, bowl up.
  3. 'drip-line-coil' uses ['wear-back']: a coil of dark tube (stacked tori) with two brass couplings and a strap.
  4. 'chrome-hubcap-pendant' uses ['wear-neck']: a chrome hubcap disc (c 0xd9dee4) on a cord loop.
  5. 'chrome-tuning-fork' uses ['hold'] with `grip`: a chrome tuning fork about 0.45 tall, stem at the bottom.
  Each: name, tags (include 'pebblewick', 'gta', 'reward'), about ("Gnome Theft Auto: ... Reward for the <title>
  achievement."), 5 examine lines in the _common.md voice (never say hose, drip line or combine as if the gnome knows
  what it is for).
- packages/achievements/src/catalog.ts: insert after the 'gta-derby-day' entry, before `// ---- Cooking Gnoma ----`,
  with game 'gnome-theft-auto', gameTitle 'Gnome Theft Auto':
  - id 'gta-pop-32', title 'Pop. 32', description 'Arrive in Pebblewick, out past the end of Route East.',
    reward { slot: 'head', prefabId: 'pebblewick-sunhat', label: 'Pebblewick Sun Hat' }
  - id 'gta-pebblewick-regular', title 'Regular', description 'Buy something at all three Pebblewick counters.',
    target 3, reward { slot: 'hand', prefabId: 'dry-spoon-ladle', label: 'Dry Spoon Ladle' }
  - id 'gta-weeping-line', title 'The Weeping Line', description "Mend Purslane Furrow's Weeping Line.",
    reward { slot: 'back', prefabId: 'drip-line-coil', label: 'Weeping Line Coil' }
  - id 'gta-hum-at-three', title 'The Hum at Three', description 'Find out what hums in the dunes east of Pebblewick.',
    reward { slot: 'neck', prefabId: 'chrome-hubcap-pendant', label: 'Chrome Hubcap Pendant' }
  - id 'gta-three-am-knock', title 'Three A.M. Knock', description 'Knock on the Old Chrome Combine at night.',
    reward { slot: 'hand', prefabId: 'chrome-tuning-fork', label: 'Chrome Tuning Fork', exclusive: true }

## Contract
The five achievement ids above are used verbatim by the game (games/gnome-theft-auto/src/outskirts/town.ts
TOWN_ACHIEVEMENTS and the quest defs). Do not rename them.

## Done when
- `npx tsc --noEmit -p packages/prefabs` and `npx tsc --noEmit -p packages/achievements` show no error in your files.
- `npm test -w packages/prefabs` passes every test naming your ids; `npm test -w packages/achievements` passes.

## Out of scope
Every other file, including catalog/index.ts and the game.
~~~~

~~~~text
ISSUE 1D: Build Pebblewick's static town (buildings, furniture, plots, fences) with colliders
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash, switch branches, start a dev server
  or run vite build.
- Many workers edit other files of games/gnome-theft-auto at the same time. Edit ONLY the files below.
  `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files you do not own (others mid-edit): ignore them.
- Some prefab ids used by the town ('pebblewick-*') are being written by other workers right now and may not exist yet.

## Goal
`buildTown(scene)` builds every piece of Pebblewick listed in town.ts as culled static geometry and returns colliders.

## Read first
- games/gnome-theft-auto/src/outskirts/town.ts: TOWN_PIECES, TownPiece (how `scale` / `size` / `yaw` / `solid` /
  `sink` / `landmark` work), FENCE_RUNS, LANES, TOWN. READ ONLY.
- games/gnome-theft-auto/src/outskirts/build.ts: the stub you replace (keep its exports and signatures).
- games/gnome-theft-auto/src/settlements.ts: `localBox` (Box3 of buildPrefab, cached) and `buildSettlements`
  (buildStaticCells call): the pattern to follow.
- games/gnome-theft-auto/src/cull.ts header comment and `buildStaticCells(placements, opts)`.
- games/gnome-theft-auto/src/types.ts: `Box` ({ minX, maxX, minZ, maxZ, h } with h = absolute top height).

## Change
- games/gnome-theft-auto/src/outskirts/build.ts:
  - `export function planTown(): { placements: StaticPrefabPlacement[]; landmarks: StaticPrefabPlacement[]; boxes: Box[]; missing: string[] }`
    (pure apart from buildPrefab measuring and heightAt; deterministic):
    - Measure each prefab once: `new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }))` (cache by id).
      `getPrefab(id)` from '@lawn/prefabs' undefined => push id to `missing` and skip the piece.
    - scale = piece.scale ?? piece.size / (largest of the box's x, y, z sizes).
    - Rotated footprint: rotate the 4 xz corners of the scaled local box by yaw (x' = x cos + z sin, z' = -x sin + z cos,
      which is three.js rotation.y), add (piece.x, piece.z), take the min/max: the world AABB.
    - y: solid pieces and buildings sit at the LOWEST heightAt(x, z) of the footprint's 4 corners and centre, minus
      0.05, minus (piece.sink ?? 0); other pieces at heightAt(piece.x, piece.z) - (piece.sink ?? 0). heightAt from
      '../terrain'.
    - Placement: `{ id: piece.prefab, x, y, z, yaw, scale, tint, trim }` (omit tint/trim when undefined). Landmark
      pieces go in `landmarks`, the rest in `placements`.
    - Solid pieces: one Box = the world AABB, `h` = y + scaled box height.
    - FENCE_RUNS: run length L = distance(from, to); unit direction (dx, dz); pieces centred at s = step/2, s += step,
      while s <= L - step/2 + 1e-6; skip a piece whose centre s is within 1.5 m of any `gaps` entry. Each piece:
      prefab = run.prefab, size = step * 0.98 (so neighbours never share a face), yaw = Math.atan2(dx, dz) - Math.PI / 2
      (a fence piece's length runs along its local x), y = min heightAt of its two ends - 0.05, a Box 0.3 m thick
      along the run (the AABB of the segment grown 0.15 sideways), h = y + scaled height.
  - `buildTown(scene)`: calls planTown(); if missing.length, console.warn once listing them; adds
    `buildStaticCells(placements, { lights: false, name: 'pebblewick', cls: 'building' })` and
    `buildStaticCells(landmarks, { lights: false, name: 'pebblewick-landmarks', cls: 'landmark' })` to the scene
    (skip an empty list); returns `{ boxes }`.
- games/gnome-theft-auto/src/outskirts/build.test.ts (new): call `installFakeDom()` from '../testing/fakeDom' first
  (see src/settlements.test.ts for how game tests set up), then planTown():
  - every box of a piece except id 'old-combine' lies inside TOWN.rect;
  - no solid box overlaps LANES.main or LANES.cross (shrink each lane by 0.05 before testing);
  - no two solid boxes of different non-fence pieces overlap (fence boxes may touch fence boxes);
  - `missing` lists only ids starting with 'pebblewick-' (every other prefab must exist).
  A piece's id is in TownPiece.id; keep a parallel `ids` array or test through an exported helper if you need it.

## Contract
`export interface TownBuild { readonly boxes: readonly Box[] }` and `export function buildTown(scene: THREE.Scene): TownBuild`
stay exactly as in the stub (outskirts/index.ts calls them). Nothing flat is laid on the ground, so no draw layer is
needed; do not add any ground decals.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in outskirts/build.ts or build.test.ts.
- `cd games/gnome-theft-auto && npx vitest run src/outskirts/build.test.ts` passes.

## Out of scope
town.ts, index.ts and every other file.
~~~~

~~~~text
ISSUE 1E: Pebblewick's townsfolk (nine named NPCs on schedules) and the hens
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash, switch branches, start a dev server
  or run vite build.
- Many workers edit other files of games/gnome-theft-auto at the same time (another one is changing src/anim/: use only
  the anim ids listed here). Edit ONLY the files below. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in
  files you do not own: ignore them.

## Goal
Nine named gnomes live in Pebblewick: each stands at a station for the time of day with an idle animation, walks
between stations along the streets, hides indoors at night, turns to and greets the player with a speech bubble and
voice; four hens peck about in a pen. Cheap: nothing runs when the player is far away.

## Read first
- games/gnome-theft-auto/src/outskirts/town.ts: NPC_STATIONS, Station, Schedule, LANES, HEN_PEN, TOWN, TownNpcId.
  READ ONLY.
- games/gnome-theft-auto/src/outskirts/npcs.ts: the stub (keep its exports and signatures).
- games/gnome-theft-auto/src/ambientGnomes.ts: `createAmbientGnomes` is the pattern to follow (makeGnome + gnomeState,
  createAnimator + animator.play(idle, { loop: true, offset }), wave on approach, `speakAt(text, voice, x, z, 16)`,
  `voiceFor(name)`, animStride / stepAnimClock LOD, bubble sprite scale 3.4 x 1.18 over the head at y + 2.25).
  `makeBubbleSprite(name, text)` is exported from it: import and use it (do not copy it).
- games/gnome-theft-auto/src/gnomes.ts: `makeGnome(scene, look)`, `gnomeState(x, y, z, yaw, speed)` (speed > 0 plays the
  walk cycle).
- games/gnome-theft-auto/src/anim/animator.ts: Animator (`play(id, opts)`, `apply(model, dt)`, `stop()`).

## Change
- games/gnome-theft-auto/src/outskirts/npcData.ts (new): `export interface TownNpcDef { id: TownNpcId; name: string;
  look: Partial<GnomeLook>; lines: readonly string[] }` and `export const TOWN_NPCS: readonly TownNpcDef[]` with
  exactly this roster (look = overrides on a base look like ambientGnomes' BASE_LOOK; `beard null` means no beard;
  "glasses" means glasses: true; "freckles" means freckles: true):
  | id | name | look | lines (3) |
  | yarrow | Reeve Yarrow Potsherd | hat 0x6a3d9a, shirt 0x3a3f58, beard 0xe8e2d0, glasses | "Pebblewick is a town, not a stop. We have a bell, a bus and a reeve." / "Population thirty-one. I count every morning. Some mornings I get thirty-two." / "The highway was meant to stop at the Flats. We asked it nicely to keep going." |
  | marigold | Marigold Skillet | hat 0xe8a33a, shirt 0xf4efe6, beard null, hair { color: 0x8b4a2b, style: 'bun' } | "Sit down, you look dusty. Everyone looks dusty. That's why it's the Dry Spoon." / "Prickly pear pie, fresh from the oven. The oven is the sun." / "Fizz Cup weekends I feed four hundred. Other days I feed Burnet four times." |
  | thistle | Thistle Twine | hat 0x2f7d5a, shirt 0xb88a4a, beard 0xbfbfbf, glasses | "If Twine's doesn't sell it, you don't need it." / "Postcards, five Acorns. Stamps are Sorrel's problem." / "I sweep the porch twice a day. The Flats sweep it back three times." |
  | burnet | Burnet Ratchet | hat 0xc0392b, shirt 0x34495e, beard 0x5a4a3a | "Every racer stops here twice. Once on the way out, once on a tow." / "That pump's Black Dew. Don't smoke near it. Don't sing near it either." / "I can hear a loose carb from the junction. I can hear the Old Combine from my bed." |
  | sorrel | Sorrel Stampwell | hat 0x1f5fa8, shirt 0xd9c9a3, beard null, hair { color: 0x3a2a1a, style: 'braid' } | "Snail post goes out on the Hopper at golden hour. If the snail is ready." / "I never read the postcards. I glance. For the stamps." / "Somebody keeps posting letters to the Old Combine. No return address." |
  | comfrey | Doc Comfrey Mortar | hat 0xf4f4f4, shirt 0x6fb7b0, beard 0xdedede, glasses | "Hairline cracks, mostly. The dry wind does it. Glaze twice a day." / "Turfton's Glaze Clinic sends me their overflow. I send them my bills." / "If you're cracked, I'm open. If you're bored, try the diner." |
  | purslane | Purslane Furrow | hat 0x7a8a3a, shirt 0xa8743a, beard 0xf0eee6 | "The Weeping Line gives a drop every span. A drop is plenty, if you're a pepper." / "Thirty years I've farmed the edge of the Flats. The Flats never once said thank you." / "Something's drinking from my line out by the canyon. Something with a pump." |
  | mallow | Mallow Bucket | hat 0xf2c94c, shirt 0xe06a8a, beard null, freckles, hair { color: 0xc96a2b, style: 'pigtails' } | "There's a combine in the dunes and it hums at three in the morning." / "I drew a map. It's mostly arrows. The arrows are important." / "When I'm reeve, the water tower's getting a slide." |
  | sedge | Old Sedge | hat 0x4a4a4a, shirt 0x9a5a3a, beard 0xcccccc | "This one's called Dust in the Carburettor. Same as the last one, slower." / "Tips in the hat, not the well. The well has enough." / "I played the Speedway once. They lapped me." |
- games/gnome-theft-auto/src/outskirts/npcRoute.ts (new, pure, no three.js):
  `export function laneOf(x: number, z: number): 'main' | 'cross' | null` (inside LANES.main / LANES.cross rectangles;
  main wins when in both) and `export function routeBetween(a: Station, b: Station): [number, number][]`:
  the points from a to b. Let pa = [a.x, a.z, ...a.path] and pb = [b.x, b.z, ...b.path] as point lists; ea = last of pa,
  eb = last of pb. Route = pa, then (if laneOf(ea) !== laneOf(eb) or either is null) LANES.hub, then pb reversed.
  Drop consecutive duplicate points. a === b gives [[a.x, a.z]].
- games/gnome-theft-auto/src/outskirts/npcs.ts: replace the stub body, keeping `TownNpcs` and `createTownNpcs(scene)`
  exactly:
  - One gnome per TOWN_NPCS entry (NPC_STATIONS gives its stations and schedule by id). Start at the station its
    schedule gives for 'Noon' (hidden if -1: model root visible = false) until the first update.
  - `update(dt, px, pz, time)`: if hypot(px - TOWN.centre.x, pz - TOWN.centre.z) > 160 return at once (no work).
    Per NPC: target = schedule[time]. When the target changes: going to -1 => walk to station 0 then hide; from hidden
    => appear at station 0, then walk to the target. Walking follows routeBetween(current station, target station) at
    1.4 m/s, facing the direction of travel, gnomeState speed 1.4 (0 when standing); on arrival face the station's yaw
    and loop its `idle` row. y = heightAt(x, z) from '../terrain'.
  - Greeting: a standing, visible NPC within 6 m of the player turns towards them (ease the yaw like ambientGnomes),
    plays 'wave' once (unless its idle is 'sit-ground', 'sleep', or one of the work rows 'sweep', 'rake', 'read'), shows
    its next line in a bubble (makeBubbleSprite(name, line), created lazily and cached per line) for 5 s, and speaks it
    with speakAt(line, voiceFor(name), x, z, 16); at most once per 25 s per NPC, cycling its 3 lines.
  - `presentAt(id, i)`: visible, not walking, and at station i. `cheer(x, z, r)`: visible NPCs within r play 'cheer'
    once (loop: false) and then return to their idle (onEnd). `nameOf(id)`: the roster name.
  - Hens: 4 'hen' prefabs (buildPrefab('hen', { lights: false }) from '@lawn/prefabs', scale 1.4) inside HEN_PEN; each
    picks a random point in the pen every 2-5 s and walks there at 0.8 m/s with a little peck bob (rotation.x wobble).
    Use a seeded PRNG (mulberry32 from '@lawn/level') so every client sees the same start.
  - No per-frame allocation: reuse vectors/arrays; LOD like ambientGnomes (stepAnimClock with animStride(distance)).
  - Anim ids used (all exist): 'hands-on-hips', 'take-notes', 'think', 'stir-pot', 'sit-ground', 'sweep',
    'wrench-fix', 'read', 'phone-call', 'cross-arms', 'look-around', 'rake', 'lean-back', 'juggle', 'busk-guitar',
    'wave', 'cheer'.
- games/gnome-theft-auto/src/outskirts/npcRoute.test.ts (new): routeBetween for each NPC's station pairs: every
  segment of the route lies inside LANES.main, inside LANES.cross, or is one of the station's own path segments
  (check the lane segments: both ends inside the same lane rectangle); laneOf basics; a station to itself.

## Contract
`TownNpcs` and `createTownNpcs(scene: THREE.Scene): TownNpcs` exactly as in the stub. npcData.ts exports TOWN_NPCS.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.
- `cd games/gnome-theft-auto && npx vitest run src/outskirts/npcRoute.test.ts` passes.

## Out of scope
town.ts, index.ts, ambientGnomes.ts, src/anim/ and every other file.
~~~~

~~~~text
ISSUE 1F: Pebblewick's three counters and their shop sheet
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash, switch branches, start a dev server
  or run vite build.
- Many workers edit other files of games/gnome-theft-auto at the same time. Edit ONLY the files below.
  `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files you do not own: ignore them.

## Goal
At Twine's General, The Dry Spoon and Ratchet's Mower & Dew the player can open a phone-friendly sheet and buy goods
with Acorns: food that mends cracks, souvenirs, and a full vehicle repair.

## Read first
- games/gnome-theft-auto/src/outskirts/town.ts: COUNTERS, COUNTER_REACH, WORKSHOP_BAY, CounterId. READ ONLY.
- games/gnome-theft-auto/src/outskirts/shops.ts: the stub (ShopsDeps, TownShops, createTownShops): keep them exactly.
- games/gnome-theft-auto/src/outskirts/save.ts: OutskirtsStore (addSouvenir / hasSouvenir). Another worker fills its
  body; use only the interface.
- games/gnome-theft-auto/src/fishing/shopUi.ts: the sheet to model yours on (fixed centred panel, 44 px buttons, close
  button, CSS injected once by id, appended to the `ui` element, `prefabIconElement`).
- games/gnome-theft-auto/src/perks.ts: `priceScaleFor(reason, activePerks())` (for the shown price) and PRICE_PERKS.
- games/gnome-theft-auto/src/vehicles.ts: `repairVehicle(v)`; Vehicle fields x, z, hp (0..1), exploded, driver
  ('none' | 'player' | ...), spec.name (types.ts).

## Change
- games/gnome-theft-auto/src/outskirts/shopItems.ts (new, pure): `export interface ShopItem { id: string; counter:
  CounterId; name: string; blurb: string; price: number; icon: string; emoji: string; heal?: number; souvenir?: boolean;
  repair?: boolean }`, `export const SHOP_REASON: Record<CounterId, string> = { store: 'Pebblewick', diner: 'Pebblewick',
  workshop: 'Ratchet Repairs' }`, `export const SHOP_ITEMS: readonly ShopItem[]` exactly:
  store: 'dust-biscuits' Dust Biscuits 4 heal 0.25 icon 'seed-cake' 🍪; 'cactus-water' Cactus Water 8 heal 0.5 icon
  'honeydew-flask' 🥤; 'postcard' Pebblewick Postcard 5 souvenir icon 'sealed-letter' ✉; 'tower-globe' Water Tower
  Globe 15 souvenir icon 'spinning-globe' 🔮 (blurb: it is full of sand, not snow); 'pop-mug' "Pop. 31" Mug 10
  souvenir icon 'espresso-cup' ☕.
  diner: 'dust-coffee' Bottomless Dust Coffee 3 heal 0.15 icon 'espresso-cup' ☕; 'pear-pie' Prickly Pear Pie 9 heal
  0.5 icon 'acorn-cake' 🥧; 'spoon-special' The Spoon Special 18 heal 1 icon 'toadstool-stew' 🍲.
  workshop: 'repair' Full Repair 35 repair icon 'brass-wrench' 🔧.
  Write a one-line dry, gnome-ish blurb for each. And `export function shownPrice(item: ShopItem, scale: number): number`
  = Math.round(item.price * scale).
- games/gnome-theft-auto/src/outskirts/shopUi.ts (new): the sheet. `createShopSheet(ui: HTMLElement, cb: { title(): string;
  keeper(): string; rows(): SheetRow[]; buy(id: string): void; onClose(): void })` returning `{ open(): void; close():
  void; isOpen(): boolean; refresh(): void }`, where `SheetRow = { id, name, blurb, price, icon, emoji, enabled, note? }`.
  Root element id 'gta-pw-shop', style id 'gta-pw-shop-style', z-index 60, width min(520px, calc(100vw - 32px)),
  max-height with safe-area insets, overflow auto, buttons min 44 x 44 px, dusty adobe colours. Escape closes.
- games/gnome-theft-auto/src/outskirts/shops.ts: implement createTownShops(deps):
  - prompt(px, pz): the counter within COUNTER_REACH of (px, pz): store "Shop at Twine's General", diner "Eat at The
    Dry Spoon", workshop "Talk to Burnet Ratchet (repairs)"; else null.
  - interact: if !deps.keeperIn(id): hud.toast("<Counter name> is shut. <keeper> is out.", 3000) where keeper is
    Thistle Twine / Marigold Skillet / Burnet Ratchet; return true. Else open the sheet for that counter.
  - rows: price = shownPrice(item, priceScaleFor(SHOP_REASON[counter], activePerks())); souvenir already owned =>
    enabled false, note 'Owned'; repair => enabled only when a repair target exists (nearest vehicle to WORKSHOP_BAY
    within its radius with !exploded, driver 'none' or 'player', hp < 1), note otherwise 'Park a dented ride on the
    forecourt'; not enough Acorns => enabled false, note 'Not enough Acorns'.
  - buy(id): `deps.economy.spend(item.price, SHOP_REASON[counter])` with the BASE price (the perk wrapper in
    perkEffects.ts applies discounts itself). On success: heal => deps.heal(item.heal), toast "<name>. Cracks mended a
    little." (or "Good as new." for 1); souvenir => deps.store.addSouvenir(id), toast "<name>: yours."; repair =>
    repairVehicle(target), toast "Burnet Ratchet fixes the <spec.name>."; then play2d('pw-till') from '../sound'
    (returns false if the sound is missing: fine), deps.play('shutter'), deps.onBought(counter), refresh the sheet.
  - isOpen / close pass to the sheet.
- games/gnome-theft-auto/src/outskirts/shopItems.test.ts (new): every counter has items; ids unique; prices > 0;
  shownPrice rounds and applies 0.8 and 0.

## Contract
ShopsDeps, TownShops and createTownShops exactly as in the stub (outskirts/index.ts calls them).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.
- `cd games/gnome-theft-auto && npx vitest run src/outskirts/shopItems.test.ts` passes.
- The sheet works at a 390 x 844 phone viewport: no hover-only controls, every button at least 44 px.

## Out of scope
town.ts, save.ts, index.ts, perks.ts and every other file.
~~~~

~~~~text
ISSUE 1G: Pebblewick's set pieces, easter egg and spot sounds
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash, switch branches, start a dev server
  or run vite build.
- Many workers edit other files of games/gnome-theft-auto at the same time. Edit ONLY the files below.
  `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files you do not own: ignore them.

## Goal
Arriving in Pebblewick greets the player; the wishing well, town bell, water-tower valve, notice board and the Old
Chrome Combine can be used; the town has spot sounds and the combine hums at night.

## Read first
- games/gnome-theft-auto/src/outskirts/town.ts: TOWN, SIGHTS, HEN_PEN, TOWN_ACHIEVEMENTS, inTown, TOWN_PIECES ids
  'windmill', 'diner'. READ ONLY.
- games/gnome-theft-auto/src/outskirts/sights.ts: the stub (SightsDeps, SightsFrame, TownSights, createTownSights):
  keep them exactly.
- games/gnome-theft-auto/src/outskirts/save.ts (OutskirtsStore interface: markVisited, addWish, markJackpot,
  markKnocked) and npcs.ts (TownNpcs.cheer): interfaces only, other workers fill them.
- games/gnome-theft-auto/src/sound/index.ts header: `playAt(id, { x, z }, { maxDist?, gain? })`, `play2d(id)`.
- games/gnome-theft-auto/src/fishing/shopUi.ts: how a DOM sheet is built (for the notice board).

## Change
- games/gnome-theft-auto/src/outskirts/sights.ts: implement createTownSights(deps):
  - Arrival (in update): when the player goes from outside to inside inTown(px, pz) and no welcome was shown in the
    last 60 s: if deps.store.markVisited() is true (first time) hud.callout?.('PEBBLEWICK', 'Pop. 32. Welcome.') and
    hud.toast('Pebblewick: the town at the end of Route East.', 4000), else hud.callout?.('PEBBLEWICK', 'Pop. 32');
    either way deps.unlock(TOWN_ACHIEVEMENTS.visit) (idempotent).
  - prompt(px, pz, night) by distance to each SIGHTS point within its reach (nearest wins): well "Toss an Acorn in the
    wishing well (1 Acorn)"; bell "Ring the Pebblewick bell"; valve "Open the water tower valve"; board "Read the
    notice board"; combine "Knock on the Old Combine". Else null.
  - interact(px, pz, night): 
    - well: economy.spend(1, 'Wishing Well') false => toast 'You have no Acorn to wish with.'; else playAt('pw-well-plop',
      well); n = store.addWish(); if n % 12 === 0: playAt('pw-well-cough', well), economy.earn(15, 'Wishing Well'),
      store.markJackpot(), toast 'The well coughs up 15 Acorns. It does that.'; else toast one of 4 wish lines (e.g.
      'Plink. Somewhere, a pepper feels lucky.').
    - bell (4 s cooldown): playAt('pw-bell', bell, { maxDist: 200 }); toast 'Dong. Reeve Yarrow glares out of the window.'
    - valve (30 s cooldown, else toast 'The valve is still dripping.'): playAt('pw-valve-gush', valve);
      deps.npcs.cheer(612, 170, 40); toast 'Water gurgles down the Weeping Line to the plots.'
    - board: open the notice sheet (DOM, root id 'gta-pw-board', z-index 60, 44 px close button, Escape closes,
      width min(480px, calc(100vw - 32px)), appended to deps.ui) with these notices: "LOST: one hum. Last heard at three
      in the morning in the eastern dunes. - M. Bucket"; "The Pebblewick Hopper leaves for Turfton whenever you ask it
      to. Fare at the stop."; "Fizz Cup weekend: the Dry Spoon opens early. Bring your own spoon."; "Somebody is
      tapping the Weeping Line. Reward. See Purslane at the plots."; "Ratchet's Mower & Dew: repairs, no questions,
      some answers."; "Town meeting every Dusk on the Green. Topic: still the highway."
    - combine: playAt('pw-combine-knock', combine). If night >= 0.6: playAt('pw-combine-hum', combine, { maxDist: 120 }),
      toast 'Something inside hums back. Three knocks. Then nothing.', store.markKnocked(),
      deps.unlock(TOWN_ACHIEVEMENTS.knock). Else toast 'Clang. Chrome, sand, nothing. It only answers at night.'
    Return true when handled.
  - update(f): only when within 110 m of TOWN.centre (or 130 m of TOWN.combine for the hum): spot sounds on random
    timers from a seeded PRNG (mulberry32 from '@lawn/level'): 'pw-windmill-creak' every 7-12 s at the 'windmill'
    piece; 'pw-chime' every 10-18 s at (646, 97); 'pw-diner-clatter' every 9-15 s at the 'diner' piece while night <
    0.6; 'pw-hen-cluck' every 6-12 s at the HEN_PEN centre; and while night >= 0.6, 'pw-combine-hum' at TOWN.combine
    every 8 s with { maxDist: 130 }. Look the piece positions up once from TOWN_PIECES by id. No per-frame allocation
    (reuse one {x, z} object).
  - isOpen / close: the notice sheet.
- games/gnome-theft-auto/src/outskirts/sights.test.ts (new): with fake deps (toast/callout spies, an in-memory fake
  OutskirtsStore, an economy fake with spend/earn), check: prompt names the nearest sight within reach and null far
  away; the 12th wish pays 15; knocking by day does not unlock, by night unlocks 'gta-three-am-knock'; walking into
  the town calls callout once. Install the fake DOM first (installFakeDom from '../testing/fakeDom').

## Contract
SightsDeps, SightsFrame, TownSights and createTownSights exactly as in the stub. Sound ids as listed (registered by
outskirts/sounds.ts, another worker; playAt of an unregistered id simply returns false).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.
- `cd games/gnome-theft-auto && npx vitest run src/outskirts/sights.test.ts` passes.

## Out of scope
town.ts, index.ts, save.ts, npcs.ts, sounds.ts and every other file.
~~~~

~~~~text
ISSUE 1H: The Pebblewick Hopper (bus between Pebblewick and Turfton's Central Bus Stop)
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash, switch branches, start a dev server
  or run vite build.
- Many workers edit other files of games/gnome-theft-auto at the same time. Edit ONLY the files below.
  `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files you do not own: ignore them.

## Goal
At the Pebblewick bus stop the player can pay a fare and ride the Hopper to Turfton's Central Bus Stop, and back from
a new Hopper post at the Central Bus Stop: a short fade, then they step off at the other end.

## Read first
- games/gnome-theft-auto/src/outskirts/town.ts: TOWN.busStop (x, z = where the player stands to ride; arriveX,
  arriveZ, arriveYaw = where a rider is put). READ ONLY.
- games/gnome-theft-auto/src/outskirts/bus.ts: the stub (BusDeps, TownBus, createTownBus): keep them exactly.
- games/gnome-theft-auto/src/taxi.ts: its fade overlay (`#gta-taxi-fade` CSS and element) is the look to follow.
- games/gnome-theft-auto/src/config.ts: ROAD_LINES, ROAD_WIDTH (Turfton's grid roads run along x = each line and
  z = each line). world.spawn is the Central Bus Stop (types.ts World.spawn).
- games/gnome-theft-auto/src/settlements.ts `localBox` (measuring a prefab with Box3 + buildPrefab).

## Change
- games/gnome-theft-auto/src/outskirts/bus.ts: implement createTownBus(deps):
  - FARE = 8 Acorns, spend reason 'Pebblewick Hopper' (export `HOPPER_FARE = 8`).
  - The Turfton post: `export function turftonPostSpot(spawn: {x:number;z:number}, boxes: readonly Box[]): {x:number;z:number}`
    (pure): the first of the offsets [3,-4], [-3,-4], [3,4], [-3,4], [5,0], [-5,0], [0,5], [0,-5] from the spawn whose
    1 x 1 m square overlaps no box and whose centre is more than ROAD_WIDTH / 2 + 0.75 from every ROAD_LINES value on
    both axes (|x - line| and |z - line|); fallback spawn + [3,-4]. At it, place a 'signpost' prefab
    (buildPrefab('signpost', { lights: false }) from '@lawn/prefabs', scaled so its largest side is 2.4 m, y =
    heightAt) and add the mesh to the scene; its collider (0.6 x 0.6, h = y + 2.4) is in `boxes`.
  - prompt(px, pz): within 2.5 m of (TOWN.busStop.x, TOWN.busStop.z): `Ride the Pebblewick Hopper to Turfton (8
    Acorns)`; within 2.5 m of the Turfton post: `Ride the Pebblewick Hopper to Pebblewick (8 Acorns)`; else null.
  - interact: economy.spend(8, 'Pebblewick Hopper') false => hud.toast('The Hopper driver wants 8 Acorns.'), return true.
    Else start a ride: fade element (id 'gta-pw-hopper-fade', fixed inset 0, black, z-index 40, pointer-events none,
    a caption "The Pebblewick Hopper rattles along Route East..." in 18 px bold, appended to deps.ui) fades in over
    0.5 s; at full black call deps.teleport(dest) and play2d('pw-bus-horn') (from '../sound'; returns false if not
    registered); hold 0.8 s; fade out 0.5 s; then remove the element. Destination to Turfton: the post spot moved 1.5 m
    towards world.spawn, yaw world.spawn.yaw. Destination to Pebblewick: (TOWN.busStop.arriveX, arriveZ, arriveYaw).
  - busy(): true while the fade runs. update(dt) drives the fade timer (no allocation per frame).
  - blips(): `[{ x: post.x, z: post.z, color: '#d9a441', label: 'Pebblewick Hopper' }]` (Blip from ../types).
- games/gnome-theft-auto/src/outskirts/bus.test.ts (new): turftonPostSpot avoids a box placed on the first candidate
  and avoids road lines; prompt/interact with a fake economy (spend false => no ride, true => busy() true, then after
  update(2) teleport was called once with the Turfton destination and busy() is false). Install the fake DOM first
  (installFakeDom from '../testing/fakeDom'); a fake World needs only spawn and boxes.

## Contract
BusDeps, TownBus and createTownBus exactly as in the stub (outskirts/index.ts calls them).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.
- `cd games/gnome-theft-auto && npx vitest run src/outskirts/bus.test.ts` passes.

## Out of scope
town.ts, index.ts, taxi.ts and every other file.
~~~~

~~~~text
ISSUE 1I: Pebblewick's sounds (procedural recipes)
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash, switch branches, start a dev server
  or run vite build.
- Many workers edit other files of games/gnome-theft-auto at the same time. Edit ONLY the files below.

## Goal
Every id in PW_SOUND_IDS is a soft, garden-scale procedural sound registered on the world sound bus.

## Read first
- games/gnome-theft-auto/src/outskirts/sounds.ts: the stub (PW_SOUND_IDS, PwSoundId, registerTownSounds): keep the
  exports; fill the body.
- games/gnome-theft-auto/src/fishing/sounds.ts and its test fishing/sounds.test.ts: the exact pattern to copy
  (registerSound, Recipe, SoundInfo, burst / tone / voiced from '../sound/synth', PEAK_MAX, pitch(), lvl()).
- games/gnome-theft-auto/src/sound/synth.ts: the helper signatures.

## Change
- games/gnome-theft-auto/src/outskirts/sounds.ts: a Recipe per id, peaks never above 0.25, each returning its duration:
  'pw-windmill-creak' a slow wooden creak (low bandpass noise sweep 0.8 s); 'pw-chime' 3 soft bell-like sine notes
  (pentatonic, decaying); 'pw-bell' one big bronze bell: a low sine plus inharmonic partials (x2.0, x2.76, x5.4),
  long decay about 3 s; 'pw-well-plop' a hollow plip deep down (sine drop + short noise, slight echo repeat at 0.15 s);
  'pw-well-cough' a hollow cough plus a jingle of coins (short high tones); 'pw-combine-hum' an eerie low hum about 2.5 s
  (two detuned sines near 55 Hz and 82 Hz with a slow wobble, fade in and out); 'pw-combine-knock' two metallic clangs
  (bandpass noise + a ringing high sine); 'pw-diner-clatter' plates and cutlery (3-5 short high clicks and one dull
  clunk); 'pw-bus-horn' a two-note old bus horn (square-ish waves through a lowpass); 'pw-valve-gush' a rush of water
  (lowpass noise swell 1.2 s); 'pw-hen-cluck' 2-3 quick clucks (voiced bursts); 'pw-till' a shop till: a bell ding and
  a drawer thunk. `registerTownSounds()` registers them all once (a module flag makes a second call a no-op).
- games/gnome-theft-auto/src/outskirts/sounds.test.ts (new): after registerTownSounds(), hasSound(id) (from
  '../sound/bus') is true for every PW_SOUND_IDS id; calling it twice does not throw; a recipe run against a fake audio
  context (copy the approach in fishing/sounds.test.ts) returns a positive duration.

## Contract
PW_SOUND_IDS, PwSoundId and registerTownSounds() exactly as in the stub.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.
- `cd games/gnome-theft-auto && npx vitest run src/outskirts/sounds.test.ts` passes.

## Out of scope
Every other file.
~~~~

~~~~text
ISSUE 1J: Pebblewick's save key (gta-outskirts-v1) with cloud merge
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash, switch branches, start a dev server
  or run vite build.
- Many workers edit other files of games/gnome-theft-auto at the same time; another planner may also be adding a key
  to saveIO.ts / cloudSave.ts: make small additive edits and re-read the file right before editing.
  `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files you do not own: ignore them.

## Goal
The town's progress (visited, counters bought from, souvenirs, wishes, the jackpot, the night knock) is saved under
'gta-outskirts-v1', exported/imported with the other progress keys and merged in the cloud save.

## Read first
- games/gnome-theft-auto/src/outskirts/save.ts: the stub (OutskirtsSave, OutskirtsStore, emptyOutskirtsSave,
  parseOutskirtsSave, createOutskirtsStore, OUTSKIRTS_KEY): keep every export and signature.
- games/gnome-theft-auto/src/fishing/fishSave.ts: the pattern (tolerant parse, storage default, notifySaveChanged()
  from '../saveHook' after each write).
- games/gnome-theft-auto/src/saveIO.ts (GTA_SAVE_KEYS), games/gnome-theft-auto/src/cloudSave.ts (MERGES table, GROWS
  set, the merge helpers like unionArrays), games/gnome-theft-auto/src/saveIO.test.ts (the fixture object listing a
  value per key), and src/cloudSave.test.ts.

## Change
- games/gnome-theft-auto/src/outskirts/save.ts: real bodies.
  - parseOutskirtsSave(raw): JSON with v 1; keep only valid fields (visited boolean, shops filtered to 'store' |
    'diner' | 'workshop' unique, souvenirs unique strings, wished a non-negative integer, wellJackpot / knocked
    booleans); anything broken => emptyOutskirtsSave().
  - createOutskirtsStore(storage?): storage defaults to localStorage when it exists, else an in-memory map; reads
    OUTSKIRTS_KEY once; every mutating call that changes something writes JSON and calls notifySaveChanged();
    return values as documented in the interface.
  - `export function mergeOutskirtsSaves(a: string, b: string): string`: union of shops and souvenirs (sorted), OR of
    the booleans, max of wished; returns JSON text; the same result whichever way round.
- games/gnome-theft-auto/src/saveIO.ts: add `'gta-outskirts-v1', // outskirts/save.ts: Pebblewick (visited, counters,
  souvenirs, wishing well, the night knock)` at the end of GTA_SAVE_KEYS.
- games/gnome-theft-auto/src/cloudSave.ts: MERGES gets `'gta-outskirts-v1': mergeOutskirtsSaves` (import from
  './outskirts/save'); add the key to GROWS (it only grows).
- games/gnome-theft-auto/src/saveIO.test.ts: add a fixture value for 'gta-outskirts-v1' (e.g. JSON.stringify({ v: 1,
  visited: true, shops: ['diner'], souvenirs: ['postcard'], wished: 3, wellJackpot: false, knocked: false })).
- games/gnome-theft-auto/src/outskirts/save.test.ts (new): parse tolerance (null, junk, bad fields), store round trip
  with a fake storage, markShop true only for a new counter, merge symmetric and idempotent.

## Contract
Every export of the stub stays with the same signature (other workers call OutskirtsStore methods).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.
- `cd games/gnome-theft-auto && npx vitest run src/outskirts/save.test.ts src/saveIO.test.ts src/cloudSave.test.ts` passes.

## Out of scope
Every other file.
~~~~

~~~~text
ISSUE 1K: Pebblewick's two side quests and their perks
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash, switch branches, start a dev server
  or run vite build.
- Many workers edit other files of games/gnome-theft-auto at the same time; another planner is adding city quests
  (quests/cityQuests.ts) and may touch defs.ts / unlocks.ts: make small additive edits and re-read each file right
  before editing. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in files you do not own: ignore them.

## Goal
Two Strangers-&-Freaks-style side quests are offered in Pebblewick, each with a dialogue intro and outro, an Acorn
reward, an achievement and a small perk.

## Read first
- games/gnome-theft-auto/src/quests/types.ts: QuestDef, GiverDef, ObjectiveDef ('visit', 'steal-deliver',
  'chase-follow'), CutsceneSpec { kind: 'dialogue', room: 'street', lines: DialogueLine[] }.
- games/gnome-theft-auto/src/quests/defs.ts: GIVERS (placed('<id>') reads the 'giver/<id>' marker of the level
  documents; markers 'giver/pebblewick-plots' at world (612, 146) and 'giver/pebblewick-tower' at world (712, 170)
  already exist) and QUESTS.
- games/gnome-theft-auto/src/quests/sideQuests.ts: the style of a side quest def.
- games/gnome-theft-auto/src/quests/unlocks.ts: SIDE_UNLOCKS (rule: a beat is a chapter quest and opens at most 2 side
  quests) and SIDE_COLORS; tests quests.test.ts (the quest count), unlocks.test.ts (the "lists every side quest ...
  exactly once" test), perks.test.ts.
- games/gnome-theft-auto/src/perks.ts: PerkId, PERKS, PRICE_PERKS.
- games/gnome-theft-auto/src/outskirts/town.ts: TOWN, TOWN_ACHIEVEMENTS, TOWN_QUESTS (ids). READ ONLY.

## Change
- games/gnome-theft-auto/src/quests/outskirtsQuests.ts (new): `export const OUTSKIRTS_QUESTS: readonly QuestDef[]`:
  1. id 'sq-weeping-line', title 'The Weeping Line', giver 'pebblewick-plots', rewardAcorns 450, achievement
     'gta-weeping-line'. cutscene dialogue (room 'street', 3-5 lines; speaker 'Purslane Furrow', look { hat: 0x7a8a3a,
     shirt: 0xa8743a, beard: 0xf0eee6 }): the line that waters her peppers has gone dry somewhere out by the canyon,
     and she hears a pump at night. Objectives:
     - visit 'Follow the Weeping Line west to the first dry joint' at [560, 170] radius 10, hint 'First dry joint',
       toastOnEnter 'The tube is bone dry here. Someone has spliced a second tube into it.'
     - visit 'Follow the splice up the canyon trail' at [532, 262] radius 12, hint 'Dry Canyon trail', heatOnEnter 1,
       toastOnEnter 'A Black Dew bowser, hooked to the line and drinking. Nobody about.'
     - steal-deliver 'Drive the tappers\' mower back to Ratchet\'s workshop in Pebblewick', vehicleKind 'mulch-spreader',
       spawnAt [536, 270, 0.2], dropAt [650, 60], radius 8, hint "Ratchet's Mower & Dew", maxDamage 0.8.
     - visit 'Tell Purslane the line is weeping again' at [612, 150] radius 6, hint 'The dry plots'.
     outro dialogue (2-3 lines, Purslane): the peppers have noticed; she names the player a friend of the line.
     doneText: "The Weeping Line weeps again. Pebblewick's counters will remember you (20% off)."
  2. id 'sq-hum-at-three', title 'The Hum at Three', giver 'pebblewick-tower', rewardAcorns 500, achievement
     'gta-hum-at-three'. cutscene dialogue (speaker 'Mallow Bucket', look { hat: 0xf2c94c, shirt: 0xe06a8a, beard:
     null, freckles: true }): a combine in the eastern dunes hums at three in the morning; nobody believes her; she
     has a map (mostly arrows). Objectives:
     - visit 'Find the chrome thing on Mallow\'s map, in the dunes east of town' at [845, 147] radius 12, hint 'The
       Old Combine', toastOnEnter 'Half-buried, chrome all over, and very slightly humming.'
     - visit "Borrow Burnet Ratchet's listening stick from the workshop" at [650, 60] radius 6, hint "Ratchet's Mower & Dew".
     - visit 'Hold the listening stick to the Old Combine' at [845, 147] radius 8, hint 'The Old Combine',
       toastOnEnter 'It is not an engine. It is singing. Somebody else is listening too.'
     - chase-follow 'Tail the HOA van that came to inspect the hum', leaderName 'HOA Inspector', leaderKind 'hoa-van',
       waypoints [[830, 120], [790, 60], [760, 50], [650, 20], [570, 30], [520, 30], [450, 70]], speed 13, maxDist 60,
       hint 'HOA van'.
     - visit 'Tell Mallow what you heard' at [712, 172] radius 6, hint 'The water tower'.
     outro dialogue (Mallow; she was right; she is writing it on the notice board).
     doneText: "The hum is real and the HOA wants it. Burnet Ratchet now fixes your rides for free."
  Keep every objective text and line short (16 words or fewer per dialogue line).
- games/gnome-theft-auto/src/quests/defs.ts: GIVERS gets 'pebblewick-plots' { name 'Purslane Furrow (Pebblewick)',
  label 'Talk to Purslane Furrow', ...placed('pebblewick-plots'), room 'street', letter '!' } and 'pebblewick-tower'
  { name 'Mallow Bucket (Pebblewick)', label 'Talk to Mallow Bucket', ...placed('pebblewick-tower'), room 'street',
  letter '!' }; QUESTS gets `...OUTSKIRTS_QUESTS` (import from './outskirtsQuests') after the side quests.
- games/gnome-theft-auto/src/quests/unlocks.ts: SIDE_UNLOCKS rows for both quests. Pick for each an `after` chapter quest
  that currently opens FEWER than 2 side quests in the table (count the rows; candidates: 'ch2-vespers-offer',
  'ch3-kiln-resin-ice', 'ch4-spade-truce', 'ch4-sandpit-drop'), the Weeping Line in chapter 2 or 3, the Hum in
  chapter 3 or 4, with a one-line `why`. SIDE_COLORS: 'pebblewick-plots': '#e0a050', 'pebblewick-tower': '#9fd0ff'.
- games/gnome-theft-auto/src/perks.ts: PerkId gets 'weeping-line' and 'combine-hum'; PERKS gets { id: 'weeping-line',
  questId: 'sq-weeping-line', name: 'Weeping Line Discount', text: "Pebblewick's counters charge 20% less." } and
  { id: 'combine-hum', questId: 'sq-hum-at-three', name: "Ratchet's Thanks", text: "Ratchet's Mower & Dew repairs for
  free." }; PRICE_PERKS gets { perk: 'weeping-line', reasons: ['Pebblewick'], scale: 0.8 } and { perk: 'combine-hum',
  reasons: ['Ratchet Repairs'], scale: 0 }.
- Tests: update the count in quests.test.ts (QUESTS.length and its test title) and make unlocks.test.ts's "lists every
  side quest ... exactly once" include OUTSKIRTS_QUESTS. Fix any other test that counts quests or perks (e.g.
  perks.test.ts, the journal, comms) only by updating the expected numbers or lists.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.
- `cd games/gnome-theft-auto && npx vitest run src/quests src/perks.test.ts src/perkEffects.test.ts` passes.

## Out of scope
town.ts, outskirts/*, sideQuests.ts content, cutscene/ and every other file.
~~~~

~~~~text
ISSUE 1L: Two Pebblewick street events
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not run npm install. Do not commit, push, stash, switch branches, start a dev server
  or run vite build.
- Many workers edit other files of games/gnome-theft-auto at the same time (another planner is changing
  events/director.ts and events/kit.ts: do not touch them). `npx tsc --noEmit -p games/gnome-theft-auto` may show
  errors in files you do not own: ignore them.

## Goal
Two street events can happen in Pebblewick: a spilled pepper cart to tidy up, and a convoy of Fizz Cup fans to race to
the Speedway gate.

## Read first
- games/gnome-theft-auto/src/events/types.ts: EventDef, EventKit (gnome, car, prop, dropProp, near, dist, say, tell,
  reward, ground, offRoad, spot, rand, pick, t), SpawnContext, EventScript, EventStatus.
- games/gnome-theft-auto/src/events/catalog/wild.ts and events/catalog/traffic.ts: finished events to copy the style of.
- games/gnome-theft-auto/src/events/catalog/index.ts and events/catalog.test.ts (rules every event must pass).
- games/gnome-theft-auto/src/outskirts/town.ts: inTown(x, z), TOWN. READ ONLY.

## Change
- games/gnome-theft-auto/src/events/catalog/pebblewick.ts (new): `export const PEBBLEWICK_EVENTS: readonly EventDef[]`:
  1. 'pebblewick-pepper-spill', title 'Pepper Cart Spill', category 'scene', hint 'Pick up the five crates of peppers',
     weight 1, cooldown 300, duration 120, anchor 'road', roadScene true, when: (c) => inTown(c.px, c.pz) &&
     !c.inVehicle. A cart-hand gnome (name 'Wort Barrowby', look { hat: 0x7a8a3a, shirt: 0xc0392b }) stands by a
     'wheelbarrow' prop tipped over (rotation.z = 1.2) at the anchor; 5 'crate' props scattered 3-9 m around it
     (scale 1.2, placed on kit.ground). The player picks a crate up by walking within 1.6 m of it (kit.near): drop the
     prop, kit.sfx('shutter'), kit.say a short line. All 5 => kit.reward(30, 'Pepper Cart Spill'), kit.say thanks,
     return 'done'. The gnome says a line every 8 s while waiting. Time out => 'gone'.
  2. 'pebblewick-fan-convoy', title 'Fizz Fan Convoy', category 'traffic', hint 'Beat the fans to the Speedway gate',
     weight 1, cooldown 400, duration 150, anchor 'road', when: (c) => inTown(c.px, c.pz) && c.inVehicle. Three cars
     (kinds 'ride-on', 'zero-turn', 'lowrider', tint 0xf2d22e, driver looks with yellow hats) spawned in a line at
     kit.spot('road', 10, 40) (or the anchor), each driveTo(790, -60, 0.85) a second apart. Goal (790, -60): the player
     within 12 m of it before any car arrives (car.arrived(12)) => kit.reward(40, 'Fizz Fan Convoy'), kit.tell('You beat
     the Fizz fans to the gate.'), 'done'; a car arrives first => kit.tell('The fans get there first. They honk about
     it.'), 'failed'. blip() returns the goal point.
- games/gnome-theft-auto/src/events/catalog/index.ts: import PEBBLEWICK_EVENTS and append `...PEBBLEWICK_EVENTS` to
  STREET_EVENTS (one import line, one spread; nothing else).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.
- `cd games/gnome-theft-auto && npx vitest run src/events` passes.

## Out of scope
events/director.ts, events/kit.ts, events/types.ts, town.ts and every other file.
~~~~

~~~~text
ISSUE 1M: Pebblewick lore
Epic: 1 Town
Depends on: none

## Environment
- Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (git worktree). Run every command from there.
  Git Bash: if node/npm/npx is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
- Dependencies are installed. Do not commit, push, stash or switch branches.
- Other planners may add rulings or entries at the same time: re-read docs/lore/rulings.md right before appending, and
  use the next free R- number (R-147 if free).

## Goal
The knowledge base knows Pebblewick: the town, its places, its nine townsfolk, the Weeping Line, the Old Chrome
Combine, the Pebblewick Hopper, and a ruling that records the decisions.

## Read first
- docs/lore/README.md (entry schema), docs/lore/canon.md (house style), docs/lore/settings.md (`apocrypha` section).
- docs/lore/entries/apocrypha/wenna-gudgeon.md and the-bent-pin.md (a person and a shop: the shape to copy),
  dust-flats.md, highway-east.md, lost-and-found-speedway.md (if present), side-quest-perks.md.
- docs/lore/rulings.md: the last few rulings (format).

## Change (all in docs/lore/; status draft, tier apocrypha, setting apocrypha, era now, games [gnome-theft-auto])
- New place entries: `pebblewick.md` (the town: adobe, about 30 gnomes, dry pepper plots on the Weeping Line, the last
  stop before the Speedway, at the end of Route East's extension; layout in brief; sources
  games/gnome-theft-auto/src/outskirts/town.ts, docs/roadmaps/gta-outskirts-town.md; Look and motifs: adobe, wattle
  fences, palms on the Green, the tin water tower), `the-weeping-line.md` (kind object: a buried Tall One tube that weeps
  a drop every span; the gnomes never say what it is; tapped by Black Dew bootleggers in 'sq-weeping-line'),
  `old-chrome-combine.md` (kind object: half-buried chrome combine in the eastern dunes; hums at three in the morning;
  answers a knock at night; the HOA is interested; why it hums stays a loose thread), `the-dry-spoon.md`,
  `twines-general.md`, `ratchets-mower-and-dew.md`, `pebblewick-glaze-post.md`, `pebblewick-hopper.md` (a bus to
  Turfton's Central Bus Stop; 8 Acorns).
- New person entries, one each, from this roster (name, role, look, lines; put the lines under "What gnomes say"):
  Reeve Yarrow Potsherd (town reeve, proud; "Pebblewick is a town, not a stop. We have a bell, a bus and a reeve."),
  Marigold Skillet (cook, The Dry Spoon; "Prickly pear pie, fresh from the oven. The oven is the sun."), Thistle Twine
  (Twine's General; "If Twine's doesn't sell it, you don't need it."), Burnet Ratchet (mower mechanic; "Every racer
  stops here twice. Once on the way out, once on a tow."), Sorrel Stampwell (postmistress; "I never read the
  postcards. I glance. For the stamps."), Doc Comfrey Mortar (glaze post; "Hairline cracks, mostly. The dry wind does
  it."), Purslane Furrow (dry farmer, gives 'The Weeping Line'; "The Weeping Line gives a drop every span."), Mallow
  Bucket (a youngster who watches the dunes, gives 'The Hum at Three'; "There's a combine in the dunes and it hums at
  three in the morning."), Old Sedge (busker on the square; "I played the Speedway once. They lapped me."). File ids:
  yarrow-potsherd, marigold-skillet, thistle-twine, burnet-ratchet, sorrel-stampwell, comfrey-mortar,
  purslane-furrow, mallow-bucket, old-sedge.
- docs/lore/settings.md `apocrypha` section: in the gnome-theft-auto sentence add "; Pebblewick, the adobe town at the
  end of Route East (R-147)" (use the ruling number you take).
- docs/lore/entries/apocrypha/dust-flats.md "In the games": add a bullet for Pebblewick (x 580..730, z 10..200) and the
  Old Chrome Combine (the pilots' story is true). highway-east.md: add a line under "In the games" (create the section
  if missing) that east-outer runs on to Pebblewick's junction at (650, 20); keep the loose thread.
  side-quest-perks.md: add Weeping Line Discount (Purslane, The Weeping Line) and Ratchet's Thanks (The Hum at Three).
- docs/lore/rulings.md: append R-147 (or the next free number): Question "Gnome Theft Auto adds a minor town on the
  outskirts. Where is it, what is it, and what is the Old Combine the Dust Flats tales mention?" Ruling: Pebblewick
  stands at the far east of the Dust Flats where Route East runs out towards the fence; ~30 gnomes; farms on the
  Weeping Line; the Old Chrome Combine is real and hums at three in the morning; the HOA takes an interest; Turfton is
  still the only city, Pebblewick has a reeve, not a mayor; the Pebblewick Hopper is the only bus. Applies to
  apocrypha, gnome-theft-auto. Date 2026-11-23. Why: the user asked for a minor town on the outskirts with things to do.
  Use `related` ids that exist (check with `npm run lore -- find <word>`).

## Done when
- `npm run lore` passes (it regenerates INDEX.md and checks every entry).
- `npm run lore -- find Pebblewick` lists the new entries.

## Out of scope
Anything outside docs/lore/.
~~~~

## Epic 2: planner pass

- `mapIcons.ts`: PlaceKind `town` (style "Pebblewick", colour, glyph); `mapPois.ts`: `pebblewickBlip()` from
  `outskirts/town.ts` (also gives the trainer's World tab a Pebblewick teleport).
- Golden layout regenerated deliberately (see Decisions); traffic/route/mapIcons/settlements/levels/quests tests.
- `npm run build -w games/gnome-theft-auto`, `npm test -w games/gnome-theft-auto`, smoke (`?pebblewick`), a screenshot,
  `npm run zfight`, `tools/gta-perf.mjs` before/after.

## Results (2026-11-23)

- Epic 1 done: 1A, 1B, 1C, 1D, 1E, 1F, 1G, 1H, 1K, 1M by workers; 1I (sounds), 1J (save) and 1L (events) by the
  planner, since the shared subagent cap was full. The planner also added `quests/stages/pebblewick.ts` (stage spots for
  the two givers and quests, required by `stages.test.ts`).
- Golden layout regenerated (it also picked up the other planners' work that was in the tree at the time).
- Smoke (`?pebblewick=square`): OK. Screenshot down Main Street looked right. Z-fight scan: one town pair (the Dew pump's
  concrete island on the sand) fixed by sinking it 0.15 m; the remaining pairs are mower glaze shells and skyway slip
  roads, not this workstream.
- Not measured: `tools/gta-perf.mjs` (the shared dev server kept reloading as other planners saved files). Cost by
  design: about 125 placements in a few merged 96 m cells plus 2 landmarks, 9 gnomes and 4 hens with animation LOD and
  no work past 160 m.
- Shared tests not owned here: `quests.test.ts` / `unlocks.test.ts` quest counts also include the city and newcomers
  workstreams; `packages/achievements` fails on `hazel-staff` granted twice (in HEAD before this work).
