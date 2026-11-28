# E18 roadmap: activities and side-quest pacing

Source items: L54 (bubble-mobile), L66 (birding/hunting/fishing intros), L67 (side-quest pacing), L68 (world changes).
The chef job (L30) moved to E24 and is done. Contracts and the hand-off table for E20-E22: [contracts.md](contracts.md).

## Shape

| epic | what | done when | issues |
|---|---|---|---|
| E18-0 foundation (lead) | `quests/storyRows.ts`, `quests/pacing.ts`, re-timed `SIDE_UNLOCKS` (+ `planned`), new `unlocks.test.ts` rules, `QuestSave.doneAt`/`ending`, `worldChanges/defs.ts` + `registry.ts` + stubs, `dewdrop/config.ts`, quest stubs, `bubble-mobile` kind stub, app.ts wiring, achievements, lore (the Dewdrop, R-227, R-228) | tsc + quest tests green | – |
| E18-A systems | P1 engine pacing, P2 journal Later shelf, H1 hobby intro quests, H2 teacher intro cards, B1 Dewdrop vehicle, B2 Dewdrop quests, B3 Dewdrop runtime, W0 world-change runtime | build + tests | 8 |
| E18-B dressing | D1 Saucer Court (W01, W09), D2 estates (W02, W18, W05), D3 Green and barn (W03, W04), D4 moles (W06, W13), D5 lights (W10, W12), D6 coast and fort (W11, W15), D7 Side-Valve and finale (W08, W17) | build + tests + smoke | 7 |

Issue texts: [issues/](issues/) (`_env.md` and `D-dressing-common.md` are shared by all). Every issue in an epic ran in
parallel; each owns its files (app.ts, defs.ts registration and the catalog index were done by the lead up front).

## Online, mobile

- Online: the Dewdrop is a normal synced vehicle kind (`net.ts`). World changes are visual and local, derived from each
  player's own quest save (`docs/roadmaps/gta-online-sync.md`: nothing new to relay). Pacing is per player.
- Mobile: the journal's four tabs and all buttons are 44 px; the Dewdrop steers with the normal touch driving controls;
  intro cards and world changes need no input.

## Deferred

- W07, W14, W16 have rows but no props: their quests (m34, m52, m64) are not built; E20-E22 add builders with them.
- `sq-chef-first-shift`, `sq-hyssop-stairwell` and the other schedule quests with no QuestDef (see contracts.md).
- The W13 root stall is visual only (no buy hook).
- E16 builds the fringe-site hoardings, crane and show-homes always on (`src/country/estates.ts`), so W02 only adds the
  slogan boards and gate workers and W17 cannot take the hoardings down yet; whoever builds m07 should move E16's
  hoardings into W02's group.
- W04: there is no baked barn at Granny's stage, so the new red roof is a freestanding canopy; no HOA "condemned" or
  foreclosure sign props exist in code, so W03/W04 only add (torn notices, scraps), they hide nothing.
- Not checked by eye: every world change, the Dewdrop's roll and bounce, the journal at 390x844. `npm run zfight` timed
  out (puppeteer protocol timeout on this world) and the screenshot pass was not done.
