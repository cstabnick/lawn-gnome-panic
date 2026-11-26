Epic: E21-2 act III wave A
Depends on: E21-1 (cast presets, props, achievements, story marks exist; the setup's stubs for every act III quest id)

**First read `docs/roadmaps/gta-batch-3/E21/issues/_quest-common.md` in full: it is the contract (files you own, the
StoryFile shape, the objective kinds and the area probes, the writing and scene rules, the checks, the report).**
Use scratch dir `C:\Users\cpsai\AppData\Local\Temp\claude\e21-A8`.

## Goal
Row 52 of the story outline is playable, directed, polished quest in the one-file-per-row layout, replacing the setup's stubs.

## Your files
- src/quests/story/52-the-test-cut.ts, src/cutscene/scenes/story/m52-the-test-cut.ts, src/quests/stages/story/s52-the-test-cut.ts
- `src/worldChanges/rows/mownScar.ts` (stub exists, registered): the W14 builder, "the mown scar" (read `docs/design/gnome-theft-auto/world-changes.md` W14 and `src/worldChanges/rows/moles.ts` for the builder style): a clean mown stripe across Hedgeworth Links along the test line, with props that tell it (a snapped flag, a cut hedge gap, the Flock standing beside it). **Anything flat on the ground takes a draw layer** (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`, rules `docs/rendering.md`), never just a small lift; no colliders. Add `src/worldChanges/rows/mownScar.test.ts` like `moles.test.ts`
- direction notes for your scenes

## The outline rows (verbatim; column header first)

| # | id | title | act | status | old id | giver (place) | region | prereq id | cast | beats | objective kinds | cutscenes | comms steps | reward and unlock | world change id | side quests it opens | notes |
| 52 | m52-the-test-cut | The Test Cut | 3 | extended | - | Dame Peony (Hedgeworth Clubhouse) | hedgeworth | m51-the-flock-stands | peony, basil, thrift, wisteria, vesper, tumblesoil, pip, tansy | (1) p1 Tee Time: caddy at the backers' gala, Vesper and the Countess on the terrace (2) p2 Mow Line: the Grand Combine wakes and cuts a test line, evacuate Peony, Basil, Thrift and the mole families ahead of it (3) p3 Against the Deck: attack it with everything, nothing works (4) final Through the Hedge: escape as Vesper broadcasts the date of the Even Cut (5) Hedgeworth keeps a mown scar | visit; probe; steal-deliver; crack; survive-derby; checkpoints | see Extended quest parts. intro: m52-the-test-cut-intro (day) Peony hands the player a caddy bib; outro: m52-the-test-cut-outro (night) the crew through the hedge, the loudspeaker over Turfton naming the longest day | 0 peony: caddy for the gala, I will say nothing; 1 pip: that is a very big blade; 2 tumblesoil: moles first, then the rest; 3 tansy: nothing works, go; 4 vesper: the Even Cut, on the longest day | 1,800 acorns; part 4 of 4 (deck) seen but not stopped; Hedgeworth allies fully committed; the Even Cut date in the journal | W14 | `sq-hedgeworth-members-cup` | Previously: the Flock, the moles and Peony are at Hedgeworth for the test, and the crew holds the other three parts. Act III turn. L58: drops the mole families at the Burrow Door when evacuated. L83: hedgeworth (follows waders-rest, so no run of three). fallback: Against the Deck as a survive-derby where the Combine is a set-piece and cannot be damaged. prefab needed: combine-test-deck, caddy-bib. mobile: no new control |

## Extended quest parts (verbatim)

| part id | row | title | objective(s) | cutscene (time of day) | cast | notes |
| m52-the-test-cut-p1 | 52 | Tee Time | visit (caddy a bag across the terrace at the backers' gala); probe (overhear Vesper and the Countess) | m52-the-test-cut-p1-intro (day) Peony hands the player a caddy bib; mid: m52-the-test-cut-p1-mid (dusk) Vesper on the terrace tells the Countess the blade will cut a straight line through the ninth | peony, wisteria, vesper, basil | prereq m51-the-flock-stands; reward 250 acorns; the Countess flinches at Vesper's words |
| m52-the-test-cut-p2 | 52 | Mow Line | steal-deliver (evacuate Peony, Basil, Thrift and the mole families ahead of the cut); crack (HOA marshals blocking the Clubhouse path) | m52-the-test-cut-p2-intro (dusk) the earth shakes and the first blade appears over the hedge; outro: m52-the-test-cut-p2-outro (dusk) the Combine's line drawn across the course | peony, basil, thrift, tumblesoil | prereq m52-the-test-cut-p1; reward 400 acorns; L58: drops each evacuee at the Clubhouse or the Burrow Door |
| m52-the-test-cut-p3 | 52 | Against the Deck | survive-derby (hit the Combine's deck with everything for 60 seconds; nothing works) | m52-the-test-cut-p3-intro (dusk) the deck rolls toward the ninth green; outro: m52-the-test-cut-p3-outro (dusk) the blades pass over the player's best attack and keep turning | pip, tansy, peony | prereq m52-the-test-cut-p2; reward 400 acorns; Tansy and Pip join by radio call |
| m52-the-test-cut | 52 | Through the Hedge | checkpoints (escape through the hedge to the Kicked Board with the Combine behind) | intro: m52-the-test-cut-intro (dusk) Vesper on every loudspeaker; outro: m52-the-test-cut-outro (night) the longest day named across Turfton, the crew at the board | peony, basil, thrift, vesper, tansy | prereq m52-the-test-cut-p3; final part records the save; reward 750 acorns plus the parts' above; W14 appears after it; Vesper's broadcast gives the date of the Even Cut |
| m52-the-test-cut | Nothing Works | Survive Against the Deck for the full 60 seconds without cracking a gnome | hand: prefab needed: golf-umbrella |

## Act context (verbatim from the outline)

## Act 3: Cold Clay, Far Edges (rows 36-53)

The crew is on the run after the Salvage Raid: Side-Valve is seized, the Golden Acorn is gone, Pip's arm is cracked off
and Tansy has vanished. The question is whether a broken crew can find friends at the edges of the map before Vesper
finishes the Grand Combine. A radio fished out of Pail Pond (#38) shows the Combine is built in four parts: power
(Pinwheel Ridge), guidance (Rootwell), deck (Hedgeworth) and money (Trellisdown). The player wants the parts stopped and
learns that every edge has its own people: skiers, rally racers, a pirate, a professor, golfers, moles, a flock. Tension
runs 4 at the Fells, a warm 4 at the lodge and couch (#37-#39), climbs through the part hunts (5 at #41-#44, 6 at the
Anthill, 7 at Trellisdown) and peaks at 8 when the Combine cuts its test line and Vesper names the date of the Even
Cut (#52); #53 is the cold-air coda that points at act IV. Pip thaws toward the crew, Cam is off stage, Lulu and the
Carburettors get their own scenes, Peony and Basil go from Vesper's tenants to allies, and Vesper and the player share
one frame for the first time (#50). Regions: frostbite-fells, snowcap-rise, downtown, capwood, pinwheel-ridge, rutbottom,
saltbucket-shore, rootwell, hedgeworth, loamdeep, trellisdown, waders-rest. Sincere beats: #43 (Driftwood), #48
(Basil), #52 final. Laughs sit between them: #44, #45, #47, #51. The four parts, in the order the crew takes them: power
(#41), guidance (#46), money (#50), deck (#52, tested and not yet stoppable).

## Places: read these for coordinates, activities and hooks

- `docs/roadmaps/gta-batch-3/E15/contracts.md`, `docs/roadmaps/gta-batch-3/E32/roadmap.md`, `src/golf/types.ts` (`GOLF_ORIGIN`, `YARD`, `CLUBHOUSE`, `KICKED_BOARD`, `MEMBERS_GATE`, `POTTING_SHED`, `GOLF_PROBES`), `src/golf/clubhouse.ts` (interior), `src/quests/golfQuests.ts` (givers `peony`, `basil`, `thrift`), the golf stage files in `src/quests/stages/`
- `docs/roadmaps/gta-batch-3/E17/contracts.md`, `src/societies/config.ts` (`BURROW_DOOR`, `WADERS_REST`, `SOCIETY_PROBES`), `src/societies/loamdeep/interior.ts`, `src/societies/loamdeep/moleman.ts`, `src/quests/loamdeepQuests.ts`, `src/quests/societyQuests.ts` (givers `tumblesoil`, `nubbin`, `saxifrage`), `src/worldChanges/rows/moles.ts` (W13)

## Intro cards to place (first story appearances)

none new (Peony and Basil are carded in row 47, Wisteria in row 50, by other workers; Vesper, Tansy, Pip, Thrift, Tumblesoil already).

## Decisions and notes for these rows (the lead's; they override the outline where they differ)

- **Extended row: the act III -> IV turn.** QuestDefs in play order: `m52-the-test-cut-p1`, `-p2`, `-p3`, then
  `m52-the-test-cut` (final). Prereqs chain p1 <- `m51-the-flock-stands`, p2 <- p1, p3 <- p2, final <- p3 (stubs show
  it). Rewards per the parts table (250, 400, 400, final 750). Copy the structure of `src/quests/story/35-salvage-raid.ts`
  and `m35-salvage-raid.ts` (E20's extended row) exactly.
- p1 Tee Time: `visit` caddying a bag across the Clubhouse terrace at the backers' gala (prop `caddy-bib` in Peony's
  hand in the intro), `inspect` verb 'Overhear' at the terrace (Vesper and the Countess; `scene` the p1 mid, dusk: Vesper
  says the blade will cut a straight line through the ninth; the Countess flinches). p2 Mow Line: `passenger` evacuations
  (Peony to the Clubhouse; a mole family (`who: 'nubbin'` or `'tumblesoil'`) to the Burrow Door `BURROW_DOOR`), then
  `crack` HOA marshals blocking the Clubhouse path; the p2 intro is the earth shaking and the first blade over the hedge
  (cutscene-only Combine: prefabs `combine-test-deck`, `grand-combine-boss` scaled as a set piece). p3 Against the Deck:
  `survive-derby` 60 s on the ninth (the Combine cannot be damaged; the outro shows the blades pass over the player's best
  attack and keep turning); Tansy and Pip join by radio call. Final Through the Hedge: `checkpoints` escaping through the
  hedge arches to the Kicked Board (`KICKED_BOARD`) with the Combine behind; intro Vesper on every loudspeaker, outro
  night: the crew at the board, the loudspeaker over Turfton naming the longest day as the date of the Even Cut.
- Tension 8, the act's peak. The final outro is **sincere** (no gag on top). Vesper is stopped later, not shattered: he
  is cold and polite here, never cartoonish. The four parts: power, guidance and money taken, the deck seen but not stopped.
- W14 (the mown scar) fires on the final (you build its props, file above). `achievement: 'gta-nothing-works'` on the
  final. Journal item: "The date of the Even Cut: the longest day". Leave the world in the state the outline names so act
  IV starts from a known save: Hedgeworth keeps the scar, the allies are committed.
- Achievements, unlocks and W-ids are already wired to your ids by the setup; your quest only has to be finishable.
