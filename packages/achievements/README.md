# @lawn/achievements: generic achievements & equipment unlocks

One achievement registry, one unlock store, and one toast UI for every game in the arcade.
Unlocking an achievement records it in `gnome.achievements.v1` (localStorage today; behind `AchievementStore` so a future platform service replaces one file) and unlocks its cosmetic `@lawn/prefabs` reward in `games/gnome-creator`.

## What a game does

```ts
import { createAchievementTracker } from '@lawn/achievements';

const achievements = createAchievementTracker({ game: 'gnome-golf', ui });
await achievements.unlock('golf-nice');
await achievements.increment('front-harvest-season'); // 1/3 -> 2/3 -> 3/3 (unlocks & shows toast)
```

See `docs/design/achievement-system.md` for the architecture and service-migration plan.

## Adding achievements for a new game (agents: do this for every new game)

1. Pick 3-6 achievements from what the game already does (a first win, a streak, a funny failure, a long-term count). Use `target` for counted ones.
2. Give most a cosmetic reward: `reward: { slot: 'head' | 'back' | 'neck' | 'hand', prefabId, label }`. Reuse an existing prefab with the matching `wear-*` (or hold) use tag; otherwise add one to `packages/prefabs/src/catalog/` and make `npm test -w packages/prefabs` pass.
3. Add the defs to `packages/achievements/src/catalog.ts` (`id` prefixed by the game, `game` = folder name, `gameTitle`).
4. In the game: add `"@lawn/achievements": "*"` to its package.json, create one tracker after `await loadMyGnome()`, and call `unlock` / `increment` from the game's events. The toast and the gnome creator need no further code.
5. `npm test -w packages/achievements` must pass (it checks every reward prefab exists and fits its slot).
6. If the game equips its own gear in a slot, override that slot (`packages/gnome/README.md`, "Games with their own gear").
