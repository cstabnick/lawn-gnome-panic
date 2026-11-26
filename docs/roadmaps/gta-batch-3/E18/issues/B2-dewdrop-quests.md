Epic: E18-A
Depends on: none (the 'bubble-mobile' kind exists; issue B1 tunes it in parallel)

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` first. Writing matters here: use judgement and the house voice.

## Goal
Hogweed Sprocket's three Dewdrop quests (L54, "a bubble-boy style vehicle quest where the player unlocks the
bubble-mobile... roll around hamster style") replace the stubs in `src/quests/dewdropQuests.ts`, are completable (quest
sim), and the last one gives the player the Dewdrop.

## Design (from docs/design/gnome-theft-auto/side-quest-schedule.md section 3; follow it)
Giver for all three: Hogweed Sprocket (`hogweed`, `UNDERSPAN.hogweed` x 580 z -18 in `src/societies/config.ts`), under
the Unfinished Span; talks fast, cited for "unauthorised verticality", never says sorry.
1. `sq-dewdrop-1` **The Rolling Prototype** (250 Acorns): the first Dewdrop got away while Hogweed argued with the Span's
   warning signs. It rolls loose along the Skyway verge and down to the canal bank. The player follows it (`chase-follow`
   with a generous distance so it never outruns a mower; the "target" is the empty ball: use the chase-follow fields
   that set the followed vehicle kind to 'bubble-mobile' if the objective supports a kind, else a 'checkpoints'
   objective along the same route with no timer), then a `visit` at the bank stops it. Hogweed arrives out of breath:
   nobody was inside it on purpose. The ball has no seat yet.
2. `sq-dewdrop-2` **Hogweed Rolls Out** (350 Acorns, prereq 1): three parts nobody will give up: a clear panel from the
   Greenhouse Strip, a coil spring from the Compost Heap furnace (Ernie lets it go for a joke about the cold), a brass
   seal-ring from the scrap heap at the Underspan's back door (`UNDERSPAN.scrapHeap`). Fetch all three
   (`steal-deliver` objectives or `visit`s, delivering to Hogweed), then a short drive alongside the rolling ball on the
   Span ramp. It bounces twice and stops. Hogweed has a plan for the third.
3. `sq-dewdrop-3` **Dewdrop** (0 Acorns, prereq 2, `achievement: 'gta-roll-with-it'`): the player climbs in. A ring of
   hay bales and tyre ramps under the Span: a `checkpoints` objective with `vehicle: { kind: 'bubble-mobile', at: [x, z,
   yaw] }` (spawned by the workshop), `requireVehicle: 'bubble-mobile'`, 5-7 gates within the `UNDERSPAN.site` rect and
   the open ground west of it (x 540..600, z -51..-1; keep off the deck), no timer; last gate the workshop door
   (`UNDERSPAN.workshopDoor`). Hogweed signs a handwritten, underlined form: the Dewdrop belongs to the player.
   `doneText` says it is parked by the workshop door and that replacements are 400 Acorns at the workshop.
Each quest: a dialogue cutscene (`kind: 'dialogue'`, `room: 'street'`, lines with `look` = Hogweed's look
`{ hat: 0x6b4a2e, shirt: 0x8a5a3a, beard: 0xd2691e, glasses: true }`, speaker `SOCIETY_CAST.hogweed` from
`societies/config.ts`), `hoa: 'off'`, `doneText`. Look at `src/quests/societyQuests.ts` (Hogweed's other quest) for
the exact style and field shapes.

## Read first
- `src/quests/dewdropQuests.ts` (stub, keep the export name `DEWDROP_QUESTS` and ids from `DEWDROP_QUESTS_IDS` in
  `src/dewdrop/config.ts`).
- `src/quests/types.ts` objective kinds: 'visit' (~l.97), 'steal-deliver' (~l.99), 'chase-follow' (~l.114),
  'checkpoints' (~l.187-200, `CheckpointDef`).
- `src/quests/societyQuests.ts`, `src/societies/config.ts` (UNDERSPAN rect, workshopDoor, scrapHeap, hogweed).
- Quest sim: `src/questSim/plans.ts` (the three ids are listed with `expect: 'pass'`), `src/questSim/solvers/` (how
  objectives are solved), `src/questSim/side.sim.test.ts`. Greenhouse Strip and Compost Heap positions: grep
  `src/quests/stages/*.ts` and `src/city/places.ts` for "Greenhouse" / "Compost".
- Stages: `src/quests/stages/societies.ts` already lists the three ids under the Underspan stage; if a quest goes to
  another place (the canal bank, Greenhouse Strip, Compost Heap), `stages.test.ts` may want those places' stages to list
  the quest: add the id to that stage's `usedBy`.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your file(s).
- `npx vitest run src/quests src/questSim/coverage.test.ts` pass.
- Quest sim for the three: `npx vitest run --config vitest.sim.config.ts src/questSim/side.sim.test.ts` (if the
  config exists; report pass/fail per quest; it may take minutes). If the sim cannot drive a 'bubble-mobile' yet because
  B1 is still changing it, say so in your report rather than weakening the quest.

## Out of scope
`src/dewdrop/runtime.ts`, `src/config.ts`, `vehicles.ts`, `handling.ts` (other issues).
