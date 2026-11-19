# @lawn/emotes: animated gnome emotes

Dances and gestures for the shared `@lawn/gnome` model. Achievements unlock them (`AchievementDef.emote` in
`@lawn/achievements`), the player equips up to 4 in the Gnome Creator, and games play them. Club Gnome is the first.

Every emote is code: `pose(t, out)` writes the shoulder and hip pivot angles and the body rig's lift, shift, spin,
lean and tip at `t` seconds. No keyframe files, no assets.

## What a game does

```ts
import { createEmotePlayer, loadMyEmotes, isEmoteId } from '@lawn/emotes';

const emote = createEmotePlayer(model);       // one per gnome model
const mine = await loadMyEmotes();            // the player's equipped emotes (max 4), already filtered to unlocked ones
// a button per emote: { id, label, icon } -> emote.play(id), and send id to other players
// every frame, right after model.update(state, dt):
emote.update(dt, walking);                    // walking cancels it; one-shots end on their own
emote.setModel(rebuiltModel);                 // after a look change
// receiving: if (isEmoteId(msg.a)) peerEmote.play(msg.a)
```

Only emote a grounded, living gnome. Online, send just the emote id (validate with `isEmoteId`); the loadout itself
never travels.

## Adding an emote

1. Add an `EmoteDef` to `src/catalog.ts` (axis notes at the top of that file). One-shots must start and end at rest;
   the test checks it.
2. Unless it is `free`, add an achievement with `emote: { emoteId, label, icon }` (same label and icon) to
   `packages/achievements/src/catalog.ts` and unlock it from the game's events.
3. `npm test -w packages/emotes` and `npm test -w packages/achievements`.

## Files

| File | What |
|---|---|
| `src/catalog.ts` | `EMOTES` (12: `wave`, `cheer` free; 10 achievement rewards), `getEmote`, `isEmoteId` |
| `src/player.ts` | `createEmotePlayer`: blends an emote over a model's walk/idle pose |
| `src/loadout.ts` | Loadout in localStorage `gnome.emotes.v1` (`{ version: 1, slots }`, max 4), unlock lookup via achievements |

Not yet: cloud sync of the loadout for signed-in players (achievements already sync, so unlocks follow the account;
only the choice of 4 is per browser).
