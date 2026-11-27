# FX17 Vehicles content: parts, glaze, dealers, cabs, police chassis, horns
Wave: 6 · Depends on: FX04 · Kind: Fix (content)
Findings: 14 (G7#3, G7#4, G7#5, G7#9, G7#10, G7#11, G7#12, G7#13, G7#16, G7#17, G7#18, G7#21, G7#24, G7#26) · Decisions: D32, D33, D34, D35

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Every vehicle the game sells works with the systems it is sold with: parts show and save, old vehicles shed parts, police drive the new chassis, the E31 rides are for sale, closed cabs have wheels and no hat through the roof (D33), and the odd rides sound like themselves (D32).

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- glazeStore.ts, glazeMounts.ts, glazeShop.ts, glazePanel*.ts, garages.ts
- debris.ts (loose parts)
- npcChassis.ts, police.ts (pursuit chassis)
- dealers/**
- lockup/** (could)
- driveGrips.ts
- skim.ts and the achievement text in packages/achievements/src/catalog.ts (`gta-skipping-stone`)
- roundabouts.ts (tarmac and kerb)
- audio.ts `playHorn` (horns and the Cone Van chime)
- traffic.ts errands (the Cone Van errand, could)
- config.ts `VEHICLES[*].seat` for closed cabs
- packages/prefabs gta-fleet.ts, gta-odd-rides.ts, gta-euro-fleet.ts, gta-jobs*.ts, damage-stages.ts

### Findings (14)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G7#3** (blocker, craft · **must**) Pay 'n' Glaze sells parts to vehicles that cannot show them, and forgets them on reload
  - What: only 8 prefabs have a glaze rig (`GLAZE_KINDS`: push-bike, ride-on, zero-turn, combine, lowrider, boot-float, snail-coach, mulch-spreader, hoa-van). Drive any other ground vehicle into Pay 'n' Glaze (Petit Pois, Deux-Pots, Wespa, Baguette Trike, Crepe Van …
  - Where: `glazeStore.ts` (`GLAZE_KINDS`, `load` line ~64), `glazeMounts.ts` (8 `defineMounts`), `vehicles.ts` `createVehicle` (rig only with a look), `glazeShop.ts` `open` (`glazePanelsFor(kind)` has no rig check), `app.ts` `?glaze` (`m.rig` guard).
  - Editor's fix: short term, for a kind without mounts show only Paint, Repair and Handling (and save paint for every ground kind). Then give the 15 newer ground prefabs `defineMounts` entries (E29/E31/E14/E25 prefabs, odd rides, golf cart) and add them to `GLAZE_KINDS`, one issue per family. A test: every kind in the dealer stock either has mounts or gets the reduced tab list.
  - Re-check: `review/shots/G7/`: `look2-euro-hatch.png`, `look-ride-on.png`
- **G7#4** (polish, craft · **should**) The oldest, most-driven vehicles lose no parts (L53 only reached the new ones)
  - What: knock-off parts come from part names matching `LOOSE_NAME`. Counting them per prefab: push-bike 0, zero-turn 0, combine 0, mulch-spreader 0, boot-float 0, lawn-roller 0, teacup 0, barrow-buggy 0, Dewdrop 0, ride-on 2 (hood, grille), Pot Rod 1. The new rides …
  - Where: `debris.ts` `LOOSE_NAME` / `looseParts`; prefabs in `packages/prefabs/src/catalog/gta-fleet.ts`, `gta-odd-rides.ts`, `damage-stages.ts`.
  - Editor's fix: name 3-5 existing parts per legacy prefab so they match (`grass-bag`/`catcher` on the push-bike, `exhaust`, `bumper`, a `lamp` pair and the seat-back `flag` on the zero-turn, the combine's `reel` guard and ladder, the barrow's `handle`... careful with `NEVER_LOOSE`), splitting a part out of a merged mesh where needed. Pin a minimum (>= 3 loose parts per drivable ground prefab) in `debris.test.ts`.
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#5** (polish, craft · **should**) Police chases still drive the old arcade model (L93 half done)
  - What: NPC traffic, rivals and the follow-quest leader use the Casual chassis, but `assignNpcChassis` only takes `driver === 'npc'`, and `police.ts` steps pursuit vans with `stepVehicle` (arcade: instant yaw, `steer = -diff * 2.2` straight at the player, a hard 21 …
  - Where: `npcChassis.ts` `assignNpcChassis`, `police.ts` ~655.
  - Editor's fix: route pursuits and scripted drivers through `stepNpcCar` (take `'police'` in `assignNpcChassis`, raise `maxCars` to ~10 with pursuits first), steer pursuits to a point on the road graph ahead of the player when one is near, and replace the 21 m/s clamp with the throttle. Keep arcade only for far, off-screen cars.
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#9** (polish, spirit · **should**, D32) The Cone Van has a chime speaker and no chime; three E31 rides use the default horn
  - What: the Cone Van prefab has a `speaker` part ("a chime speaker", E31 V1), but `audio.ts` `playHorn` has no case for `cone-van`, `ranger-buggy` or `shell-camper`, and there is no ice-cream chime anywhere in `sound/`.
  - Where: `audio.ts` `playHorn` (`default:`), `living/sound.ts`.
  - Editor's fix: a synthesized 4-6 note chime as the Cone Van's horn, and (spirit) the van plays it softly now and then while cruising Saltbucket Shore. A two-tone parp for the buggy, a slow low hoot for the camper. Optional: a "Greensleeves-but-wrong" lore line for the chime.
  - Decision: D32 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#10** (polish, craft · **should**) The E31 rides are not for sale; dealer list out of order and without stats
  - What: Burl's Forecourt sells the five European rides and the dirt bike, but not the Ranger Buggy, Snail-Shell Camper or Cone Van, even though they are in traffic and parked. The list is ordered by price except the dirt bike (650) after the Combine (3500). Cards …
  - Where: `dealers/config.ts` `DEALERS.forecourt.stock`, `dealers/ui.ts`. Shot: `dealer-390.png`.
  - Editor's fix: add the three (Camper ~1600, Cone Van ~1900, Ranger Buggy ~1300, or make the buggy a story/ranger reward and say so on a locked card); sort by price; add two small bars per card (speed, grip or "size"); tint variant icons with the variant colour.
  - Re-check: `review/shots/G7/`: `dealer-390.png`
- **G7#11** (polish, spirit · **must**, D33) The Petit Pois's driver pokes through the roof
  - What: the seated gnome's hat (and the top of the head) stick out through the Petit Pois's roof and pea pod, visible at rest and on the Pay 'n' Glaze stage. Seat y 0.4 m vs roof at 1.08 m; a seated gnome with hat is ~1.3 m.
  - Where: `config.ts` `VEHICLES['euro-hatch'].seat`, prefab `gta-euro-hatch` (`gta-euro-fleet.ts`, `cabin`, `roof`). Shots: `euro-hatch-960-rest.png`, `look2-euro-hatch.png`.
  - Editor's fix: keep the joke and own it: a sunroof hole sized to the hat (the hat sticks out on purpose, like the Deux-Pots' roll-top), or lower the seat and squash the cabin. Check the other closed cabs (Crepe Van, Cone Van, Shell Camper, HOA van, Taxi) with the tallest hat in the creator.
  - Decision: D33 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G7/`: `euro-hatch-960-rest.png`, `look2-euro-hatch.png`
- **G7#12** (polish, craft · **should**) Closed cabs have no steering wheel; the Petit Pois was meant to have one
  - What: `euro-hatch`, `crepe-van`, `bin-lorry` and `fire-engine` are in `driveGrips.test.ts` `NO_CONTROL`: no steering wheel, the gnome's hands rest on nothing. The Petit Pois cabin is glass, so it shows. E29's brief promised "Petit Pois has doors and a steering …
  - Where: `driveGrips.ts` `DRIVE_CONTROLS`, prefabs in `gta-euro-fleet.ts`, `gta-jobs*`.
  - Editor's fix: add a small `steer` pivot wheel to the four prefabs and grip entries; remove them from `NO_CONTROL`.
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#13** (polish, craft · **should**) Quick Respray undercuts the new Repair tab
  - What: Quick Respray (90 Acorns) fully repairs, repaints and clears heat. The Repair tab charges `10 + 120 x missing hp x tier + 15 x damage level`: a wrecked Combine costs ~325, a wrecked Snail-Coach ~270, a wrecked Petit Pois ~235, all more than the respray that …
  - Where: `garages.ts` `RESPRAY_COST`/`quickRespray`, `glazePanelRepair.ts` `REPAIR`, `repairQuote`.
  - Editor's fix: either Quick Respray no longer repairs (it is a respray: paint + heat), or it repairs and costs `max(90, repairQuote + 40)`. Label the Repair button "Repair, keep the paint". Re-pin in `economyCurve.test.ts`.
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#16** (nit, spirit · **could**, D34) Lock-Up holds five ground vehicles, the Forecourt sells 23
  - What: L25 asked to "allow storage of multiple cars of the same type". It works (uid-keyed), but `LOCKUP.capacity.ground` is 5 with no way to grow it, while air and water have buyable estates.
  - Where: `lockup/config.ts` `capacity`, `ESTATES`.
  - Editor's fix: a buyable second ground garage (e.g. a Pardonlin mews lock-up, 6 slots, ~1500) or a lock-up extension at Side-Valve. Decider call on size.
  - Decision: D34 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#17** (nit, spirit · **could**, D35) Pot Rod: "hot engine", 13 m/s, 1,800 Acorns
  - What: the Pot Rod is sold as "A flowerpot with a hot engine and no regrets" for 1,800 (more than the Zero-Turn at 900), and tops out at 13 m/s, slower than the 150-Acorn push-bike (20). Odd rides are slow by design, but this one's name and blurb promise speed.
  - Where: `config.ts` `VEHICLES['pot-rod']`, `dealers/config.ts`.
  - Editor's fix: either make it quick off the line and twitchy (max ~22, accel ~14, keep the tail-happy profile), or keep it slow and rewrite the blurb ("All flame decals, no engine") and price it ~600.
  - Decision: D35 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#18** (nit, craft · **could**) Only the Zero-Turn can earn Skipping Stone
  - What: with `SKIM` (drag 0.6/s, 6 % lost per hop, drop at 7 m/s) the longest skim from top speed is about: zero-turn 42 m, ride-on 28 m, Petit Pois 26 m, push-bike 20 m. The achievement asks for 40 m, so only a Zero-Turn at full speed (or with boost) can get it, and …
  - Where: `skim.ts` `SKIM`, `packages/achievements/src/catalog.ts` `gta-skipping-stone`.
  - Editor's fix: either drop the bar to 30 m (reachable by any quick car off a ramp) or say "a fast mower" in the achievement text. Do not change skim feel.
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#21** (nit, craft · **could**) Two Repair-ish tabs with the same icon
  - What: Pay 'n' Glaze tabs "🔧 Repair" and "🔧 Handling" share the spanner. Handling could be a gauge or a dial.
  - Where: `glazePanelRepair.ts`, the handling panel registration in `garages.ts`/`glazePanels.ts`.
  - Re-check: the spot and file named in Where (no editor shot)
- **G7#24** (nit, craft · **could**) Roundabout tarmac is a faceted polygon with no kerb
  - What: the Anthill ring (and the Pardonlin rings) read as an angular asphalt plate on grass: straight facets around the outside, no kerb or verge, the spokes join with hard corners.
  - Where: `roundabouts.ts` / `roundaboutIslands.ts`, highway ring mesh. Shot: `traffic-anthill.png`. (G2 may also report the Pardonlin ones.)
  - Editor's fix: more ring segments, a kerb ring on the outer edge, rounded spoke mouths.
  - Re-check: `review/shots/G7/`: `traffic-anthill.png`
- **G7#26** (nit, spirit · **could**, D32) Region traffic mixes: the Pardonlin feel is good; the coast could carry it further
  - What: watching traffic, Pardonlin (Hatwheel) is ~90 % European rides at a gentle 8-13 m/s with wardens holding junctions: it feels like a different country, exactly right. The coast mix spawns Cone Vans and Wespas, but a Cone Van cruising at 10 m/s never stops; the …
  - Where: `living/trafficMix.ts`, `traffic.ts` errands (`TOWN_ONLY`, `PLACES`).
  - Editor's fix: give the Cone Van an errand that parks it by the boardwalk/beach with its hatch open and the chime (see #9) for a few seconds; rangers stop at the preserve gate. Keep it to one behaviour each.
  - Decision: D32 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D32. The Cone Van's chime and its errand — G7#9 **should**, G7#26 **could**
- **Decision:**
  - A synthesised 4–6 note "slightly wrong" chime as the Cone Van's horn.
  - A two-tone parp for the Ranger Buggy and a low hoot for the camper.
  - #26: one errand: the Cone Van parks by the boardwalk with its hatch open and plays the chime.

#### D33. The Petit Pois's driver pokes through the roof — G7#11 · **must**
- **Options:**
  - (a) A sunroof sized to the hat, which owns the joke.
  - (b) Lower the seat and squash the cabin.
- **Decision:** (a) for the Petit Pois. For the other closed cabs (Crepe Van, Cone Van, Shell Camper, HOA van, Taxi),
  check with the tallest creator hat and lower the seat where they clip.
- **Reason:** the first European car clips on frame one. The sunroof turns a bug into a Continental gag, at prefab
  cost.

#### D34. Lock-Up capacity: 5 ground slots — G7#16 · **could**
- **Decision:** a buyable second ground lock-up (a Pardonlin mews, 6 slots, about 1,500 Acorns) through the existing
  `ESTATES` pattern.

#### D35. The Pot Rod's "hot engine" — G7#17 · **could**
- **Options:**
  - (a) Make it fast and twitchy.
  - (b) Keep it slow, and own the joke.
- **Decision:** (b).
  - The blurb becomes "All flame decals, no engine. No regrets."
  - The price drops to about 600.
- **Reason:** odd rides are slow by design, and retuning touches handling tests for no gain.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX04 capsule and `halfWidth` (police and parts collide with it).

## Online / mobile / achievements / prefabs / lore notes

- D33 must: a sunroof sized to the hat on the Petit Pois; check the other closed cabs with the tallest creator hat and lower the seat where they clip.
- D34, D35, G7#26: could.
- Achievements: `npm test -w packages/achievements` if the text changes.

## Risks and open questions (with the decision taken)

- Police on `stepNpcCar`: raise `maxCars` to ~10 with pursuits first; run the police tests and the quest-sim suites twice.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX17/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- A test: every ground kind sold by Pay 'n' Glaze either has mounts or is offered only Paint, Repair and Handling; parts survive a reload.
- All 2 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
