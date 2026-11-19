# @lawn/gnome: one gnome for every game

The player makes a gnome in the Gnome Creator (`games/gnome-creator`). Every game shows it, and other players see it online.
It lives in the browser's localStorage (one key, `gnome.profile.v1`, same origin for every game on the arcade site) and, for a
signed-in player, in the platform service (`ConnectGnomeStore`, `proto/`), mirrored locally. Showing other players' gear online needs
more than `resolveLook`: see `docs/gear-sync.md`.

## What a game does

```ts
import { loadMyGnome, getMyGnome, resolveLook, prefetchLooks, createGnomeModel } from '@lawn/gnome';

await loadMyGnome();                       // once, at the top of main.ts. null = no custom gnome: keep the game's own look
const mine = getMyGnome();                 // { name, look (model look), code }
createGnomeModel(mine?.look ?? myOwnLook); // wear it
createNetClient(url, game, { name, character: mine?.code ?? 'gnorman' }); // send it (the look code, 11 characters)
await prefetchLooks(roster);               // when a roster arrives: fetches players' gnomes by userId (gear is NOT in the look code)
createGnomeModel(resolveLook(player) ?? theGamesOwnLook); // someone else's gnome; player = { id, character, userId } from PlayerInfo (model look or null)
onLooksChanged(() => rebuildPuppets());    // only if you build models before prefetchLooks resolves
```

Online, games still put the per-match player colour on the hat: `{ ...look, hat: player.color }`.
A player who never used the creator has no look: `getMyGnome()` is null, `resolveLook` is null for old clients, and every
game looks exactly as it did before.

## Games with their own gear

Achievement gear (`look.equipment`: `head`, `back`, `neck`, `hand`) shows on the gnome in every game. If your game equips
its own item in a slot, tell the model so the two do not stack:

```ts
createGnomeModel(look, { overrideEquipment: ['hand'] }); // game's club replaces the customizer's hand item from the start
model.setEquipmentOverride('head', true);                // game helmet equipped; false restores the customizer's cosmetic
model.setEquipmentOverrides({ back: true, neck: false });
```

Never fork the gnome model to change gear. Games with no player character (match-3, viewers, tools) do not need this package.
New games: wear the player's gnome from the start (see the "Player gnome by default" rule in `AGENTS.md`), then add
achievements and gear rewards for it (`packages/achievements/README.md`).

## Files

| File | What |
|---|---|
| `types.ts` | `Look` and `Gnome` (shaped like the service's protobuf JSON), `GnomeStore`, the model's `GnomeLook`, `GnomeModel`, `PlayerState` |
| `look.ts` | `PALETTE` (64 frozen colours), the look code (`g1.` + 8 characters), snapping, conversions |
| `store.ts` | `LocalGnomeStore` (localStorage) and `createGnomeStore()`, the one place that picks where gnomes live |
| `resolve.ts` | `loadMyGnome`, `getMyGnome`, `resolveLook`, `prefetchLooks`, `onLooksChanged`: the only API games use |
| `model.ts` | `createGnomeModel`, the one gnome model all games share |

## How the platform service plugs in (done; kept as a map of which file does what)

Games and the creator did not change. The pieces:

1. `store.ts`: add `ConnectGnomeStore implements GnomeStore` (`getMe` = `GetMe`/`CreateGuest`, `updateGnome` = `UpdateGnome`,
   `batchGetGnomes` = `BatchGetGnomes`) and return it from `createGnomeStore()`. Types can come from `buf generate`
   instead of `types.ts` (same names, same JSON). Upload the local gnome once on first sign-in: `CreateGuest({ display_name, look })`.
2. `resolve.ts` (done): `prefetchLooks(roster)` calls `batchGetGnomes` for players that carry a `userId` and fills a cache;
   `resolveLook` reads the cache first and falls back to decoding `character`; `onLooksChanged` fires when the cache grows.
   Games that build a model before the look arrives call `onLooksChanged` to rebuild it (the games that await
   `prefetchLooks` before building need nothing).
3. `packages/mp` (done): `PlayerInfo.userId` (optional). `loadMyGnome` calls `setMyUserId` from `@lawn/mp/client`, so every
   `createNetClient` hello carries my account id and the server copies it, if well-formed, into the roster. It is NOT
   verified: it only selects a public gnome to fetch, and anyone can already wear any look code. Gear (`look.equipment`) is
   not in the look code, so other players see it only through this path; players without an account (or a build without
   accounts) show colours only.
4. The `proto` `GnomeLook` must have the fields of `Look` (pants, boots, beard, hair, freckles, dress, glasses).

## Gear clearance

Worn gear must not clip into the gnome's head or face. `src/anatomy.ts` holds the head sphere, the face features and the neck anchor; `model.ts` builds from them, and `src/gear-clearance.ts` measures a prefab's surface against them.

- `gearClearance(prefabIdOrDef)` returns the smallest gap (negative = inside) and which feature it is against.
- `src/gear-clearance.test.ts` checks every `wear-neck` prefab with a gap of at least `MIN_GEAR_GAP` (0.01). A failure names the item and the feature it hits. Fix it by moving the parts in `packages/prefabs/src/catalog/`.
- Run: `npm test -w packages/gnome`.
