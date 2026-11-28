# G7 Vehicles and driving: editorial review, round 1

Editor: G7. Branch `gta-batch-3` at `0db911aa`. Evidence in `shots/G7/` (screenshots, plus three data dumps:
`collision-radius-vs-body.txt` = every vehicle's collision radius against its built prefab's half-width and half-length;
`handling-sim-*.txt` = a headless chassis sim of every ground vehicle in every driving mode: 0-90 % time, 3 s at full
lock and full throttle, braking distance; keyboard input, flat ground, stock setup).

How it was checked: read the E02/E08/E27/E29/E31 briefs and roadmaps and the code (`collide.ts`, `simdrive.ts`,
`handling.ts`, `npcChassis.ts`, `traffic.ts`, `vehicles.ts`, `debris.ts`, `camera.ts`, `glaze*`, `dealers/`, `lockup/`,
`ownership.ts`, `skim.ts`, `police.ts`); ran 96 vehicle/traffic/economy test files (885 pass, 2 time out under load, see
#20); drove 19 vehicles in the dev server (desktop 960x600 and 390x844) with `?mount=`; watched live traffic for 30 s at a
traffic warden and at all four roundabouts; opened Pay 'n' Glaze, Burl's Forecourt and the Lock-Up on a phone viewport.

## Verdict

Driving is in good shape where it counts. Casual is consistent across the fleet: every ground vehicle reaches 90 % of top
speed in 2.3-3.6 s, holds 9-19 m/s² at full lock without spinning, and stops in proportion to its speed. NPC cars on the
Casual chassis follow lanes and roundabouts sensibly (no car wedged more than ~9 s at any spot I watched, and those were
waiting on a warden). Landings no longer bounce, the gnome stays in the seat, the new vehicles all have engines, seats,
traffic and achievements.

The growing pains are at the edges the batch added in a hurry: (1) the user's own L01 complaint is only half fixed,
because every vehicle still collides as one circle as wide as it is long; (2) the drive camera ignores vehicle size, so
the Combine and the Boot Float hide the road; (3) Pay 'n' Glaze sells parts to 14+ newer vehicles that cannot show them;
(4) the newest vehicles skipped parts of the registration checklist (handling profile, horn/chime, dealer stock), while
the oldest, most-driven ones never got L53's breakable parts. Fix those and the garage feels hand-made end to end.

Counts: 3 blockers, 12 polish, 11 nits (26 findings); 20 craft, 6 spirit.

## Findings

### 1. Every vehicle still collides as one circle as wide as it is long (L01 not really fixed)
- **What:** E02 made round *scenery* colliders, but vehicles still collide as one circle of `spec.radius`, and that
  radius is about half the vehicle's **length**. Measured against the built prefabs: side padding beyond the visible body
  is ~0.9 m on the HOA van (r 2.1 vs half-width 1.19), ~1.0 m on the Bin Lorry and Fire Engine, 0.9 m on the Snail-Shell
  Camper, 1.3 m on the Taxi, 0.5 m on the dirt bike and Wespa (r 0.8-0.9 vs half-width 0.38), and 1.3 m on the Clog
  Cruiser hull (boats use 0.85 of it). A dirt bike cannot pass between two bollards 1.6 m apart; a van stops almost a
  metre short of a wall it is driving along; two vans meeting in opposite lanes nearly touch circles.
- **Where:** `collide.ts` `sweepCircleBoxes` / `pushOutOfBoxes` as called from `vehicles.ts` ~543, ~847, `simdrive.ts`
  `stepChassis`, `boats.ts` (`BOAT_HIT_RADIUS_FRAC`), and `collideVehicles` (~757, `rr = a.radius + b.radius`). Data:
  `shots/G7/collision-radius-vs-body.txt`.
- **Why it matters:** this is the user's own L01 ("I cannot get my vehicle close to them without getting stuck", "fix
  collision again"). Round scenery helped the round props; long thin vehicles still bump air.
- **Proposed fix:** collide vehicles as a short capsule (two or three circles along the heading, radius = body
  half-width + a few cm, from the prefab's measured bounds or a new `spec.halfWidth`) against boxes and against each
  other. Keep `spec.radius` for culling, camera and spawn spacing. Add a `collide.test.ts` case: a dirt bike threads a
  1.2 m gap, a van slides along a wall within 0.15 m of its body.
- **Severity:** blocker. **Type:** craft.

### 2. The drive camera ignores vehicle size: the Combine and Boot Float hide the road
- **What:** `VIEW.drive` is a fixed 8.5 m back, 1.8 m look height for every vehicle. The Boot Float (7 m tall) and the
  Combine (5 m) fill the frame from behind; on a phone in portrait the Combine covers the whole screen and the road ahead
  is invisible. At the other end, the Baguette Trike, Wespa, push-bike and skateboard sit small in the middle distance.
- **Where:** `camera.ts` `VIEW` (line ~34), `app.ts` ~2594 `chase.update(...)` passes no size. Shots:
  `boot-float-960-rest.png`, `combine-960-drive.png`, `combine-390-rest.png`, `baguette-trike-960-drive.png`.
- **Why it matters:** the Combine is sold for 3,500 Acorns (the dearest car) and the Boot Float is a story ride; both are
  near-undrivable from the chase view. Size-blind framing is the most visible "not hand-made" tell in driving.
- **Proposed fix:** scale drive `dist` and `lookHeight` from the vehicle's height and length (e.g. `dist = 5.5 + 1.6 *
  radius`, `lookHeight = max(1.8, 0.9 * bodyHeight)`; pitch up a little for tall bodies), eased when switching vehicles;
  same for `fly` and boats. Check portrait at 390x844 for the Combine, Boot Float, Snail-Coach and Bin Lorry.
- **Severity:** blocker. **Type:** craft.

### 3. Pay 'n' Glaze sells parts to vehicles that cannot show them, and forgets them on reload
- **What:** only 8 prefabs have a glaze rig (`GLAZE_KINDS`: push-bike, ride-on, zero-turn, combine, lowrider,
  boot-float, snail-coach, mulch-spreader, hoa-van). Drive any other ground vehicle into Pay 'n' Glaze (Petit Pois,
  Deux-Pots, Wespa, Baguette Trike, Crepe Van, dirt bike, golf cart, Pot Rod, the E31 rides, bin lorry, fire engine...)
  and the shop still shows Wheels / Lights / Body / Trim. Applying a spoiler, lamps, canopy, ornament and 1.4x wheels to
  a Petit Pois changes nothing on the car (`v.rig` stays undefined; shot `look2-euro-hatch.png` vs `look-ride-on.png`).
  On top, `glazeStore.ts` `load()` drops saved loadouts for kinds outside `GLAZE_KINDS`/`CRAFT_GLAZE_KINDS`, so even a
  paint bought for a stolen Petit Pois is gone after a reload.
- **Where:** `glazeStore.ts` (`GLAZE_KINDS`, `load` line ~64), `glazeMounts.ts` (8 `defineMounts`), `vehicles.ts`
  `createVehicle` (rig only with a look), `glazeShop.ts` `open` (`glazePanelsFor(kind)` has no rig check), `app.ts`
  `?glaze` (`m.rig` guard).
- **Why it matters:** the player pays Acorns for invisible parts. E29 deferred the mounts; the shop was never told.
- **Proposed fix:** short term, for a kind without mounts show only Paint, Repair and Handling (and save paint for every
  ground kind). Then give the 15 newer ground prefabs `defineMounts` entries (E29/E31/E14/E25 prefabs, odd rides,
  golf cart) and add them to `GLAZE_KINDS`, one issue per family. A test: every kind in the dealer stock either has mounts
  or gets the reduced tab list.
- **Severity:** blocker. **Type:** craft.

### 4. The oldest, most-driven vehicles lose no parts (L53 only reached the new ones)
- **What:** knock-off parts come from part names matching `LOOSE_NAME`. Counting them per prefab: push-bike 0,
  zero-turn 0, combine 0, mulch-spreader 0, boot-float 0, lawn-roller 0, teacup 0, barrow-buggy 0, Dewdrop 0, ride-on 2
  (hood, grille), Pot Rod 1. The new rides have 2-12 (Baguette Trike 12, Fire Engine 6, Wespa 5, Bin Lorry 5). Glaze
  fittings come off too, but a stock zero-turn (the racer) only ever loses what its damage stages hide.
- **Where:** `debris.ts` `LOOSE_NAME` / `looseParts`; prefabs in `packages/prefabs/src/catalog/gta-fleet.ts`,
  `gta-odd-rides.ts`, `damage-stages.ts`.
- **Why it matters:** L53 "the more parts we lose the better" is felt most in the vehicles players drive most. Today the
  crash fun depends on which car you stole.
- **Proposed fix:** name 3-5 existing parts per legacy prefab so they match (`grass-bag`/`catcher` on the push-bike,
  `exhaust`, `bumper`, a `lamp` pair and the seat-back `flag` on the zero-turn, the combine's `reel` guard and ladder,
  the barrow's `handle`... careful with `NEVER_LOOSE`), splitting a part out of a merged mesh where needed. Pin a minimum
  (>= 3 loose parts per drivable ground prefab) in `debris.test.ts`.
- **Severity:** polish. **Type:** craft.

### 5. Police chases still drive the old arcade model (L93 half done)
- **What:** NPC traffic, rivals and the follow-quest leader use the Casual chassis, but `assignNpcChassis` only takes
  `driver === 'npc'`, and `police.ts` steps pursuit vans with `stepVehicle` (arcade: instant yaw, `steer = -diff * 2.2`
  straight at the player, a hard 21 m/s cap). World-event haulers, escorts and the runaway combine (`worldEvents.ts`
  ~308-386), `events/kit.ts`, `quests/objectivesAction.ts` ~163 are arcade too.
- **Where:** `npcChassis.ts` `assignNpcChassis`, `police.ts` ~655.
- **Why it matters:** the chase is where NPC driving is most watched; the user said NPCs "turn like it's arcade mode
  still". Next to Casual traffic the arcade vans now look worse by contrast.
- **Proposed fix:** route pursuits and scripted drivers through `stepNpcCar` (take `'police'` in `assignNpcChassis`,
  raise `maxCars` to ~10 with pursuits first), steer pursuits to a point on the road graph ahead of the player when one
  is near, and replace the 21 m/s clamp with the throttle. Keep arcade only for far, off-screen cars.
- **Severity:** polish. **Type:** craft.

### 6. Simcade takes three times as long to get going, and keyboard full lock spins the bikes round
- **What:** headless sim, stock setups, keyboard input. 0-90 % of top speed: Casual 2.3-3.6 s, Open World 4-5.5 s,
  Simcade 5.3-9.9 s (zero-turn 9.9, dirt bike 9.7, Wespa 9.4, push-bike 7.2). Holding full lock at top speed for 3 s:
  in Simcade the push-bike, zero-turn, Wespa, dirt bike and Pot Rod end up travelling backwards (spun); in Open World the
  push-bike (sideslip 1.4 rad) and the Snail-Coach (1.0 rad) spin. Drift spins everything, as it should.
- **Where:** `handling.ts` `TUNES` (`hybrid`, `simcade`), `PROFILES` (`balance` < 0 on push-bike, dirt-bike, wespa,
  snail-coach, zero-turn, pot-rod), `@lawn/vehicle` presets. Data: `shots/G7/handling-sim-*.txt`.
- **Why it matters:** keyboard steering is binary, so "held A at speed" is the normal case. A bus that spins in Open
  World and a racer that needs ten seconds to get going in Simcade read as bugs, not as realism.
- **Proposed fix:** in `simcade`, raise drive force (or the traction-control floor) so 0-90 % lands at ~4-5 s; for the
  keyboard source, ramp steer more slowly above 60 % of top speed in Open World and Simcade; move the Snail-Coach's
  `balance` to >= 0 (a bus should not be "tail-happy"). Pin "no stock vehicle spins at keyboard full lock in Casual and
  Open World" in `handling.test.ts`.
- **Severity:** polish. **Type:** craft.

### 7. Two-wheelers and soft cars never lean, so their profile notes do not show
- **What:** at full lock the chassis tilts 0-1 degrees in Casual and Open World for every vehicle (max 4 degrees in
  Simcade). The Deux-Pots ("soft, leans hugely, never quite rolls"), the Wespa, the dirt bike and the Baguette Trike
  ("tippy") corner flat as a tray; only the rider's `lean` sells it.
- **Where:** `handling.ts` PROFILES (stiffness / comHeight), `suspension.ts` (visual roll), `vehicles.ts`
  `syncVehicleMesh`.
- **Why it matters:** the Deux-Pots' whole joke is the lean. Bikes that do not bank into corners look stiff.
- **Proposed fix:** a visual body roll per kind (a `roll` gain in `PROFILES`, fed into the existing suspension roll from
  lateral acceleration): about 8-10 degrees for the Deux-Pots, bank-into-the-turn for two-wheelers (negative sign,
  10-15 degrees), small for vans. Visual only, no physics change.
- **Severity:** polish. **Type:** spirit.

### 8. Cone Van, golf cart and Taxi have no handling profile
- **What:** `PROFILES` has entries for every new ride except the Cone Van; the golf cart and the Taxi have none either,
  so all three drive on the neutral reference mower. The Cone Van is a 2.5 m tall ice-cream van with a cone on the roof
  that drives exactly like a ride-on mower; its twin, the Crepe Van, is "tall and wallowy".
- **Where:** `handling.ts` `PROFILES`.
- **Why it matters:** checklist gap (E31 V1 named handling.ts); one van drives unlike its twin.
- **Proposed fix:** copy the Crepe Van row for the Cone Van (a touch higher comHeight for the cone), give the golf cart
  a light, grippy, low-top-speed row. Add a test: every kind sold by a dealer or in a traffic mix has a profile.
- **Severity:** polish. **Type:** craft.

### 9. The Cone Van has a chime speaker and no chime; three E31 rides use the default horn
- **What:** the Cone Van prefab has a `speaker` part ("a chime speaker", E31 V1), but `audio.ts` `playHorn` has no case
  for `cone-van`, `ranger-buggy` or `shell-camper`, and there is no ice-cream chime anywhere in `sound/`.
- **Where:** `audio.ts` `playHorn` (`default:`), `living/sound.ts`.
- **Why it matters:** an ice-cream van that does not play a tune is the single cheapest bit of charm left on the table;
  a ranger buggy and a snail camper honking like a mower is a small "unfinished" tell.
- **Proposed fix:** a synthesized 4-6 note chime as the Cone Van's horn, and (spirit) the van plays it softly now and
  then while cruising Saltbucket Shore. A two-tone parp for the buggy, a slow low hoot for the camper. Optional: a
  "Greensleeves-but-wrong" lore line for the chime.
- **Severity:** polish. **Type:** spirit.

### 10. The E31 rides are not for sale; dealer list out of order and without stats
- **What:** Burl's Forecourt sells the five European rides and the dirt bike, but not the Ranger Buggy, Snail-Shell
  Camper or Cone Van, even though they are in traffic and parked. The list is ordered by price except the dirt bike
  (650) after the Combine (3500). Cards show name, price and a joke, no top speed or handling hint, so the player cannot
  compare; variants show the base model's icon (Bumblebuzz is yellow and black, its card icon is the red push-bike).
- **Where:** `dealers/config.ts` `DEALERS.forecourt.stock`, `dealers/ui.ts`. Shot: `dealer-390.png`.
- **Why it matters:** L29 is "a shop where I can buy new cars"; the newest cars are missing and choosing is guesswork.
- **Proposed fix:** add the three (Camper ~1600, Cone Van ~1900, Ranger Buggy ~1300, or make the buggy a story/ranger
  reward and say so on a locked card); sort by price; add two small bars per card (speed, grip or "size"); tint variant
  icons with the variant colour.
- **Severity:** polish. **Type:** craft.

### 11. The Petit Pois's driver pokes through the roof
- **What:** the seated gnome's hat (and the top of the head) stick out through the Petit Pois's roof and pea pod,
  visible at rest and on the Pay 'n' Glaze stage. Seat y 0.4 m vs roof at 1.08 m; a seated gnome with hat is ~1.3 m.
- **Where:** `config.ts` `VEHICLES['euro-hatch'].seat`, prefab `gta-euro-hatch` (`gta-euro-fleet.ts`, `cabin`, `roof`).
  Shots: `euro-hatch-960-rest.png`, `look2-euro-hatch.png`.
- **Why it matters:** the first European car most players drive clips on frame one.
- **Proposed fix (spirit):** keep the joke and own it: a sunroof hole sized to the hat (the hat sticks out on purpose,
  like the Deux-Pots' roll-top), or lower the seat and squash the cabin. Check the other closed cabs (Crepe Van, Cone Van,
  Shell Camper, HOA van, Taxi) with the tallest hat in the creator.
- **Severity:** polish. **Type:** spirit.

### 12. Closed cabs have no steering wheel; the Petit Pois was meant to have one
- **What:** `euro-hatch`, `crepe-van`, `bin-lorry` and `fire-engine` are in `driveGrips.test.ts` `NO_CONTROL`: no
  steering wheel, the gnome's hands rest on nothing. The Petit Pois cabin is glass, so it shows. E29's brief promised
  "Petit Pois has doors and a steering wheel".
- **Where:** `driveGrips.ts` `DRIVE_CONTROLS`, prefabs in `gta-euro-fleet.ts`, `gta-jobs*`.
- **Why it matters:** the hands-on-grips work (E02/L18) is one of the nicest details in the game; four new vehicles skip
  it.
- **Proposed fix:** add a small `steer` pivot wheel to the four prefabs and grip entries; remove them from `NO_CONTROL`.
- **Severity:** polish. **Type:** craft.

### 13. Quick Respray undercuts the new Repair tab
- **What:** Quick Respray (90 Acorns) fully repairs, repaints and clears heat. The Repair tab charges
  `10 + 120 x missing hp x tier + 15 x damage level`: a wrecked Combine costs ~325, a wrecked Snail-Coach ~270, a
  wrecked Petit Pois ~235, all more than the respray that also hides you from the Hat Watch.
- **Where:** `garages.ts` `RESPRAY_COST`/`quickRespray`, `glazePanelRepair.ts` `REPAIR`, `repairQuote`.
- **Why it matters:** L90's repair option is a worse deal than a button next to it; the only reason to use it is to
  keep your paint, and the UI does not say so.
- **Proposed fix:** either Quick Respray no longer repairs (it is a respray: paint + heat), or it repairs and costs
  `max(90, repairQuote + 40)`. Label the Repair button "Repair, keep the paint". Re-pin in `economyCurve.test.ts`.
- **Severity:** polish. **Type:** craft.

### 14. Arcade and sim airtime use different gravity
- **What:** arcade airborne gravity is 30 m/s² (`ARCADE_AIR.gravity`); the sim chassis gets 9.81 + 9 = 18.8 m/s²
  (`SIM_AIR.airGravity`). The same ramp gives visibly different hang times in the two models; arcade also lands with a
  hard `vy = 0` snap (no landing squash).
- **Where:** `vehicles.ts` `ARCADE_AIR`, `simdrive.ts` `SIM_AIR`, `stunts.ts` `RAMP_LAUNCH`.
- **Why it matters:** small, but stunt jumps are designed against one feel; arcade is still a supported mode.
- **Proposed fix:** set arcade gravity to ~20 and retune `RAMP_LAUNCH.arcadeBoost` so `ramps.test.ts` jump lengths hold;
  feed the landing `vy` into the suspension heave for a squash on touchdown.
- **Severity:** nit. **Type:** craft.

### 15. Bump damage and vehicle-vehicle contact also use the length circle
- **What:** `collideVehicles` uses `a.radius + b.radius`; two Snail-Coaches in opposite lanes (`LANE_OFFSET` 2.5, so
  centres 5 m apart) are exactly in contact; a Combine meeting the bus overlaps by 0.7 m and shoves sideways. Part of #1,
  listed so the fix covers vehicle-vehicle as well as vehicle-wall.
- **Where:** `vehicles.ts` `collideVehicles` ~757.
- **Severity:** polish (folds into #1). **Type:** craft.

### 16. Lock-Up holds five ground vehicles, the Forecourt sells 23
- **What:** L25 asked to "allow storage of multiple cars of the same type". It works (uid-keyed), but
  `LOCKUP.capacity.ground` is 5 with no way to grow it, while air and water have buyable estates.
- **Where:** `lockup/config.ts` `capacity`, `ESTATES`.
- **Why it matters:** collecting is a natural loop the batch just opened (23 cars, achievements for three of one type);
  five slots ends it quickly.
- **Proposed fix (spirit):** a buyable second ground garage (e.g. a Pardonlin mews lock-up, 6 slots, ~1500) or a
  lock-up extension at Side-Valve. Decider call on size.
- **Severity:** nit. **Type:** spirit.

### 17. Pot Rod: "hot engine", 13 m/s, 1,800 Acorns
- **What:** the Pot Rod is sold as "A flowerpot with a hot engine and no regrets" for 1,800 (more than the Zero-Turn at
  900), and tops out at 13 m/s, slower than the 150-Acorn push-bike (20). Odd rides are slow by design, but this one's
  name and blurb promise speed.
- **Where:** `config.ts` `VEHICLES['pot-rod']`, `dealers/config.ts`.
- **Why it matters:** a hot rod that loses to a push-mower is either a joke the card should make, or a tuning outlier.
- **Proposed fix (spirit):** either make it quick off the line and twitchy (max ~22, accel ~14, keep the tail-happy
  profile), or keep it slow and rewrite the blurb ("All flame decals, no engine") and price it ~600.
- **Severity:** nit. **Type:** spirit.

### 18. Only the Zero-Turn can earn Skipping Stone
- **What:** with `SKIM` (drag 0.6/s, 6 % lost per hop, drop at 7 m/s) the longest skim from top speed is about: zero-turn
  42 m, ride-on 28 m, Petit Pois 26 m, push-bike 20 m. The achievement asks for 40 m, so only a Zero-Turn at full speed
  (or with boost) can get it, and nothing tells the player.
- **Where:** `skim.ts` `SKIM`, `packages/achievements/src/catalog.ts` `gta-skipping-stone`.
- **Proposed fix:** either drop the bar to 30 m (reachable by any quick car off a ramp) or say "a fast mower" in the
  achievement text. Do not change skim feel.
- **Severity:** nit. **Type:** craft.

### 19. Stale comments: "Garage (no UI yet)"
- **What:** `simdrive.ts` ("Garage: each vehicle's setup... No UI yet") and `app.ts` `__gta.garage` ("Garage (no UI
  yet)") while `garages.ts` has the Handling modal and Pay 'n' Glaze has a Handling tab.
- **Severity:** nit. **Type:** craft.

### 20. Two whole-world vehicle tests time out under the full suite
- **What:** `canalCruise.test.ts` (the Clog Cruiser canal run) and `sandpitJump.test.ts` hit the 30 s timeout when run
  with the other 94 vehicle/traffic files; both pass alone. E27's goal was a suite that gives the same answer every run.
- **Where:** those two files (`buildWorld` per test).
- **Proposed fix:** explicit timeouts (120 s) like the traffic preset test got, or move them to `*.slow.test.ts` and the
  `mp-audit` config.
- **Severity:** polish. **Type:** craft.

### 21. Two Repair-ish tabs with the same icon
- **What:** Pay 'n' Glaze tabs "🔧 Repair" and "🔧 Handling" share the spanner. Handling could be a gauge or a dial.
- **Where:** `glazePanelRepair.ts`, the handling panel registration in `garages.ts`/`glazePanels.ts`.
- **Severity:** nit. **Type:** craft.

### 22. The vehicle name pill sits on top of small vehicles
- **What:** the bottom-centre name + health pill ("Wespa", "Petit Pois") overlaps the vehicle itself on screen for
  every small vehicle at the default drive distance, desktop and phone.
- **Where:** `hud.ts` vehicle name/health pill. Shots: `euro-hatch-960-rest.png`, `euro-hatch-390-drive.png`.
- **Proposed fix:** move it below the vehicle (lower third), or fade it after 3 s of driving. Pairs with #2.
- **Severity:** nit. **Type:** craft.

### 23. "NEAR MISS!" collides with the top button row on a phone
- **What:** at 390x844 the near-miss banner and its "+15 Acorns" draw over the Gnomlet/taxi/quest buttons.
- **Where:** stunt/near-miss banner in `hud.ts` / `stunts.ts`. Shot: `euro-hatch-390-drive.png`. (Hand to G9 if they
  own the HUD layout.)
- **Severity:** nit. **Type:** craft.

### 24. Roundabout tarmac is a faceted polygon with no kerb
- **What:** the Anthill ring (and the Pardonlin rings) read as an angular asphalt plate on grass: straight facets
  around the outside, no kerb or verge, the spokes join with hard corners.
- **Where:** `roundabouts.ts` / `roundaboutIslands.ts`, highway ring mesh. Shot: `traffic-anthill.png`. (G2 may also
  report the Pardonlin ones.)
- **Proposed fix:** more ring segments, a kerb ring on the outer edge, rounded spoke mouths.
- **Severity:** nit. **Type:** craft.

### 25. Lock-Up map label is the odd one out
- **What:** map legend: "Hangar Two (your aircraft)", "Mossbank Boathouse (your boats)", but "Side-Valve Lock-Up" (no
  "(your vehicles)"); L25 asked for the storage spot to be marked clearly.
- **Where:** `mapIcons.ts` `lockup` name.
- **Severity:** nit. **Type:** craft.

### 26. Region traffic mixes: the Pardonlin feel is good; the coast could carry it further
- **What:** watching traffic, Pardonlin (Hatwheel) is ~90 % European rides at a gentle 8-13 m/s with wardens holding
  junctions: it feels like a different country, exactly right. The coast mix spawns Cone Vans and Wespas, but a Cone
  Van cruising at 10 m/s never stops; the Unmown and Snowcap mixes have no "doing something" behaviour either.
- **Where:** `living/trafficMix.ts`, `traffic.ts` errands (`TOWN_ONLY`, `PLACES`).
- **Proposed fix (spirit):** give the Cone Van an errand that parks it by the boardwalk/beach with its hatch open and
  the chime (see #9) for a few seconds; rangers stop at the preserve gate. Keep it to one behaviour each.
- **Severity:** nit. **Type:** spirit.

## Things checked and fine (no action)

- L18 seated gnome: riders stay seated at speed (reseat after the late mesh sync); no clipping seen in 19 vehicles.
- L55 landing: sim jumps settle without the old bounce (`airtime.test.ts` passes).
- L14 plane reverse: 6 % of top speed on the floor only; sensible.
- L113 bushes: rose bushes, allotment beds and Pebblewick shrubs mow; hedges and topiary stay solid as documented.
- L91 civilian mods: seeded by ghost id, cosmetic only.
- Traffic: no wedged cars beyond ~9 s at any of five watched spots (those were waiting on a Pardonlin warden);
  roundabouts give way and circulate; the Skyway decks keep NPC cars on their rails.
- Insurance: 10 % fee, 25 % deductible, one reclaim per 10 min; no arbitrage found (scrap value is a flat 60).
