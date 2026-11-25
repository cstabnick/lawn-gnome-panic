Epic: E16-D (countryside, last wave)
Depends on: none
Agent: general-purpose (Sonnet): quest writing

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
Two side quests from the side-quest schedule are playable and pass the quest sim: **Night Shift at Levelright**
(`sq-levelright-night-shift`, giver Chard Levelright at the gate of Even-Estates Plot 1) and **The Croft by the Silo**
(`sq-windfall-croft-deed`, giver Farmer Bramble at Windfall Croft's gate). Both use `visit` objectives (and at most one
interior or simple objective type the bot already handles), so the bot can do them.

## Background (confirmed)
- Schedule (`docs/design/gnome-theft-auto/side-quest-schedule.md`): `sq-levelright-night-shift` unlocks after #7
  `m07-even-estates` (Chard met the player at the fringe site and is short of hands that will not talk to the Tattler),
  act I cap 3; `sq-windfall-croft-deed` after #31 `m31-granny-cracks` (Granny told the player about her husband's silo;
  Bramble knows who holds the deed), act II cap 4. Neither story quest exists yet (E20 builds acts I-II). Until then:
  unlock the night shift after the existing `ch1-two-coat-tail` (the tail goes past the fringe) and the croft deed after
  `ch2-sprinkler-gauntlet` (the player meets the Cloverfield farmers in chapter 2), each with a `why` noting that E20
  re-times them to #7 / #31. Respect the open-offer caps: `src/quests/unlocks.test.ts` must still pass; if a cap breaks,
  move the unlock one existing story quest later and say so. Update the two schedule rows and the two area-coverage rows
  ("Thorne Even-Estates sites (E16)", "Windfall Croft (E16)") with the temporary unlocks.
- Givers: the lead placed `giver` markers: `giver/chard` at world (-323, -117) (just outside Plot 1's west gate) and
  `giver/bramble` at world (57, 545) (outside Windfall Croft's west gate). `src/quests/defs.ts` `GIVERS` entries use
  `...placed('<id>')`, e.g. `lovage`.
- Places (`src/country/types.ts` `EVEN_ESTATES`, `src/farm/types.ts` `CROFT`): Plot 1 centre (-295, -120), its yard
  (-297, -104), crane (-275, -122), show-homes at z -139 (x -308, -298, -288; doors face south, the spot 1.5 m in front
  of a door is z -134.9); Plot 2 (gate (220, 325) on its east side; show-home doors face north at z ~340.4: front spots
  (208, 339), (198, 339), (188, 339)); Plot 3 (gate (1020, 250); yard (1048, 271)); Windfall Croft: farmhouse door spot
  (121.5, 513) (front faces west), barn doors (121.5, 553), the oak spot (118, 534), the For Sale board (62.5, 541),
  the orchard along z ~559 (x 66..116); Granny's barn (find `granny-barn` in `src/quests/stages.ts` or
  `docs/design/gnome-theft-auto/environments.md` for its spot). Colliders: the site hoardings, show-homes and the
  croft's buildings are solid, so put every `visit` target on open ground 2-4 m in front of a door or at a yard edge,
  never inside a footprint.
- People (`docs/design/gnome-theft-auto/characters.md` rows `chard`, `bramble`; lore `npm run lore -- find levelright`,
  `-- find bramble`, `-- find croft`): Chard: slow, flat, gravelly, pauses to check things by eye, site words ("true",
  "plumb", "out of square"); "That wall is out of square. Everything else is fine." / "Nobody asked me who it was for."
  He builds identical empty houses for Vesper Thorne and has stopped asking who for. Bramble: low near-whisper, flat farm
  vowels, "Don't look up. Just listen." before anything loud; Granny Gnertrude's neighbour; knows more about Granny's
  late husband's acorn silo than he lets on (hint only, never revealed). House voice: short, plain, dry; nothing hurt.

## Read first
- `games/gnome-theft-auto/src/quests/types.ts` (`QuestDef`, `visit` objective, `GiverDef`).
- `games/gnome-theft-auto/src/quests/rootwellQuests.ts` (two finished side quests of the same shape: dialogue
  cutscene, objectives with `toastOnEnter`, outro, `doneText`).
- `games/gnome-theft-auto/src/quests/defs.ts` (`GIVERS`, `QUESTS`), `src/quests/unlocks.ts` (`SIDE_UNLOCKS`,
  `SIDE_COLORS`).
- `games/gnome-theft-auto/src/questSim/plans.ts` (per-quest expectations).

## Change
- New `src/quests/countryQuests.ts` exporting `COUNTRY_QUESTS_DEFS: readonly QuestDef[]`:
  - `sq-levelright-night-shift` "Night Shift at Levelright", giver `chard`, rewardAcorns 250. Dialogue (4-6 lines):
    Chard needs someone to walk the night round of all three sites, because his watchmen talk to the Tattler and the
    player does not; he wants every show-home checked ("Same window lit in every one. If one's different, I want to
    know."). Objectives: (1) `visit` Plot 1's show-home row (in front of the middle door), toast: the same window is lit
    in all three, as ordered; (2) `visit` Plot 2's gate, then (3) the front of its middle show-home, toast: one house
    has a doormat and a milk bottle, which nobody ordered; (4) `visit` Plot 3's yard, toast: the bucket crane has a
    pigeon in the bucket, which is not in the plans either; (5) `visit` back to Chard. Outro (2-3 lines): Chard hears
    about the doormat, is quiet, and says "Somebody wanted to live there." He pays; a flicker of the man in #69.
  - `sq-windfall-croft-deed` "The Croft by the Silo", giver `bramble`, rewardAcorns 200. Dialogue (4-6 lines): Bramble,
    near-whisper: Windfall Croft has a For Sale board and nobody knows who is selling; the old owner left in a hurry and
    the deed went with the apples; he thinks it is still on the land. Objectives: (1) `visit` the croft's farmhouse door,
    toast: the letterbox is full of bank letters, none of them the deed; (2) `visit` the barn doors, toast: the hayloft
    has a nest, a lantern and a tin with nothing in it but a note: "the oak spot"; (3) `visit` the oak spot, toast: under
    a stone, an oilskin packet: the deed, made out to "whoever minds the oak"; (4) `visit` back to Bramble. Outro:
    Bramble reads it, glances up, says "Don't look up. Just listen." and then nothing happens; he hands it back: the bank
    still sells the croft, but the deed says the oak spot is for whoever plants there. A hint that Granny's husband's
    silo kept a copy (never more than a hint). `doneText` one dry line.
  - Use the same fields as the Rootwell quests (room 'street' dialogues, `hoa` policy if they set one, etc.).
- `src/quests/defs.ts`: `GIVERS` entries `chard` (name "Even-Estates Plot 1", label 'Talk to Chard Levelright',
  `...placed('chard')`, room 'street', letter '!') and `bramble` (name 'Windfall Croft', label 'Talk to Farmer Bramble',
  `...placed('bramble')`, room 'street', letter '!'); add `...COUNTRY_QUESTS_DEFS` to `QUESTS` after the Rootwell ones.
  If a giver id `bramble` already exists in GIVERS, use `bramble-croft` for the new one and the marker stays
  `giver/bramble` (pass it to `placed`).
- `src/quests/unlocks.ts`: two `SIDE_UNLOCKS` rows (as above) and `SIDE_COLORS` for `chard` ('#d9c8a5') and `bramble`
  ('#8fb339').
- `src/questSim/plans.ts`: both `{ suite: 'side', expect: 'pass' }`.
- `docs/design/gnome-theft-auto/side-quest-schedule.md`: the two rows and the two area-coverage rows.

## Contract
Quest ids exactly `sq-levelright-night-shift` and `sq-windfall-croft-deed` (`COUNTRY_QUESTS` in `src/country/types.ts`);
giver ids `chard` and `bramble` (or `bramble-croft`, see above).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests src/levels.test.ts src/sites.test.ts` passes.
- `npm run quest-sim -w games/gnome-theft-auto -- --quest sq-levelright-night-shift,sq-windfall-croft-deed` passes (it
  builds the game in a headless browser and may take minutes; if the tool cannot run in your environment, run
  `npx vitest run --config vitest.sim.config.ts src/questSim/side.sim.test.ts` and check both ids pass in its output;
  if a visit fails because a collider sits on a target, move the target to open ground and say so).
- `npx tsc --noEmit -p games/gnome-theft-auto` passes for your files.

## Out of scope
`src/country/*`, `src/farm/*`, `app.ts`, level documents (the giver markers are already placed), other quests.
