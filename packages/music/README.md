# @lawn/music

Synthesized game music on Tone.js, shared by `games/sample-3d` (Lawn Gnome Panic) and `games/faster-than-lawn`. Everything is generated in code, so there are no assets to credit.

- **Sector themes** (`buildSectorTrack`): five chiptune themes in the manner of Ben Prunty's FTL score. Each has an explore and a battle arrangement that play in sync and crossfade when `opts.battle()` flips. Songs are arranged from per-theme pattern banks under fixed rules, so the notes are never random.
- **Jungle** (`buildRunTrack`, `buildMenuTheme`): a generated drum & bass track per seed, and a composed menu theme.
- **Golf ambient** (`buildGolfAmbient`): slow, relaxing generated golf music (soft pads, electric piano, a lazy bass, a flute melody, light brushed percussion) that loops forever. `games/gnome-golf` uses it.

Use it from a game:

```ts
import { playSong, setMuteKey, buildSectorTrack } from '@lawn/music';

setMuteKey('my-game-music-muted');
let battle = false;
playSong((T, keep, out) => buildSectorTrack(T, keep, out, seed, { battle: () => battle }));
```

Add `"@lawn/music": "*"` to the game's dependencies and run `npm install` from the repo root. Type-check with `npm run typecheck -w packages/music`.
