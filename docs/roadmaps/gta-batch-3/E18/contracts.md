# E18 contracts: side-quest pacing, world changes, the Dewdrop, hobby intros

For E20-E22 and anyone adding side quests or world changes. Code: `games/gnome-theft-auto/src/`.

## Side-quest pacing (L67)

- `quests/storyRows.ts`: `STORY_ROWS` (all 70 spine ids -> row, built or not), `offerCap(row)` (3 in act I rows 1-15,
  4 in act II rows 16-35, 6 from row 36), `OFFER_WINDOW` = 4.
- `quests/unlocks.ts` `SIDE_UNLOCKS: { questId, after, why, planned? }[]`. `after` is a **built** main quest. `planned` is
  the spine row the schedule (`docs/design/gnome-theft-auto/side-quest-schedule.md`) wants where that main quest is not
  built yet. `unlockMet` / `unlockRule` / `isQuestAvailable` are unchanged: a quest is *takeable* once `after` is done
  (started or finished quests stay unlocked; old saves lose nothing).
- `quests/pacing.ts` `sidePacing(saves, quests) -> { row, beats, cap, offered, later, upcoming }` decides what is
  *offered* (journal Open tab, map marker and beam, the "new side job" notice):
  1. Unlocked roots join a queue at their beat (table order). Each beat, offers older than `OFFER_WINDOW` main quests
     (their own beat and three more) leave the list, then the queue fills free slots up to `offerCap`. Simulated as if
     the player plays no side quests, so it is stable and needs no save.
  2. Live: anything started or finished frees its slot and the queue moves up. Chain follow-ups (a `prereq` that is a
     side quest) come first, offered for `OFFER_WINDOW` beats from the prereq's `QuestSave.doneAt` (the engine records
     the number of main quests done on every completion).
  3. Everything else unlocked and takeable is on the journal's **Later** shelf: still taken by walking up to the giver,
     no map marker, no notice. The journal also shows up to three "Coming up" quests (unlock with the next main quest).
- Test (`quests/unlocks.test.ts`): every `after` is a built main quest with a row; every `planned` is a spine row **not
  built yet** (the test fails as soon as you build it: then move `after` onto it and drop `planned`); no chain unlocks
  before its prereq; a story-only playthrough never exceeds the cap; nothing is lost (offered or on the shelf at the end).
- Adding a side quest: add a `SIDE_UNLOCKS` row at the beat where its giver has appeared in the story. Do not raise caps.

### Hand-off: unlocks waiting for their story row

| side quest | now after (built) | moves to (planned row) | epic |
|---|---|---|---|
| `sq-levelright-night-shift` | `ch1-tax-break-in` (#8) | #7 `m07-even-estates` | E20 |
| `sq-big-lou-embargo` | `ch1-two-coat-tail` (#6) | #9 `m09-where-asphalt-sleeps` | E20 |
| `sq-dewdrop-1` | `ch1-founders-boot` (#15) | #10 `m10-under-the-span` | E20 |
| `sq-underspan-verticality` | `ch1-founders-boot` (#15) | #10 `m10-under-the-span` | E20 |
| `nc-bent-pin` | `ch1-tax-break-in` (#8) | #11 `m11-the-dons-cigars` | E20 |
| `sq-court-regulars` | `ch1-founders-boot` (#15) | #14 `m14-drainpipe-court` | E20 |
| `nc-lockup` | `ch2-dew-run` (#16) | #17 `m17-the-dew-buyer` | E20 |
| `sq-castaway-drydock` | `ch2-sprinkler-gauntlet` (#18) | #19 `m19-squall-box-forecast` | E20 |
| `sq-porcelain-blues` | `ch2-vespers-offer` (#20) | #21 `m21-penthouse-viewing` | E20 |
| `city-penthouse-exclusive` | `ch2-vespers-offer` (#20) | #22 `m22-off-air` | E20 |
| `sq-fescue-fugitive` | `ch2-unmowed-tablet` (#23) | #24 `m24-the-burrow-door` | E20 |
| `nc-reedwatch` | `ch2-vespers-offer` (#20) | #25 `m25-one-leg-to-stand-on` | E20 |
| `sq-burrow-post` | `ch2-unmowed-tablet` (#23) | #25 `m25-one-leg-to-stand-on` | E20 |
| `sq-flock-errands` | `ch2-unmowed-tablet` (#23) | #27 `m27-heap-of-trouble` | E20 |
| `sq-dewdrop-2` | `ch3-salvage-raid` (#35) | #28 `m28-sibling-rivalry` | E20 |
| `sq-hedgeworth-lost-balls` | `ch3-salvage-raid` (#35) | #29 `m29-the-kicked-board` | E20 |
| `race-rookie-mowdown` | `ch3-salvage-raid` (#35) | #30 `m30-cams-big-night` | E20 |
| `sq-windfall-croft-deed` | `ch2-sprinkler-gauntlet` (#18) | #31 `m31-granny-cracks` | E20 |
| `nc-hangar-and-boathouse` | `ch2-unmowed-tablet` (#23) | #32 `m32-driftwoods-chart` | E20 |
| `sq-dewdrop-3` | `ch3-salvage-raid` (#35) | #33 `m33-the-bench-lock` | E20 |
| `nc-party` | `ch2-unmowed-tablet` (#23) | #34 `m34-forty-seven-wrenches` | E20 |
| `sq-snowdrop-sled-trials` | `ch3-kiln-resin-ice` (#36) | #38 `m38-pail-pond` | E21 |
| `sq-pail-pond-lines` | `ch3-kiln-resin-ice` (#36) | #39 `m39-couch-surfing` | E21 |
| `race-capwood-open` | `ch3-kiln-resin-ice` (#36) | #40 `m40-the-capwood-run` | E21 |
| `sq-tessie` (TESSIE.questId) | `ch3-kiln-resin-ice` (#36) | #40 `m40-the-capwood-run` | E21 |
| `sq-capwood-cap-count` | `ch3-kiln-resin-ice` (#36) | #41 `m41-pinwheel-ridge` | E21 |
| `race-rutbottom-knobbly` | `ch3-kiln-resin-ice` (#36) | #42 `m42-rutbottom-impound` | E21 |
| `race-lowrider-derby` | `ch3-kiln-resin-ice` (#36) | #43 `m43-saltbucket-boardwalk` | E21 |
| `sq-rutbottom-heats` | `ch3-kiln-resin-ice` (#36) | #44 `m44-the-bathtub-queen` | E21 |
| `coast-boardwalk-tubing` | `ch4-runway-flares` (#55, `COAST_UNLOCK_AFTER`) | #45 `m45-rootwell-admissions` | E21 |
| `coast-spokewheel-gondola` | `ch4-runway-flares` (#55, `COAST_UNLOCK_AFTER`) | #45 `m45-rootwell-admissions` | E21 |
| `coast-bathtub-tours` | `ch4-sandpit-drop` (#57) | #46 `m46-starfall-at-the-anthill` | E21 |
| `coast-queens-treasure` | `ch4-sandpit-drop` (#57) | #46 `m46-starfall-at-the-anthill` | E21 |
| `sq-rootwell-lost-essay` | `ch3-tundra-drift-run` (#53) | #47 `m47-hedgeworth-links` | E21 |
| `sq-anthill-rent` | `ch3-tundra-drift-run` (#53) | #48 `m48-the-groundskeepers-secret` | E21 |
| `sq-hedgeworth-pro-lesson` | `ch3-tundra-drift-run` (#53) | #49 `m49-loamdeep` | E21 |
| `sq-hedgeworth-ninth-green` | `ch3-tundra-drift-run` (#53) | #50 `m50-trellisdown-tasting` | E21 |
| `sq-loamdeep-lamps` | `ch3-tundra-drift-run` (#53) | #50 `m50-trellisdown-tasting` | E21 |
| `sq-loamdeep-under-chorus` | `ch3-tundra-drift-run` (#53) | #50 `m50-trellisdown-tasting` | E21 |
| `sq-hedgeworth-members-cup` | `ch3-tundra-drift-run` (#53) | #52 `m52-the-test-cut` | E21 |
| `race-snail-endurance` | `ch3-tundra-drift-run` (#53) | #54 `m54-the-heist-board` | E22 |
| `sq-hum-at-three` | `ch4-spade-truce` (#59) | #60 `m60-the-moles-dig` | E22 |
| `sq-porcelain-support` | `ch4-sandpit-drop` (#57) | #66 `m66-porcelain-hearts` | E22 |

Deviations from the schedule, kept on purpose: `city-kerbside-rounds` stays after `ch1-mowers-keepers` (#4), not #18,
because the Impound Run at #8 needs it; `nc-sky-spotting` after `ch2-sprinkler-gauntlet` (#18); `nc-tuft-and-tally`
after `ch2-unmowed-tablet` (#23, the schedule row). Not built yet (no rows): `sq-hyssop-stairwell` (#5),
`sq-chef-first-shift` (#13), `sq-pinwheel-linemen` (#42), `sq-trellisdown-pickers` (#51), `sq-hedgeworth-reseed` (#56),
`sq-fort-fence` (#61): add their rows with the quest.

## World changes (L68)

- `worldChanges/defs.ts` `WORLD_CHANGES: { id, title, after[], planned?, hides?, where, bulletin, bulletinB? }[]`:
  on when every `after` quest is done and no change that is on lists it in `hides`. Derived from the quest save, no
  new key. `activeWorldChanges(saves)`, `isChanged(id, saves?)`, `endingOf(saves)` (W17 reads `QuestSave.ending`, set by
  the finale's 'choice' objective).
- `worldChanges/registry.ts` `registerWorldChange(id, (ctx) => ({ root, update?, hide? }))`; builders live in
  `worldChanges/rows/*.ts` and are imported by `rows/index.ts`. `ctx = { scene, groundY, night, ending }`. A builder makes
  a separate group of prefabs/signs/stand-ins; the runtime (`worldChanges/runtime.ts`, wired in app.ts) adds it while on
  and plays the row's Turfton FM bulletin (`EVENT_BULLETINS['world-<id>']`) the first time the player drives after it
  turned on in play. `?worldchange=W03,W08` forces changes on for screenshots.
- Same `planned` rule as unlocks (`worldChanges/worldChanges.test.ts`), plus: every row whose quests are all built has a
  builder.

| id | what | now after | planned | built |
|---|---|---|---|---|
| W01 | flat 3B is home | `m02-roof-on-credit` | – | yes |
| W02 | Even-Estates hoardings (hidden by W17) | `ch1-tax-break-in` | `m07-even-estates` | yes |
| W18 | Even-Estates show-homes (stay after W17) | `ch1-tax-break-in` | `m07-even-estates` | yes |
| W03 | Founders' Green opens | `ch1-founders-boot` | – | yes |
| W04 | Gnertrude's is open | `ch2-vespers-offer` | – | yes |
| W05 | the Double Pot tops out | `ch2-unmowed-tablet` | `m21-penthouse-viewing` | yes |
| W06 | moles are neighbours | `ch2-unmowed-tablet` | `m24-the-burrow-door` | yes |
| W07 | Side-Valve party bunting | `m34-forty-seven-wrenches` (dormant) | – | no: E20 builds it with m34 |
| W08 | Side-Valve seized | `ch3-salvage-raid` | – | yes |
| W09 | a second tenant in 3B | `ch3-kiln-resin-ice` | `m39-couch-surfing` | yes |
| W10 | the lights are steady | `ch3-tundra-drift-run` | `m41-pinwheel-ridge` | yes |
| W11 | tubes: they float | `ch4-runway-flares` | `m44-the-bathtub-queen` | yes |
| W12 | the dome is open | `ch3-tundra-drift-run` | `m46-starfall-at-the-anthill` | yes |
| W13 | a root stall on Bodega's street | `ch4-runway-flares` | `m49-loamdeep` | yes |
| W14 | the mown scar | `m52-the-test-cut` (dormant) | – | no: E21 builds it with m52 |
| W15 | coalition colours | `ch4-spade-truce` | `m60-the-moles-dig` | yes |
| W16 | all hats | `m64-all-hats` (dormant) | – | no: E22 builds it with m64 |
| W17 | after the Even Cut (Ending A clover / B neon) | `ch5-even-cut` | – | yes |

## The Dewdrop (L54)

- `VehicleKind 'bubble-mobile'` (config `VEHICLES['bubble-mobile']`, prefab `gta-dewdrop`, handling profile, synced
  online like any vehicle). `dewdrop/config.ts`: `bubbleUnlocked(saves?)`, `DEWDROP_BAY`, `DEWDROP_PRICE` 400,
  `DEWDROP_ACH`. Quests `sq-dewdrop-1..3` (`quests/dewdropQuests.ts`, giver `hogweed`); `dewdrop/runtime.ts` parks the
  player's ball at the workshop once unlocked, sells replacements there, and counts Hamster Hour.
- Achievements: `gta-roll-with-it` (finish sq-dewdrop-3, reward `gta-bubble-visor` head), `gta-hamster-hour`,
  `gta-rod-comb-notebook` (all three hobby intros, reward `field-binoculars` neck).

## Hobby intros (L66)

`nc-bent-pin` (Wenna Gudgeon, giver `club-bent-pin`), `nc-tuft-and-tally` (Hazel Mattock, `club-lodge`), `nc-reedwatch`
(Dunnock Pell, `club-reedwatch`) are given by the teacher at the hobby's own place, still count as Newcomers' Card
stamps, and each teacher has an intro card (`cutscene/castIntros.ts`) shown once when first met (`hobbyIntros.ts`).
E20: when m11/m25 exist, move the two planned unlocks (table above) and consider a story line that sends the player to
the teacher.
