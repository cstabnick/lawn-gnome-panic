Epic: 3 Life and quests (runs alongside epic 2)
Depends on: epic 1; the event contracts below (other workers are building the senders right now)

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Worker: Sonnet. At the same time other workers build
`src/coast/boardwalk.ts`, `spokewheel.ts`, `pirateShip.ts`, `life.ts` and `src/tubing/runtime.ts`. You own only:
`src/quests/coastQuests.ts` (new), `src/quests/defs.ts` (one import + spread), `src/quests/unlocks.ts` (rows),
`src/coast/probes.ts` (new), and test files you add (`src/quests/coastQuests.test.ts`, a quest-sim suite entry if the
sim needs one). If a comms/radio or cast-intro table must gain rows for your quests to pass their tests, you may add rows
to those tables too, and list the files in your report.

## Goal
Four side quests (ids prefixed `coast-`) start inside the existing side-quest web and send the player to Saltbucket
Shore: the Spokewheel, tubing with Driftwood, Captain Bilge's pirate tour, and the Bathtub Queen's treasure.

## Events and places you can rely on (contracts from the other workers)
- `window` event `'gta:spokewheel-ride'` after each full Spokewheel ride (ride starts from the E prompt at
  `COAST.spokewheel.board`).
- `window` event `'gta:tow-run'` with `detail: { course: string, gates: number, finished: boolean, mode: 'tube' | 'ski' }`
  whenever a Saltwater run passes a gate or finishes (course id `'saltwater'`); renting at the Last Tube
  (`COAST.lastTube.rack`, tube; ski rack 4 m east) puts the player on a tube / skis towed by Driftwood's boat.
- `window` event `'gta:queen-chest'` when the player opens the sea chest in the interior `bathtub-queen-cabin` (door
  `COAST.ship.cabinDoor` on the ship's deck; Captain Samphire Bilge stands inside).
- The ship's deck and the pier are walkable (rooftops at `COAST.ship.deckY` / `COAST.pier.deckY`); the beach is dry from
  z 1140 to ~1188; the boardwalk deck is at ground level ~-4.2.
- Achievements: `COAST_ACH.tours` (`'gta-shiver-me-glaze'`) and `COAST_ACH.treasure` (`'gta-queens-treasure'`) go on the
  quest defs' `achievement` field.

## Read first
- `games/gnome-theft-auto/src/quests/types.ts` (`QuestDef`, `GiverDef` incl. `interior`, `ObjectiveDef` kinds — `visit`
  (optionally with `interior`), `probe` (`{ kind: 'probe', text, probe, count?, at?, hint }`), `steal-deliver`,
  `checkpoints`, ...; `achievement`, `prereq`).
- `games/gnome-theft-auto/src/quests/newcomerQuests.ts` (quests built on `probe` objectives) and `outskirtsQuests.ts`
  (a small self-contained side-quest file: givers, cutscene `dialogue` lines, rewards). Copy their shape.
- `games/gnome-theft-auto/src/city/probes.ts` (`registerProbe(id, fn)`, `bumpProbe(id)`, `declareCounter`) and
  `src/city/install.ts` (where probes are registered).
- `games/gnome-theft-auto/src/quests/defs.ts` (the quest list), `src/quests/unlocks.ts` (`SIDE_UNLOCKS`), and the tests
  that check quests: `src/quests/quests.test.ts`, `src/quests/unlocks.test.ts`, `src/questSim/side.sim.test.ts`.
- `games/gnome-theft-auto/src/coast/config.ts` (`COAST`, `COAST_QUESTS`, `COAST_UNLOCK_AFTER`, `COAST_ACH`).
- Lore: `docs/lore/entries/apocrypha/marram-teaspoon.md`, `driftwood-castaway.md`, `samphire-bilge.md`,
  `the-bathtub-queen.md`, `the-spokewheel.md`, `the-last-tube.md`, `the-saltcut.md`; `docs/lore/canon.md` house style.
  `docs/design/gnome-theft-auto/side-quest-schedule.md` rows for `coast-*` (givers, why the giver appears).

## Change
1. `src/coast/probes.ts`: `export function installCoastProbes(): void` — counts the three window events into probes with
   `bumpProbe` / `declareCounter` (ids: `'coast-spokewheel-rides'`, `'coast-tow-gates'` (+1 per gate on course
   `'saltwater'`), `'coast-tow-finish'` (+1 per finished saltwater run), `'coast-queen-chest'`). Call it once from
   `coastQuests.ts` at module load **only if** `typeof window !== 'undefined'` (so tests and the sim still load), or wire it
   where city probes are installed if that is cleaner (then list the file).
2. `src/quests/coastQuests.ts`: `export const COAST_GIVERS` and `export const COAST_QUEST_DEFS: QuestDef[]` with the four
   ids in `COAST_QUESTS`:
   - `coast-spokewheel-gondola` "The Wobbly Gondola" — giver Marram Teaspoon at the Spokewheel platform (ground, about
     (-252, 1110)). Gondola seven wobbles; she wants someone to ride it and listen for the rattle. Steps: ride the
     Spokewheel once (`probe 'coast-spokewheel-rides'`), fetch a spanner from Plank & Pickle (visit the stall at
     (-95, 1104), radius 4), come back to Marram (visit). Reward ~300 acorns.
   - `coast-boardwalk-tubing` "Tubing the Long Spoon" — giver Driftwood at the Last Tube (about (156, 1150)). He needs
     someone to test the new slalom. Steps: rent a tube at the Last Tube (visit the rack, then `probe
     'coast-tow-gates'` count 3), finish one Saltwater run (`probe 'coast-tow-finish'`), back to Driftwood. Reward ~400.
   - `coast-bathtub-tours` "Pirate Tours, Mostly" — giver Captain Samphire Bilge **inside** `bathtub-queen-cabin`
     (`interior`, local position by the table, e.g. (0, -2)). Run her tour: walk the tourists' route (visit the anchor on
     the beach at (360, 1175), the end of the pier bowl (300, 1250), the Saltcut mouth (745, 1205) by boat or on foot),
     then keep a nosy HOA patrol from looking in the hold: use an existing objective kind that fits (e.g. `chase-follow`
     or a visit with `heatOnEnter`) — pick the simplest that the quest simulator already solves. `achievement:
     COAST_ACH.tours`. Reward ~600.
   - `coast-queens-treasure` "The Queen's Treasure" — prereq `coast-bathtub-tours`; giver Bilge in the cabin again.
     Steps: dig where her chart says (visit the beach at (-520, 1170), radius 5, toast "Only a boot."), then the real one is
     where she sleeps: open the sea chest in the cabin (`probe 'coast-queen-chest'` with `at` set to the cabin door).
     `achievement: COAST_ACH.treasure`. Reward ~800 plus whatever fits (an item through `addItem` if the quest system
     supports item rewards; else acorns only).
   Dialogue in each giver's voice (short, dry, specific to the place; Marram: brisk and warm, "Hat on, hands in, wait for
   the bell."; Driftwood: castaway, vindicated about the Big Puddle, "lawn sharks"; Bilge: loud, salt-cured, "Every cargo
   is honest. Some of it was just not yet yours."). No Tall One object named for what it really is.
3. `src/quests/defs.ts`: import and spread `COAST_QUEST_DEFS` next to `OUTSKIRTS_QUESTS`.
4. `src/quests/unlocks.ts`: rows `{ questId: 'coast-spokewheel-gondola', after: COAST_UNLOCK_AFTER, why }`,
   `coast-boardwalk-tubing` (same), `coast-bathtub-tours` (after `'ch4-sandpit-drop'`), and `coast-queens-treasure`
   (after `'ch4-sandpit-drop'`, the prereq does the rest). Respect the open-offer cap: check `unlocks.test.ts` /
   any cap test and the schedule (at most ~6 offered at once in the late game).
5. Tests: `src/quests/coastQuests.test.ts` — four defs with `coast-` ids matching `COAST_QUESTS`; givers on dry ground
   or in an interior; every `visit` point outside interiors is reachable on foot (dry: `waterDepthAt === 0`) or explicitly
   by boat (the Saltcut mouth); the treasure quest has the tours quest as prereq; both pirate quests carry their
   achievements. Then make the existing quest tests and the side-quest simulation pass
   (`npx vitest run src/quests`, `npm run quest-sim:suites -w games/gnome-theft-auto` or the narrower
   `npx vitest run --config vitest.sim.config.ts src/questSim/side.sim.test.ts`): if the simulator cannot solve a `probe`
   objective it needs a solver/plan entry (see how `newcomers.sim.test.ts` handles probes) — add the minimum it needs.

## Contract
Quest ids exactly `COAST_QUESTS`; probe ids `coast-spokewheel-rides`, `coast-tow-gates`, `coast-tow-finish`,
`coast-queen-chest`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files.
- `npx vitest run src/quests` passes; the side-quest sim suite passes (or report exactly which coast step it cannot solve
  and why).

## Out of scope
`src/coast/` other than `probes.ts`, `src/tubing/`, `app.ts`, `world.ts`, `config.ts`, the prefab catalog.
