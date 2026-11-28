# FX04 Vehicle capsule collision, drive camera, handling feel and stunt ramps
Wave: 2 · Depends on: FX02 · Kind: Fix (shared, GR8)
Findings: 11 (G1#16, G5#20, G7#1, G7#2, G7#6, G7#7, G7#8, G7#14, G7#15, G7#19, G7#20) · Decisions: D21, D31, D36

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

L01 for real: vehicles collide as their shape (D36), the camera frames big vehicles, the soft cars and two-wheelers lean (D31), and every stunt ramp wears its place with one readable cue (D21).

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- collide.ts, vehicles.ts (collision paths ~543, ~757 `collideVehicles`, ~847, `syncVehicleMesh` roll), simdrive.ts, boats.ts (hit radius only), config.ts `VEHICLES[*].halfWidth`
- camera.ts drive `VIEW`, and the `chase.update(...)` call in app.ts (~2594, one argument)
- handling.ts (`TUNES`, `PROFILES`), suspension.ts
- ramps.ts, stunts.ts (ramp skins, airtime)
- the two slow whole-world vehicle test files (G7#20)

### Findings (11)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G1#16** (polish, craft · **should**, D21) The park-fountain stunt ramp is an undressed black wedge with neon-cyan edges in Gnorwin Clayfoot Park
  - What: the stunt `park-fountain` (-42, 36) draws a black slab with a bright cyan outline across the civic lawn. zfight also reports a coplanar pink strip next to it (`#d94e7a` at (-42, 0.03, 46.9) against the cab-rank booth).
  - Where: `stunts.ts:27`, the ramp mesh in `ramps.ts`. Shots `gnorwin.png`, `w03-green.png`, `bowls-in.png`.
  - Editor's fix: skin stunt ramps by biome: in parks, a timber-and-turf ramp (wood boards, grass top, a "NO RAMPING (PLEASE)" council sign). Keep the cyan only as a faint HUD-ring when the stunt is active. Fix the pink strip's draw layer.
  - Decision: D21 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `gnorwin.png`, `w03-green.png`, `bowls-in.png`
- **G5#20** (polish, spirit · **should**, D21) Dean's Leap looks like a generic stunt ramp.
  - What: the ramp is the standard black wedge with cyan neon edges and yellow stripes (`leap-2`, `x-mound-n.png`). The jump itself works (39 m, achievement fires).
  - Editor's fix: keep the stunt-ramp colour coding if it is a game-wide readability rule. Otherwise build it from old planks and packed earth, with a faded painted wheelchair symbol and a brass plate ("DONATED BY THE CLASS OF ——").
  - Decision: D21 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G5/`: `x-mound-n.png`
- **G7#1** (blocker, craft · **must**, D36) Every vehicle still collides as one circle as wide as it is long (L01 not really fixed)
  - What: E02 made round *scenery* colliders, but vehicles still collide as one circle of `spec.radius`, and that radius is about half the vehicle's **length**. Measured against the built prefabs: side padding beyond the visible body is ~0.9 m on the HOA van (r 2.1 vs …
  - Where: `collide.ts` `sweepCircleBoxes` / `pushOutOfBoxes` as called from `vehicles.ts` ~543, ~847, `simdrive.ts` `stepChassis`, `boats.ts` (`BOAT_HIT_RADIUS_FRAC`), and `collideVehicles` (~757, `rr = a.radius + b.radius`). Data …
  - Editor's fix: collide vehicles as a short capsule (two or three circles along the heading, radius = body half-width + a few cm, from the prefab's measured bounds or a new `spec.halfWidth`) against boxes and against each other. Keep `spec.radius` for culling, camera and spawn spacing. Add a `collide.test.ts` case: a dirt bike threads a 1.2 m gap, a van slides along a wall within 0.15 m of its body.
  - Decision: D36 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G7/`: `collision-radius-vs-body`
- **G7#2** (blocker, craft · **must**) The drive camera ignores vehicle size: the Combine and Boot Float hide the road
  - What: `VIEW.drive` is a fixed 8.5 m back, 1.8 m look height for every vehicle. The Boot Float (7 m tall) and the Combine (5 m) fill the frame from behind; on a phone in portrait the Combine covers the whole screen and the road ahead is invisible. At the other end …
  - Where: `camera.ts` `VIEW` (line ~34), `app.ts` ~2594 `chase.update(...)` passes no size. Shots: `boot-float-960-rest.png`, `combine-960-drive.png`, `combine-390-rest.png`, `baguette-trike-960-drive.png`.
  - Editor's fix: scale drive `dist` and `lookHeight` from the vehicle's height and length (e.g. `dist = 5.5 + 1.6 * radius`, `lookHeight = max(1.8, 0.9 * bodyHeight)`; pitch up a little for tall bodies), eased when switching vehicles; same for `fly` and boats. Check portrait at 390x844 for the Combine, Boot Float, Snail-Coach and Bin Lorry.
  - Re-check: `review/shots/G7/`: `boot-float-960-rest.png`, `combine-960-drive.png`, `combine-390-rest.png`, `baguette-trike-960-drive.png`
- **G7#6** (polish, craft · **should**) Simcade takes three times as long to get going, and keyboard full lock spins the bikes round
  - What: headless sim, stock setups, keyboard input. 0-90 % of top speed: Casual 2.3-3.6 s, Open World 4-5.5 s, Simcade 5.3-9.9 s (zero-turn 9.9, dirt bike 9.7, Wespa 9.4, push-bike 7.2). Holding full lock at top speed for 3 s: in Simcade the push-bike, zero-turn …
  - Where: `handling.ts` `TUNES` (`hybrid`, `simcade`), `PROFILES` (`balance` < 0 on push-bike, dirt-bike, wespa, snail-coach, zero-turn, pot-rod), `@lawn/vehicle` presets. Data: `shots/G7/handling-sim-*.txt`.
  - Editor's fix: in `simcade`, raise drive force (or the traction-control floor) so 0-90 % lands at ~4-5 s; for the keyboard source, ramp steer more slowly above 60 % of top speed in Open World and Simcade; move the Snail-Coach's `balance` to >= 0 (a bus should not be "tail-happy"). Pin "no stock vehicle spins at keyboard full lock in Casual and Open World" in `handling.test.ts`.
  - Re-check: `review/shots/G7/`: `handling-sim-`
- **G7#7** (polish, spirit · **should**, D31) Two-wheelers and soft cars never lean, so their profile notes do not show
  - What: at full lock the chassis tilts 0-1 degrees in Casual and Open World for every vehicle (max 4 degrees in Simcade). The Deux-Pots ("soft, leans hugely, never quite rolls"), the Wespa, the dirt bike and the Baguette Trike ("tippy") corner flat as a tray; only …
  - Where: `handling.ts` PROFILES (stiffness / comHeight), `suspension.ts` (visual roll), `vehicles.ts` `syncVehicleMesh`.
  - Editor's fix: a visual body roll per kind (a `roll` gain in `PROFILES`, fed into the existing suspension roll from lateral acceleration): about 8-10 degrees for the Deux-Pots, bank-into-the-turn for two-wheelers (negative sign, 10-15 degrees), small for vans. Visual only, no physics change.
  - Decision: D31 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#8** (polish, craft · **should**) Cone Van, golf cart and Taxi have no handling profile
  - What: `PROFILES` has entries for every new ride except the Cone Van; the golf cart and the Taxi have none either, so all three drive on the neutral reference mower. The Cone Van is a 2.5 m tall ice-cream van with a cone on the roof that drives exactly like a …
  - Where: `handling.ts` `PROFILES`.
  - Editor's fix: copy the Crepe Van row for the Cone Van (a touch higher comHeight for the cone), give the golf cart a light, grippy, low-top-speed row. Add a test: every kind sold by a dealer or in a traffic mix has a profile.
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#14** (nit, craft · **could**) Arcade and sim airtime use different gravity
  - What: arcade airborne gravity is 30 m/s² (`ARCADE_AIR.gravity`); the sim chassis gets 9.81 + 9 = 18.8 m/s² (`SIM_AIR.airGravity`). The same ramp gives visibly different hang times in the two models; arcade also lands with a hard `vy = 0` snap (no landing squash).
  - Where: `vehicles.ts` `ARCADE_AIR`, `simdrive.ts` `SIM_AIR`, `stunts.ts` `RAMP_LAUNCH`.
  - Editor's fix: set arcade gravity to ~20 and retune `RAMP_LAUNCH.arcadeBoost` so `ramps.test.ts` jump lengths hold; feed the landing `vy` into the suspension heave for a squash on touchdown.
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#15** (polish, craft · **must**, D36) Bump damage and vehicle-vehicle contact also use the length circle
  - What: `collideVehicles` uses `a.radius + b.radius`; two Snail-Coaches in opposite lanes (`LANE_OFFSET` 2.5, so centres 5 m apart) are exactly in contact; a Combine meeting the bus overlaps by 0.7 m and shoves sideways. Part of #1, listed so the fix covers …
  - Where: `vehicles.ts` `collideVehicles` ~757.
  - Decision: D36 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#19** (nit, craft · **could**) Stale comments: "Garage (no UI yet)"
  - What: `simdrive.ts` ("Garage: each vehicle's setup... No UI yet") and `app.ts` `__gta.garage` ("Garage (no UI yet)") while `garages.ts` has the Handling modal and Pay 'n' Glaze has a Handling tab.
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#20** (polish, craft · **should**) Two whole-world vehicle tests time out under the full suite
  - What: `canalCruise.test.ts` (the Clog Cruiser canal run) and `sandpitJump.test.ts` hit the 30 s timeout when run with the other 94 vehicle/traffic files; both pass alone. E27's goal was a suite that gives the same answer every run.
  - Where: those two files (`buildWorld` per test).
  - Editor's fix: explicit timeouts (120 s) like the traffic preset test got, or move them to `*.slow.test.ts` and the `mp-audit` config.
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

**GR8. Cross-cutting craft fixes are made once, in shared code, by one owner.** Several groups found the same
defects. No region builds its own workaround. See D58 for the list and the owners.

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D21. Stunt ramps: the neon kit look — G1#16, G5#20 · **should**
- **Question:** should the game-wide black-and-cyan stunt ramp stay as a readability rule?
- **Options:**
  - (a) Keep the neon everywhere.
  - (b) Skin every ramp to its place.
  - (c) Skin ramps to their place, but keep one small readable cue.
- **Decision:** (c).
- **Fix round:**
  - The ramp body takes a place skin:
    - parks get timber and turf with a "NO RAMPING (PLEASE)" sign;
    - Dean's Leap gets old planks and packed earth, a faded wheelchair symbol and a "DONATED BY THE CLASS OF ——" brass
      plate;
    - dirt and rally ramps get earth and tyres.
  - Every ramp keeps a painted white lip line and yellow chevrons, so players can still read it.
  - Cyan appears only as the HUD ring while a stunt is active.
  - Fix the pink coplanar strip next to the park ramp.

#### D31. Two-wheelers and soft cars don't lean — G7#7 · **should**
- **Decision:** a visual body roll per kind (a `roll` gain in `PROFILES`, fed from lateral acceleration): the
  Deux-Pots 8–10°, two-wheelers banking into the turn 10–15°, vans a little. No physics change.

#### D36. L01: the vehicle collides as one long circle — G7#1, G7#15 (craft; ruled because of its risk) · **must**
- **Decision:**
  - Vehicles collide as a short capsule: 2–3 circles along the heading, radius = body half-width + 5 cm, from a new
    `spec.halfWidth`. This applies against boxes and vehicle-to-vehicle.
  - `spec.radius` stays for culling, the camera, spawn spacing and bump damage thresholds.
- **Reason:** it is the user's own complaint, and the capsule changes the least code.
- **Fix round:**
  - The tests G7 proposes: a dirt bike through a 1.2 m gap, a van along a wall within 0.15 m.
  - The full traffic and quest-sim suites must stay green, run twice.
  - Boats keep their own fraction.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- `spec.halfWidth` and a capsule of 2-3 circles along the heading (radius = halfWidth + 0.05) for boxes and vehicle-to-vehicle; `spec.radius` stays for culling, camera, spawn spacing and bump thresholds.
- Drive camera `dist` / `lookHeight` scaled by the vehicle size.
- `PROFILES[kind].roll` (visual only).
- Ramp skins per place (park timber and turf, Dean's Leap planks, dirt and rally earth and tyres), each with a white lip line and yellow chevrons; cyan only as the HUD ring during a stunt.

## Contracts this epic consumes from earlier epics

- FX02's interior branch of camera.ts (keep it intact).

## Online / mobile / achievements / prefabs / lore notes

- Mobile: check the drive camera at 390x844 for the Combine, the Boot Float and the Petit Pois. Online: the capsule runs on each client for its own vehicle; remote vehicles keep their sync path.
- GR10: Casual handling and NPC traffic on the Casual chassis are on the keep list. No physics feel change beyond what the findings ask.

## Risks and open questions (with the decision taken)

- Collision touches every quest and traffic test. Run the full traffic and quest-sim suites twice (`npm run quest-sim:suites -w games/gnome-theft-auto`), D36.
- Arcade gravity change (G7#14) must keep `ramps.test.ts` jump lengths: retune `RAMP_LAUNCH.arcadeBoost`.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX04/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- New tests: a dirt bike passes a 1.2 m gap; a van drives along a wall within 0.15 m; two Snail-Coaches pass in opposite lanes without contact (D36, G7#15).
- A test: every kind sold by a dealer has a `PROFILES` row (G7#8).
- All 3 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
