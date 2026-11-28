# FX20 Gnomlet tablet, options, loading screen and UI sound
Wave: 8 · Depends on: FX19, FX21 · Kind: Fix (UI)
Findings: 20 (G9#4, G9#5, G9#6, G9#7, G9#8, G9#9, G9#10, G9#20, G9#21, G9#22, G9#23, G9#24, G9#25, G9#27, G9#28, G9#29, G9#30, G9#32, G9#33, G9#34) · Decisions: D37, D40, D41, D42, D43

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

The Gnomlet is a tablet, not a launcher (D37): menu-like apps render inside it through `mount(root)` with one visual kit, grouped and named as one product; options read right (D41); the loading screen knows the new world (D42); the UI makes sound (D40), radio has a volume and ducks under calls, and feet hear the floor.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- gnomlet/** (gnomlet.ts `BRIDGED`, registry, apps, `GNOMLET_CSS` kit)
- the panels mounted into the tablet: bag/*, ledger.ts, the Kiln-Shield panel, jobs panel, city/exchangeApp.ts, quests/journal.ts (mount and the empty state; FX21's `previously` line stays), birding/journalUi.ts, hunting and fishing journals, winter/winterApp.ts, streetRace/raceApp.ts, golf/golfApp.ts, sports/app.ts, farm/farmApp.ts (kit only)
- options.ts, viewPrefs.ts, sound/volumeUi.ts
- loading/facts.ts, loading/pages.ts
- sound/** (watchLife.ts footsteps, recipes, duck rules), radio/player.ts, surfaces.ts (surface tags)

### Findings (20)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G9#4** (blocker, craft · **must**) Kerbside Exchange: the contract rows squash and their text overlaps
  - What: `.ex-body` is a scrolling flex column. Its `.ex-row` children keep the default `flex-shrink: 1`, so with many locked contracts each row is squeezed below its content height. Each row's price and "After …" line then print across the row above's border and …
  - Where: `desk-14-app-kerbside-exchange.png`, `port-14-app-kerbside-exchange.png`, `city/exchangeApp.ts` CSS (~line 108).
  - Editor's fix: add `#gta-exchange .ex-row{flex:none}`. The same trap probably exists in other flex scroll lists; grep for `flex-direction:column` combined with `overflow-y:auto`.
  - Re-check: `review/shots/G9/`: `desk-14-app-kerbside-exchange.png`, `port-14-app-kerbside-exchange.png`
- **G9#5** (blocker, spirit · **must**, D37) The Gnomlet is mostly a launcher: 15 of 24 apps close it and open an older panel in another style
  - What: only 9 apps open inside the tablet (Home, Farm, Unmown Checklist, Race Club, Gnomey Bird, Snowdrop, Founders' Green, Hedgeworth, Options). The rest are `run()` apps that close it: Bag, Kiln-Shield and Ledger (grey bottom sheet), Jobs (right drawer), Kerbside …
  - Where: `desk-12-app-bag.png`, `desk-14…`, `desk-16-app-ledger.png`, `desk-19-app-jobs.png`, `desk-21-app-journal.png`, `desk-22-app-birdJournal.png`; `gnomlet/gnomlet.ts` `BRIDGED`, `launch()`.
  - Editor's fix: add an `open` adapter so a panel can render its body into the tablet's `root` (most of these panels already build one DOM subtree; give them a `mount(root)` and drop their own backdrop and close button). Do the menu-like ones first: Bag, Ledger, Kiln-Shield, Jobs, Exchange, the four journals. The map and the taxi stay `run()`. Back and ⌂ then work everywhere.
  - Decision: D37 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G9/`: `desk-12-app-bag.png`, `desk-16-app-ledger.png`, `desk-19-app-jobs.png`, `desk-21-app-journal.png`, `desk-22-app-birdJournal.png`
- **G9#6** (polish, craft · **must**, D37) Apps inside the tablet share no visual kit; four use bare browser buttons
  - What: Race Club, Snowdrop, Founders' Green and Hedgeworth build their UI with inline `style.cssText`, and their buttons are user-agent defaults: light grey, black system text, square. Cards use `border:1px solid currentColor`. Home and Farm are bare text. The …
  - Where: `desk-26-app-race-club.png`, `desk-28-app-ski-runs.png`, `desk-29-app-founders-green.png`, `desk-30-app-hedgeworth.png`; `winter/winterApp.ts:40-42`, `streetRace/raceApp.ts`, `sports/app.ts`, `golf/golfApp.ts`.
  - Editor's fix: add a small kit to `GNOMLET_CSS`: `.gnl-card`, `.gnl-btn` (primary is yellow-outline like Options, secondary is ghost), `.gnl-stat` (label / value rows), `.gnl-empty` and `.gnl-section`. Convert the six apps to classes (no inline CSS). Use the same kit for finding 5.
  - Decision: D37 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G9/`: `desk-26-app-race-club.png`, `desk-28-app-ski-runs.png`, `desk-29-app-founders-green.png`, `desk-30-app-hedgeworth.png`
- **G9#7** (polish, craft · **should**) Empty states are bare
  - What: Home shows one line ("Pip says the bench at Side-Valve is not a home…") on an otherwise empty 780x560 tablet. Farm shows three lines. Kiln-Shield says "Nothing in your garages to cover yet." Quest Journal Active says "No active quest…". There is no picture …
  - Where: `desk-11-app-home.png`, `desk-13-app-farm.png`, `desk-15-app-kiln-shield.png`.
  - Editor's fix: a `.gnl-empty` block with a big icon, one line of flavour, and one action button: "Show on map" (sets the waypoint to the For Sale board, the bank or Pip), or "Open Ledger".
  - Re-check: `review/shots/G9/`: `desk-11-app-home.png`, `desk-13-app-farm.png`, `desk-15-app-kiln-shield.png`
- **G9#8** (polish, craft · **should**) Options names the wrong key for first person
  - What: the First person row says "V or the eye button switches it too." V is the binoculars (`keys.ts:52`), and first person is F5 (`keys.ts:68`). The Gnomlet tile says F5 correctly.
  - Where: `viewPrefs.ts:59`; `desk-31-app-options.png`.
  - Editor's fix: build the hint with `fillHint('{firstPerson}')`, like the Sound row does, so it follows the device.
  - Re-check: `review/shots/G9/`: `desk-31-app-options.png`
- **G9#9** (nit, craft · **could**) Journal empty state points at a tab that does not exist
  - What: "No active quest. Walk up to any glowing marker on the map or check the Available tab." The tab is called **Open**.
  - Where: `quests/journal.ts:143`; `desk-21-app-journal.png`. The comment at `quests/quests.ts:85` is stale too.
  - Editor's fix: "…or check the Open tab." Better still, make "Open" a link that switches to that tab.
  - Re-check: `review/shots/G9/`: `desk-21-app-journal.png`
- **G9#10** (polish, craft · **should**) Ledger: "buy it in the Ledger app" is a dead end, and owned/for-sale state is unclear
  - What: Windfall Croft's `buyHint` reads "Signed for at the For Sale board by the croft gate, or in the Ledger app". Any `buyHint` suppresses the Buy button (`ledger.ts:227-233`), so the Ledger shows that sentence and no button. The Farm app repeats the promise. Flat …
  - Where: `ledger.ts:216-235`, `farm/farmApp.ts`; `desk-16-app-ledger.png`, `desk-13-app-farm.png`.
  - Editor's fix: show Buy whenever the property can be bought remotely (a flag on the def rather than the hint's presence), and drop "or in the Ledger app" where it can't. Give every row a status chip: Yours / For sale / Locked.
  - Re-check: `review/shots/G9/`: `desk-16-app-ledger.png`, `desk-13-app-farm.png`
- **G9#20** (polish, craft · **should**) Acorn amounts are written four different ways
  - What: the HUD says "Kiln-Debt: 5,000". The Ledger says "5000 🌰" and "price 1500 · 0 down". Sling-Lift says "from 70 Acorns". The Exchange says "500 Acorns". The Gnomlet tile says "50 🌰 · owe 5000".
  - Where: `desk-02-gnomlet.png`, `desk-14…`, `desk-16…`.
  - Editor's fix: add one `formatAcorns(n)` → "5,000 🌰" and use it in every panel, and capitalise "Price".
  - Re-check: `review/shots/G9/`: `desk-02-gnomlet.png`
- **G9#21** (nit, craft · **could**) Option labels and section styling are inconsistent
  - What: values appear as "Screen shake: Normal", "Water waves: high", "Time of day: Auto Cycle", "Profile & Upload: OFF" (which becomes "Profiling & Upload: ON" when toggled), and "Radio text: on". Section headings are yellow and cramped (the heading touches the card …
  - Where: `desk-31-app-options*.png`, `port-31-app-options-p2.png`; `options.ts`, `sound/volumeUi.ts`.
  - Editor's fix: values in Title case ("On / Off / High / Normal / Auto"); 14 px top margin on sections; the note right under the sliders (order 45); Radio voice moved next to Radio text; one label for the profiler toggle.
  - Re-check: `review/shots/G9/`: `port-31-app-options-p2.png`
- **G9#22** (polish, craft · **should**) No music or radio volume
  - What: Options has Sound on/off and World, Ambience and Voices sliders. There is no slider for the radio or `@lawn/music`, none for cutscene music (`CUE_LEVEL` 0.9), and player SFX and UI go straight to the master.
  - Where: `sound/volumeUi.ts`; sound bible §2.
  - Editor's fix: add a "Radio and music" slider (radio player plus `@lawn/music`, `gta.vol.music`) and route cutscene music pads through it. Keep the bible's ratios at 100 %.
  - Re-check: the spot and file named in Where (no editor shot)
- **G9#23** (polish, craft · **should**) The radio is not ducked under mission calls
  - What: cutscenes duck the radio to 0.25, but a comms briefing or call does not touch it (`setRadioVoiceBusy` only stops host chatter, `app.ts:714`). Voices sit at `VOICE_LEVEL` 0.5 under master 0.5 (−12 dB), and the radio is at full under master (−6 dB). While …
  - Where: `briefing/briefing.ts`, `radio/player.ts`, `sound/index.ts` duck rules.
  - Editor's fix: while `briefing.active`, ramp the radio to 0.35 (0.3 s in, 0.6 s out), the same way the cutscene step does. Add the row to the bible's ducking table.
  - Re-check: the spot and file named in Where (no editor shot)
- **G9#24** (polish, craft · **should**) Footsteps ignore what you are standing on
  - What: the player's step sound is `surfaceAt(p.x, p.z)`, the ground under the column (`sound/watchLife.ts:122`). On the boardwalk and Long Spoon Pier you hear sand. On rooftops you hear the street. Interiors are at x ≥ 5000, which counts as city biome, so you hear …
  - Where: `sound/watchLife.ts:113-127`, `surfaces.ts:93-130`, `sound/recipes/world.ts:280-290`.
  - Editor's fix: add `step-wood` and `step-stone` recipes. When the player stands on a collider (grounded above terrain), use that box's surface tag (boardwalk, pier, floors → wood; roofs, pavements, plazas → stone). Otherwise fall back to the ground. NPC steps can stay as they are.
  - Re-check: the spot and file named in Where (no editor shot)
- **G9#25** (polish, spirit · **should**, D40) The UI makes no sound at all
  - What: the Gnomlet has no open, close or tap sound, and Gnomey Bird has no flap, score or crash sound. An incoming call "rings" for 0.6 s but only on screen (`briefing.ts` `RING_SECONDS`, no audio). The player SFX bus has the horn and shop sounds, but the tablet is …
  - Editor's fix: four tiny, dry recipes on the player SFX path: tablet unlock (a soft clay "tok" and a rising blip), tap tick, a double "burr-burr" call ring through the radio filter, and a Gnomey Bird flap and point. Follow the "a little too earnest" rule.
  - Decision: D40 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G9#27** (nit, craft · **could**) The Gnomlet clock shows real time
  - What: the tablet bar shows the device clock (17:58) while the HUD says "Noon" and the sky agrees.
  - Where: `gnomlet.ts` `paintClock()`.
  - Editor's fix: show the game time from the time-of-day system ("12:04", or the HUD's label). It is the natural home for the clock if the HUD drops it (17).
  - Re-check: the spot and file named in Where (no editor shot)
- **G9#28** (polish, spirit · **should**, D37) The Gnomlet's groups and names don't hang together
  - What: "Kerbside Exchange" (the contract board) is under *Money and things*, and its icon is 📌, the same glyph as the pin marker on pinned tiles. "Jobs" is under *Out and about*. Race Club, Snowdrop, Founders' Green and Hedgeworth are under *Games* next to Gnomey …
  - Where: `desk-02-gnomlet.png`, `desk-03-gnomlet-bottom.png`, `desk-25-app-unmown-checklist.png`; `gnomlet/gnomlet.ts` `BRIDGED`, each app's `group`.
  - Editor's fix: regroup as Calls (Taxi, Sling-Lift), Work (Jobs, Kerbside Exchange 📋), Money and home (Bag, Ledger, Kiln-Shield, Home, Farm), Sport and places (Race Club, Snowdrop, Founders' Green, Hedgeworth), Journals, Fun (Gnomey Bird, Emotes, Party), Settings. Use sentence case for every detail line, and settle the taxi brand with lore.
  - Decision: D37 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G9/`: `desk-02-gnomlet.png`, `desk-03-gnomlet-bottom.png`, `desk-25-app-unmown-checklist.png`
- **G9#29** (polish, spirit · **should**, D41) Options shows the profiler to players, and "Cheats" holds the default handling
  - What: the last Options section is "Profiler" (Profile & Upload, Perf overlay, Upload now, "View reports at /admin/profiler/"), and it always shows. "Cheats" contains Driving realism, including "Casual … The default".
  - Where: `options.ts:329-360`; `desk-31-app-options-p3.png`.
  - Editor's fix: put Profiler inside a collapsed "For developers" disclosure (or behind `?debug`; the user does use it, see L88). Rename the section "Handling", with "Silly handling (cheats)" as its sub-head.
  - Decision: D41 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G9/`: `desk-31-app-options-p3.png`
- **G9#30** (polish, spirit · **should**, D42) The loading screen stops at the old world
  - What: 36 facts and 5 concept-art pages cover Turfton, the kiln, mowers, Tessie and the coast. There is nothing for Rootwell, the Anthill, Capwood, Snowcap Rise, Hedgeworth, the Unmown, Trellisdown or Pardonlin's sights (the Bean Tower, Radio Adagio). The stage …
  - Where: `loading/facts.ts`, `loading/pages.ts`, `main.ts:6,16`; `desk-00-loading.png`.
  - Editor's fix: add about 12 facts from the batch-3 lore (one per new place) and 3 pages (Anthill Observatory, Pardonlin rooftops, the Unmown from a hide). Rename the stage "Building the Yard". Fix or cut the garbled fact.
  - Decision: D42 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G9/`: `desk-00-loading.png`
- **G9#32** (nit, craft · **could**) The Field journal's "?" badge looks like a help button
  - What: unseen and heard-only species carry a round "?" rarity badge in the top-right of the card, the size and shape of an info button. It does nothing. Heard-but-not-seen birds still show "?".
  - Where: `desk-22-app-birdJournal.png`; `birding/journalUi.ts:195-201`.
  - Editor's fix: write "Rarity unknown" in small text, or drop the badge until the bird is seen.
  - Re-check: `review/shots/G9/`: `desk-22-app-birdJournal.png`
- **G9#33** (nit, spirit · **should**, D43) Kerbside Exchange lists every locked contract and the mission that unlocks it
  - What: the Locked section lists all of them, each with "After 'Kiln-Resin & Black Ice'", "After 'The Don's Cigars'" and so on, which shows story mission titles hours ahead.
  - Where: `desk-14-app-kerbside-exchange.png`.
  - Editor's fix: show the next one or two locked contracts, then "and 7 more". Show only the unlocking titles of missions already seen in the journal.
  - Decision: D43 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G9/`: `desk-14-app-kerbside-exchange.png`
- **G9#34** (nit, craft · **could**) Small text inconsistencies across the apps
  - What: "–" (Hedgeworth table) next to "—" (Best round). "the Wool Run" and "the Tea-Tray Run" are lower-case card titles. "Kerb Row Circuit - Street" uses a hyphen as a separator. "Games: 0. Wins: 0." uses full stops between stats. The Unmown checklist uses …
  - Where: `desk-26…`, `desk-28…`, `desk-29…`, `desk-30…`, `desk-25…`.
  - Editor's fix: handle all of these with the kit from finding 6: a stat row (label / value), "—" for none, Title case titles, a "·" separator, and a non-interactive tick glyph for auto-ticks.
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D37. The Gnomlet: launcher or tablet — G9#5 (blocker), G9#6, G9#28 · **must** (journals and the regroup: **should**)
- **Question:** L94 asked for "a tablet with apps that give the different options ... more real GTA like". Today 15 of
  24 apps close the tablet and open an older panel.
- **Options:**
  - (a) Every menu-like panel renders inside the tablet through a `mount(root)` adapter.
  - (b) Keep it as a launcher, and only restyle the panels.
- **Decision:** (a).
- **Reason:** L94's words.
- **Fix round:**
  - `mount(root)`: the panel drops its own backdrop and close button, and Back and ⌂ then work everywhere.
  - **Must:** Bag, Ledger, Kiln-Shield, Jobs, Kerbside Exchange, the Quest Journal.
  - **Should:** the Field, Hunting and Catch journals.
  - The map, the taxi and Sling-Lift stay `run()`. They are actions, not menus.
  - The shared `.gnl-*` kit (G9#6, craft) is a must alongside, so the panels mounted in the tablet look like one
    product.
  - Regroup the tiles per G9#28 (Calls / Work / Money and home / Sport and places / Journals / Fun / Settings).
  - Rename "Turfton Taxi" to "Kerbstone Cabs" (lore: `kerbstone-cabs.md`).
  - Sentence case for detail lines.
  - The Gnomlet clock shows game time (G9#27).

#### D40. The UI is silent — G9#25 · **should**
- **Decision:**
  - The tablet makes a soft clay "tok" when it opens.
  - Taps make a tap tick.
  - Calls ring with a "burr-burr" through the radio filter.
  - Gnomey Bird gets a flap sound and a point sound.
  - All on the player SFX path, within the mix table, following the sound bible's "a little too earnest" rule.

#### D41. The profiler and "Cheats" in Options — G9#29 · **should**
- **Decision:**
  - Profiler stays reachable, because the user uses it (L88). It moves into a collapsed "For developers" disclosure at
    the bottom, closed by default.
  - "Cheats" is renamed "Handling", with "Silly handling (cheats)" as a sub-head.

#### D42. The loading screen stops at the old world — G9#30 · **should**
- **Decision:**
  - About 12 new facts from batch-3 lore, one per new place.
  - 3 new pages: the Anthill Observatory, Pardonlin's rooftops, the Unmown from a hide. Code-drawn, like the existing
    pages.
  - The stage text becomes "Building the Yard".
  - Cut the garbled fact.

#### D43. Locked contracts show story titles hours ahead — G9#33 · **should**
- **Decision:** list the next two locked contracts, then "and N more". Name an unlocking mission only if the player
  has seen it in the journal.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- `mount(root)` adapter: a panel drops its backdrop and close button; Back and ⌂ work everywhere.

## Contracts this epic consumes from earlier epics

- FX19 `ui/layers.ts`. FX21 journal Active card (`previously`, reward chip).

## Online / mobile / achievements / prefabs / lore notes

- D37 must: Bag, Ledger, Kiln-Shield, Jobs, Kerbside Exchange, Quest Journal; should: the Field, Hunting and Catch journals and the regroup (G9#28). Map, taxi and Sling-Lift stay `run()`.
- Rename "Turfton Taxi" to "Kerbstone Cabs" (lore `kerbstone-cabs.md`). Sentence case for detail lines.
- D40: all UI sounds on the player SFX path within the mix table; "a little too earnest" (sound bible).
- If the lead hits 30 issues, the should items carry to round 2 (load rule).

## Risks and open questions (with the decision taken)

- Many panels: one adapter, then one issue per panel. Keep each panel usable outside the tablet until its mount lands.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX20/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Every must app opens inside the tablet at 390x844 and desktop; Back and ⌂ work from each.
- All 3 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
