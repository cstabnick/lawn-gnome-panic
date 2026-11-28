# FX16 Hedgeworth Links, Loamdeep, the Flock's tent and the manor hall
Wave: 5 · Depends on: FX01, FX02, FX03 · Kind: Fix (content)
Findings: 10 (G6#5, G6#6, G6#7, G6#14, G6#15, G6#16, G6#17, G6#19, G6#21, G6#24) · Decisions: D19, D58

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Hedgeworth looks like a giant's garden golf course (rough, tees, mounding, a visible Drip), DJ Moleman's burrow is the warmest reveal in the game (D19), Loamdeep's tunnels have a ceiling, and the tent and the tasting hall are rooms worth entering.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- golf/** except hud.ts and runtime.ts swing (FX03 did those): greens.ts, yard.ts, course.ts, clubhouse.ts
- societies/loamdeep/** (moleman.ts, interior.ts, hallsEast.ts, hallsWest.ts, surface.ts, door.ts)
- societies/flock/tent.ts
- country/manorInterior.ts
- packages/prefabs: golf umbrella, tee kit

### Findings (10)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G6#5** (polish, craft · **should**) Hedgeworth's rough is covered in identical mud mounds with bulrushes.
  - What: - `golf/yard.ts:254` fills 38 % of the rough band (and the ring round every green) with `reed-bed`, a marsh prefab with a big brown soil base. - Hosepipe Pond's ring and the Drip add more (`golf/greens.ts:242`). - The result is hundreds of raised brown ovals …
  - Where: whole course, worst round holes 4–6 and the Turn.
  - Editor's fix: - Use `reed-bed` only on pond and Drip margins (where it belongs). - Fill the rough with base-less grasses (`ornamental-grass`, `giant-grass-blade`, a seed-head grass) in two or three heights. - Vary the density: thicker away from the fairway.
  - Re-check: `review/shots/G6/`: `turn`, `shed`
- **G6#6** (polish, craft · **should**) Tee boxes and tee markers look placeholder.
  - What: - Every tee is a flat, unlit, saturated lime square with hard edges. - The two tee markers are blue spheres about the size of the gnome's head (`shots/G6/maze`, `drip`, E32 `hole5`, `hole7-round`). - On hole 7 the lime square sits on the shed roof like a …
  - Where: `golf/greens.ts` (tee decal, `tee-marker` placements).
  - Editor's fix: - Make tees a slightly raised, mown-striped rectangle with a darker fringe and soft corners, coloured like the fairway stripes but lighter. - Scale the markers to about 0.35, or give each hole its own marker (acorns, thimbles, a pair of snail shells on the Drip): a cheap place for jokes. - Add a small ball washer or tee bench by some tees.
  - Re-check: `review/shots/G6/`: `maze`
- **G6#7** (polish, craft · **should**) The course is flat and the giant plants are thin.
  - What: - Fairways are flat stripes on flat ground, and greens are flat discs. In `shots/G6/rhubarb` and `clubhouse-front` the course is a striped lawn to the horizon. - 110 "giant plants" are spread over a 300 x 560 m yard. The low hedges (1.2 m after E32) don't …
  - Where: `golf/yard.ts` (giants loop), `golf/course.ts`.
  - Editor's fix: - Add gentle mounding along fairway edges and behind greens (a visual-only height offset where the ball does not roll, or a small `courseGroundY` tweak with tests). - Group the giant plants into a few big stands per hole (hostas round a green, a foxglove spinney at a dogleg) instead of a thin, even scatter. - Raise some of the perimeter hedges to 3–4 m.
  - Re-check: `review/shots/G6/`: `rhubarb`
- **G6#14** (polish, spirit · **should**, D19) DJ Moleman's burrow is a big, empty square, and the star mole is hard to see.
  - What: - Lore: "a snug round room… decks against the north wall". The game has an 18 x 14 m square brown box with a small desk far away, two speakers and a floor-to-ceiling black pole (the "NOT THE TRANSMITTER" joke, which reads as a render glitch because its sign …
  - Where: `societies/loamdeep/moleman.ts` (size, layout).
  - Editor's fix: - Shrink the room to about 8 m and make it round, with curved wall segments or a ring of earth posts. - Bring the decks and DJ Moleman to the middle of the north wall under a warm lamp. - Fill the walls with stacked records, a kettle, a supper plate under a cloche (his family's kept supper, a cute echo of Loamdeep), cables running into the ceiling and a hat stand with no hats. - Make the pole a thin root with a big …
  - Decision: D19 (quoted in full under "Decisions this epic applies").
  - Re-check: `review/shots/G6/`: `int-moleman-burrow`
- **G6#15** (polish, craft · **must**, D58) Loamdeep's entry tunnel is a flat-walled corridor under a black void.
  - What: The tunnel is two vertical brown planes with no ceiling in view: black above the walls, and gaps where you see over a wall into the next hall (`shots/G6/int-loamdeep`; E17's `interior-loamdeep` too).
  - Where: `societies/loamdeep/interior.ts`, `hallsEast.ts`, `hallsWest.ts` (wall heights, ceiling).
  - Editor's fix: - Add a visible low ceiling (warm earth colour, roots hanging) and make the walls meet it. - Arch the tunnel with timber props every few metres. - Use more `mole-lamp-lit` with warm pools of light. - Lay a woven runner on the floor.
  - Decision: D58 row "Elevated undersides as black voids" (quoted in full under "Decisions this epic applies").
  - Split: D58: the emissive underside floor material. FX16 builds the Loamdeep ceiling, props and lamps. (part done by FX01)
  - Re-check: `review/shots/G6/`: `int-loamdeep`
- **G6#16** (polish, craft · **should**) The Flock's "Big Tent" is a plain rectangular room.
  - What: Inside, it is flat walls, a flat ceiling, eight grey floor mats and one shelf (`shots/G6/int-flock-tent`). Nothing says "tent", and there is no pink anywhere (the Lady's colour).
  - Where: `societies/flock/tent.ts`.
  - Editor's fix: - Add a centre pole and sloping canvas panels (angled blocks) from the pole to the walls, plus guy-rope shadows. - Add a pink ribbon shrine facing west (lore: she faces west), a stack of tea cups and the "owed cups" tally board. - Put reed mats instead of grey squares.
  - Re-check: `review/shots/G6/`: `int-flock-tent`
- **G6#17** (polish, craft · **should**) Brassknock's tasting hall is sparse and murky.
  - What: A 26 x 16 m hall holds one rug, one table, two urns, one bookcase, two fireplaces and three bare window holes. The cream walls and ceiling of `HALL_THEME` render as brown-grey (`shots/G6/int-brassknock-manor`).
  - Where: `country/manorInterior.ts`.
  - Editor's fix: - Brighten the light. - Add window frames and curtains, a chandelier, a long table laid with thimble glasses and grape-dew bottles, and a barrel rack. - Put up the promised portraits large enough to read. - Add dust sheets over a few chairs (most rooms are shut).
  - Re-check: `review/shots/G6/`: `int-brassknock-manor`
- **G6#19** (polish, craft · **should**) The clubhouse's "golf umbrella drying by the door" is a huge red-and-white café parasol.
  - What: `glaze-canopy-umbrella` at size 1.2 with a blue tint (0x2e4a7a) renders untinted (red/white) and gnome height, right at the entrance, blocking the view in (`shots/G6/int-hedgeworth-clubhouse`).
  - Where: `golf/clubhouse.ts:210`.
  - Editor's fix: - Use a golf-umbrella prefab (or add one: a smaller dome, a straight shaft and a hook handle), lying half-open on its side at about 0.6. - Check why the tint isn't applied.
  - Re-check: `review/shots/G6/`: `int-hedgeworth-clubhouse`
- **G6#21** (polish, craft · **should**) The Burrow Door's porch is a box stuck on a blob.
  - What: The door frame is a square timber box that sticks out of the side of a smooth, low-poly dome. Its side faces show, and nothing (grass, stones, roots) blends the joint. The mound itself is a bare green dome on a flat lawn (`shots/G6/burrow`, `burrow-close`).
  - Where: `societies/loamdeep/surface.ts`, BURROW door (-993.5, 300).
  - Editor's fix: - Sink the porch into the mound (or add earth cheeks either side), and ring the door with stones and roots. - Add tufts and flowers on the dome, a tiny mole-height letterbox, a boot scraper and molehills trailing off toward the golf course (the "mole by the ninth green" thread).
  - Re-check: `review/shots/G6/`: `burrow`
- **G6#24** (polish, craft · **should**) Hole 6's water carry ("The Drip") can't be seen from its tee.
  - What: From the 6th tee you see the giant birdbath standing on grass and a field of reed mounds. The Drip's water is a flat decal at ground level, hidden behind the rough's `reed-bed` mounds and its own ring of reeds every 6 m (`shots/G6/golf6`; E32's own `hole6` …
  - Where: `golf/greens.ts:231-243` (pond disc and reed ring), `golf/yard.ts` grass band; hole 6 tee (-1282, 932).
  - Editor's fix: - Keep the line from the tee to the green clear of reeds. - Put reeds only on the far and side banks. - Sink the water about 0.3 m into a visible bank (edge ring in `LAYER.decal`) with a lighter, glinting surface. - Add the leaking hosepipe's ripples so it reads at a glance. - Check hole 1's Hosepipe Pond the same way.
  - Re-check: `review/shots/G6/`: `golf6`

### Decisions this epic applies (quoted from decisions.md)

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D19. DJ Moleman's burrow — G6#14 · **should**
- **Decision:**
  - About 8 m across and round, with curved wall segments or a ring of earth posts.
  - The decks and Moleman at the middle of the north wall, under a warm lamp.
  - Stacked records, a kettle, a supper plate under a cloche, cables into the ceiling, and a hat stand with no hats.
  - The pole becomes a thin root with a large "NOT THE TRANSMITTER" sign.
- **Reason:** L50 ("cute but misunderstood ... make DJ Moleman make an appearance"). This should be the warmest
  reveal in the game.

#### D58. Defects found by several groups (rows that apply here) · **must**

| Defect | Found in | The one fix |
|---|---|---|
| Elevated undersides as black voids | G1#5, G6#15 | An emissive floor on underside materials, plus tunnel and deck lamps (G1#5's dressing). |


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- Golf grass cell culling stays importable (FX15 reuses it).

## Contracts this epic consumes from earlier epics

- FX01 underside material (Loamdeep ceilings). FX02 interior camera clamp. FX03 golf HUD and swing.

## Online / mobile / achievements / prefabs / lore notes

- Also: FX01 does the shared underside material for G6#15; here the Loamdeep ceiling, timber props and lamps.
- GR10 keeps the kind, misunderstood moles and the gentle Flock.

## Risks and open questions (with the decision taken)

- Golf mounding must not change ball physics: a visual-only offset or a `courseGroundY` tweak with tests.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX16/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- `golf` tests green; hole 6 tee shot shows the water carry.
- All 1 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.

## Added after FX01 (orchestrator)

- `interiors/kit.ts` draws Moleman's "KICK DRUM" sign with its own text code: switch it to FX01's `layoutPlate`.

## Added after FX03 (orchestrator)

- G6#25 (partly fixed by FX03): the golf tee camera needs to sit higher (`golf/view.ts`). Use FX03's `src/activityMode.ts` for any golf HUD.
