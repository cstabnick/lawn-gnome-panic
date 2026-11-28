# FX21 result: story kit (the `previously` field, the reward chip, D7)

Branch `fix/FX21`. Roadmap: [roadmap.md](roadmap.md). Shots in `review/shots/FX21/` (git-ignored, local only).

## Findings

| ID | Priority | Result | Evidence |
|---|---|---|---|
| G12#4 (D7) | should | **fixed** | `questSave.evenCut.test.ts` (chain queue, frame, W15/W16 skipped under W17); shots `j-vet-avail(.png, -phone)`, `j-vet-m54(-phone)` |

### G12#4: what landed
- **Chain queue:** `catchUpHeld(id, saves)` (quests/questSave.ts), checked by `isQuestAvailable`. An inserted row
  (`mNN-...`) whose old-chain successor is already done is a catch-up; catch-ups are offered one at a time in story
  order. A mid-act-IV save now gets m54, then m56, then m58. Normal play never has a catch-up, so it is unchanged.
- **Before the Even Cut:** `isBeforeTheEvenCut(id, saves)`: an act IV row (54-69) when the finale is done and the row
  was not finished before it (`doneAt` compared with the finale's; with no stamps, inserted rows count as after). The
  journal's Open tab files such rows under a "Before the Even Cut" heading; the Active card's narrator line reads
  "**Before the Even Cut:** ..."; the briefing card's tag reads "Before the Even Cut · Briefing · <title>". Nothing is
  hidden or reset.
- **W17 on:** `activeWorldChanges` drops a change earned by such a row (W15, W16) unless the change itself lists
  `ch5-even-cut` (W17, W19 still apply); `payOut` skips the row's Turfton FM completion bulletin. A skipped change has
  no world-change bulletin either.
- Interpretation (recorded in roadmap.md): the frame is shown only once the finale is done; a mid-act-IV save is queued
  but not framed, since its Even Cut is still ahead.
- Not done: `migrateFinaleSave`'s "active old finale resumes in p1 without the act IV setups" (part of the finding's
  "what", not of D7's fix round). Carried over.

## Contracts provided for FX22-FX24 (D45 / D46 mechanisms)
- `QuestDef.previously?: string` (quests/types.ts) and `quests/story/previously.ts`: `PREVIOUSLY` (all 70 rows, narrator
  voice, voice-passed), `previouslyOf(q)`, `previouslyLine(q, saves)`. Shown on the journal Active card (`.j-prev`).
  Shots: `j-m02-phone`, `j-m26`, `j-m45`, `j-m63-phone`.
- Reward chip: `quests/story/rewards.ts` `rewardChip(q)` (acorns + `REWARD_EXTRAS` non-money labels; #24 "A favour from
  Sorrel", #30 "Entry money, someday"). On the comms briefing card (`.gb-chip`; desktop in the head, phone portrait on
  its own row under the name, landscape clamped to two lines) and on the journal Active/Open/Later cards (`.j-chip`).
  Shots: `brief-m54`, `brief-m54-phone`, `brief-m54-land`, `brief-m26-phone`.
- Tests in `quests/comms.test.ts`: "never opens a line with a spoken Previously label (GR4)" with `PREVIOUSLY_ALLOW`
  (33 quest ids today) and "says no fee in the sincere and crisis rows (GR5)" with `FEE_ALLOW` (11 `id#step` entries).
  Both assert equality, so an act epic that fixes a row must also remove it from the list. FX22/FX23/FX24 empty them.
- `quests/story/previously.test.ts`: every row has a line, no label, at most 28 words; reward labels at most 4 words.

## Files outside the brief's list (small additive edits)
- `quests/quests.ts` (2 lines: the chain-queue check, the bulletin skip), `worldChanges/defs.ts` (the W17 filter),
  `app.ts` (passes `reward` / `kicker` to the briefing), new `quests/story/rewards.ts`.

## Checks
- `npm run build -w games/gnome-theft-auto`: pass.
- `npm test -w games/gnome-theft-auto`: 527 files passed, 4 skipped (5443 tests); the three new/changed test files rerun
  after the last tweaks: 22/22.
- `bash tools/smoke.sh "http://localhost:5521/?offline" gta-gnomlet`: SMOKE OK.
- No scenery, scenes, lore or density changed, so zfight, cutscene-report, lore and perf were not needed.
