Epic: 2, Systems
Depends on: none

## Goal
Hotkeys 1-8 use hotbar slots. World objects can be clicked, right-clicked and examined. Player movement respects Slowed and Rooted.

## Read first
- `games/gnomes-of-gnomomia/src/input.ts` (all: picking, menus, hotkeys at about line 220), `src/player.ts` (`PlayerAction`, `interact`, `updatePlayer`)
- `src/objects.ts` exports `objectFromMesh(obj)`, `objectPosition(id)`, `useObject(id)`; `src/abilities.ts` exports `useHotbar(slot)`; `src/combat.ts` exports `speedFactor(id)`; `src/content.ts` `OBJECTS`

## Change
- `src/input.ts`:
  - **Hotkeys:** keys `1`-`8` call `useHotbar(n-1)` (replacing the direct castSpell calls).
  - **Picking objects:** when the raycast hit is not an entity, try `objectFromMesh`.
    - Left-click an object: walk to it and use it (`interact('use', ...)`, see player.ts below).
    - Right-click an object: show a menu with `OBJECTS[id].verb`, `Examine` (say the `examine` text) and `Walk here`.
    - Hover text shows the object's name.
- `src/player.ts`:
  - Extend `PlayerAction` to `{ type: 'attack' | 'talk' | 'take'; target: number } | { type: 'use'; object: string }`.
  - `interact` gets an overload for objects: `export function useWorldObject(id: string): void` walks to `objectPosition(id)` and, within 1.8 m, calls `useObject(id)` and clears the action.
  - Walk speed × `speedFactor(PLAYER_ID)`. No movement while it is 0.
  - Ranged weapons: when attacking with an equipped item whose `weaponClass` is sling/blowpipe/thrown, stop walking once within 12 m instead of melee range (read `equippedWeapon()`).

## Contract
Existing exports unchanged, plus `useWorldObject(id)`. combat.ts handles the actual ranged swing distance; player.ts only stops walking in range.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in input.ts or player.ts.

## Out of scope
objects.ts, abilities.ts, combat.ts, ui/*.
