# @lawn/cloudsave

Cloud saves for signed-in players. A **slot** mirrors one localStorage save (`saveKey`) to the platform's
SaveService, one save per account per game, so the save follows the player to other devices and other copies of the
arcade. Not signed in, or the service unreachable: the slot does nothing and the game plays from localStorage as
before.

Writes are guarded by a revision. The slot remembers, under `syncKey`, the revision it last synced and a hash of the
local text it synced then (`{ rev, hash }`). When both sides changed since then, the slot follows one of two modes.

## Modes

| Mode | Use it for | When both sides changed |
| --- | --- | --- |
| `'choose'` (default) | One line of progress, e.g. an RPG character | `syncAtStartup()` returns a `conflict`; the game asks the player and calls `resolveConflict('local' \| 'remote')`. During play, a write refused because another device wrote first sets status `'stopped'` for the session. |
| `'merge'` | Data that only grows, e.g. achievements, best photos | The slot merges the two with your `merge()` and pushes the result. No conflict is shown. A refused write is re-read, merged and retried (up to 3 times). `merge` is required in this mode. |

Gnomomia uses `choose`. Its save is one character's progress, and two devices playing it at once is a real choice for
the player. Achievements use `merge`: two devices unlocking different achievements should keep both.

## Usage

Choose mode (Gnomomia):

```ts
import { createCloudSlot, defaultDeps } from '@lawn/cloudsave';

const slot = createCloudSlot({
  game: 'GNOMOMIA',
  saveKey: SAVE_KEY,            // localStorage key of the save text
  syncKey: 'gnomomia.cloud.v1', // localStorage key of the sync bookkeeping
  summarize: (text) => `Level ${levelOf(text)}, ${zoneOf(text)}`, // shown on conflicts
  mode: 'choose',
});

const r = await slot.syncAtStartup(); // before the game reads its save
if (r.kind === 'conflict') {
  // show r.local and r.remote, then:
  await slot.resolveConflict(playerChoice); // 'local' | 'remote'
}
// after every local save write:
slot.pushSave();
```

Merge mode (achievements):

```ts
import { createCloudSlot } from '@lawn/cloudsave';

const slot = createCloudSlot({
  game: 'ARCADE',
  saveKey: ACHIEVEMENTS_KEY,
  syncKey: 'achievements.cloud.v1',
  summarize: (text) => `${countOf(text)} achievements`,
  mode: 'merge',
  // local (null = none here) + remote (cloud form) → the new local text. Deterministic and idempotent.
  merge: (local, remote) => (local === null ? remote : unionOfWords(local, remote)),
  onLocalChanged: (text) => reloadAchievementCache(text), // called when a retry merged in another device's data
});

await slot.syncAtStartup();
slot.pushSave(); // after every local write
```

`syncAtStartup(timeoutMs = 4000)` never rejects. It returns `{ kind: 'off' }` when it gives up, so the game can
start from localStorage. Status is one of `'off' | 'synced' | 'syncing' | 'stopped'`; `onStatus(cb)` reports
changes.

## Options

- `game`: the gnome.common.v1.Game name (`'GNOMOMIA'`, `'ARCADE'`).
- `summarize(text)`: a short description of a save text, shown to the player on conflicts and stored with the push.
- `toCloud(text)`: converts the local text before upload (e.g. shrinks photos to thumbnails). Default: the text
  itself. The local text and the sync hash stay in local form.
- `pushWindowMs`: minimum gap between two pushes. Default 30000.

## Limits

A save uploaded to the service may be at most **512 KiB** (`MAX_SAVE_BYTES`, counted in UTF-8 bytes). A cloud form
over that is not pushed; a warning goes to `console.warn`, and the local save is kept as it is. Keep `toCloud` output
small.

## Tests

`npm test -w packages/cloudsave` runs vitest in Node, with no localStorage and no window. The slot takes its
environment from `deps`, so tests pass fakes:

- `storage`: `getItem` / `setItem` / `removeItem` (a `Map`-backed fake is enough).
- `signedIn`: `() => boolean`.
- `load`: `() => Promise<PlatformApi>`, a fake with `getAccessToken`, `saveClient()` (`getSave`, `putSave`),
  `ConnectError`, `Code` (`NotFound`, `Aborted`) and `Game`.
- `now`: the clock for the push throttle.

`games/gnomes-of-gnomomia/src/cloudSave.test.ts` is a model for the fakes.
