Epic: 2, Systems
Depends on: none

## Goal
Saves are version 2 (with zone, XP, class, talents, flags, objects and hotbar). Old version 1 saves migrate without losing the character.

## Read first
- `games/gnomes-of-gnomomia/src/save.ts` (all), `src/state.ts` (`GameState`, `newGameState`), `src/config.ts` (`SAVE_KEY` is now `'gnomomia.save.v2'`)
- `docs/design/gnomomia/combat.md` §12 (migration notes)

## Change
- `src/save.ts`:
  - **Format:** `{ v: 2, state, zone, x, z }`. Merge nested records like today, adding `flags`, `talents`, `objects` and `hotbar`.
  - **Loading:** after loading, call `loadZone(state.zone, x, z)` (import from `./zones`) instead of `teleportPlayer`.
  - **Migration:** if there's no v2 save but `localStorage['gnomomia.save.v1']` exists, migrate it:
    - `level` stays. `xp = 0`, `skillPoints = level - 1`, `classId = null`, `zone = 'mossbottom'`.
    - Skills: `armor` → `toughness`, `destruction` → `sun`, `restoration` → `bloom`, `marksmanship` = 5, `rain` = 5. Clamp each to `5 + 4·level`.
    - Equipment: `shield` → `offhand`; the new slots are null.
    - Keep `quests`, `gold` and `inventory`.
    - Save as v2 and leave the v1 key in place.
  - **Broken saves** (wrong shape) return false as now.

## Contract
`saveGame`, `loadGame` and `deleteSave` signatures unchanged.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in save.ts.

## Out of scope
state.ts, zones.ts.
