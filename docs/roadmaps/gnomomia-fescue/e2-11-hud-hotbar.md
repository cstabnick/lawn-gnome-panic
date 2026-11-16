Epic: 2, Systems
Depends on: none

## Goal
The HUD shows an XP bar, the class resource bar, an 8-slot hotbar, hitsplats coloured by damage type (big gold crits), rank-coloured nameplates, a boss bar and a zone banner.

## Read first
- `games/gnomes-of-gnomomia/src/ui/hud.ts` (all), `src/ui/hotbar.ts` (stub)
- `src/events.ts` (`hit` now has `damageType`, `crit`; also `xp-gained`, `zone-changed`, `boss-phase`, `status`)
- `src/abilities.ts` exports `resource()`, `knownAbilities()`, `abilityCooldown(id)`, `useHotbar(i)`; `src/progression.ts` exports `xpToNext(level)`; `src/rules.ts` exports `enemyStats(def)`

## Change
- `src/ui/hud.ts`:
  - **XP bar:** a thin gold bar under the orb row showing `state.xp / xpToNext(state.level)`, with tooltip text `XP a / b`.
  - **Resource bar** under it: brown (grit), green (focus) or blue (mana); hidden while classless.
  - **Hitsplat colours** by `damageType`: slash/crush/pierce red as now, sun orange, rain blue, bloom green, poison purple (when the payload has no type but a poisoned status ticked). Crits are 1.5× size, gold, with a `!`.
  - **Overhead nameplates:** name colour by rank (trivial grey, normal white, elite gold, miniboss orange, boss/worldboss/final red).
  - **Boss bar:** a wide bar at the top centre while an enemy of rank boss/worldboss/final is in combat, with its name and HP. Show the `boss-phase` text under it for 4 s.
  - **Zone banner:** on `zone-changed`, the zone name in big gold serif text that fades over 3 s.
- `src/ui/hotbar.ts`:
  - `createHotbar(root)`: 8 square slots bottom-centre in the brown/gold UI palette (`UI` in config), numbered 1-8.
  - Each slot shows the ability or spell icon for `state.hotbar[i]`, a cooldown shade, and a red tint if the resource is short.
  - Left-click → `useHotbar(i)`. Right-click → a menu listing `knownAbilities()` (plus Flare and Mend) to assign to that slot (writes `state.hotbar[i]`).
  - `updateHotbar()` is called from hud's update.

## Contract
`createHotbar`/`updateHotbar` as stubbed. Don't change `createHud`/`updateHud` signatures.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in ui/hud.ts or ui/hotbar.ts.

## Out of scope
ui/panels.ts, abilities.ts, main.ts.
