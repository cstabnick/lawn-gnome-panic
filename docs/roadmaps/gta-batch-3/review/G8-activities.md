# G8 Activities and jobs: editorial review, round 1

Editor: G8 (activities and jobs). Branch `gta-batch-3` at 0db911aa. Dev server `:5408`, headless Edge, a puppeteer
script that loads each activity's dev hook and shoots it at 960x600, 390x844 and 844x390 (with `debug`, `offline`,
`no-intro`), plus key presses and clicks for the bin lift, hose, golf address, chef and Gnomazon clock-out. The
activity tests pass (93 files, 707 tests: workplaces, golf, court, skate, winter, fishing, farm, streetRace,
raceTrack, dewdrop, jobs, economyCurve, hobbyIntros). Shots: `shots/G8/` (paths below are relative to this folder).

Not done: a real phone; a full shift, round, call, set or race played to the end by hand (same gap the E24/E25/E26
leads recorded); Loamdeep mole jobs, Gnomey Bird, birding and hunting were read in code only; the golf address shot on
a phone (the dev server stopped before it ran).

## Verdict

The writing is the best thing here. Kippy ("Hydration is a KPI"), the mechanic briefs ("Make it pink and loud...
and also that I am pink"), the comedy sets, Mags' kerb line, Winifred Rook's shed ("It was always going to be a
bonfire eventually"), the crop blurbs and the hole names ("The Mortgage") all land. The rules are mostly sound and
tested: the bin lift, the hose and ladder, the packing score, the chef widgets, the 9-hole round, 2v2 pickup on
GJAM's sim. Keep all of that.

The growing pains are in how the activities sit in the game, and a player hits them in the first minute:

- **Phone controls pile up.** Each activity adds its own buttons but the game's own touch cluster (Fire, Guns,
  Reload, Horn, Boost, Exit) stays on screen under them. On the court and the skateboard the buttons overlap.
- **The gnome brings a pistol to everything.** Golf has no club and no swing; the comedian holds the gun on stage.
- **The job HUD eats the jokes.** The bin and fire shift panel sits exactly where the toasts go, so the caller's
  line and the boss's line are unreadable; on a phone it also covers the money and the minimap.
- **Some activities are flat 2D forms over a hidden world.** The kitchen and the packing station cover the 3D room
  completely (and its vignettes); Sage, the chef job's character, never speaks where the player can see it; the
  comedy camera shows the stage but not the crowd that is the whole joke.
- **The new jobs pay about half of a taxi fare**, while a 250-acorn street wager pays five times a job.

None of this needs a rewrite. Most fixes are one shared mechanism (an "activity mode" for touch and the gun, a HUD
slot for the shift panel) applied to many activities.

Counts: 3 blockers, 21 polish, 10 nits. 27 craft, 7 spirit.

## Findings

### 1. On a phone, activity buttons sit on top of the game's own touch cluster
- **What:** the touch cluster in `input.ts` (`showButtons(mode)`) only knows the modes foot / drive / fly / chute.
  Activities add their own buttons in their own layer but never hide the cluster. Results at 390x844:
  basketball: SHOOT / TURBO / PASS / FAKE overlap Jump, and Guns / Reload / Aim / Fire stay under the Turbo and Shot
  meters; QUIT sits on the minimap and the scoreboard on the Gnomlet buttons. Skateboard: FLIP / GRAB / OLLIE sit on
  Horn / Boost / Handbrake. Tea-tray sled: Hop sits on Exit, and Fire / Reload / Radio stay. Golf before addressing
  the ball: Guns / Aim / Fire. Desktop has the same idea in text: the skate hint says "Flip: F/click" while the
  generic bar says "Click: Fire".
- **Where:** `input.ts:226` `showButtons`; `court/hud.ts`, `skate/hud.ts:101` (pad at bottom 170 px),
  `winter/runtime.ts:156` (Hop column at bottom 150 px), `golf/hud.ts`. Shots `courtP2-8.png`, `skateP-5.png`,
  `sledP-5.png`, `golfP2-6.png`, `courtD2-14.png`, `skateD-5.png`.
- **Why:** mobile is a rule for every game. Overlapping 44 px targets means a tap on OLLIE can boost, and a tap on
  FAKE can open the telescope. This is the first thing a phone player sees in four activities.
- **Fix:** add an `activity` touch mode (e.g. `input.setActivity({ stick: true, buttons: [] })` / clear) that hides
  the cluster except the stick, and hide the keyboard hint bar with it. Call it from court, skate, winter rides,
  golf (whole round, not just the address), fishing, the hose and the lift. Move the court's QUIT out of the minimap
  column and the scoreboard below the Gnomlet row on narrow screens. Add one smoke check per activity at 390x844
  that asserts no two visible buttons' rects intersect.
- **Severity:** blocker. **Type:** craft.

### 2. The gnome holds the pistol through golf and stand-up, and golf has no club or swing
- **What:** the gun is hidden only for emotes and fishing (`app.ts:2255` `hideGun = emote.active ||
  fishing.active()`). On the tee the gnome stands with the pistol out (`golfD2-10.png`, `golfL-6.png`); on stage the
  comedian holds it between lines (`comC-35.png`). When the ball is addressed the gun hides, but there is no club in
  the hand and no swing: the ball just leaves. A `golf-club` hold prefab already exists
  (`packages/prefabs/src/catalog/gta-golf-gear.ts`). The weapon HUD ("12 / 12 Pistol") also stays up in golf, the
  court and the kitchen.
- **Where:** `app.ts:2251-2258`; `golf/runtime.ts putPlayer` (no held item, no anim); `workplaces/comedy/runtime.ts`.
- **Why:** the user asked to "actually play golf". A golfer with a pistol and no club reads as unfinished, and a gun
  on the comedy stage changes the joke.
- **Fix:** one `activityHidesGun()` predicate (golf round, comedy set, court game or shootaround, skate, chef,
  Gnomazon, lift, hose, farm work) feeding `hideGun` and hiding the weapon HUD. Golf: hold `golf-club` (or a putter
  look on the green) through `buildHeld` while the round is on, add a short backswing/follow-through clip on the
  swing tap (anim registry, like the batch-2 ride poses), and play it before the ball launches.
- **Severity:** blocker. **Type:** craft.

### 3. The bin and fire shift panel covers the toasts, the region banner and (on a phone) the money and minimap
- **What:** `#gta-shift-hud` is fixed at the top centre (`top: safe + 8px`, z-index 35), the same place as the HUD
  toasts. At the start of a round or a call the job's best lines land under it: Mags' "Mind the kerb. The kerb has
  feelings, and a lawyer.", Chief Pumpwell's "Keep the tank full and the dignity wet.", the caller's line. The
  "Mossy Wood" region banner draws over the same spot, and the vehicle label "Watering-Can Pumper" shows twice.
  At 390x844 the panel (min 220 px wide) covers the acorn panel on the left and the minimap on the right. The fire
  panel also says "Tank 100%" twice (a line and the meter label). The ski run's pill and its toasts stack the same
  way ("Fresh powder!" / time / "Missed gate" in one pile).
- **Where:** `workplaces/shiftHud.ts:34`; `firefighter/runtime.ts:673-692`; `garbage/runtime.ts:100`; shots
  `binD-4.png`, `fireD-4.png`, `binP-12.png`, `fireP-12.png`, `skiD-9.png`.
- **Why:** the caller and the boss are the jobs' charm and the call line is the brief; nobody can read it. On a phone
  the player loses the minimap while driving to a fire.
- **Fix:** give activity panels a HUD slot below the toast stack (or move toasts below the panel while one is up),
  and on narrow screens put the panel under the top button row, full width, two lines max. Drop the duplicate
  "Tank" line. Show the call's caller line inside the panel for its first 6 s instead of as a toast. Suppress the
  region banner while a shift starts.
- **Severity:** blocker. **Type:** craft.

### 4. Sage never speaks where the player can see it
- **What:** the chef job routes Sage's lines (start, rush, good ticket, walkout, end) through `hud.toast`. The kitchen
  is a full-screen opaque panel at z-index 38 and `#gta-hud` has no z-index, so every toast is behind the paper.
  Kippy works because the packing UI has its own speech line.
- **Where:** `workplaces/chef/runtime.ts:109` (`say: (t) => deps.hud.toast(...)`), `chef/kitchenUi.ts:13`.
- **Why:** Sage is the job's character, and the walkout and rush lines are feedback the player needs.
- **Fix:** add a speech strip under the kitchen header (like Kippy's `.kippy` row) and send `say` there.
- **Severity:** polish. **Type:** craft.

### 5. The kitchen, the packing station and the bin lift are 2D forms that hide the 3D place
- **What:** the chef shift and the Gnomazon shift are opaque full-screen panels; the 3D kitchen and the FC-1 floor
  with its vignettes (box tower, birthday at station 4, Kippy on the floor) are never seen while working. At desktop
  sizes half the panel is empty lined paper (`chefD-4.png`, `gnzD-12.png`). On a phone the bin lift's 2D diagram
  covers the middle of the screen, so the real arm and bin are hidden (`binLiftP-6.png`). After clocking out the FC-1
  floor is a big grey room (`gnzQ-7.png`).
- **Where:** `chef/kitchenUi.ts`, `gnomazon/packUi.ts`, `garbage/liftUi.ts`.
- **Why:** these are three.js places built with vignettes, and a GTA job should feel like being somewhere. The user's
  "hand crafted" bar is about the world.
- **Fix (decider):** keep the widgets but make the panels compact and translucent over a fixed camera on the
  workstation (chef: the pass and the hob; Gnomazon: the station with the conveyor and the shelf; lift: a lower-third
  strip with the 3D arm in view). Show the order slip and shelf as a bottom sheet on phones. Alternative: keep the
  forms and accept the trade for readability.
- **Severity:** polish. **Type:** spirit.

### 6. The comedy camera shows the stage and an empty floor, not the crowd
- **What:** the set is framed from behind a candle table: the gnome, the mic stand and 60% of the frame of dark
  floor. The ten seats, the hecklers and the tomato throwers are off camera; heckles appear only as text bubbles.
  The "TONIGHT: YOU" poster is cut by the top edge.
- **Where:** `workplaces/comedy/runtime.ts` (showroom target), `comedy/club.ts`; shots `comC-10.png`, `comC-35.png`,
  `comP-20.png`. E24 recorded "comedy crowd mostly off camera".
- **Why:** L110 is "sit there while your character ... gets grilled by the crowd". The crowd is the punchline.
- **Fix:** frame over the shoulders of the front row (two or three seated gnome backs in the lower third, heads
  turning, arms folding on a groan), cut to the heckler's seat for each heckle (1.5 s) and follow a tomato's arc
  once per set. Lift the camera so the poster is in frame.
- **Severity:** polish. **Type:** craft.

### 7. The new jobs pay about half of the old ones, and nothing pins it
- **What:** `economyCurve.test.ts` pins only taxi, courier, pilot and boat (about 30 acorns a minute at level 1, pilot
  about 52). Estimated level-1 rates for the workplace jobs from `workDefs.ts` and their shift lengths: chef 25-30
  a minute (normal shift), fire about 20, mechanic 15-20, Gnomazon about 16 (3 a parcel, quota bonus 15, 150 s),
  comedy about 12 (by design, "it pays (barely)"), bin crew about 11 (4 a bin, 6-8 bins plus the drive out from the
  depot and back). A spill fine (5) is more than a level-1 bin pays (4).
- **Where:** `jobs/workDefs.ts WORK_PAY`, `economyCurve.test.ts`.
- **Why:** the most crafted jobs are the worst money, so a player who needs acorns goes back to the taxi. The bin
  round is the most work for the least pay.
- **Fix:** add the six workplace jobs to the curve test with an assumed cycle each and a band of 18-40 a minute
  at level 1 (comedy exempt, with a comment). Raise bin pay to about 8 a bin (keep the fine at 5), Gnomazon to 5 a
  parcel, mechanic base to 55.
- **Severity:** polish. **Type:** craft.

### 8. A street-race wager pays far more than any job
- **What:** pickup races pay twice the stake to the winner (`session.ts pickupPayout`). At the top stake (250) a win
  nets +250 for a 1-2 minute race, five to eight times a job's rate, with no cap. Rivals rubber-band
  (`raceAi.ts:363`), so a good driver wins most of them. A 0 stake pays nothing at all.
- **Where:** `streetRace/session.ts:27`, `streetRace/types.ts WAGERS`.
- **Why:** it flattens the economy curve E08 set (big buys "take a few hours of job play").
- **Fix:** have the bookie take a cut (win pays 1.8x), raise rival pace with the stake (the 250 race brings the
  meet's best two), and pay a small purse (10-20) for a 0-stake win so free races are worth finishing. Or cap the
  big stake to one race per meet per in-game day ("Sable does not race the same mug twice before supper").
- **Severity:** polish. **Type:** craft.

### 9. The first chef shift can be a 12-ticket rush
- **What:** rush is Noon or Dusk, 30% of the 6-minute day, and the game starts at Noon. A rush is 12 tickets every
  7 s at 80% patience. A level-1 Dishwasher on their first shift gets five tickets on the rail within 30 s
  (`chefD-30.png`).
- **Where:** `chef/menu.ts:139-182` `makeTickets`, `isRush`; `chef/runtime.ts:102`.
- **Why:** the first shift teaches the widgets; a rush on it means walkouts and a bad first card.
- **Fix:** no rush until the player has served 8 tickets (or until level 2); on the first shift space tickets at
  18 s and say so ("Quiet one. Learn the pass.").
- **Severity:** polish. **Type:** craft.

### 10. Buying a replacement Dewdrop is pointless
- **What:** after the series the runtime respawns the ball at the bay for free whenever none is there and the player
  is more than 40 m away (wrecked or lost balls are dropped first). The workshop also sells one for 400.
- **Where:** `dewdrop/runtime.ts:113-133` and `addSpot`.
- **Why:** a player who pays 400 learns later that walking away does the same. It reads as a bug.
- **Fix:** pick one. Either a wrecked ball does not come back until bought (lore: Hogweed "does not do credit", and
  signs a form), or drop the buy spot and add a line when the free one appears ("Hogweed has blown you another.").
- **Severity:** polish. **Type:** craft.

### 11. The Pumper is handed over inside the station, with the camera in the walls
- **What:** the engine spawns in the bay facing out; the follow camera sits behind it inside the red house, so the
  first seconds of every shift are 70% red wall (`fireD-15.png`, `fireP-12.png`). The house has no back wall (E25
  note), so from some angles the camera sees through it.
- **Where:** `firefighter/station.ts` (`engine` spot), `firefighter/runtime.ts:272`.
- **Why:** the shift's opening shot is the worst-looking frame of the job.
- **Fix:** spawn the Pumper on the apron just outside the bay doors with the camera snapped behind it, and give the
  house its back wall (prefab or a box). Or a 2 s roll-out shot from the front.
- **Severity:** polish. **Type:** craft.

### 12. The lorry's arm and the bin do not line up in 3D
- **What:** with `?binround=lift` the bin stands on the far pavement while the lift arm swings on the near side of
  the lorry; after Grab the 3D bin stays on the kerb while the 2D diagram shows it on the claw (`binLift-9.png`).
  The lift opens for any bin within 5 m of the lorry centre, on either side or behind.
- **Where:** `garbage/runtime.ts` (stop check, `devStart` line 255), `garbage/bins.ts pose`, `GARBAGE.stopRadius`.
- **Why:** the 3D arm is the satisfying part of the job; if it grabs air, the diagram is the only feedback. This may
  partly be the dev hook's parking, so check it on a real stop.
- **Fix:** only offer "Lift bin" when the bin is on the arm's side (local x < 0) within 3.5 m and roughly level with
  the arm; otherwise toast "Pull up with the bin on the kerb side". Verify `pose` carries the bin from the grab on.
- **Severity:** polish. **Type:** craft.

### 13. Time trials show "POS 1/1" and no target
- **What:** a trial uses the race HUD pill `POS p/n LAP l/L time`. Alone, that reads POS 1/1. There is no best time
  and no gap to the ghost on screen while driving.
- **Where:** `quests/objectivesRace.ts:396-399`; `streetRace/session.ts` (trial). Shot `srD-10.png`.
- **Why:** a time trial is about beating a time; the HUD hides the time to beat.
- **Fix:** for `kind: 'trial'` show `BEST 1:02.3 · GHOST −0.8` (gap at the last gate, green/red) instead of POS.
- **Severity:** polish. **Type:** craft.

### 14. The skateboard HUD is keyboard-first and collides with the top HUD
- **What:** the line "Ollie: Space - Flip: F/click + direction - Grab: right click + direction - Off: E" shows on a
  phone; on desktop it runs into the minimap column and the weapon label. The "0 km/h best combo 0" pill sits on the
  acorn panel on a phone and shows zeros while standing. The generic driving hint bar (Boost, Horn, Fire) shows too.
- **Where:** `skate/hud.ts`; shots `skateD-5.png`, `skateP-5.png`.
- **Fix:** show the key hint only for keyboard input (inputSource), and as glyph chips like the court buttons
  ("SHOOT F / click"); put the speed/combo pill under the top row on narrow screens and hide it below 1 m/s.
- **Severity:** polish. **Type:** craft.

### 15. Golf's buttons crowd each other and the corner buttons
- **What:** ◀ Aim, Aim ▶, Club −, Club + touch each other with overlapping borders; SWING sits on the telescope
  button; Card and Quit sit on top of the minimap at 960x600 and in landscape (`golfAddr-9.png`, `golfL-6.png`).
- **Where:** `golf/hud.ts:110-131`, the row layout at line 133.
- **Fix:** an 8 px gap in the left row (or a 2x2 block on phones), hide the telescope button during a round (finding
  1), and put Card / Quit left of the minimap or under it.
- **Severity:** polish. **Type:** craft.

### 16. The hose has no keyboard hints on desktop
- **What:** manning the hose shows the touch stick and the water button even on desktop and no key glyphs; the keys
  are WASD/arrows to aim, Space to spray, L for the ladder. Holding Space in a headless run left the tank full, so
  it is worth checking that the key path sprays.
- **Where:** `firefighter/hoseUi.ts:157-174`; shot `fireHose-16.png`.
- **Fix:** glyph chips on the buttons for keyboard players (Space on the water button, L on Ladder) and a one-line
  hint the first time ("WASD aim · Space spray"). Verify Space sprays.
- **Severity:** polish. **Type:** craft.

### 17. Gnomazon's shelf icons are tiny and the emoji fallbacks are wrong
- **What:** the prefab icons render at about 16 px inside 64-110 px tiles (`gnzD-12.png`), so the shelf reads by
  label only. Where a prefab icon fails, the fallback emoji are wrong: Trowel 🪛 (screwdriver), Watering Can 🚿
  (shower), Doormat 🧺 (basket), Hose Reel 🧵 (thread). The phone shows keyboard hotkeys (1, 2, ..., -, =) on tiles.
- **Where:** `gnomazon/orders.ts:7-20 STOCK`, `gnomazon/packUi.ts:168,202,320`.
- **Fix:** size the icon to 40-48 px in the tile; drop the misleading fallbacks (show the name alone when the
  prefab icon fails rather than a wrong picture); hide hotkey labels for touch input.
- **Severity:** polish. **Type:** craft.

### 18. The shift card's copy does not match what happened
- **What:** quitting the kitchen at once gives "Clean pass. Get some rest." over "Nothing done, nothing paid."
  (`chefQ-5.png`). Gnomazon's quote is double-quoted: `"Kippy: "Shift complete.""`, and its title repeats itself:
  "Gnomazon Associate shift: Gnomazon FC-1" (`gnzQ-7.png`).
- **Where:** `chef/runtime.ts:59` (`pick(SAGE_LINES.end)`), `gnomazon/runtime.ts`, `workplaces/shift.ts:49`.
- **Fix:** a `quit` line set per job ("Apron's on the hook. Come back when you mean it."); pass Kippy's line without
  the wrapping quotes (the card adds them); title as "Shift at Gnomazon FC-1".
- **Severity:** nit. **Type:** craft.

### 19. Achievement toasts cover the workplace panels' buttons
- **What:** the achievement card draws over the Gnomazon header and its Clock out button (`gnzD-6.png`,
  `gnzP-6.png`), and over the minimap on the ice (`iceD-5.png`).
- **Where:** the achievements toast layer vs `packUi.ts` z-index 38.
- **Fix:** while a workplace panel is open, queue achievement toasts to the bottom-left or until the shift card.
- **Severity:** nit. **Type:** craft.

### 20. The comedy level curve runs four times faster than the mechanic's
- **What:** XP per minute at level 1, from `WORK_PAY.xpPerUnit` and the cycle lengths: comedy about 110 (70 a set
  of 40-60 s), chef about 55, Gnomazon about 40, fire about 40, bin about 30, mechanic about 25. Comedy reaches
  "Legend of Silence" in about 15 minutes; mechanic needs over an hour.
- **Where:** `jobs/workDefs.ts:WORK_PAY`.
- **Fix:** comedy xpPerUnit 35 (sets unlock by level, so it still moves), mechanic 90. Pin XP a minute in the same
  test as finding 7.
- **Severity:** nit. **Type:** craft.

### 21. Dev hooks for golf, the court, skate lines and comedy do nothing on their own
- **What:** `?golf=N`, `?court=...` and `?skate=<line>` refuse ("Too far from Hedgeworth", "Drainpipe Court is in
  Founders' Green", "The Gutter Bowls are in...") unless `&at=` puts the player there; the refusal toast is gone by
  the time the page settles. `?comedyset` waits for the player to be inside the club, so it needs
  `&interior=le-petit-groan`. `?chefshift` opens the kitchen wherever the player stands.
- **Where:** `app.ts:2913-2934`, `golf/runtime.ts:251`, `court/runtime.ts:102`, `comedy/runtime.ts:160`.
- **Why:** the epics' screenshot passes, the smoke checks and the next fix round depend on these hooks.
- **Fix:** each hook teleports to its place first (as `?gnomazonshift` and `?firecall` do), and its comment says so.
- **Severity:** nit. **Type:** craft.

### 22. Ski and sled runs are 15-20 seconds
- **What:** the Wool Run and the Tea-Tray Run are about 280 m of slope (E12 note). With a rope tow back up, the ride
  is shorter than the walk to it.
- **Where:** `winter/course.ts`, `winter/hill.ts`.
- **Why:** L42/L43 asked for a ski hill. A 15 s run is a sample; the activity does not have time to feel like
  skiing (rhythm through gates, a second half that is harder).
- **Fix (decider):** a third, longer run from the Snowcap Rise side (E33's routes reach it) of 45-60 s with a
  mid-run shortcut, or chain the two runs into one "Top to Cocoa" run with a split time.
- **Severity:** polish. **Type:** spirit.

### 23. The mechanic's client vanishes
- **What:** after "Hand back the keys" the client car is removed; the client never walks up or drives off (E24
  deferred).
- **Where:** `workplaces/mechanic/runtime.ts`, `glazeClient.ts`.
- **Why:** the payoff of a five-star glaze is the client seeing it. Today the car blinks out.
- **Fix:** the client gnome walks to the car, plays a reaction emote (cheer at 4-5 stars, facepalm at 1-2) with the
  brief's good/bad line in a bubble, and drives it off along the road for 10 s before despawn.
- **Severity:** polish. **Type:** craft.

### 24. None of the new activities can be shared online
- **What:** golf, the court, skate lines, the jobs, the farm and the winter runs are local; only the race modes
  relay. E19 kept 2v2 basketball local.
- **Where:** `court/`, `golf/` (E15 deferred online balls), E19 roadmap.
- **Why:** "Online by default, where it fits". 2v2 pickup is the best-fitting multiplayer thing the batch added.
- **Fix (decider):** one online activity this batch: two players replace the CPU on one side of the court (host
  runs GJAM's sim, relays positions and the ball), or a shared golf round where each player's ball relays and the
  card shows both. Record "local, why" for the rest in the PR.
- **Severity:** polish. **Type:** spirit.

### 25. The bin round starts in "Mossy Wood"
- **What:** the Bin Depot is "by the Compost Heap" in Turfton (job place text), but driving out of it fires the
  "Entering Mossy Wood" banner (`binD-4.png`), and the fire station on the Mossy Wood edge shows it too.
- **Where:** biome / district at (-218, -89) and (-221, 135); `jobs/workDefs.ts` place names.
- **Fix:** either give the depot and station their own named district ("the Compost Yards") or rename the place
  text to match the banner. G1 may own the district map.
- **Severity:** nit. **Type:** craft.

### 26. Sled and ski riders are vehicles with Fire, Reload, Boost and Horn
- **What:** the tea tray and skis show the full driving cluster: Exit, Horn, Boost, Handbrake, Radio, Reload, Fire
  (`sledP-5.png`), and the hint bar offers "Shift Boost". The winter Hop button is the only ride-specific control.
- **Where:** `input.ts showButtons` (drive mode), `winter/runtime.ts:156`.
- **Fix:** covered by finding 1's activity mode: stick + Hop + Exit only.
- **Severity:** polish. **Type:** craft.

### 27. The bin lift's diagram duplicates the 3D arm on desktop
- **What:** on desktop the lift panel sits bottom right with a 2D lorry, arm and bin while the real lorry is in view
  (`binLift-6.png`). Players watch the diagram because it is clearer.
- **Where:** `garbage/liftUi.ts`.
- **Fix:** once finding 12 is fixed, shrink the panel to the Grab/hold button with a swing indicator and let the 3D
  arm carry the action; keep the diagram only on phones in portrait where the lorry is small.
- **Severity:** nit. **Type:** spirit.

### 28. The chef rail and pass have no sense of a diner
- **What:** the kitchen is lined paper with ticket slips; no plates go out, no counter, no customers, no bell on
  screen. The 4-star "chef-bell" sound is the only sign of service.
- **Where:** `chef/kitchenUi.ts`.
- **Why:** L30 said "should be fun". The widgets are fine; the frame around them is a form.
- **Fix:** a pass strip at the bottom with the plated dish prefab icon sliding off on serve, the bell icon ringing,
  and a customer name popping a one-line reaction ("a trucker: 'That's clover alright.'"). Pairs with finding 5.
- **Severity:** polish. **Type:** spirit.

### 29. Gnomazon's shift has no conveyor, no clock pressure in the room
- **What:** the 150 s shift is a timer and a bar; Kippy's idle lines fire at 20 s. The world around the station
  (three associates, the birthday at station 4) is not shown and does not react to quota.
- **Where:** `gnomazon/packUi.ts`, `gnomazon/warehouse.ts`.
- **Fix:** with finding 5's camera, the next order's tote slides in on a conveyor, and the other associates cheer
  (or freeze) on quota met. One extra joke: Kippy's countdown in the last 10 s ("Ten. Nine. Kippy believes in
  eight.").
- **Severity:** nit. **Type:** spirit.

### 30. Comedy pays per set but the set length grows with level
- **What:** sets "get longer and worse" by level (7 beats at level 1, 9+ later) while pay rises 6 → 12 a set; the
  per-minute rate stays near flat and hazard pay (2 a tomato) is the only thing that moves.
- **Where:** `workplaces/comedy/material.ts`, `WORK_PAY.comedy`.
- **Why:** it is meant to pay "barely", which is fine; but levelling up should feel like something. Today the
  reward is new material only.
- **Fix:** keep the pay joke; make the level-up visible: a bigger name on the "TONIGHT:" poster per level, and at
  Cult Disappointment a small crowd that comes to boo on purpose (more tomatoes, more hazard pay).
- **Severity:** nit. **Type:** spirit.

### 31. Party slices: three activities are natural fits and none is in the backlog
- **What:** the party README lists only `gta-getaway` and `boat-regatta` for this game. The chef rush (four cooks,
  one rail), the Gnomazon pack race (most parcels in 45 s) and Gnomey Bird (four flappers, one seed) are 20-60 s,
  one-verb rounds built from pure modules (`chef/menu.ts`, `stepWidgets.ts`, `gnomazon/orders.ts`,
  `gnomlet/apps/gnomeyBirdSim.ts`). E25 put Gnomazon "in backlog" in its log, not in the README.
- **Where:** `packages/party/README.md`.
- **Fix:** add backlog rows (status "later") for the three with the one-line reason; do not build them in R1.
- **Severity:** nit. **Type:** craft.

### 32. Old and new jobs end differently
- **What:** workplace jobs and mole jobs end on the shared shift card (stars, lines, pay, level bar). Taxi, courier,
  pilot and boat gigs end on toasts and the job HUD only.
- **Where:** `jobs/runtime.ts` vs `workplaces/shift.ts`, `workplaces/shiftCard.ts`.
- **Why:** consistency across the Jobs app: the player levels all ten jobs on one board.
- **Fix:** show a compact shift card when the player goes off duty in an old job (the session's gigs, pay, tips,
  level bar), reusing `showShiftCard`. Per-gig feedback stays as it is.
- **Severity:** polish. **Type:** craft.

### 33. The court's phone scoreboard and controls also hide the play
- **What:** at 390x844 the scoreboard sits over the Gnomlet row and the top of the court, and the button column on
  the right covers the far basket's lane (`courtP2-8.png`). The camera is high and wide, so the gnomes are about
  20 px tall.
- **Where:** `court/hud.ts`, `court/view.ts`.
- **Fix:** in portrait, put the score in a slim bar under the top row, buttons in a bottom-right arc (after finding
  1 removes the cluster), and pull the camera in 20% toward the ball carrier.
- **Severity:** polish. **Type:** craft.

### 34. Some activity HUD text reads as debug
- **What:** "0 km/h best combo 0" (skate), "Round 0%" with an empty bar (bin round, before the first bin),
  "Tank 100%" twice (fire), "3 fires left" then "4 fires left" with no word on why (spread).
- **Where:** `skate/hud.ts`, `garbage/runtime.ts`, `firefighter/runtime.ts`, `firefighter/hoseUi.ts`.
- **Fix:** hide zero states; when a fire spreads say so once ("It has reached the awning!").
- **Severity:** nit. **Type:** craft.
