# FX05 Quest-scoped stage sets, scene weather and key-frame light (GR3, GR6)
Wave: 2 · Depends on: FX02 · Kind: Fix (shared, GR3/GR6)
Findings: 9 (G1#1, G1#21, G10#3, G10#6, G10#25, G11#16, G11#17, G11#18, G12#10) · Decisions: D3, D5, D49

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Story dressing exists only while its quest is active and never sits on a road; story scenes play in clear weather unless they ask for rain, and every night key frame and sincere close-up is lit and shows the speaker's face.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- stageSets.ts, stageSets.test.ts, quests/stages/story/** (all story sets)
- cutscene/director.ts, cutscene/script.ts, cutscene/timeline.ts (scene-level `weather`, key light), cutscene/pacing.test.ts (`npm run cutscene-report` checks)
- the scene files of the shots named below only: m14-drainpipe-court.ts, ch1d.ts (#15 outro), m21-penthouse-viewing.ts, m34-forty-seven-wrenches.ts (weather), m39-couch-surfing.ts, m41-pinwheel-ridge.ts, m43-saltbucket-boardwalk.ts, m44-the-bathtub-queen.ts, m46-starfall-at-the-anthill.ts, m50-trellisdown-tasting.ts, m52-the-test-cut.ts, m64-all-hats.ts / m64a-all-hats.ts (staging and light only, not dialogue)
- the Double Pot tunnel wall door prop (D3)

### Findings (9)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G1#1** (blocker, craft · **must**, D3) The HOA cell and a café table stand in the Double Pot Tunnel's traffic lanes, solid, from game start
  - What: stage sets are built once at game start as permanent solid props (`stageSets.ts buildStageSets`). Row 62's set puts the chain-link HOA pen and the cell bunk at x 114.6..118.5, which is the west lane of the tunnel road (x 115..125). Row 21's set puts a table …
  - Where: `quests/stages/story/s62-cams-cell.ts` set (lines ~48-57), `s21-penthouse-viewing.ts` set (lines ~61-64); world (116.5, -98) and (125, -99). Shot `dpot-tunnel.png` (pen on the left, table on the right), `n-tunnel.png`.
  - Editor's fix: lay the lockup out the way the lore entry `hoa-lockup` says: a door in the tunnel wall leading into a walk-in interior (E05 `defineInterior`, like the sales floor), not a pen in the road. Move the s21 table onto the sales floor or the slab. Add a check, as a test, that no solid stage-set prop overlaps a road rectangle (`world.layout` roads) unless it is marked `overRoad`. Also gate story-only dressing on its world …
  - Decision: D3 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G1/`: `dpot-tunnel.png`, `n-tunnel.png`
- **G1#21** (polish, craft · **must**, D3) A stage set is coplanar with the Double Pot façade (large flicker in the tunnel)
  - What: zfight: `towers-facade` (x 111) vs the `lockup-row` stage set (back face at x 111, (111, 1.8, -94.3)), `kind: flicker`, 3,657 px at the default view. Smaller ones in Turfton: the city-hall forecourt paving vs terrain at (6.25, -80.25) (buried), Kilnside parks …
  - Where: `quests/stages/story/s62-cams-cell.ts:49`; run `npm run zfight -- "http://localhost:<port>/?offline&no-intro&at=30,100,3.14"`.
  - Editor's fix: resolved by #1 if the lockup moves indoors. Otherwise pull it 0.15 m off the wall. Give the forecourt paving and the park patches a `flatLayer`.
  - Decision: D3 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#3** (blocker, craft · **must**, D49) #14's sincere beat is hidden behind the player's hat, in near darkness
  - What: in `drainpipe-court-outro` the close-up for "A Potsworth gets a stool and a ledger. Mine had my name on it." is `PIP_PLAYER.single('pip', 'cu')`, and the player's hat fills the frame; Pip is invisible (`shots/G10/drainpipe-court-outro-28.png`, `-31.png`). The …
  - Where: `cutscene/scenes/story/m14-drainpipe-court.ts` line ~158 (and the `sky: 'night'` choice).
  - Editor's fix: shoot the cu from Pip's other side (or `side`/`height` so the player is out of the cone), and play the scene at `golden` dusk with the court lamps coming on at the end, as the comment already describes.
  - Decision: D49 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G10/`: `drainpipe-court-outro-28.png`, `31.png`, `25.png`, `drainpipe-court-outro-28`
- **G10#6** (polish, spirit · **must (key), should (set)**, D5) "Penthouse Viewing" never shows a penthouse, and the key choice promises a prop that does not exist
  - What: the tour plays on a rainy street in the Double Pot Tunnel (fallback noted in the quest header; `shots/G10/m21-penthouse-viewing-mid-38.png`). The choice's option A says "A key will hang in flat 3B" and Vesper's call says "If you take the key, it will hang in …
  - Where: `quests/story/21-penthouse-viewing.ts`, `m21-penthouse-viewing.ts`.
  - Editor's fix: a small beige interior (one room, E05 kit) for the tour, or at least the lift and a beige landing; hang the key on a hook in flat 3B when option A was chosen (a prop gated on the quest's choice), or change both lines to say only that the key is yours.
  - Decision: D5 (quoted in full under "Decisions this epic applies").
  - Split: D5 key: the key prop on a hook by flat 3B's door, gated on choiceOf('m21...') === 'A' (flat3b.ts is FX08's file). (part done by FX08)
  - Re-check: `review/shots/G10/`: `m21-penthouse-viewing-mid-38.png`, `m21-penthouse-viewing-mid-38`
- **G10#25** (polish, spirit · **must**, D49) The act I "last bright image" is four gnomes in the rain
  - What: `founders-boot-outro` wants "the crowd on the tiers"; the frame shows four gnomes, a rope and rain streaks (`shots/G10/founders-boot-outro-14.png`, `-34.png`). Rain also falls through #21's tour and the #34 party is thin. Scenes do not pin the weather.
  - Where: `ch1d.ts`, `m21-penthouse-viewing.ts`, `m34-forty-seven-wrenches.ts`.
  - Editor's fix: a crowd (8–12 extras) on the tiers and bunting for the ribbon; a `weather: 'clear'` override for scenes whose mood needs it (G9 owns the mechanism).
  - Decision: D49 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G10/`: `founders-boot-outro-14.png`, `34.png`, `founders-boot-outro-14`
- **G11#16** (blocker, craft · **must**, D49) Night scenes are too dark to read, including #50's key frame
  - What: In `m50-trellisdown-tasting-mid` the Countess's intro card plays over an almost black frame (her silhouette only), and the shot where Vesper turns to the player, the act's emotional fulcrum, is unreadable dark blue. In `m44-the-bathtub-queen-outro` Samphire's …
  - Where: `shots/G11/m50-trellisdown-tasting-mid-20.png`, `-28.png`; `m44-the-bathtub-queen-outro-28.png`; `m39-couch-surfing-outro-30.png`.
  - Editor's fix: Add key lights for night scenes: the scene's props already include lanterns and lamp posts, so give the forecourt and the Queen's deck a warm practical light and a fill on faces in mcu/cu shots. Pin `weather` for sincere scenes. Coordinate the shared lighting fix with G9.
  - Decision: D49 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G11/`: `m50-trellisdown-tasting-mid-20.png`, `28.png`, `m44-the-bathtub-queen-outro-28.png`, `m39-couch-surfing-outro-30.png`, `m50-trellisdown-tasting-mid-20`
- **G11#17** (blocker, craft · **must**) The Test Cut's turn plays over empty frames, and the deck has no scale
  - What: In `m52-the-test-cut-p2-intro` the frame at about 24 s is solid flat orange (the camera is in the sky or inside geometry) at the moment the first blade should rise over the hedge. In `m52-the-test-cut-outro` Vesper's "Friends of Turfton... A date, for your …
  - Where: `shots/G11/m52-the-test-cut-p2-intro-24.png`, `m52-the-test-cut-outro-26.png`, `m52-the-test-cut-p2-outro-24.png`, `m52-the-test-cut-p3-outro-18.png`.
  - Editor's fix: Re-block the reveal as a low angle from the ninth green, with the deck rising over the hedge to fill the top of the frame (scale the `combine-test-deck` set piece 3-4x and let its blades turn). Put the loudspeaker horn and the crew in the broadcast shot, so "the longest day" is heard over faces. In the p3 outro, frame Pip in front of the passing blades. Run `?cutscenecheck` for occluders and re-shoot.
  - Re-check: `review/shots/G11/`: `m52-the-test-cut-p2-intro-24.png`, `m52-the-test-cut-outro-26.png`, `m52-the-test-cut-p2-outro-24.png`, `m52-the-test-cut-p3-outro-18.png`, `m52-the-test-cut-p2-intro-24`
- **G11#18** (polish, craft · **must**, D49) Key close-ups show the back of the speaker's head
  - What: Several mcu singles are framed from behind and above, so the speaker's face is turned away on their most important line: Ragwort's "All ten. I forgot how loud that is." (m41 outro), Driftwood's "Six months I said it was real." (m43 outro, the sincere beat) …
  - Where: `shots/G11/m41-pinwheel-ridge-outro-18.png`, `m43-saltbucket-boardwalk-outro-24.png`, `m52-the-test-cut-p3-outro-18.png`, `m46-starfall-at-the-anthill-outro-20.png`.
  - Editor's fix: For singles whose subject faces a third point (the sea, the ridge, the deck), move the camera to the subject's facing side (`toward` the subject's look target, not the listener). Re-shoot Wally's card at eye level. Also, in the m52 p2 intro, Thrift's held tool crosses his face.
  - Decision: D49 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G11/`: `m41-pinwheel-ridge-outro-18.png`, `m43-saltbucket-boardwalk-outro-24.png`, `m52-the-test-cut-p3-outro-18.png`, `m46-starfall-at-the-anthill-outro-20.png`, `m41-pinwheel-ridge-outro-18`
- **G12#10** (polish, craft · **must**, D49) The All Hats count is played in the dark, sometimes in the rain
  - What: all-hats-outro (night) frames Tansy's count as near-black silhouettes; the fire does not light faces; the world's weather leaks into scenes (rain in [all-hats-outro-042](shots/G12/all-hats-outro-042.png); see also …
  - Where: `cutscene/scenes/story/m64-all-hats.ts` (all-hats-p4-*, all-hats-outro), scene runner.
  - Editor's fix: a warm point light on the `campfire` prop in scenes (or `sky: 'dusk'` with lanterns lit), and a scene-level `weather: 'clear'` for story scenes (check the roof in #68 and the jam/hat too).
  - Decision: D49 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G12/`: `all-hats-outro-042.png`, `all-hats-outro-032.png`, `all-hats-outro-042`, `all-hats-outro-032`

### Decisions this epic applies (quoted from decisions.md)

**GR3. Stage sets are quest-scoped, and never sit on a road.**
- A story stage set is hidden outside its row's window: shown when the row becomes active (or when its scene plays),
  and removed when the row is done, unless a world change deliberately keeps it.
- No solid stage-set prop may overlap a road rectangle unless it is marked `overRoad` and is scene-only. Add the
  check as a test over `quests/stages/**` against `world.layout` roads (G1#1).
- Permanent traces of a beat (a door, a sign, a scar) go through `worldChanges`, not through the stage-set batch.

**GR6. Story scenes pin their weather and light their key frames.**
- The scene runner gets a scene-level `weather` override. The default for story scenes is `clear`, unless the scene's
  direction note asks for rain.
- Night and dusk scenes get a warm key light: a point light on the campfire, lantern or lamp prop, or a rim light on
  the speaker in close-ups.
- An intro card or a sincere close-up must never play over a near-black frame, or show the back of the speaker's
  head. Add both checks to `npm run cutscene-report` if they can be measured (mean luminance of key frames; speaker
  facing the camera). If not, cover them in the screenshot pass.
- Covers G10#3, G10#25, G11#16, G11#18, G12#10.

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D3. Stage sets in the Double Pot Tunnel (the HOA cell, the café table) — G1#1, G1#21 · **must**
- **Question:** the stage sets are permanent solid props in the traffic lanes, and they spoil #62.
- **Options:**
  - (a) Make the lockup a walk-in interior behind a door, as the lore says. Con: E21 found that scenes can't play
    inside interiors.
  - (b) Quest-scoped sets (GR3), moved off the road, with a permanent door in the tunnel wall. Pro: works with today's
    scene runner.
- **Lore:** `hoa-lockup.md`: "entered by a door in the Double Pot Tunnel".
- **Decision:** (b) now. The cells interior (a) is a **could**.
- **Fix round:**
  - Move the s62 lockup set behind the tunnel's west wall line (a recess, or the slab side), never in x 115..125, and
    show it only while #62 is active.
  - A permanent beige door with "HOA HOLDING (WAIT HERE)" and a speaker over it goes in the tunnel wall.
  - The s21 table moves to the Double Pot roof (see D5).
  - Pull every remaining set 0.15 m off façades (the zfight flicker).
  - Apply GR3 to every stage set in `quests/stages/story/` and add the road-overlap test.

#### D5. "Penthouse Viewing" has no penthouse, and the key is never hung — G10#6 · key **must**, set **should**
- **Options:**
  - (a) Build a beige one-room interior. Con: scenes can't play inside interiors.
  - (b) A beige roof-garden set on the Double Pot helipad roof (E05 walkable roof), quest-scoped (GR3).
  - (c) Change the lines only.
- **Decision:** (b) for the set. For the key: hang it in flat 3B.
- **Reason:** the user asked for new buildings and environmental storytelling. The roof already exists, and a
  promise in a choice must be kept.
- **Fix round:**
  - #21's tour plays on the roof set (a beige table, beige chairs, a beige pot, a view), with the lift kiosk fixed
    per G1#3.
  - A key prop on a hook by flat 3B's door, gated on `choiceOf('m21...') === 'A'`.
  - If the set cannot work, fall back to (c): change both lines to "the key is yours".

#### D49. Dark and rainy key frames — G10#3, G10#25, G11#16, G11#18, G12#10 · **must**
- **Decision:** GR6.
- **Fix round, per scene:**
  - #14: the bench close-up is reframed onto Pip's face. Dusk, not night, or a court floodlight on the bench.
  - #15 outro: 8–12 extras on the tiers, plus bunting.
  - #50 mid: Vesper's turn and the Countess's card, with a lantern key light.
  - #44 outro, the #39 culvert and the All Hats count: firelight on faces, pinned clear weather.
  - #50 (and others): fix the shots that show the back of a head.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- `StageSet.window`: shown from the row's activation (or its scene) to its completion; permanent traces go through `worldChanges`.
- A test over `quests/stages/**`: no solid prop overlaps a `world.layout` road rectangle unless `overRoad` and scene-only (GR3).
- `Scene.weather?: WeatherKind` (story default `clear`) and `Scene.keyLight?` (a warm point light on a named prop, or a rim light on the speaker for close-ups).
- `npm run cutscene-report` reports key-frame mean luminance and speaker facing (or the screenshot pass covers it, GR6).
- Could: a scene flag `clearAmbient: radius` for world-stage scenes (FX24 G12#11 uses it if it lands; otherwise FX24 closes the meridian through worldChanges).

## Contracts this epic consumes from earlier epics

- None.

## Online / mobile / achievements / prefabs / lore notes

- Do not edit cutscene/cast.ts (FX06 owns it this wave).
- Dialogue in the scene files belongs to the act epics (FX22-FX24, later waves). Here only cameras, lights, weather, extras and set pieces change.
- D5 set: #21 plays on a beige roof-garden set on the Double Pot helipad roof (E05 walkable roof), with FX02's fixed lift kiosk. Fallback (c): change both lines to "the key is yours" and record it in rounds.md.

## Risks and open questions (with the decision taken)

- Scenes cannot play inside interiors (E21): every set stays in the open world.
- Hiding sets by quest window must not break the quest-sim suites: a scene that needs its set while the row is not yet active shows it for the scene.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX05/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- The road-overlap test and a window test (s62 set hidden before #62 is active and after it is done) pass.
- The key frames listed below re-shot from the cutscene-report or the scene shots read clearly on a 390 px screen.
- All 9 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
