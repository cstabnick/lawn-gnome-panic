Epic: 2, Systems
Depends on: none

## Goal
Quests support the five new objective types (reach, interact, escort, defend, choice), flag and level conditions, quest tiers (XP is granted by progression.ts listening to `quest-completed`), and per-zone defend waves.

## Read first
- `games/gnomes-of-gnomomia/src/quests.ts` (all), `src/config.ts` (`Objective`, `Condition`, `QuestDef`)
- `docs/design/gnomomia/quests.md`, the "Objective types" table
- `src/entities.ts` exports `spawnEnemyAt(defId, x, z)`; `src/player.ts` exports `player`; `src/state.ts` exports `setFlag`

## Change
- `src/quests.ts`:
  - **`checkCondition`** handles every `Condition` field: `flag` (equal), `flagSet`, `flagUnset`, `minLevel`, `classId` (`'none'` means null), `hasItem` (`countItem`), `questAtLeast` (done, or active with `stage >= n`), and `not` (recursive negation).
  - **`checkStage`:**
    - `choice` is met when `state.flags[flag] !== undefined`.
    - `reach` is met when `state.zone === zone` and the player is within `r` of (x, z). Checked in `updateQuests`.
    - `interact` counts `interacted` events whose `objectId` matches, into `q.count`.
    - `escort` is met when `state.zone === zone` and the escorted NPC entity (find it by `defId === npc` in `allEntities()`) is within `r` of (x, z).
    - `defend`: on entering the stage while in the zone, start a timer. At each wave's `at` second, spawn `count` enemies with `spawnEnemyAt` at random points 8-12 m from (x, z). The stage is met after `seconds`. If the player is more than `r + 6` from the point for 5 s, or dies, reset the stage (`say` "You fell back. The defence starts again when you return.") and clear the timer.
  - **`updateQuests(dt)`** checks reach, escort and defend for active quests (throttle to every 0.25 s).
  - Listen to `flag-set` (for choice) and `zone-changed` (for reach and defend).
  - **`complete()`:** emit `quest-completed { questId }` before `quest-updated`.
  - Keep turn-in item handling. Quest items (`questItem`) are fine to take.

## Contract
`updateQuests(dt: number): void` (main.ts already calls it). Existing exports unchanged.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in quests.ts.
- The existing four Mossbottom quests behave as before.

## Out of scope
progression.ts (gives XP), dialogue.ts (sets flags), entities.ts.
