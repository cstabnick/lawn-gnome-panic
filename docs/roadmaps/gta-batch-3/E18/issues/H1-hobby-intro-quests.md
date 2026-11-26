Epic: E18-A
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` first. Use a capable model's judgement for the writing; follow
the lore below.

## Goal
The three hobby intros (fishing `nc-bent-pin`, hunting `nc-tuft-and-tally`, birding `nc-reedwatch`) become friendly
in-world introductions **given by the teacher at the hobby's own place** (not by Mabel at the bus stop), with guided
first steps: what to buy, where, how, with the controls named. Quest ids, rewards' size and the Newcomers' Card
(they still count as stamps) stay.

## Read first
- `games/gnome-theft-auto/src/quests/newcomerQuests.ts`: `card()`, `HOST_LOOK` (wenna, hazel, dunnock), the three quests,
  and how the other stamps are written. Positions: `BENT_PIN` (fishing/types.ts `SHOP`, x -110, z 252, front faces -z to
  the canal), `LODGE_DOOR` (hunting `LODGE` x -548 z -52, door faces +z), `HIDE` (birding/types.ts, x -630 z -546, front
  faces -z, the loch).
- `games/gnome-theft-auto/src/quests/defs.ts`: `GIVERS` (see the `hogweed` giver ~l.371 for a giver with explicit x/z,
  `exit`, `room: 'street'`, `letter`).
- `games/gnome-theft-auto/src/quests/commsNewcomers.ts`: phone lines per newcomer quest step (update the three).
- `games/gnome-theft-auto/src/quests/stages/*.ts` + `src/quests/stages.test.ts` ("every giver and every quest has a
  stage"): `turfton.ts` stage `bus-stop` lists the three quests in `usedBy`; nearest stages: `wilds.ts` (centre -582,-120,
  76 m from the lodge), `cloverfield.ts` (centre -40,216, 79 m from the Bent Pin), `east.ts` (centre -722,-552, 92 m from
  the hide).
- `games/gnome-theft-auto/src/city/probes.ts`: the probes the quests use (`fish-rod`, `fish-caught`, `fish-sold`,
  `hunt-licensed`, `hunt-combed`, `hunt-sold`, `bird-seen`, `bird-heard`, `bird-photos`); use only existing probes.
- Lore: `npm run lore -- find "Bent Pin"`, `find "Tuft & Tally"`, `find Reedwatch`, `find "Newcomers' Card"` (Wenna
  Gudgeon keeps the Bent Pin, every fish goes back; Hazel Mattock sells the Tuft License for 120 Acorns, nobody gets hurt;
  Dunnock Pell keeps the hide, the life list and the optics).
- `games/gnome-theft-auto/src/fishing/shop.ts`, `hunting/lodge.ts`, `birding/hide.ts` only to find where the player
  stands to talk to each keeper (for the giver x/z: stand the giver marker 2-3 m in front of the counter, on open ground,
  not inside walls).

## Change
- `defs.ts` `GIVERS`: add `club-bent-pin` (name "Wenna Gudgeon (The Bent Pin)", label "Ask Wenna about fishing", letter
  'N'), `club-lodge` ("Hazel Mattock (Tuft & Tally Lodge)", "Ask Hazel about hunting", 'N'), `club-reedwatch`
  ("Dunnock Pell (Reedwatch Hide)", "Ask Dunnock about birding", 'N'); explicit x/z/exit from the shop constants,
  `room: 'street'`.
- `unlocks.ts`: ONLY add to `SIDE_COLORS`: `'club-bent-pin': '#f2c200', 'club-lodge': '#f2c200', 'club-reedwatch': '#f2c200'`
  (the Newcomers' Card colour). Do not touch `SIDE_UNLOCKS`.
- `newcomerQuests.ts`: the three quests get `giver` = the new ids. Rewrite each cutscene as a dialogue at the place
  (titleCard stays `Newcomers' Card: <title>`), 3-5 lines, the teacher speaking (with `look: HOST_LOOK.x`), one short
  line from 'You' allowed, no Mabel line (Mabel may be mentioned: "Mabel sent you? She sends everyone."). The lines must
  say what to buy, what it costs, and the first how-to. Objectives (keep probes; improve text and hints so a newcomer
  knows the control, e.g. "{interact}" style placeholders only if `fillHint` in `ui/glyphs.ts` supports them — check):
  - Fishing: buy the cheapest rod at the counter (say the price from `fishing/tackle.ts` RODS[0]), walk to the bank,
    cast, wait for the bob, reel, catch one fish, sell the catch card to Wenna.
  - Hunting: buy the Tuft License (120), sneak (crouch) up on a quarry in Mossy Wood, knock it over, comb its tuft, sell.
  - Birding: raise the binoculars (say how, and whether the player must buy them first: read `birding/` to find out; if
    the hide sells them, add a first step buying them with the existing probe if one exists, else say it in the lines),
    log a bird, log one by its call, take one photo.
  - Keep `rewardAcorns` (80/100/100) and `doneText`s' perk meaning (perks.ts reads quest ids, not text).
- `commsNewcomers.ts`: update the three quests' step lines to fit (teacher voices: wenna, hazel, dunnock speaker keys if
  the comms file supports any name string; else keep the existing speaker style).
- Stages: remove the three quest ids from `turfton.ts` `bus-stop.usedBy`; add each new giver and its quest to the
  nearest suitable stage's `givers` / `usedBy` (if `stages.test.ts` rejects a giver outside a stage's radius, add a
  small new stage for that spot instead, copying the field shape of a simple stage in the same file).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files.
- `npx vitest run src/quests src/questSim/coverage.test.ts src/questSim/newcomers.sim.test.ts` pass (sim tests may be
  skipped in vitest; then also run `npx vitest run --config vitest.sim.config.ts src/questSim/newcomers.sim.test.ts`
  if that config exists, and report the result).
- `npm run lore` (repo root) passes (you change no lore, just check).

## Out of scope
`hobbyIntros.ts`, `cutscene/castIntros.ts` (issue H2), `quests.ts`, `journal.ts`, `pacing.ts`.
