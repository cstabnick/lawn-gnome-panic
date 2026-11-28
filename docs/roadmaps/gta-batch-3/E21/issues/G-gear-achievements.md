Epic: E21-1 foundation (cast, props, gear, story marks)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adcca8ae7d2f22e45` (run every command from there).
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout, do not
run `npm install`. Keep LF line endings. Another worker edits `packages/prefabs/src/catalog/gta-story-act3.ts` at the
same time: do not touch it.

## Goal
Six Gnome Theft Auto story achievements (act III) exist, five with a new wearable cosmetic reward and one reusing an
existing scarf, so the story quests can name them with `achievement: '<id>'` (it unlocks when that quest is finished).

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules), `packages/prefabs/src/types.ts` (PrefabDef, `wear`
  field, `PrefabWear`, the `'wear-<slot>'` uses).
- `packages/prefabs/src/catalog/gta-story-gear.ts`: the act I-II story wearables (head, neck, back, hand): copy the
  shape of their `wear` mounts, categories, uses and examine voice exactly.
- `packages/achievements/src/catalog.ts`: the block `// ---- Gnome Theft Auto: story acts I-II (E20) ----` and the
  reward shape `{ slot, prefabId, label }`; `packages/achievements/README.md`.

## Change
1. `packages/prefabs/src/catalog/gta-story-gear3.ts` (already registered, array `GTA_STORY_GEAR3`, empty now): add the
   five new wearables below. Each: `uses` and `wear` like its slot's neighbour in `gta-story-gear.ts`, five examine
   lines (no "wet", "soak", "blood", "gore"), tags with `'gta'`.
2. `packages/achievements/src/catalog.ts`: add a block `// ---- Gnome Theft Auto: story act III (E21) ----` right
   after the last E20 story entry, with the six `AchievementDef`s, each with its reward.

| achievement id | title | description (as the player reads it; it unlocks when the quest is finished) | reward prefab id (slot) | the item |
|---|---|---|---|---|
| `gta-woolly-sock-regular` | Woolly Sock Regular | Lose the salt-plows on Snowdrop Slope and take a bunk at the Woolly Sock Lodge. | `woolly-sock-scarf` (neck) **exists already: reuse, do not add** | - |
| `gta-cap-bruiser` | Cap Bruiser | Win the Capwood Run for Lugnut Lulu and the Carburettors. | `racing-flag` (hand) | a small chequered racing flag on a short stick |
| `gta-pirate-for-a-night` | Pirate for a Night | Take an HOA barge's blades and raise the crew's colours on the Bathtub Queen. | `pirate-tricorn` (head) | a black felt tricorn with a gold trim and a little paper skull |
| `gta-sugar-landlord` | Sugar Landlord | Pay the ants' sugar toll and fly out of Rootwell with the guidance lens. | `faculty-gown` (back) | a short black faculty gown with a green Rootwell hood, worn as a cape |
| `gta-everyone-digs` | Everyone Digs | Do all three jobs for the Burrowfolk of Loamdeep. | `mole-lamp-helmet` (head) | a brass miner's helmet with a small warm lamp (`glow`) on the front |
| `gta-nothing-works` | Nothing Works | Throw everything at the Grand Combine's deck and live to run through the hedge. | `golf-umbrella` (hand) | a big striped golf umbrella, closed, held like a cane |

Before adding, grep both catalogs: if an id already exists (other than `woolly-sock-scarf`), stop and report (do not rename).

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.
- `npm test -w packages/gnome` passes (wear mounts render on a gnome).
- `npx tsc --noEmit -p packages/prefabs` and `-p packages/achievements` pass.

## Out of scope
Every other file, the game code, `gta-story-act3.ts`, `catalog/index.ts` (already wired).
Final report (<= 10 lines): ids added, test results.
