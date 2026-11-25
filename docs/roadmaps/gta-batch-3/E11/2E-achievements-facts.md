Epic: 2 Places and rides
Depends on: epic 1 (reward prefabs in `packages/prefabs/src/catalog/gta-coast-gear.ts` exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. Other workers edit game files under `src/coast/` and `src/tubing/` at
the same time. You own only `packages/achievements/src/catalog.ts` and `games/gnome-theft-auto/src/loading/facts.ts`.

## Goal
Five Saltbucket Shore achievements exist in the shared catalog, each with a wearable reward, and the loading screen has
five new coast facts.

## Read first
- `packages/achievements/src/catalog.ts`: entries with `game: 'gnome-theft-auto'`, e.g. `gta-glazed-over`,
  `gta-roof-rat`, `gta-rooftop-run` (a counted one with `target`). Match their shape exactly.
- `packages/achievements/src/types.ts` (`AchievementDef`, `reward: { slot, prefabId, label }`).
- `packages/achievements/src/achievements.test.ts` (what is checked: unique ids, reward prefab exists, ...).
- `packages/prefabs/src/catalog/gta-coast-gear.ts` (reward prefab ids and names).
- `games/gnome-theft-auto/src/loading/facts.ts` (`LOADING_FACTS`, 140 characters max each).

## Change
1. `packages/achievements/src/catalog.ts`: append, next to the other `gta-` entries (end of the GTA block is fine):

| id | title | description | target | reward |
|---|---|---|---|---|
| `gta-salt-skier` | Salt Skier | Water-ski 2000 metres on the Saltwater. Driftwood calls that "warming up". | 2000 | head `ski-visor` "Salt-Skier Visor" |
| `gta-wake-jumper` | Wake Jumper | Spend a full second in the air off the Saltwater wake ramp, on skis. | – | back `life-ring-back` "Life Ring" |
| `gta-full-circle` | Full Circle | Ride the Spokewheel all the way round and come down where you went up. | – | neck `spokewheel-scarf` "Spokewheel Scarf" |
| `gta-queens-treasure` | The Queen's Treasure | Find the Bathtub Queen's real treasure, not the one for the tourists. | – | head `pirate-bandana` "Pirate Bandana" |
| `gta-shiver-me-glaze` | Shiver Me Glaze | Finish Captain Bilge's pirate tour without anyone looking in the hold. | – | head `eye-patch` "Toy Eye Patch" |

   (`game: 'gnome-theft-auto'`, `gameTitle: 'Gnome Theft Auto'`; omit `target` where the table says –.)
2. `games/gnome-theft-auto/src/loading/facts.ts`: append to `LOADING_FACTS` (each <= 140 characters):
   - 'The Saltwater is real. Gnomes who have not seen it call it the Big Puddle. Driftwood was right all along.'
   - 'The Puddle Sea drains south through the Saltcut. Driftwood says he dug it with a teaspoon. Nobody has checked.'
   - 'The Spokewheel turns once every ninety-six seconds whatever anyone does. Marram charges three acorns to sit in a teacup.'
   - 'The Bathtub Queen runs pirate tours at noon and cargo at midnight. Captain Bilge asks you not to mix them up.'
   - 'Long Spoon Pier is a giant spoon laid out to sea, bowl end first. Walk it slow: the bowl end sways.'

## Done when
- `npm test -w packages/achievements` passes.
- `cd games/gnome-theft-auto && npx vitest run src/loading` passes (if a facts test exists; else `npx tsc --noEmit -p .`
  is clean for facts.ts).

## Out of scope
Every other file. Do not add the achievements anywhere in game code (other issues call `unlock` / `increment`).
