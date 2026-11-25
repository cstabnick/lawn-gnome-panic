Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
Story quest #2, "A Roof on Credit" (`m02-roof-on-credit`), right after the prologue: Pip sends the player to Mabel, who
leads them to the First Kiln Bank, where Parsley Inkpot books the 1,500-Acorn loan for Flat 3B; then to Saucer Court,
past Hyssop Doormat, and up into the flat.

## The outline row (verbatim from docs/design/gnome-theft-auto/story-outline.md, row 2)
| 2 | m02-roof-on-credit | A Roof on Credit | 1 | new | Pip (Side-Valve Salvage) | downtown | prereq prologue-fresh-kiln |
cast pip, parsley, hyssop, mabel | (1) Pip admits his bench is full and sends you to Mabel's cab outside, the fare is on
the bank (2) Mabel will not carry mower-mud on her seats and leads at walking pace, you follow on the bike to the First
Kiln Bank (3) Loan officer Parsley Inkpot at the counter: 1,500 acorns added to the Kiln-Debt for flat 3B at Saucer
Court (4) Keys in hand, ride to Saucer Court and climb to the flat (5) Hyssop Doormat in 3A opens her door a crack and
recites the stairwell rules (6) Name on the buzzer, a lit window | chase-follow; visit; visit | comms: 0 Pip: no room on
the bench, Mabel runs you to the bank, a flat at Saucer Court; 1 Mabel: not in my cab, follow me, Saucer Court;
2 Parsley: sign here, 1,500 acorns added to your Kiln-Debt; 3 Hyssop: rules of the stairwell | 150 acorns; unlocks the
player's home, flat 3B at Saucer Court | Previously: you took a loan you could not afford because a bench is not a home.
Lore ruling R-169 (binding): the loan sits on the bank's ledger BESIDE the Kiln-Debt, never inside it: write "on your
ledger, beside the Kiln-Debt", not "added to your Kiln-Debt".

## Voices (from the character bible)
- Pip: fast, cheerful, changes the subject when money comes up. Mabel Kerbstone: brisk cabbie, "every fare ends well
  and is paid in cash", never short of change. Parsley Inkpot: bank loan officer, stamps everything twice, polite menace.
  Hyssop Doormat: retired lollipop-crossing warden in flat 3A who now watches the stairwell. The player: straight man,
  two to six words, mostly questions, at most one line in three.

## Read first
- `games/gnome-theft-auto/src/quests/types.ts`: `QuestDef`, `ObjectiveDef` (`chase-follow`, `visit` with optional
  `interior`), `CutsceneSpec` (`{ kind: 'dialogue', room: 'side-valve', lines: [{ speaker, text, look? }] }`).
- `games/gnome-theft-auto/src/quests/chapter1.ts`: `prologue-fresh-kiln` (a chase-follow) and the style of a quest row.
- `games/gnome-theft-auto/src/quests/defs.ts`: `QUESTS` (order matters: a giver offers the FIRST available quest in
  this list) and `GIVERS['side-valve']`.
- `games/gnome-theft-auto/src/homes/types.ts`: `BANK_COUNTER` (101, 113), `SAUCER_COURT` (`exit` (30, 82.5),
  `stairDoor` (30, 80.6)). `games/gnome-theft-auto/src/config.ts`: `SIDE_VALVE.bay`.
- `games/gnome-theft-auto/src/questSim/plans.ts`: `QUEST_PLANS` (every quest needs a row; coverage.test.ts checks).

## Change
- New `games/gnome-theft-auto/src/quests/homeQuests.ts` exporting `HOME_QUESTS: readonly QuestDef[]` with one quest:
  - `id: 'm02-roof-on-credit'`, `title: 'A Roof on Credit'`, `giver: 'side-valve'`, `prereq: 'prologue-fresh-kiln'`,
    `chapter: 1`, `rewardAcorns: 150`, `hoa: 'off'`.
  - `cutscene`: a `dialogue` in room `'side-valve'`, 4-6 lines: Pip waves at his bench ("That bench is my bed, my
    desk and my alibi"), sends the player to Mabel; the player asks one short question; Pip: the fare is on the bank.
  - `objectives` (exactly this order; the home runtime signs the loan when objective index 2 starts):
    0. `chase-follow`: text "Follow Mabel Kerbstone's cab to the First Kiln Bank", `leaderName: 'Mabel Kerbstone'`,
       `leaderKind: 'taxi'`, `leaderLook: { hat: 0xf2c200, shirt: 0x222222, glasses: true }`, waypoints along the city
       streets (roads on the 60 m grid: x or z in {-180,-120,-60,0,60,120,180}) from `SIDE_VALVE.bay` to (101, 120),
       ending on the street in front of the bank; `speed: 9` (walking pace for a cab, the player can keep up on foot
       or bike), `maxDist: 75`, hint 'Mabel\'s cab'. Look at the prologue's waypoints for how they follow streets.
    1. `visit`: text "Sign for Flat 3B with Parsley Inkpot at the First Kiln Bank counter", `at: [BANK_COUNTER.x,
       BANK_COUNTER.z]`, `radius: 4`, hint 'First Kiln Bank', `toastOnEnter`: Parsley's line (sign here, twice; 1,500
       Acorns on your ledger, beside the Kiln-Debt; "the walls remain the bank's").
    2. `visit`: text "Ride to Saucer Court with your new keys", `at: [SAUCER_COURT.exit.x, SAUCER_COURT.exit.z]`,
       `radius: 5`, hint 'Saucer Court', `toastOnEnter`: Hyssop's stairwell rules through a door opened a crack (wipe
       feet, no running, no lodgers, she is watching).
    3. `visit` with `interior: 'flat-3b'`: text "Go up to Flat 3B", `at: [0, 0]`, `radius: 3`, hint 'Flat 3B, Saucer Court'.
  - `outro`: a `dialogue` in room `'street'` of 2-3 lines (Hyssop through the wall, or the player alone: "Mine?" /
    a reply from the bank's notice), or omit if it reads better without.
  - `doneText`: "Your name is on the buzzer at Saucer Court. Tonight one more window is lit. (Decorate the flat: tap
    the Decorate spot inside, or the Home app on the Gnomlet.)"
- `games/gnome-theft-auto/src/quests/defs.ts`: import `HOME_QUESTS` and put it in `QUESTS` right after the prologue and
  before the other chapter-1 quests, without editing chapter1.ts:
  `CHAPTER_1_QUESTS[0], ...HOME_QUESTS, ...CHAPTER_1_QUESTS.slice(1), ...`. Keep every other entry as it is.
- `games/gnome-theft-auto/src/questSim/plans.ts`: add `'m02-roof-on-credit': { suite: 'story', expect: 'pass' }` after
  the prologue row.

## Contract
- Quest id `m02-roof-on-credit`, giver `side-valve`, objective index 1 = the bank visit, index 2 = the Saucer Court
  visit (the home runtime signs the loan when step 2 starts; do not reorder).
- Do not change `first-contract`'s prereq or any other quest (E20 renumbers the story later).

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/quests src/questSim/coverage.test.ts src/radio`
  passes (if a test pins the number or order of quests and fails only because of the new quest, update that pin and say
  so in your report).
- `npm run quest-sim -w games/gnome-theft-auto -- --quest m02-roof-on-credit` if the tool supports a single quest
  (read `tools/quest-sim.mjs --help` or its header); report the result. A failure here is reported, not fixed by
  changing the sim.

## Out of scope
chapter1.ts, cityQuests.ts (another worker edits those), home/* and homes/*, app.ts.
