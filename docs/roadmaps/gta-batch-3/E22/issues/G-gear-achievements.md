Epic: E22-1 foundation (cast, props, gear, W16, lore part 1)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adec7594cd8bfc2db` (run every command from there).
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout, do not
run `npm install`. Keep LF line endings. Another worker edits `packages/prefabs/src/catalog/gta-story-act4.ts` at the
same time: do not touch it.

## Goal
Eight Gnome Theft Auto story achievements (act IV) exist, seven with a new wearable cosmetic reward and one ("The
Whole Story") reusing an existing wearable, so the story quests can name them with `achievement: '<id>'`.

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules), `packages/prefabs/src/types.ts` (PrefabDef, `wear`
  field, `PrefabWear`, the `'wear-<slot>'` uses).
- `packages/prefabs/src/catalog/gta-story-gear3.ts` and `gta-story-gear.ts`: the earlier story wearables (head, neck,
  back, hand): copy the shape of their `wear` mounts, categories, uses and examine voice exactly.
- `packages/achievements/src/catalog.ts`: the block `// ---- Gnome Theft Auto: story act III (E21) ----` and the
  reward shape `{ slot, prefabId, label }`; `packages/achievements/README.md`.

## Change
1. `packages/prefabs/src/catalog/gta-story-gear4.ts` (already registered, array `GTA_STORY_GEAR4`, empty now): add the
   seven new wearables below. Each: `uses` and `wear` like its slot's neighbour in `gta-story-gear3.ts`, five examine
   lines (no "wet", "soak", "blood", "gore"), tags with `'gta'`. `stop-sign-lollipop` must also be holdable as a prop
   (`uses` includes `'hold'` with a `grip`): Hyssop holds it in a cutscene.
2. `packages/achievements/src/catalog.ts`: add a block `// ---- Gnome Theft Auto: story act IV (E22) ----` right after
   the last E21 story entry, with the eight `AchievementDef`s, each with its reward.

| achievement id | title | description (as the player reads it; it unlocks when the quest is finished) | reward prefab id (slot) | the item |
|---|---|---|---|---|
| `gta-almost-certainly` | Almost Certainly | Fly to the Underspan and back for Hogweed's mortar and a parachute that almost certainly opens. | `patched-parachute-pack` (back) | a small canvas parachute pack covered in mismatched patches, one patch reading "ALMOST" |
| `gta-salute-to-a-mole` | Salute to a Mole | Escort the Burrowfolk's diggers under Fort Sandpit and see Commander Diggs salute a mole. | `spade-guard-pin` (neck) | a small brass pin of two crossed spades on a green ribbon, worn at the collar |
| `gta-all-hats` | All Hats at One Table | Bring every outcast in Turfton to one table at the overlook camp. | `patchwork-coalition-cape` (back) | a short cape of patchwork squares in every faction's cap colour |
| `gta-hairline` | Hairline | See Clara's photograph and hear what she asks of you. | `pressed-leaf-locket` (neck) | a small oval locket on a chain with a pressed green leaf behind glass |
| `gta-last-lift-home` | Last Lift Home | Drive every friend home on the night before the Even Cut. | `saucer-court-key` (hand) | a big brass flat key on a ring with a saucer-shaped fob stamped "3B" |
| `gta-lollipop-lady` | Lollipop Lady | Get the fringe out of the Grand Combine's way while Hyssop holds the crossing. | `stop-sign-lollipop` (hand) | a crossing-patrol stop sign: a round red-and-white "STOP" disc on a tall white pole, held upright |
| `gta-hat-comes-off` | The Hat Comes Off | Stop Vesper Thorne without shattering him, and take his top hat. | `borrowed-top-hat` (head) | a tall glossy black top hat with a porcelain-white band, slightly too big |
| `gta-the-whole-story` | The Whole Story | Finish every main quest of the story, all seventy. | an **existing** wearable: pick one fitting (a medal, rosette, sash or laurel) from `packages/prefabs/src/catalog/*gear*.ts` that no other achievement uses as a reward (grep `prefabId:` in the achievements catalog) | - |

Before adding, grep both catalogs: if an id already exists, stop and report (do not rename).

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.
- `npm test -w packages/gnome` passes (wear mounts render on a gnome).
- `npx tsc --noEmit -p packages/prefabs` and `-p packages/achievements` pass.

## Out of scope
Every other file, the game code, `gta-story-act4.ts`, `catalog/index.ts` (already wired).
Final report (<= 10 lines): ids added, the existing prefab chosen for The Whole Story, test results.
