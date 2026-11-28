# FX03 Touch activity mode, holstering and activity HUD layout
Wave: 1 · Depends on: none · Kind: Fix (shared, GR8)
Findings: 14 (G1#12, G4#11, G6#25, G8#1, G8#2, G8#3, G8#11, G8#14, G8#15, G8#16, G8#19, G8#26, G8#33, G8#34) · Decisions: D30, D58

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

On a phone, an activity shows only the controls it uses, and the gnome never holds a pistol at home, on the green, on stage or at work (D30). Activity HUDs sit in their own slot and never cover the toasts, money, minimap or the line of play.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- input.ts (`showButtons`, a new `setActivity` mode)
- a new `activityMode.ts` (the `activityHidesGun()` predicate and the `PEACEFUL_INTERIORS` list)
- app.ts: the `hideGun` block (~2251-2258) and the call that feeds it, nothing else
- court/hud.ts, skate/hud.ts, golf/hud.ts, golf/runtime.ts (`putPlayer`, club and swing), winter/runtime.ts (button set only)
- workplaces/shiftHud.ts, workplaces/firefighter/hoseUi.ts, workplaces/firefighter/station.ts and runtime.ts (the Pumper hand-over on the apron, G8#11; HUD text), workplaces/garbage/runtime.ts (HUD text only), workplaces/comedy/runtime.ts (holster only)
- the vehicle key card for sleds and skis, the achievements toast queue while a workplace panel is open

### Findings (14)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G1#12** (polish, spirit · **must**, D30) Weapons and combat buttons inside the player's own flat
  - What: inside Flat 3B on a phone, the touch layout shows Guns / Reload / Aim / Fire next to Leave / Jump. On desktop the pistol is in hand. E05 left holstering "for E18". It was not done.
  - Where: `?interior=flat-3b` at 390x844 touch. Shot `i-flat-phone.png`.
  - Editor's fix: holster on `onInteriorChange(id)` for interiors flagged `peaceful: true` (flat-3b, townhouse-404, diggs-bungalow, bodega, the sales floor), and hide the combat buttons. Show "Decorate" / "Sleep" as context buttons instead.
  - Decision: D30 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `i-flat-phone.png`
- **G4#11** (polish, craft · **should**) Phone: starting a ride drops a desktop key card over the rider, with three more toasts stacked on it
  - What: At 390x844 with `?winter=tea-tray-run`, a "WASD / Click / Shift / Space / H / B / N" help card covers the middle of the screen and the gnome, while the achievement banner, the "contract waiting" toast and the radio "Now playing" strip all show at once …
  - Where: The vehicle help card shown on entering a vehicle (HUD); the winter ride start.
  - Editor's fix: Do not show the vehicle key card for `tea-tray-sled` and `snow-skis` (show "steer / brake" touch hints instead). Queue toasts during a run's countdown. Hand this to G9 for the global queue.
  - Re-check: the spot and file named in Where (no editor shot)
- **G6#25** (polish, craft · **should**) On a phone, the golf strip and the Card/Quit buttons sit across the line of play.
  - What: At 390 x 844 in portrait, the hole strip (top 250 px) and Card/Quit (top 352 px) sit exactly where the fairway meets the horizon, which is where the pin is. The low camera puts the lime tee box in the lower half, so the hole itself is a thin band behind the …
  - Where: `golf/hud.ts:192-213` (`placeTop`).
  - Editor's fix: - In portrait, dock the strip as a compact two-line bar under the top HUD row, or move it to the bottom above the swing buttons. - Move Card/Quit into the Gnomlet row or to the bottom corners. - Raise the tee camera a little in portrait so the green shows above the HUD. - Wrap the strip's lines, or shorten them ("PW 102 · 214 to pin"). - Keep the address spot clear of the markers.
  - Re-check: `review/shots/G6/`: `golf1-phone`, `golf5-phone`
- **G8#1** (blocker, craft · **must**) On a phone, activity buttons sit on top of the game's own touch cluster
  - What: the touch cluster in `input.ts` (`showButtons(mode)`) only knows the modes foot / drive / fly / chute. Activities add their own buttons in their own layer but never hide the cluster. Results at 390x844: basketball: SHOOT / TURBO / PASS / FAKE overlap Jump …
  - Where: `input.ts:226` `showButtons`; `court/hud.ts`, `skate/hud.ts:101` (pad at bottom 170 px), `winter/runtime.ts:156` (Hop column at bottom 150 px), `golf/hud.ts`. Shots `courtP2-8.png`, `skateP-5.png`, `sledP-5.png`, `golfP2-6.png`, `courtD2-14.png` …
  - Editor's fix: add an `activity` touch mode (e.g. `input.setActivity({ stick: true, buttons: [] })` / clear) that hides the cluster except the stick, and hide the keyboard hint bar with it. Call it from court, skate, winter rides, golf (whole round, not just the address), fishing, the hose and the lift. Move the court's QUIT out of the minimap column and the scoreboard below the Gnomlet row on narrow screens. Add one smoke check …
  - Re-check: `review/shots/G8/`: `courtP2-8.png`, `skateP-5.png`, `sledP-5.png`, `golfP2-6.png`, `courtD2-14.png`, `skateD-5.png`
- **G8#2** (blocker, craft · **must**, D30) The gnome holds the pistol through golf and stand-up, and golf has no club or swing
  - What: the gun is hidden only for emotes and fishing (`app.ts:2255` `hideGun = emote.active || fishing.active()`). On the tee the gnome stands with the pistol out (`golfD2-10.png`, `golfL-6.png`); on stage the comedian holds it between lines (`comC-35.png`). When …
  - Where: `app.ts:2251-2258`; `golf/runtime.ts putPlayer` (no held item, no anim); `workplaces/comedy/runtime.ts`.
  - Editor's fix: one `activityHidesGun()` predicate (golf round, comedy set, court game or shootaround, skate, chef, Gnomazon, lift, hose, farm work) feeding `hideGun` and hiding the weapon HUD. Golf: hold `golf-club` (or a putter look on the green) through `buildHeld` while the round is on, add a short backswing/follow-through clip on the swing tap (anim registry, like the batch-2 ride poses), and play it before the ball launches.
  - Decision: D30 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G8/`: `golfD2-10.png`, `golfL-6.png`, `comC-35.png`
- **G8#3** (blocker, craft · **must**) The bin and fire shift panel covers the toasts, the region banner and (on a phone) the money and minimap
  - What: `#gta-shift-hud` is fixed at the top centre (`top: safe + 8px`, z-index 35), the same place as the HUD toasts. At the start of a round or a call the job's best lines land under it: Mags' "Mind the kerb. The kerb has feelings, and a lawyer.", Chief Pumpwell's …
  - Where: `workplaces/shiftHud.ts:34`; `firefighter/runtime.ts:673-692`; `garbage/runtime.ts:100`; shots `binD-4.png`, `fireD-4.png`, `binP-12.png`, `fireP-12.png`, `skiD-9.png`.
  - Editor's fix: give activity panels a HUD slot below the toast stack (or move toasts below the panel while one is up), and on narrow screens put the panel under the top button row, full width, two lines max. Drop the duplicate "Tank" line. Show the call's caller line inside the panel for its first 6 s instead of as a toast. Suppress the region banner while a shift starts.
  - Re-check: `review/shots/G8/`: `binD-4.png`, `fireD-4.png`, `binP-12.png`, `fireP-12.png`, `skiD-9.png`
- **G8#11** (polish, craft · **must**, D58) The Pumper is handed over inside the station, with the camera in the walls
  - What: the engine spawns in the bay facing out; the follow camera sits behind it inside the red house, so the first seconds of every shift are 70% red wall (`fireD-15.png`, `fireP-12.png`). The house has no back wall (E25 note), so from some angles the camera sees …
  - Where: `firefighter/station.ts` (`engine` spot), `firefighter/runtime.ts:272`.
  - Editor's fix: spawn the Pumper on the apron just outside the bay doors with the camera snapped behind it, and give the house its back wall (prefab or a box). Or a 2 s roll-out shot from the front.
  - Decision: D58 row "Interior cutaway: floating signs, sky band, camera in walls" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G8/`: `fireD-15.png`, `fireP-12.png`
- **G8#14** (polish, craft · **should**) The skateboard HUD is keyboard-first and collides with the top HUD
  - What: the line "Ollie: Space - Flip: F/click + direction - Grab: right click + direction - Off: E" shows on a phone; on desktop it runs into the minimap column and the weapon label. The "0 km/h best combo 0" pill sits on the acorn panel on a phone and shows zeros …
  - Where: `skate/hud.ts`; shots `skateD-5.png`, `skateP-5.png`.
  - Editor's fix: show the key hint only for keyboard input (inputSource), and as glyph chips like the court buttons ("SHOOT F / click"); put the speed/combo pill under the top row on narrow screens and hide it below 1 m/s.
  - Re-check: `review/shots/G8/`: `skateD-5.png`, `skateP-5.png`
- **G8#15** (polish, craft · **should**) Golf's buttons crowd each other and the corner buttons
  - What: ◀ Aim, Aim ▶, Club −, Club + touch each other with overlapping borders; SWING sits on the telescope button; Card and Quit sit on top of the minimap at 960x600 and in landscape (`golfAddr-9.png`, `golfL-6.png`).
  - Where: `golf/hud.ts:110-131`, the row layout at line 133.
  - Editor's fix: an 8 px gap in the left row (or a 2x2 block on phones), hide the telescope button during a round (finding 1), and put Card / Quit left of the minimap or under it.
  - Re-check: `review/shots/G8/`: `golfAddr-9.png`, `golfL-6.png`
- **G8#16** (polish, craft · **should**) The hose has no keyboard hints on desktop
  - What: manning the hose shows the touch stick and the water button even on desktop and no key glyphs; the keys are WASD/arrows to aim, Space to spray, L for the ladder. Holding Space in a headless run left the tank full, so it is worth checking that the key path …
  - Where: `firefighter/hoseUi.ts:157-174`; shot `fireHose-16.png`.
  - Editor's fix: glyph chips on the buttons for keyboard players (Space on the water button, L on Ladder) and a one-line hint the first time ("WASD aim · Space spray"). Verify Space sprays.
  - Re-check: `review/shots/G8/`: `fireHose-16.png`
- **G8#19** (nit, craft · **could**) Achievement toasts cover the workplace panels' buttons
  - What: the achievement card draws over the Gnomazon header and its Clock out button (`gnzD-6.png`, `gnzP-6.png`), and over the minimap on the ice (`iceD-5.png`).
  - Where: the achievements toast layer vs `packUi.ts` z-index 38.
  - Editor's fix: while a workplace panel is open, queue achievement toasts to the bottom-left or until the shift card.
  - Re-check: `review/shots/G8/`: `gnzD-6.png`, `gnzP-6.png`, `iceD-5.png`
- **G8#26** (polish, craft · **should**) Sled and ski riders are vehicles with Fire, Reload, Boost and Horn
  - What: the tea tray and skis show the full driving cluster: Exit, Horn, Boost, Handbrake, Radio, Reload, Fire (`sledP-5.png`), and the hint bar offers "Shift Boost". The winter Hop button is the only ride-specific control.
  - Where: `input.ts showButtons` (drive mode), `winter/runtime.ts:156`.
  - Editor's fix: covered by finding 1's activity mode: stick + Hop + Exit only.
  - Re-check: `review/shots/G8/`: `sledP-5.png`
- **G8#33** (polish, craft · **should**) The court's phone scoreboard and controls also hide the play
  - What: at 390x844 the scoreboard sits over the Gnomlet row and the top of the court, and the button column on the right covers the far basket's lane (`courtP2-8.png`). The camera is high and wide, so the gnomes are about 20 px tall.
  - Where: `court/hud.ts`, `court/view.ts`.
  - Editor's fix: in portrait, put the score in a slim bar under the top row, buttons in a bottom-right arc (after finding 1 removes the cluster), and pull the camera in 20% toward the ball carrier.
  - Re-check: `review/shots/G8/`: `courtP2-8.png`
- **G8#34** (nit, craft · **could**) Some activity HUD text reads as debug
  - What: "0 km/h best combo 0" (skate), "Round 0%" with an empty bar (bin round, before the first bin), "Tank 100%" twice (fire), "3 fires left" then "4 fires left" with no word on why (spread).
  - Where: `skate/hud.ts`, `garbage/runtime.ts`, `firefighter/runtime.ts`, `firefighter/hoseUi.ts`.
  - Editor's fix: hide zero states; when a fire spreads say so once ("It has reached the awning!").
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

**GR8. Cross-cutting craft fixes are made once, in shared code, by one owner.** Several groups found the same
defects. No region builds its own workaround. See D58 for the list and the owners.

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D30. The pistol indoors, at golf and on stage — G1#12, G8#2 · **must**
- **Decision:**
  - Holster and hide the combat buttons:
    - in interiors flagged `peaceful` (flat 3B, the townhouse, Diggs's bungalow, the Bodega, the sales floor, Café
      Pardon, the clubhouse, the Moleman burrow, the Flock's tent);
    - during golf, stand-up comedy and every workplace shift.
  - Show the context buttons (Decorate, Sleep, Swing) in their place.
  - Golf gets a club and a swing (G8#2, craft).
- **Reason:** the home should feel safe, and phone screens are where it hurts most.

#### D58. Defects found by several groups (rows that apply here) · **must**

| Defect | Found in | The one fix |
|---|---|---|
| Interior cutaway: floating signs, sky band, camera in walls | G1#4, G1#11, G6#18, G1#14, G8#11 | Wall decor culls with its wall. Interiors use a dark warm background and less fog. An entry-view check for every interior: nothing taller than 1.2 m within 3 m in front of the spawn, and camera clearance on `stairsTo` arrivals. |


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- `input.setActivity({ stick: boolean, buttons: ActivityButton[] } | null)`: hides the normal cluster except what is asked for, and the keyboard hint bar. Sleds and skis: stick + Hop + Exit.
- `activityHidesGun(): boolean` covering golf, comedy, court, skate, chef, Gnomazon, bin lift, hose, farm work, every workplace shift and the `PEACEFUL_INTERIORS` (flat 3B, the townhouse, Diggs's bungalow, the Bodega, the sales floor, Café Pardon, the clubhouse, the Moleman burrow, the Flock's tent).
- An activity HUD slot below the toast stack (and under the top button row on narrow screens).

## Contracts this epic consumes from earlier epics

- None.

## Online / mobile / achievements / prefabs / lore notes

- Mobile is the point: 44 px targets, check 390x844 and 844x390 for every activity. Online: none. Prefabs: a golf club via `buildHeld` (reuse a prefab if one fits).
- The context buttons (Decorate, Sleep, Swing) show in place of the combat buttons (D30).

## Risks and open questions (with the decision taken)

- app.ts is a hot file: keep the diff to the hideGun block and one import.
- Gamepad and keyboard paths must keep working: the activity mode only changes touch buttons and hints.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX03/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- A test: `activityHidesGun()` is true in each listed activity and peaceful interior, false on the street.
- Each activity at 390x844: no rect overlap between the activity buttons and the remaining touch controls (extend the smoke rect check if it exists).
- All 5 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
