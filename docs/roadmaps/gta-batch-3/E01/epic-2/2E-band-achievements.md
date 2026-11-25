Epic: E01-2 Fill (GTA batch 3, world expansion)
Depends on: none

## Environment
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af7a6a91d2dd2fbef` (a git worktree). Game: `games/gnome-theft-auto`.
- Git Bash. If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers are editing other files of this game at the same time (`src/hud.ts`, `src/world.ts`, `src/parks/*`,
  `src/biomes.ts`, `src/landforms/*`, level documents, `docs/lore`). Touch only the files listed under Change. Do not
  commit. Do not run `vite build` or a dev server.
- Keep each existing file's line endings (use the Edit tool).
- Repo rule (AGENTS.md, achievements): each new `AchievementDef` ideally has a cosmetic `reward`: a `@lawn/prefabs` gear
  item for the gnome's `head`, `back`, `neck` or `hand` slot, reusing an existing prefab. How: `packages/achievements/README.md`.

## Goal
The map grew by four band regions. Reaching each one for the first time unlocks an achievement with a cosmetic reward.

| achievement id | when | title | description |
|---|---|---|---|
| `gta-band-highlands` | first time the player is in biome `highland` (Snowcap Rise, north) | Above the Fells | Climb past Frostbite Fells to Snowcap Rise. |
| `gta-band-shore` | first time in biome `coast` (Saltbucket Shore, south) | Salt on the Glaze | Drive south until the garden ends in sand at Saltbucket Shore. |
| `gta-band-campus` | first time in biome `campus` (Rootwell, east) | Mature Student | Find Rootwell University past the Dust Flats. |
| `gta-band-estates` | first time in biome `estate` (Trellisdown, west) | Through the Hedge | Slip past the hedges into Trellisdown, west of Mossy Wood. |

## Read first
- `packages/achievements/README.md` (the def shape, rewards) and `packages/achievements/src/catalog.ts` (search
  `gta-captain-clay` for a GTA example with `reward: { slot: 'head', prefabId: 'captain-cap', label: "Captain's Cap" }`).
- Prefab catalogs for gear: `packages/prefabs/src/catalog/cosmetics-head-a.ts`, `cosmetics-head-b.ts`,
  `cosmetics-back.ts`, `cosmetics-neck.ts`. Pick four existing gear prefabs that fit (e.g. a woolly or knitted hat for
  the highlands, a sun hat or shades for the shore, a mortarboard/scholar's cap for the campus, a cravat or monocle-ish
  neck item for the estates) and that no other achievement in `catalog.ts` already uses as its `prefabId`
  (`grep -n "prefabId: '<id>'" packages/achievements/src/catalog.ts` must find nothing before you add it).
- `games/gnome-theft-auto/src/wildAchievements.ts` (style of a small achievement table module).
- `games/gnome-theft-auto/src/app.ts` around the comment `// Biomes: a toast and an explorer count the first time each one is entered.` (~line 1686).

## Change
- `packages/achievements/src/catalog.ts`: add the four `AchievementDef`s next to the other GTA ones, with
  `game: 'gnome-theft-auto', gameTitle: 'Gnome Theft Auto'`, the titles/descriptions above, and a `reward` each
  (slot + existing prefabId + a short label).
- New `games/gnome-theft-auto/src/bandAchievements.ts`:
  ```ts
  import type { BiomeId } from './types';
  /** The batch-3 band biomes (E01) and the achievement the first visit unlocks (packages/achievements catalog.ts). */
  export const BAND_ACHIEVEMENTS: Readonly<Partial<Record<BiomeId, string>>> = {
    highland: 'gta-band-highlands', coast: 'gta-band-shore', campus: 'gta-band-campus', estate: 'gta-band-estates',
  };
  /** The achievement to unlock on entering `biome`, or null. */
  export function bandAchievement(biome: BiomeId): string | null { return BAND_ACHIEVEMENTS[biome] ?? null; }
  ```
  and `games/gnome-theft-auto/src/bandAchievements.test.ts` checking each band biome maps to its id, `city` maps to
  null, and every id exists in the catalog (`import { ACHIEVEMENTS } from '@lawn/achievements'` or whatever the package
  exports for the list; check `packages/achievements/src/index.ts`).
- `games/gnome-theft-auto/src/app.ts`: import `bandAchievement` and, inside the existing
  `if (nowBiome !== biome) { ... }` block, after the toast, add
  `const bandId = bandAchievement(biome); if (bandId) void achievements.unlock(bandId);` (unlock is idempotent). Change
  nothing else in app.ts.

## Contract
- Achievement ids exactly as in the table. `bandAchievement(biome: BiomeId): string | null`.

## Done when
- `npm test -w packages/achievements` passes (from the repo root).
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` succeeds.
- `npx vitest run src/bandAchievements.test.ts` passes (from `games/gnome-theft-auto`).

## Out of scope
- Any other file. The existing `gta-explorer` achievement (leave its target and text alone).
