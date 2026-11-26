Epic: E20-1 foundation (engine, cast, props)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a615015c8306f82da` (run every command from there).
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout, do not
run `npm install`. Keep LF line endings. Another worker edits `packages/prefabs/src/catalog/gta-story-act12.ts` at the
same time: do not touch it.

## Goal
Twelve Gnome Theft Auto story achievements (acts I-II) exist, each with a new wearable cosmetic reward, so the story
quests can name them with `achievement: '<id>'`.

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules), `packages/prefabs/src/types.ts` (PrefabDef, `wear`
  field, `PrefabWear`, the `'wear-<slot>'` uses).
- `packages/prefabs/src/catalog/gta-sports-gear.ts`: finished GTA wearables (head, neck, back, hand): copy the shape of
  their `wear` mounts and categories.
- `packages/achievements/src/catalog.ts`: entries `game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'` and the
  reward shape `{ slot, prefabId, label }`; `packages/achievements/README.md`.

## Change
1. `packages/prefabs/src/catalog/gta-story-gear.ts` (already registered, array `GTA_STORY_GEAR`, empty now): add the
   twelve wearables below. Each: `uses: ['wear-<slot>']` (hand items `['hold', 'wear-hands']`-style as the sports gear
   does for hand), a `wear` mount like its neighbours, five examine lines, tags with `'gta'`.
2. `packages/achievements/src/catalog.ts`: add the twelve `AchievementDef`s (append after the last
   `gnome-theft-auto` entry), each with its reward.

| achievement id | title | description (condition, as the player reads it) | reward prefab id (slot) | the item |
|---|---|---|---|---|
| `gta-mortgage-gnome` | Mortgage Gnome | Sign for Flat 3B and climb the stairs. | `house-key-lanyard` (neck) | a brass key on a red lanyard |
| `gta-cap-back` | Cap Back | Bring Asphalt and her bottlecap home to Bodega & Sons. | `bottlecap-pendant` (neck) | a red crimped bottlecap on a cord |
| `gta-off-by-a-quarter-inch` | Off by a Quarter-Inch | Swap Reginald's calipers without anyone raising an alarm. | `quarter-inch-ruler` (hand) | a folding wooden rule with one mark in red |
| `gta-swish-seven` | Swish | Win Pip's toolbox back at Drainpipe Court. | `court-headband` (head) | a green-and-white headband |
| `gta-dress-rehearsal` | Dress Rehearsal Clean | Run the Boot float through the Even-Estates site at night. | `parade-banner-cape` (back) | a short parade banner worn as a cape, a boot sewn on |
| `gta-fair-weather-friend` | Fair-Weather Friend | Set all three of Rooster's barometers down unbroken. | `weathervane-pack` (back) | a small rooster weathervane on a backpack frame |
| `gta-agreeable` | Agreeable | Leave the penthouse key on the table. | `beige-cravat` (neck) | a neat beige cravat |
| `gta-mole-neighbour` | Neighbourly | Bring Nubbin home to the Burrow Door without a bump. | `mole-lantern-charm` (neck) | a tiny brass mole lantern on a chain |
| `gta-standing-ovation` | Standing Ovation | Stand on one leg through Mother Saxifrage's whole sermon. | `flamingo-plume` (head) | one tall pink feather in a hat band |
| `gta-gentle-hands` | Gentle Hands | Drive Granny to the Glaze Clinic without a single bump. | `pie-tin` (hand) | a pie tin with a lattice crust |
| `gta-hold-the-bay` | Hold the Bay | Hold Side-Valve Alley while the crate is loaded. | `shop-rag-scarf` (neck) | an oily red shop rag knotted as a scarf |
| `gta-on-the-house` | On the House | Square things with Chrome-Knuckle Cass: Pay 'n' Glaze repairs are free. | `chrome-knuckle-glove` (hand) | a work glove with chrome knuckle plates |

Before adding, grep both catalogs: if an id already exists, stop and report (do not rename).

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.
- `npm test -w packages/gnome` passes (wear mounts render on a gnome).
- `npx tsc --noEmit -p packages/prefabs` and `-p packages/achievements` pass.

## Out of scope
Every other file, the game code, `gta-story-act12.ts`, `catalog/index.ts` (already wired).
