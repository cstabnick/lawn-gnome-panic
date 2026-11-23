# Re-direction lanes (step 2 of the direction pass)

Four lanes re-direct every story and side scene against [bible.md](bible.md), in parallel. Each lane owns its files and
nothing else (two lanes never edit the same scene file). For each scene, in the order below:

1. Watch it (`http://localhost:5310/?no-intro&cutscene=<id>`) and read its block in the report
   (`npm run cutscene-report -w games/gnome-theft-auto`).
2. Copy [TEMPLATE.md](TEMPLATE.md) to `scenes/<id>.md` and fill it. The standard: [scenes/mowers-keepers-intro.md](scenes/mowers-keepers-intro.md).
3. Re-direct the scene (`direct.ts` helpers, `frame` shots, the dialogue pass). Set `direction: { notes: ... }`.
4. Make it pass: the report shows it OK (or only waived faults, each with a reason), `npm test -w games/gnome-theft-auto`
   passes, including line of sight. Then delete its id from `src/cutscene/pacing.baseline.ts`.
5. Watch it again, at desktop size and in a phone-sized window.

Counts are from the first report on this branch (normal text speed). "Order" is the order to tackle them: the scenes the
most players see and the story leans on most come first. Shared fixes first where a lane has them.

Totals at the start: Story A 21 scenes / 172 faults (1 done), Story B 13 / 95, Side A 17 / 202, Side B 26 / 239.
Examples (`street-pickup`, `pull-up`, `back-room`: 9 faults) are engine samples in no lane; leave them in the baseline.

## Story A: prologue, chapters 1-2 (`scenes/story/ch1.ts`, `ch1b.ts`, `ch2.ts`, `ch2b.ts`)

Owns the hat ladder's first three rungs, the brass-wrench and Cam plants, and the new First Contract intro.

| Order | Scene | Kind | Length | Faults | Priority notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `prologue-intro` | chapter-open | 60.5 s | 9 | the game's first minute; narrator x3 -> 2; Pip's lines on a wide; the player's back; John's stage directions |
| 2 | `prologue-outro` | outro | 60.6 s | 9 | over length; opens on narration; plant the 47 wrenches and the cigar box, Pip dodging Fescue |
| 3 | `first-contract-intro` (new) | intro | - | - | write it: the quest still uses the old `{ kind: 'contract' }` wanted-poster card. Don Compost's three taps, silent (R-025); wire it in `chapter1.ts` |
| 4 | `first-contract-outro` | outro | 28.6 s | 7 | dead first shot; the guard's line unseen; the Narrator explains the joke |
| 5 | `mowers-keepers-outro` | outro | 43.5 s | 10 | pays off "not my bay, not my problem"; Vesper's first drive-by |
| 6 | `tax-break-in-intro` | intro | 62.2 s | 12 | Vesper's first visit in person: hat ladder rung 2, the only full "Shame if it cracked." |
| 7 | `two-coat-intro` | intro | 70.8 s | 18 | three dead shots, three line jumps, Juniper on wides |
| 8 | `two-coat-handover` | arrival | 17.1 s | 5 | hat ladder rung 1: "Nice hat." only |
| 9 | `two-coat-outro` | outro | 41.1 s | 6 | the Vance siblings' double act |
| 10 | `tax-break-in-outro` | outro | 30.2 s | 4 | the Grand Combine reveal: picture before Pip's line |
| 11 | `founders-boot-intro` | intro | 49.6 s | 5 | Pip's first "Okay, hear me out"; narration to cut |
| 12 | `founders-boot-outro` | chapter-close | 67.0 s | 8 | Vesper: "Then we stop asking." must be the button, then END OF CHAPTER 1 |
| 13 | `vesper-diner` | arrival | 37.9 s | 11 | the chapter 2 centrepiece: the offer; low singles on Vesper, no hat line (rung 3 is the offer) |
| 14 | `tablet-intro` | intro | 37.4 s | 14 | Bracken's back to camera on a wide for three lines; line jumps |
| 15 | `tablet-outro` | chapter-close | 44.9 s | 11 | the first sincere scene (no jokes, one silence), then Cam's sale as the closer's threat |
| 16 | `dew-run-intro` | chapter-open | 40.1 s | 8 | chapter 2's question in a picture; Granny's four-line briefing needs a turn |
| 17 | `dew-run-outro` | outro | 27.5 s | 11 | the debt paid: make it land |
| 18 | `vespers-offer-intro` | intro | 62.2 s | 7 | the invitation; Vesper off screen |
| 19 | `sprinkler-intro` | intro | 32.5 s | 7 | Rooster's prophecy |
| 20 | `sprinkler-outro` | outro | 28.8 s | 5 | Granny's pie (ladder rung 1) |
| 21 | `compost-forge` | arrival | 30.2 s | 5 | narration describes the forge: show it |

## Story B: chapters 3-5 (`scenes/story/ch3.ts`, `ch3b.ts`, `ch3c.ts`, `ch4.ts`, `ch4b.ts`, `ch4c.ts`, `ch5.ts`)

Owns the betrayal and the arm, the hat ladder's last rungs and payoff, Diggs's turn, the finale and the epilogue.

**Done** (plan: [../../../roadmaps/gta-redirect-story-b.md](../../../roadmaps/gta-redirect-story-b.md)): all 13 scenes have notes in
`scenes/`, pass the checker with no waivers and are out of the baseline (95 faults -> 0).

| Order | Scene | Kind | Length | Faults | Priority notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `salvage-raid-intro` | chapter-open | 84.0 s | 9 | the game's biggest dramatic beat: the arm breaks off camera, Tansy vanishes with a whoosh, the Narrator describes it all. Stage the betrayal and the arm; hat rung 4 "Nice hat. Shame." |
| 2 | `even-cut-outro` | chapter-close | 46.1 s | 19 | the ending: four dead shots in a row, wides, line jumps; every running joke pays off here |
| 3 | `even-cut-intro` | chapter-open | 48.2 s | 12 | the finale's call to arms; the brass wrench; no coordinates ("z = -300"); hat rung 5 on the PA |
| 4 | `tundra-outro` | chapter-close | 60.7 s | 9 | Tansy's first hug (shown, not narrated); the Combine fires; end on the threat, not Burt's phone call |
| 5 | `spade-truce-intro` | intro | 31.8 s | 4 | give "Nobody fires the Guard" back to Diggs |
| 6 | `runway-intro` | chapter-open | 46.7 s | 10 | chapter 4's question; plant Diggs through Wally; kazoo rung 2 |
| 7 | `salvage-raid-outro` | outro | 35.6 s | 5 | Father Loam and the cracked pilgrims: warm against the cold |
| 8 | `kiln-resin-intro` | intro | 38.9 s | 5 | "one sensible argument and two plow drivers later": stage it or cut it |
| 9 | `kiln-resin-outro` | outro | 23.7 s | 4 | the arm cured: a sincere beat; Tansy's snail-mail |
| 10 | `spade-truce-outro` | chapter-close | 35.1 s | 4 | the coalition; brass wrench rung 2; Vesper's "Tonight" as the threat |
| 11 | `sandpit-drop-intro` | intro | 20.0 s | 5 | Pip's second "Okay, hear me out" |
| 12 | `sandpit-drop-outro` | outro | 39.5 s | 4 | Diggs's entrance (low, still) |
| 13 | `tundra-intro` | intro | 35.2 s | 5 | the drift run; no road directions |

## Side A: the first six side quests in `sideQuests.ts` order (`scenes/side/gridTruthers.ts`, `porcelainBlues.ts`, `fescueFugitive.ts`, `hoaAudit.ts`, `castaway.ts`, `mulchPyramid.ts`)

Shared fix first: these scenes talk on the stage wides (`stageCut`); cover them with `frame` shots and cut the long
holds. Night scenes (Grid Truthers) need `sky: 'golden'` or a light behind the subject. Each quest has its own tone
(Clara's scenes are the sincere register: no gags on her lines).

| Order | Scene | Kind | Length | Faults | Priority notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `sq-porcelain-blues-intro` | intro | 77.2 s | 22 | over length; one wide held 28 s with five lines; Clara unseen |
| 2 | `sq-porcelain-blues-outro` | outro | 95.7 s | 13 | the longest scene in the game: cut to under 60 s; a sincere ending |
| 3 | `sq-grid-truthers-intro` | intro | 90.0 s | 17 | over length; too dark; Mossley's paranoia is great material: tighten it |
| 4 | `sq-grid-truthers-outro` | outro | 70.0 s | 13 | the Tall-One Pencil reveal: picture first |
| 5 | `sq-fescue-fugitive-intro` | intro | 85.3 s | 14 | over length; Bracken's voice per the bible |
| 6 | `sq-mulch-pyramid-intro` | intro | 58.8 s | 20 | Cedric's patter: a monologue that needs reactions |
| 7 | `sq-hoa-audit-intro` | intro | 56.7 s | 13 | Burt's nerves |
| 8 | `sq-hoa-audit-outro` | outro | 77.9 s | 13 | over length |
| 9 | `sq-fescue-fugitive-gallery` | arrival | 68.5 s | 12 | an arrival at 68 s: cut to 45 |
| 10 | `sq-castaway-drydock-intro` | intro | 47.3 s | 10 | |
| 11 | `sq-castaway-drydock-outro` | outro | 42.4 s | 9 | ends on an errand hook: give it a button |
| 12 | `sq-mulch-pyramid-outro` | outro | 46.8 s | 10 | |
| 13 | `sq-porcelain-blues-ledger` | arrival | 17.6 s | 8 | |
| 14 | `sq-grid-truthers-gamma` | arrival | 48.2 s | 7 | too dark; over length for an arrival |
| 15 | `sq-fescue-fugitive-granny` | outro | 47.6 s | 8 | choice payoff (fence it to Granny) |
| 16 | `sq-fescue-fugitive-hollow` | outro | 55.9 s | 7 | choice payoff (return it to Bracken) |
| 17 | `sq-mulch-pyramid-wasps` | arrival | 21.3 s | 6 | the wasp gag: lock off, hold it |

## Side B: the other side quests, Tessie and the races (`scenes/side/biscuitHotdog.ts`, `snailRigging.ts`, `porcelainSupport.ts`, `hoseRevolt.ts`, `bigLou.ts`, `tessie.ts`, `scenes/speedway.ts`)

Shared fixes first: the race scenes are generated by `raceIntro` / `racePodium` in `speedway.ts` (one fix covers all
eight: shorten the crane, frame Burdock for his lines, check the grandstand shots with `?cutscenecheck` in the browser,
which reports camera-blocked shots the node check cannot see). Tessie and Hose Revolt shoot people tiny on wides; Big Lou
is too dark.

| Order | Scene | Kind | Length | Faults | Priority notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `sq-tessie-intro` | intro | 71.7 s | 28 | the most faults in the game: Driftwood at 2-6% of the frame, back to camera, four 19-22-word lines, two captions |
| 2 | `race-rookie-mowdown-intro` (+ the other race intros via `raceIntro`) | race-intro | 43.1 s | 14 | the first race everyone plays; over length; then `race-lowrider-derby-intro` 5, `race-snail-endurance-intro` 4, `race-fizz-cup-final-intro` 6 |
| 3 | `race-rookie-mowdown-podium` (+ the other podiums via `racePodium`) | race-podium | 23.6 s | 4 | Burdock unseen while he speaks; then `race-lowrider-derby-podium` 3, `race-snail-endurance-podium` 3, `race-fizz-cup-final-podium` 3 |
| 4 | `sq-big-lou-embargo-intro` | intro | 51.1 s | 22 | Lou's back to camera for six lines; too dark |
| 5 | `sq-biscuit-hotdog-intro` | intro | 64.6 s | 23 | Bramble in the storm cellar: a whisper scene shot wide |
| 6 | `sq-hose-revolt-intro` | intro | 49.4 s | 16 | Brenda's throne: shoot her low, she is royalty |
| 7 | `sq-snail-rigging-intro` | intro | 57.9 s | 16 | Shelldon |
| 8 | `sq-porcelain-support-intro` | intro | 47.3 s | 16 | sincere register (Clara) |
| 9 | `sq-tessie-shore` | arrival | 21.7 s | 10 | Tessie surfacing: awe language (low, slow, hold) |
| 10 | `sq-big-lou-embargo-outro` | outro | 66.4 s | 10 | over length |
| 11 | `sq-hose-revolt-club` | arrival | 30.0 s | 8 | |
| 12 | `sq-snail-rigging-outro` | outro | 48.2 s | 8 | |
| 13 | `sq-tessie-secret` | outro | 28.8 s | 7 | choice payoff |
| 14 | `sq-biscuit-hotdog-outro` | outro | 29.9 s | 6 | |
| 15 | `sq-porcelain-support-outro` | outro | 38.9 s | 6 | |
| 16 | `sq-hose-revolt-outro` | outro | 25.4 s | 6 | wide shot with tiny people |
| 17 | `sq-tessie-eggs` | arrival | 30.9 s | 5 | |
| 18 | `sq-tessie-tabloid` | outro | 24.2 s | 5 | choice payoff |
| 19 | `sq-big-lou-embargo-vip` | arrival | 8.3 s | 3 | |
| 20 | `sq-snail-rigging-swap` | arrival | 21.8 s | 2 | |
