# FX18 Jobs, activities and racing: workstations, pay, feedback, meets
Wave: 7 · Depends on: FX03, FX11 · Kind: Fix (content)
Findings: 23 (G2#16, G3#27, G8#4, G8#5, G8#6, G8#7, G8#8, G8#9, G8#10, G8#12, G8#13, G8#17, G8#18, G8#20, G8#21, G8#23, G8#24, G8#27, G8#28, G8#29, G8#30, G8#31, G8#32) · Decisions: D10, D15, D27, D28, D29

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Jobs feel like being somewhere (D27): compact, translucent panels over a fixed workstation camera; jobs pay on one curve; wagers and trials make sense; shifts end the same way; the meets have their own crowds (D10) and the Lay-By and the Dash reach the sea (D15).

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- workplaces/** (chef, comedy, gnomazon, garbage, mechanic, shift.ts, shiftCard.ts) except the HUD text FX03 did
- jobs/** (workDefs.ts `WORK_PAY`, runtime.ts), economyCurve.test.ts
- dewdrop/**
- streetRace/** (session.ts, types.ts WAGERS, meets.ts, meetScene.ts), raceTrack/defs/streets.ts (`SALTBUCKET_DASH`), quests/objectivesRace.ts (trial HUD)
- app.ts dev hooks block (~2913-2934) only
- packages/party/README.md (backlog rows)
- docs/lore saltbucket-lay-by.md

### Findings (23)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G2#16** (polish, craft · **should**, D10) The race meet's crowd always stands on the Opera forecourt, using Turfton's lines
  - What: The Quai de la Boucle meet (centre (-1724,-91)) shares the Boulevard with the Opera Hall. Its spectators stand there all day, shouting generic street-race cheers, including "Wave the flag, Wick!" (Wick is Turfton's flagger; Pardonlin's is Odette Marchand) and …
  - Where: `lb1` (-1712,-100). `streetRace/meets.ts:23-33`, `streetRace/meetScene.ts:25-31` `CHEERS`.
  - Editor's fix: Give each meet its own cheer list, with the flagger's name taken from `cast.ts`. Give Pardonlin's cheers a Continental flavour ("Pardon! Pardon! Faster, pardon!"). Move the meet's crowd 20–30 m south along the Boulevard so the Opera forecourt belongs to the Opera, or show the crowd only when a race is offered. Flag this to G8 too.
  - Decision: D10 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G3#27** (polish, spirit · **should**, D15) The Saltbucket Lay-By is neither at Saltbucket nor a lay-by
  - What: - The meet is at (975, 140) on the East Band, about 1 km from the coast. It sits on open lawn, with no tarmac pull-in and no sand drift (`a14-layby`; E26's own notes say "reads sparse"). - The Saltbucket Dash ends at (150, 975) on the band road and never …
  - Where: `src/streetRace/meets.ts` `saltbucket`, `src/raceTrack/defs/streets.ts` `SALTBUCKET_DASH`, `docs/lore/entries/apocrypha/saltbucket-lay-by.md`.
  - Editor's fix: At minimum, lay a tarmac pull-in pad with sand-drift decals under the meet. Then extend the Dash down the coast spur to finish at the boardwalk entrance sign (0, 1072), so it really ends at the sea. Moving the meet itself is the decider's call.
  - Decision: D15 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#4** (polish, craft · **should**) Sage never speaks where the player can see it
  - What: the chef job routes Sage's lines (start, rush, good ticket, walkout, end) through `hud.toast`. The kitchen is a full-screen opaque panel at z-index 38 and `#gta-hud` has no z-index, so every toast is behind the paper. Kippy works because the packing UI has …
  - Where: `workplaces/chef/runtime.ts:109` (`say: (t) => deps.hud.toast(...)`), `chef/kitchenUi.ts:13`.
  - Editor's fix: add a speech strip under the kitchen header (like Kippy's `.kippy` row) and send `say` there.
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#5** (polish, spirit · **should**, D27) The kitchen, the packing station and the bin lift are 2D forms that hide the 3D place
  - What: the chef shift and the Gnomazon shift are opaque full-screen panels; the 3D kitchen and the FC-1 floor with its vignettes (box tower, birthday at station 4, Kippy on the floor) are never seen while working. At desktop sizes half the panel is empty lined paper …
  - Where: `chef/kitchenUi.ts`, `gnomazon/packUi.ts`, `garbage/liftUi.ts`.
  - Editor's fix: keep the widgets but make the panels compact and translucent over a fixed camera on the workstation (chef: the pass and the hob; Gnomazon: the station with the conveyor and the shelf; lift: a lower-third strip with the 3D arm in view). Show the order slip and shelf as a bottom sheet on phones. Alternative: keep the forms and accept the trade for readability.
  - Decision: D27 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G8/`: `chefD-4.png`, `gnzD-12.png`, `binLiftP-6.png`, `gnzQ-7.png`
- **G8#6** (polish, craft · **should**) The comedy camera shows the stage and an empty floor, not the crowd
  - What: the set is framed from behind a candle table: the gnome, the mic stand and 60% of the frame of dark floor. The ten seats, the hecklers and the tomato throwers are off camera; heckles appear only as text bubbles. The "TONIGHT: YOU" poster is cut by the top …
  - Where: `workplaces/comedy/runtime.ts` (showroom target), `comedy/club.ts`; shots `comC-10.png`, `comC-35.png`, `comP-20.png`. E24 recorded "comedy crowd mostly off camera".
  - Editor's fix: frame over the shoulders of the front row (two or three seated gnome backs in the lower third, heads turning, arms folding on a groan), cut to the heckler's seat for each heckle (1.5 s) and follow a tomato's arc once per set. Lift the camera so the poster is in frame.
  - Re-check: `review/shots/G8/`: `comC-10.png`, `comC-35.png`, `comP-20.png`
- **G8#7** (polish, craft · **should**) The new jobs pay about half of the old ones, and nothing pins it
  - What: `economyCurve.test.ts` pins only taxi, courier, pilot and boat (about 30 acorns a minute at level 1, pilot about 52). Estimated level-1 rates for the workplace jobs from `workDefs.ts` and their shift lengths: chef 25-30 a minute (normal shift), fire about 20 …
  - Where: `jobs/workDefs.ts WORK_PAY`, `economyCurve.test.ts`.
  - Editor's fix: add the six workplace jobs to the curve test with an assumed cycle each and a band of 18-40 a minute at level 1 (comedy exempt, with a comment). Raise bin pay to about 8 a bin (keep the fine at 5), Gnomazon to 5 a parcel, mechanic base to 55.
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#8** (polish, craft · **should**) A street-race wager pays far more than any job
  - What: pickup races pay twice the stake to the winner (`session.ts pickupPayout`). At the top stake (250) a win nets +250 for a 1-2 minute race, five to eight times a job's rate, with no cap. Rivals rubber-band (`raceAi.ts:363`), so a good driver wins most of them. …
  - Where: `streetRace/session.ts:27`, `streetRace/types.ts WAGERS`.
  - Editor's fix: have the bookie take a cut (win pays 1.8x), raise rival pace with the stake (the 250 race brings the meet's best two), and pay a small purse (10-20) for a 0-stake win so free races are worth finishing. Or cap the big stake to one race per meet per in-game day ("Sable does not race the same mug twice before supper").
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#9** (polish, craft · **should**) The first chef shift can be a 12-ticket rush
  - What: rush is Noon or Dusk, 30% of the 6-minute day, and the game starts at Noon. A rush is 12 tickets every 7 s at 80% patience. A level-1 Dishwasher on their first shift gets five tickets on the rail within 30 s (`chefD-30.png`).
  - Where: `chef/menu.ts:139-182` `makeTickets`, `isRush`; `chef/runtime.ts:102`.
  - Editor's fix: no rush until the player has served 8 tickets (or until level 2); on the first shift space tickets at 18 s and say so ("Quiet one. Learn the pass.").
  - Re-check: `review/shots/G8/`: `chefD-30.png`
- **G8#10** (polish, craft · **should**) Buying a replacement Dewdrop is pointless
  - What: after the series the runtime respawns the ball at the bay for free whenever none is there and the player is more than 40 m away (wrecked or lost balls are dropped first). The workshop also sells one for 400.
  - Where: `dewdrop/runtime.ts:113-133` and `addSpot`.
  - Editor's fix: pick one. Either a wrecked ball does not come back until bought (lore: Hogweed "does not do credit", and signs a form), or drop the buy spot and add a line when the free one appears ("Hogweed has blown you another.").
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#12** (polish, craft · **should**) The lorry's arm and the bin do not line up in 3D
  - What: with `?binround=lift` the bin stands on the far pavement while the lift arm swings on the near side of the lorry; after Grab the 3D bin stays on the kerb while the 2D diagram shows it on the claw (`binLift-9.png`). The lift opens for any bin within 5 m of the …
  - Where: `garbage/runtime.ts` (stop check, `devStart` line 255), `garbage/bins.ts pose`, `GARBAGE.stopRadius`.
  - Editor's fix: only offer "Lift bin" when the bin is on the arm's side (local x < 0) within 3.5 m and roughly level with the arm; otherwise toast "Pull up with the bin on the kerb side". Verify `pose` carries the bin from the grab on.
  - Re-check: `review/shots/G8/`: `binLift-9.png`
- **G8#13** (polish, craft · **should**) Time trials show "POS 1/1" and no target
  - What: a trial uses the race HUD pill `POS p/n LAP l/L time`. Alone, that reads POS 1/1. There is no best time and no gap to the ghost on screen while driving.
  - Where: `quests/objectivesRace.ts:396-399`; `streetRace/session.ts` (trial). Shot `srD-10.png`.
  - Editor's fix: for `kind: 'trial'` show `BEST 1:02.3 · GHOST −0.8` (gap at the last gate, green/red) instead of POS.
  - Re-check: `review/shots/G8/`: `srD-10.png`
- **G8#17** (polish, craft · **should**) Gnomazon's shelf icons are tiny and the emoji fallbacks are wrong
  - What: the prefab icons render at about 16 px inside 64-110 px tiles (`gnzD-12.png`), so the shelf reads by label only. Where a prefab icon fails, the fallback emoji are wrong: Trowel 🪛 (screwdriver), Watering Can 🚿 (shower), Doormat 🧺 (basket), Hose Reel 🧵 …
  - Where: `gnomazon/orders.ts:7-20 STOCK`, `gnomazon/packUi.ts:168,202,320`.
  - Editor's fix: size the icon to 40-48 px in the tile; drop the misleading fallbacks (show the name alone when the prefab icon fails rather than a wrong picture); hide hotkey labels for touch input.
  - Re-check: `review/shots/G8/`: `gnzD-12.png`
- **G8#18** (nit, craft · **could**) The shift card's copy does not match what happened
  - What: quitting the kitchen at once gives "Clean pass. Get some rest." over "Nothing done, nothing paid." (`chefQ-5.png`). Gnomazon's quote is double-quoted: `"Kippy: "Shift complete.""`, and its title repeats itself: "Gnomazon Associate shift: Gnomazon FC-1" …
  - Where: `chef/runtime.ts:59` (`pick(SAGE_LINES.end)`), `gnomazon/runtime.ts`, `workplaces/shift.ts:49`.
  - Editor's fix: a `quit` line set per job ("Apron's on the hook. Come back when you mean it."); pass Kippy's line without the wrapping quotes (the card adds them); title as "Shift at Gnomazon FC-1".
  - Re-check: `review/shots/G8/`: `chefQ-5.png`, `gnzQ-7.png`
- **G8#20** (nit, craft · **could**) The comedy level curve runs four times faster than the mechanic's
  - What: XP per minute at level 1, from `WORK_PAY.xpPerUnit` and the cycle lengths: comedy about 110 (70 a set of 40-60 s), chef about 55, Gnomazon about 40, fire about 40, bin about 30, mechanic about 25. Comedy reaches "Legend of Silence" in about 15 minutes …
  - Where: `jobs/workDefs.ts:WORK_PAY`.
  - Editor's fix: comedy xpPerUnit 35 (sets unlock by level, so it still moves), mechanic 90. Pin XP a minute in the same test as finding 7.
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#21** (nit, craft · **could**) Dev hooks for golf, the court, skate lines and comedy do nothing on their own
  - What: `?golf=N`, `?court=...` and `?skate=<line>` refuse ("Too far from Hedgeworth", "Drainpipe Court is in Founders' Green", "The Gutter Bowls are in...") unless `&at=` puts the player there; the refusal toast is gone by the time the page settles. `?comedyset` …
  - Where: `app.ts:2913-2934`, `golf/runtime.ts:251`, `court/runtime.ts:102`, `comedy/runtime.ts:160`.
  - Editor's fix: each hook teleports to its place first (as `?gnomazonshift` and `?firecall` do), and its comment says so.
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#23** (polish, craft · **should**) The mechanic's client vanishes
  - What: after "Hand back the keys" the client car is removed; the client never walks up or drives off (E24 deferred).
  - Where: `workplaces/mechanic/runtime.ts`, `glazeClient.ts`.
  - Editor's fix: the client gnome walks to the car, plays a reaction emote (cheer at 4-5 stars, facepalm at 1-2) with the brief's good/bad line in a bubble, and drives it off along the road for 10 s before despawn.
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#24** (polish, spirit · **must (documentation only)**, D28) None of the new activities can be shared online
  - What: golf, the court, skate lines, the jobs, the farm and the winter runs are local; only the race modes relay. E19 kept 2v2 basketball local.
  - Where: `court/`, `golf/` (E15 deferred online balls), E19 roadmap.
  - Editor's fix: one online activity this batch: two players replace the CPU on one side of the court (host runs GJAM's sim, relays positions and the ball), or a shared golf round where each player's ball relays and the card shows both. Record "local, why" for the rest in the PR.
  - Decision: D28 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#27** (nit, spirit · **could**, D27) The bin lift's diagram duplicates the 3D arm on desktop
  - What: on desktop the lift panel sits bottom right with a 2D lorry, arm and bin while the real lorry is in view (`binLift-6.png`). Players watch the diagram because it is clearer.
  - Where: `garbage/liftUi.ts`.
  - Editor's fix: once finding 12 is fixed, shrink the panel to the Grab/hold button with a swing indicator and let the 3D arm carry the action; keep the diagram only on phones in portrait where the lorry is small.
  - Decision: D27 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G8/`: `binLift-6.png`
- **G8#28** (polish, spirit · **could**, D27) The chef rail and pass have no sense of a diner
  - What: the kitchen is lined paper with ticket slips; no plates go out, no counter, no customers, no bell on screen. The 4-star "chef-bell" sound is the only sign of service.
  - Where: `chef/kitchenUi.ts`.
  - Editor's fix: a pass strip at the bottom with the plated dish prefab icon sliding off on serve, the bell icon ringing, and a customer name popping a one-line reaction ("a trucker: 'That's clover alright.'"). Pairs with finding 5.
  - Decision: D27 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#29** (nit, spirit · **could**, D27) Gnomazon's shift has no conveyor, no clock pressure in the room
  - What: the 150 s shift is a timer and a bar; Kippy's idle lines fire at 20 s. The world around the station (three associates, the birthday at station 4) is not shown and does not react to quota.
  - Where: `gnomazon/packUi.ts`, `gnomazon/warehouse.ts`.
  - Editor's fix: with finding 5's camera, the next order's tote slides in on a conveyor, and the other associates cheer (or freeze) on quota met. One extra joke: Kippy's countdown in the last 10 s ("Ten. Nine. Kippy believes in eight.").
  - Decision: D27 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#30** (nit, spirit · **could**, D29) Comedy pays per set but the set length grows with level
  - What: sets "get longer and worse" by level (7 beats at level 1, 9+ later) while pay rises 6 → 12 a set; the per-minute rate stays near flat and hazard pay (2 a tomato) is the only thing that moves.
  - Where: `workplaces/comedy/material.ts`, `WORK_PAY.comedy`.
  - Editor's fix: keep the pay joke; make the level-up visible: a bigger name on the "TONIGHT:" poster per level, and at Cult Disappointment a small crowd that comes to boo on purpose (more tomatoes, more hazard pay).
  - Decision: D29 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#31** (nit, craft · **could**) Party slices: three activities are natural fits and none is in the backlog
  - What: the party README lists only `gta-getaway` and `boat-regatta` for this game. The chef rush (four cooks, one rail), the Gnomazon pack race (most parcels in 45 s) and Gnomey Bird (four flappers, one seed) are 20-60 s, one-verb rounds built from pure modules …
  - Where: `packages/party/README.md`.
  - Editor's fix: add backlog rows (status "later") for the three with the one-line reason; do not build them in R1.
  - Re-check: the spot and file named in Where (no editor shot)
- **G8#32** (polish, craft · **should**) Old and new jobs end differently
  - What: workplace jobs and mole jobs end on the shared shift card (stars, lines, pay, level bar). Taxi, courier, pilot and boat gigs end on toasts and the job HUD only.
  - Where: `jobs/runtime.ts` vs `workplaces/shift.ts`, `workplaces/shiftCard.ts`.
  - Editor's fix: show a compact shift card when the player goes off duty in an old job (the session's gigs, pay, tips, level bar), reusing `showShiftCard`. Per-gig feedback stays as it is.
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

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

#### D15. The Saltbucket Lay-By — G3#27 · **should**
- **Options:**
  - (a) Move the meet to the coast. Con: it reworks E26's meet, routes and tests.
  - (b) Keep the meet's position, give it a pull-in, and extend the Dash to the sea.
- **Decision:** (b).
- **Reason:** the lore says "on the band road out to the coast", which the current spot is. The Dash's promise ("runs
  from here to the sea") is the part that breaks.
- **Fix round:**
  - A tarmac pull-in with sand-drift decals under the meet.
  - Extend `SALTBUCKET_DASH` down the coast spur to finish at the boardwalk entrance sign (0, 1072).
  - Update the lore coordinates.

#### D27. Jobs as 2D forms over a hidden 3D place — G8#5, #27, #28, #29 · #5 **should**, the others **could**
- **Options:**
  - (a) Keep the full-screen forms. Pro: readability. Con: the vignettes are never seen.
  - (b) Compact, translucent panels over a fixed workstation camera.
- **Decision:** (b).
  - Chef: the pass and the hob in view, with the order slips as a bottom sheet on phones.
  - Gnomazon: the station and the shelf in view.
  - Bin lift: a lower-third strip on desktop, with the 2D diagram kept only on portrait phones (#27).
- **Reason:** a GTA job should feel like being somewhere. The widgets stay as they are.
- **Fix round:**
  - Keep every widget and every score.
  - #28: the diner pass strip with a plated icon and a one-line customer reaction. **could**.
  - #29: a conveyor tote and Kippy's countdown. **could**.

#### D28. No new activity is online — G8#24 · **must** (documentation only)
- **Options:**
  - (a) 2v2 court online in R1.
  - (b) Shared golf.
  - (c) None in R1, and state why.
- **Decision:** (c).
- **Reason:**
  - AGENTS.md allows "keep it single-player and say why" when online play would add a lot of work.
  - A host-run GJAM relay is a new system, and GR9 rules out new systems in a fix round.
  - Race modes already relay.
- **Fix round:** the PR description lists each activity as "local", with its reason. Add the 2v2 court as the first
  item in the online backlog.

#### D29. Comedy's level curve — G8#30 · **could**
- **Decision:** keep the pay joke. A bigger name on the "TONIGHT:" poster per level. At Cult Disappointment, a small
  crowd that comes to boo on purpose.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX03 activity mode, holster and the activity HUD slot. FX11's coast (the Dash ends at (0, 1072)).

## Online / mobile / achievements / prefabs / lore notes

- D28 (must, documentation only): the PR description lists every activity as "local" with its reason; the 2v2 court is the first item in the online backlog. GR9: no new online modes.
- D27 #28, #29 and D29 are could.
- Mobile: every workstation panel at 390x844 (bottom sheet for chef order slips).

## Risks and open questions (with the decision taken)

- Pay changes move the economy curve: pin them in `economyCurve.test.ts` (18-40 a minute at level 1, comedy exempt).

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX18/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- The economy curve test covers the six workplace jobs.
- All 1 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.

## Added after FX03 (orchestrator)

- G8#33 (partly fixed by FX03): pull the court camera in (`court/view.ts`). Fishing still needs the touch activity mode (FX03's `src/activityMode.ts`); check with `node tools/gta-touch-check.mjs`.
