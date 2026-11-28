# FX21 roadmap: story kit (the `previously` field, the reward chip, D7)

Brief: [../FX21-story-kit-previously-reward-chip.md](../FX21-story-kit-previously-reward-chip.md). Findings: G12#4 (D7);
mechanisms for D45 (GR4) and D46 (GR5) that FX22-FX24 build on.

## Foundation (written by the lead, before the workers)

- `quests/types.ts`: `QuestDef.previously?: string`.
- `quests/questSave.ts`: D7 helpers `isCatchUp(id, saves)`, `catchUpHeld(id, saves)` (the chain queue: an old save's
  inserted rows come one at a time, in story order) and `isBeforeTheEvenCut(id, saves)` (act IV row 54-69, finale
  done, row not finished before the finale).
- `quests/quests.ts`: `isQuestAvailable` returns false while `catchUpHeld`; `payOut` skips the Turfton FM bulletin of a
  Before-the-Even-Cut row.
- `worldChanges/defs.ts`: `activeWorldChanges` drops a change earned by a Before-the-Even-Cut row while W17 is on
  (changes that list `ch5-even-cut` themselves, W17 and W19, still apply).
- `quests/story/previously.ts` (stub `PREVIOUSLY`, `previouslyOf`, `previouslyLine`) and `quests/story/rewards.ts`
  (stub `REWARD_EXTRAS`, `rewardChip`).
- `briefing/briefing.ts`: `BriefingShowOptions.reward?` and `kicker?` (interface only); `app.ts` passes them.

Interpretation of D7 recorded here: "old-chain successor done" defines a catch-up row (the chain queue). The "Before
the Even Cut" frame is shown only when the finale itself is done: a mid-act-IV save has not had the Even Cut yet, so
its catch-ups are queued but not framed.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Story kit | build + tests pass; journal and comms card show line and chip | 4 (A Sonnet writer, B-D Haiku) |

No dependencies inside the epic: every issue owns its own files; the foundation fixed the contracts.

## Issues

~~~~text
FX21-A  Writer: the 70 "previously" lines and the non-money reward labels (Sonnet)
Owns: games/gnome-theft-auto/src/quests/story/previously.ts, quests/story/rewards.ts, new quests/story/previously.test.ts
Fill PREVIOUSLY (every row's own quest id from quests/storyRows.ts that is not a -pN part, 70 keys) from the outline's
"Previously:" column, voice pass (GR4: narrator, second person, past tense, contractions, no label, <= 28 words, a
full stop; only scenes the player cannot skip). Fill REWARD_EXTRAS from the outline's reward column (non-money only,
<= 4 words a label, no achievements; #24 Sorrel gives a favour, #30 Cam "the entry money back, someday" as a label).
Test: every row id has a line; no line starts with "Previously" or contains a colon label; extras <= 4 words.
~~~~

~~~~text
FX21-B  Journal: previously line, reward chip, "Before the Even Cut" section (Haiku)
Owns: games/gnome-theft-auto/src/quests/journal.ts
Active card: a chip (class j-chip) built from rewardChip(q).text replaces "🌰 N" in the title row; under the From line an
italic narrator line (class j-prev) from previouslyLine(q, snap.saves). Open/Later offer buttons: the same chip.
Available tab: story quests with isBeforeTheEvenCut(q.id, snap.saves) go under a heading "Before the Even Cut" (class
j-section) after the other story quests, with one sub line "From before the finale. The world has moved on; the story
hasn't forgotten." 44px targets unchanged; check at 390x844.
~~~~

~~~~text
FX21-C  Comms card: the reward chip and the kicker (Haiku)
Owns: games/gnome-theft-auto/src/briefing/briefing.ts
A chip element (class gb-chip) in the head after the name block, text = opts.reward, shown only in 'briefing' mode
when reward is non-empty; tag = `${kicker ? kicker + ' · ' : ''}Briefing · title`. Desktop, phone portrait and
landscape styles; the chip never wraps the name off the card.
~~~~

~~~~text
FX21-D  Tests: no comms line starts with "Previously", no fee in sincere rows, D7 helpers (Haiku)
Owns: games/gnome-theft-auto/src/quests/comms.test.ts, new quests/questSave.evenCut.test.ts
Allow-lists of today's offenders by quest id (FX22-FX24 empty them). D7 unit tests on hand-built saves.
~~~~

The full worker prompts are the issue texts pasted into each worker run (kept in the lead's scratchpad).
