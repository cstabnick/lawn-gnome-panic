# FX10 Pardonlin's life: queues, people, shops, roundabouts, the Wickets, sound and night
Wave: 4 · Depends on: FX06, FX09 · Kind: Fix (content)
Findings: 14 (G2#5, G2#6, G2#13, G2#14, G2#17, G2#18, G2#19, G2#21, G2#22, G2#23, G2#24, G2#27, G2#28, G2#29) · Decisions: D10, D11

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

A lived-in town (D10, D11): full queues (the town's defining joke), cyclists and strollers, residential back streets, finished roundabouts, a customs gnome at the Wickets, a Continental warden, a church bell on the hour, sound in every district, and a town that glows at night.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- pardonlin/life.ts, pardonlin/activities.ts, pardonlin/activityLogic.ts, pardonlin/sound.ts, pardonlin/sounds.recipes.ts, pardonlin/wickets.ts, pardonlin/interiors.ts
- district shop mixes (`SIDE_MIX`, `BACK_MIX`, `SHOP_NAMES`, teacupQuays.data.ts) and the gardens' residents and sheds
- roundaboutIslands.ts (the Pardonlin islands only)
- trafficDirectorsView.ts / trafficDirectors.ts (the Pardonlin warden look)
- night: `buildStaticCells(..., { lights })` in pardonlin/town.ts (window glow, light decals)
- docs/lore Pardonlin entries (G2#23)

### Findings (14)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G2#5** (blocker, spirit · **must**, D10) Nobody is in the queues
  - What: The Bean Tower switchback, the Grand Platz "QUEUE HERE. For what: see the front of the queue." line and the bakery queue are rope posts with nobody in them. The activity tells you "You join the queue. It is long." and you are the only gnome in it. The only …
  - Where: `towerqueue` (-1508,-335), `platzqueue` (-1484,-188). `oldTown.ts` has 122 `pl-queue-post`s and 5 residents. `activities.ts:83`, `activityLogic.ts QUEUE_LINES` ("A gnome ahead checks a clipboard...").
  - Editor's fix: Stand 8–15 ambient gnomes in each queue, with idle variety (newspaper, checking a watch, a picnic in the line, a dog). For "Queued for Nothing", put gnomes ahead of the player who step forward as the queue moves and leave at the front. Add a queue of 4–6 outside Brigitte's bakery at dawn.
  - Decision: D10 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#6** (polish, spirit · **should**, D10) A thin population, and no cyclists in the streets
  - What: The Old Town has 5 residents for 435 buildings and the Left Bank 5 for 848. The 9 strollers and cyclists in `life.ts` only use the two riverside walks. The lore says Continentals "cycle everywhere" and go round the Hatwheel "once more than strictly needed" …
  - Where: `pardonlin/life.ts:342-360` (`walkPaths` = thymes-walk, rive-gauche). Resident counts are from `pardonlinPlans()`.
  - Editor's fix: Add cyclists that lap the Hatwheel 1–3 times before leaving, using the existing ring path. Add more strollers on the Rue Haute pavements and the new lanes, and window-leaners, shopkeepers in doorways and a street sweeper. Aim for 12–15 visible Continentals per district.
  - Decision: D10 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#13** (polish, craft · **should**) Shop names repeat street after street
  - What: Each building type cycles through 1–3 names. In Teacup Row and the Quays, "ANTIQUES (NEW STOCK: OLD)" and "THE ALMOST INN" appear 11 and 10 times. In the Old Town, "BISTRO. Lunch begins at ten" and "BISTRO. Soup of the day: yesterday." appear 8 times each. On …
  - Where: `teacupQuays.data.ts:10-17`, `oldTown.ts SHOP_NAMES`, the Left Bank menu boards.
  - Editor's fix: Write a pool of 8–12 names per building type per district (unique per street), or put names only on every 2nd–3rd shop and leave the others as plain "BOULANGERIE"-style lettering, which also reads as more real.
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#14** (polish, spirit · **should**, D11) Too many shops of too few types, in the wrong places
  - What: The whole town uses 11 kit buildings. The Left Bank has 133 antiques shops, 106 bistros and 62 bakeries among 848 buildings, and shopfronts face the backyards and quiet side streets. Shop types should cluster on the Rue Haute, Teacup Row and the market; side …
  - Where: `leftBank.ts` mixes; `oldTown.ts SIDE_MIX/BACK_MIX` (antiques and bakery on side streets).
  - Editor's fix: Use residential-only mixes for back and side rows. Ration shopfronts to the high streets and squares. Vary tint and trim more per row. If budget allows, add 2–3 new kit pieces: a narrow 2-bay house, a corner house with a turret, and an arcade or covered passage that a lane from finding 2 can pass through.
  - Decision: D11 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#17** (polish, craft · **should**) The steeple bell is in the wrong place and rings every 90 seconds
  - What: `sound.ts` says "the steeple bell on the hour". The code tolls three times every 90 s, heard over 400 m, from (-1500,-250) on the Grand Platz, where there is no steeple. The steeple church (the Church of the Second Helping) is at Place du Pot.
  - Where: `pardonlin/sound.ts:24,37` `SOUND_SPOTS.bell` `every: [90, 90]`.
  - Editor's fix: Put the bell at the church's steeple. Ring it on the in-game hour (and the half hour once), with the number of tolls set by the hour, and an extra, late toll as a joke ("the bell is on a go-slow").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#18** (polish, craft · **should**) Whole districts have no sound
  - What: The 10 town sound spots cover the Platz, Teacup Row, the quay accordion and the market's pigeons. The Left Bank has no café, market chatter or studio noises. The Jardin, the Little Gardens and Basin Quay have nothing beyond the general `continental` bed.
  - Where: `pardonlin/sound.ts SOUND_SPOTS`.
  - Editor's fix: Add market haggling and a stall bell, a cello practising badly from the Opera's stage door, shears snipping and the fountain in the Jardin, a watering can and a radio at the allotments, rigging and gulls on Basin Quay, and bicycle bells on the streets.
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#19** (polish, craft · **should**) The town is flat and unlit at night
  - What: At `?time=night` the Platz and Teacup Row are uniformly blue-dark. The lamp posts cast no pools, the windows stay unlit and the café string lights don't glow. The Opera's windows glow by day but the rest of the town doesn't at night.
  - Where: `night-platz`, `night-teacup`. `buildStaticCells(..., { lights: false })` in `town.ts`.
  - Editor's fix: Give a share of windows emissive glow at night, put fake light decals under lamps (flat layer) and on café terraces, and add glow to the string lights and the bandstand. Keep real lights at zero.
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#21** (polish, spirit · **should**, D11) Roundabout islands are generic and look unfinished
  - What: Place du Pot's island is a brown soil disc with primitive coloured spheres and a big green ball. The Hatwheel has the same planter as every Turfton roundabout. Neither says "Pardonlin", and the Hatwheel has no hat. The lore asks for a "Place du Pot (Pot Not …
  - Where: `potfountain` (-1500,450), `hatwheel`. `roundaboutIslands.ts` (`roundabout-planter`).
  - Editor's fix: Give the Hatwheel a giant bronze hat on a plinth, or a hat-shaped topiary, with "Allow Several Laps" on a sign. Give Place du Pot an empty plinth with a plaque, "Pot Not Included". Lay a cobbled belt round both rings. Planted-bed islands stay for the other bands.
  - Decision: D11 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#22** (polish, spirit · **should**, D11) The Wickets: an empty customs hut and an entrance with no joke
  - What: The Grand Wicket's customs hut has no officer. The hat-and-stamp prop is still deferred from E28 ("left for a later pass"). The wicket signs carry symbols only. Arriving in Pardonlin is a gap in a plank fence.
  - Where: `wicket` (-1375,-30). `pardonlin/wickets.ts:133`.
  - Editor's fix: Put a customs gnome in the hut (stamping, asking "Purpose of visit? Lunch?") with the hat and stamp on the counter, made from existing prefabs. Add a welcome board on the town side ("PARDONLIN. Pardon?") and a short queue of cars and suitcases at the boom.
  - Decision: D11 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#23** (polish, craft · **should**) The lore disagrees with the game about places
  - What: (a) Odile Easelby is "a Left Bank painter" and `pardonlin.md` lists her under the Left Bank. The game (and the E30 cast table) puts her on the Grand Platz in the Old Town. (b) `brigitte-levains-bakery.md` places the bakery off the Rue Haute "near x -1462, z …
  - Where: `docs/lore/entries/apocrypha/{odile-easelby,pardonlin,brigitte-levains-bakery,the-hatwheel,place-du-pot,le-petit-groan}.md`.
  - Editor's fix: Bring the lore in line with the game (the cast table is the fixed point), or build what the lore says (the cobbled belt, finding 21). Run `npm run lore`.
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#24** (polish, craft · **should**) Allotment sheds are post booths, and the Folly is a post booth
  - What: 19 of the Little Gardens' shed slots use `euro-post-booth`, a yellow post kiosk. The Jardin's "Romantic Ruin" folly is a post booth with two ivy walls. Both read as a post office in a vegetable patch.
  - Where: `gardens.ts:368` and `gardens.ts:270`. `gd2` (yellow booth at right).
  - Editor's fix: Use `garden-shed` (tinted) or add a small lean-to shed prefab. Build the folly from broken columns and an arch (a new `pl-folly` prefab), which fits the sign "Built last Tuesday. Ruined Wednesday."
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#27** (nit, craft · **could**) Wilhelmina Marrow stands inside an allotment bed
  - What: She is waist-deep inside a raised bed, clipped through its walls.
  - Where: `marrow` (-1460,682). `gardens.ts` residents.
  - Editor's fix: Move her about 1 m onto the path beside the bed, facing the marrow.
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#28** (nit, craft · **could**) Brigitte's reward line promises a joke and doesn't deliver it
  - What: "Brigitte: Five doors, five bakes. Here is your N acorns and a bad joke about rolls." No joke is told, and "is" should be "are".
  - Where: `pardonlin/activities.ts:212`.
  - Editor's fix: Tell the bad joke, e.g. "Here are your N acorns. Why did the roll stop? It was on a go-slow. ...It is a bread joke."
  - Re-check: the spot and file named in Where (no editor shot)
- **G2#29** (nit, spirit · **should**, D11) The Pardonlin warden wears HOA green in a town that is "not an HOA town"
  - What: Herr-Monsieur Lupin Pardoux wears the HOA green uniform. R-183 says Pardonlin is not an HOA town and `pardonlin.md` says he is "on loan from the Continentals". The warden lore says Pardonlin thinks HOA hats are "too short".
  - Where: `trafficDirectorsView.ts HOA_GREEN`, `trafficDirectors.ts:38`, `warden2`.
  - Editor's fix: Give the Pardonlin warden a Continental uniform (navy, white gloves) and a visibly taller hat than the Turfton wardens: a joke that is already in the lore.
  - Decision: D11 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

**GR1. Lore and the game disagree: which one changes.**
- If the disagreement is about **what a place's name or lore promises it looks like** (its signature image: Saltbucket's
  bucket and dunes, Snowcap's snow, the Unmown's tall grass, the Double Pot's two pots, City Hall's upside-down planter,
  Pardonlin's queues and pavements), **the game changes**. Canon 1 ("every landmark is an ordinary yard object at giant
  scale") is the game's best visual joke, and the name is the promise.
- If it is about **positions, coordinates, counts, who stands where, colours, small facts or "Planned" markers**, **the
  lore changes** to match the build. The cast tables and the code are the fixed points (G2#23, G4#24, G4#32, G12#15–20,
  G1#29).
- Where the lore and the build both fall short of the brief (for example Espalier End's twelve houses, or Capwood's
  "gnomes walk under the caps"), build towards the lore.
- Every ruling below that changes the lore is recorded as a new ruling in `docs/lore/rulings.md`, numbered from
  R-237 in the order the fix epics merge. `npm run lore` must pass.

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D10. Pardonlin's life: queues, population, the race crowd — G2#5, #6, #16 · queues **must**, the rest **should**
- **Decision:**
  - **Queues (must):** 8–15 gnomes in the Bean Tower and Platz queues, with idle variety. The "Queued for Nothing"
    queue moves. 4–6 gnomes queue at Brigitte's bakery at dawn. The queue is Pardonlin's defining joke (GR1).
  - **Population and cyclists (should):** cyclists that lap the Hatwheel 1–3 times, more strollers on the Rue Haute
    and in the new lanes, window-leaners, doorway shopkeepers and a sweeper. Aim for 12–15 visible Continentals per
    district, within GR9.
  - **The race meet (should):**
    - each meet gets its own cheers, with the flagger's name taken from `cast.ts`;
    - Pardonlin's cheers get a Continental flavour;
    - Pardonlin's crowd shows only while a race is offered, so the Opera forecourt belongs to the Opera.
- **Reason:** the user's brief was a lived-in town.

#### D11. Pardonlin details: shop mix, roundabouts, the Wickets, the warden — G2#14, #21, #22, #29 · **should**
- **Decision:**
  - Side and back rows become residential (doors, shutters, window boxes), and shopfronts are rationed to the high
    streets, Teacup Row and the market. New kit pieces (a narrow house, a corner turret, an arcade) are a **could**.
  - The Hatwheel gets a bronze hat on a plinth and an "Allow Several Laps" sign. Place du Pot gets an empty plinth with
    "Pot Not Included". Lay a cobbled belt round both rings. The other bands keep their planters.
  - A customs gnome stands in the Grand Wicket hut with the hat and the stamp, plus a "PARDONLIN. Pardon?" board and a
    short queue at the boom.
  - The Pardonlin warden gets a navy Continental uniform, white gloves and a taller hat.
- **Reason:** all of these are cheap and already written in the lore (GR1). R-183 says Pardonlin is not an HOA town.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX09 lanes and pavements (walk paths). FX06 bubble rules and `y`.

## Online / mobile / achievements / prefabs / lore notes

- GR9 density: 12-15 visible Continentals per district, measured as in FX09.
- GR10 keeps Radio Adagio and the sign voice: add, do not rewrite.
- Lore: the cast table is the fixed point (GR1); `npm run lore`.

## Risks and open questions (with the decision taken)

- Queues: 8-15 ambient gnomes per queue × several queues: use the cheap ambient path and LOD.

## Rules for every fix epic (from decisions.md)

- Decisions are final for batch 3. If a ruled fix proves impossible, take the ruling's fallback (or its cheaper
  option), and record it in `review/rounds.md`. Do not reopen the question.
- **GR9 scope guard:** no new systems (the only exceptions: the `previously` field, the reward chip, scene weather, the
  Gnomlet `mount(root)` adapter, the ambient-gnome `y`/`surface` field, the vehicle capsule, quest-scoped stage sets,
  choice-gated outro steps). No new online modes. Density passes are measured with `node tools/gta-perf.mjs --cpu 4` at
  the densest spot before and after, and may raise phone frame time there by at most 15%.
- **GR10 keep list:** the sign and dialogue voice, the HOA as the butt of the jokes, the gentle Flock, the kind moles,
  act IV's voices, Radio Adagio, the Spine Cut and the World's Edge, Casual handling and Casual-chassis traffic, the
  comms card on desktop, Gnomey Bird, the moored-only Bathtub Queen, "Tours at noon. Cargo at midnight." Rewrites add a
  clause; they do not replace a scene.
- **GR1 lore:** signature images change the game; positions, counts, colours and small facts change the lore. Every
  lore change gets a ruling appended to `docs/lore/rulings.md` (use the next free number on your branch; the
  orchestrator renumbers from R-237 in merge order). `npm run lore` must pass.
- Priorities: **must** is done this round and checked in R1 round 2; **should** is done unless it blocks a must;
  **could** only if there is room. Nits without a decision are *could*: do them where cheap, bundle several per issue.
- Edit only the files this brief owns. Hot files (`config.ts`, `app.ts`, `hud.ts`, save keys, the prefab catalog
  index, `rulings.md`, `AGENT_INDEX.md`) take small, additive edits only; conflicts are resolved at merge.
- Prefab rule for every new object (`@lawn/prefabs`), z-fight rule for anything flat (`flatLayer`), mobile by default
  (390x844 and 844x390, 44 px targets), keep LF line endings. Workers never commit; the lead commits on its branch.
- Load: at most ~30 worker issues. If decompose finds more, do the musts first, commit a working state, and report
  the rest as deferred.

## Done when

- `npm run build -w games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass (rerun a timing-sensitive file alone before calling it a regression).
- With the dev server up: `bash tools/smoke.sh <url> #ui canvas` reports no console errors.
- Any 3D scenery or prop change: `npm run zfight -- <url>` at each changed spot is clean.
- Prefabs added or changed: `npm test -w packages/prefabs` passes. Lore changed: `npm run lore` passes.
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX10/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Perf at the Platz and the market within GR9.
- Bell rings on the in-game hour at the steeple (a unit test for the schedule).
- All 1 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
