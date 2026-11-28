# FX02 Interiors: cutaway walls, backgrounds and entry cameras
Wave: 1 · Depends on: none · Kind: Fix (shared, GR8)
Findings: 7 (G1#3, G1#4, G1#11, G1#13, G1#14, G1#24, G6#18) · Decisions: D58

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Every walk-in interior and rooftop arrival looks deliberate: wall decor culls with its wall, no sky or void over the cutaway, the camera never starts inside a wall, kiosk or wardrobe, and the street does not talk into the flat.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- interiors/kit.ts, interiors/runtime.ts, interiors/rooftops.ts, interiors/interiors.test.ts
- interiors/showcase/doublePot.ts (the roof arrival and lift kiosk only)
- homes/interiors.ts (Diggs's bungalow)
- camera.ts (foot camera height clamp inside interiors only)
- home/decorUi.ts (phone layout)
- the ambient bark toast path while indoors

### Findings (7)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G1#3** (blocker, craft · **must**) Taking the lift up to the Thorne Helipad puts the camera inside the lift kiosk
  - What: `DOUBLE_POT_ROOF_ARRIVAL` (120, 9, -75) faces north, and the kiosk (a scaled `cab-rank-booth`) stands at z -71.7, right where the follow camera sits behind the player. On arrival the whole screen is mustard yellow until the player walks away.
  - Where: `interiors/showcase/doublePot.ts` lines 12-14 and 40-50; `?interior=double-pot-sales&roof=1`. Shot `i-roof.png`.
  - Editor's fix: put the player 3 m south of the kiosk, facing south (toward the pad, yaw 0), or put the kiosk against the parapet at the north end with the arrival in front of it facing away. Swap the taxi booth for a proper lift housing (a beige box with a THORNE lift door; add a prefab `even-lift-kiosk`). Add a camera-clearance assert to the interiors test for every `stairsTo` world target.
  - Re-check: `review/shots/G1/`: `i-roof.png`
- **G1#4** (polish, craft · **must**, D58) Interior wall signs float in the air when their wall is cut away
  - What: interior walls are single-sided planes, so they vanish when the follow camera is outside them (dollhouse view). The signs (`kit.sign`) on those walls still render, so they hang in mid-air at the edge of the screen, often over the HUD. Seen in Flat 3B (the …
  - Where: `interiors/kit.ts` (`sign`, `frontPlane` walls). Shots `i-flat.png` (left and right edges), `i-dpot.png`, `i-workshop.png`, `i-diggs.png`.
  - Editor's fix: build signs as front-facing single-sided planes on the room side, like the walls (`frontPlane` plus the wall's facing), so they cull with their wall. Do the same for any `kit.put` wall piece (paintings, the flat's `wall` stock): put them on the wall's layer and hide them with it. Check it with the same five `?interior=` shots.
  - Decision: D58 row "Interior cutaway: floating signs, sky band, camera in walls" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `i-flat.png`, `i-dpot.png`, `i-workshop.png`, `i-diggs.png`
- **G1#11** (nit, craft · **must**, D58) Every walk-in shows the sky or void above the cut-away ceiling, and it is inconsistent
  - What: Flat 3B, the townhouse and Diggs' bungalow show a band of light-blue sky above the room. The Mulch Club and the workshop show black. It depends on the theme and time.
  - Where: `interiors/runtime.ts` / `kit.ts room()`. Shots `i-flat.png`, `i-townhouse.png` (top band), `i-mulch.png`.
  - Editor's fix: while inside, set the scene background to a dark warm neutral (or the theme's ceiling colour, darkened 60%) and turn the fog down. Restore both on leaving.
  - Decision: D58 row "Interior cutaway: floating signs, sky band, camera in walls" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `i-flat.png`, `i-townhouse.png`, `i-mulch.png`
- **G1#13** (nit, craft · **could**) Street barks and quest toasts play inside the flat
  - What: inside Flat 3B: "Buck-Iron driver: 'Over-caffeinated blender!'". The world runs round the interior's exit (E05), so street NPC barks still toast.
  - Where: shots `i-flat.png`, `i-flat-empty.png`.
  - Editor's fix: while `currentInterior()` is set, drop ambient NPC bark toasts, or prefix them "(outside) ..." and halve their rate. Keep quest comms.
  - Re-check: `review/shots/G1/`: `i-flat.png`, `i-flat-empty.png`
- **G1#14** (polish, craft · **must**, D58) Diggs' bungalow: the spawn faces the back of a wardrobe
  - What: on entry the camera looks straight at a large dark-brown cabinet back that fills the middle of the screen.
  - Where: `homes/interiors.ts` (diggs-bungalow build). Shot `i-diggs.png`.
  - Editor's fix: move the cabinet against the west wall facing into the room, or move the door spawn. Run the entry-view check for every interior: nothing taller than 1.2 m within 3 m in front of the spawn.
  - Decision: D58 row "Interior cutaway: floating signs, sky band, camera in walls" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `i-diggs.png`
- **G1#24** (polish, craft · **should**) Decorate panel on a phone: the room is hidden and the plan's labels are clipped
  - What: at 390x844 the bottom sheet takes about 60% of the height, and the room behind it shows only ceiling and walls, so a nudge cannot be seen in 3D. Plan labels use only the first word and are squashed into the piece width: "Pot" for Pot Plant, an unreadable lamp …
  - Where: `home/decorUi.ts:118-144`, `?interior=flat-3b&decor=room` at 390x844 touch. Shot `i-flat-decor-phone.png`.
  - Editor's fix: on portrait phones, raise the camera to a top-down view of the room while the panel is open and shrink the sheet to about 45% (plan above the buttons, collapse the storage strip into a row). Plan labels: use a short-name field on `FurnitureStock` ("Plant", "Lamp", "Shelf"), draw them outside the piece when it is narrower than the text, and never clip them at the plan edge.
  - Re-check: `review/shots/G1/`: `i-flat-decor-phone.png`
- **G6#18** (polish, craft · **must**, D58) Interiors show the sky or a black void above (camera clears low ceilings).
  - What: - In the Unmown Ranger Station (h 3.2 m) the top of the frame is open sky (`shots/G6/int-unmown-ranger-station`). - The clubhouse and Loamdeep show black where a ceiling should be.
  - Where: `unmown/station.ts:29`, `golf/clubhouse.ts`, the Loamdeep halls; interior camera (shared, G1/G9).
  - Editor's fix: - Pull the camera in under the ceiling inside short rooms (clamp camera height to the ceiling minus 0.3), or raise those rooms to at least 4 m. - Make ceilings double-sided.
  - Decision: D58 row "Interior cutaway: floating signs, sky band, camera in walls" (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `int-unmown-ranger-station`

### Decisions this epic applies (quoted from decisions.md)

**GR8. Cross-cutting craft fixes are made once, in shared code, by one owner.** Several groups found the same
defects. No region builds its own workaround. See D58 for the list and the owners.

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

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

- `currentInterior()`-aware scene background and fog (dark warm neutral) restored on exit.
- An entry-view assert in interiors.test.ts: for every interior spawn nothing taller than 1.2 m within 3 m in front, and camera clearance on every `stairsTo` / roof arrival.
- `camera` clamps foot-camera height to ceiling − 0.3 m inside interiors (FX16 relies on it for Loamdeep and the clubhouse).

## Contracts this epic consumes from earlier epics

- None.

## Online / mobile / achievements / prefabs / lore notes

- Mobile: G1#24 is the phone decorate layout (top-down room camera, sheet about 45%). Check 390x844 and 844x390.
- Prefabs: a THORNE lift housing (`even-lift-kiosk`) goes into packages/prefabs.

## Risks and open questions (with the decision taken)

- Do not touch the peaceful-interior holster: that is FX03 (`PEACEFUL_INTERIORS` list in its own module).
- camera.ts is also FX04's file (drive camera, wave 2): keep the change inside the foot/interior branch.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX02/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- The new entry-view test passes for every registered interior and rooftop arrival.
- All 5 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
