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
