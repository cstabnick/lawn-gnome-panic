# @lawn/gnome: one gnome for every game

The player makes a gnome in the Gnome Creator (`games/gnome-creator`). Every game shows it, and other players see it online.
Today it lives in the browser's localStorage (one key, `gnome.profile.v1`, same origin for every game on the arcade site).
Later it moves to the platform service (`docs/design/gnome-platform.md` (in PR 38, not merged yet), `proto/`); this package is built so that move
changes one file.

## What a game does

```ts
import { loadMyGnome, getMyGnome, resolveLook, prefetchLooks, createGnomeModel } from '@lawn/gnome';

await loadMyGnome();                       // once, at the top of main.ts. null = no custom gnome: keep the game's own look
const mine = getMyGnome();                 // { name, look (model look), code }
createGnomeModel(mine?.look ?? myOwnLook); // wear it
createNetClient(url, game, { name, character: mine?.code ?? 'gnorman' }); // send it (the look code, 11 characters)
prefetchLooks(roster);                     // when a roster arrives
createGnomeModel(resolveLook(player) ?? theGamesOwnLook); // someone else's gnome (model look or null)
```

Online, games still put the per-match player colour on the hat: `{ ...look, hat: player.color }`.
A player who never used the creator has no look: `getMyGnome()` is null, `resolveLook` is null for old clients, and every
game looks exactly as it did before.

## Files

| File | What |
|---|---|
| `types.ts` | `Look` and `Gnome` (shaped like the service's protobuf JSON), `GnomeStore`, the model's `GnomeLook`, `GnomeModel`, `PlayerState` |
| `look.ts` | `PALETTE` (64 frozen colours), the look code (`g1.` + 8 characters), snapping, conversions |
| `store.ts` | `LocalGnomeStore` (localStorage) and `createGnomeStore()`, the one place that picks where gnomes live |
| `resolve.ts` | `loadMyGnome`, `getMyGnome`, `resolveLook`, `prefetchLooks`, `onLooksChanged`: the only API games use |
| `model.ts` | `createGnomeModel`, the one gnome model all games share |

## Moving to the platform service (what changes, and what does not)

Games and the creator do not change. Changes:

1. `store.ts`: add `ConnectGnomeStore implements GnomeStore` (`getMe` = `GetMe`/`CreateGuest`, `updateGnome` = `UpdateGnome`,
   `batchGetGnomes` = `BatchGetGnomes`) and return it from `createGnomeStore()`. Types can come from `buf generate`
   instead of `types.ts` (same names, same JSON). Upload the local gnome once on first sign-in: `CreateGuest({ display_name, look })`.
2. `resolve.ts`: `prefetchLooks` calls `batchGetGnomes` for players that carry a `userId` and fills a cache; `resolveLook`
   reads the cache first and falls back to decoding `character`; `onLooksChanged` fires when the cache grows. Games that
   build a model before the look arrives call `onLooksChanged` to rebuild it (no game does yet: today looks are known at once).
3. `packages/mp`: `PlayerInfo` gains an optional `userId` (the service verifies the token at queue time). The look code in
   `character` then becomes a fallback for players without an account.
4. The `proto` `GnomeLook` must have the fields of `Look` (pants, boots, beard, hair, freckles, dress, glasses).
