# Gnome gear sync: showing other players' customized gnomes

Read this when a change shows a player's gnome (or its gear) to someone else: any online game with player gnomes, a new roster or seat structure, or the gnome/mp packages. Single-player games only need the "Player gnome by default" rule in `AGENTS.md`.

## Why this is easy to get wrong

The `character` that travels with matchmaking is the look code (`g1.` + 8 characters). It carries **colours and flags only, never gear** (`look.equipment`: `head`, `back`, `neck`, `hand`). So `resolveLook({ id, character })` alone shows other players in the right colours and bare-handed. Type-checks, builds and tests all pass with this bug; only seeing two signed-in players together catches it.

Gear reaches other players by the account id instead:

1. `loadMyGnome()` sets my id (`MyGnome.userId`, `u_…`, signed-in players only) with `setMyUserId` (`@lawn/mp/client`). Every `createNetClient` hello then carries it.
2. `mp-server` copies a well-formed `hello.userId` into the roster as `PlayerInfo.userId`. It is **not verified**: it only selects a public gnome to fetch. Never use it for anything that needs trust.
3. `prefetchLooks(players)` calls the platform's open `BatchGetGnomes` for players with a `userId`, caches the gnomes (gear included) and fires `onLooksChanged`.
4. `resolveLook({ id, character, userId })` returns the cached gnome first, else decodes `character`.

## Checklist for an online game

- [ ] Roster entries keep `userId`. If the game copies `PlayerInfo` into its own state (a seat, a lobby slot, a snapshot), add an optional `userId` field and fill it from `PlayerInfo.userId`. Anything the host snapshots to guests must carry it, so guests can fetch too. Example: `Seat.userId` in `games/gnome-blackjack/src/config.ts`, filled by `seatHuman(..., chips?, userId?)`.
- [ ] `prefetchLooks(...)` is called when a roster or a late joiner arrives (it is a cheap no-op for ids already known and for players without an id). Either `await` it before building models, or:
- [ ] If a model can be built before the fetch finishes, rebuild that player's model in `onLooksChanged` (example: `onLooksChanged` in `games/gnome-blackjack/src/scene.ts`).
- [ ] `resolveLook` is passed the `userId` (`{ id, character, userId }`), not just `character`.
- [ ] My own gnome: wear `getMyGnome()?.look` (it has the gear), not the decoded code of my own `character`.
- [ ] If the game equips its own item in a slot, use `overrideEquipment` / `setEquipmentOverride` (`packages/gnome/README.md`), never a second gnome model.
- [ ] Players keep the per-match colour on the hat: `{ ...look, hat: player.color }`.

## Known limits (state them in the PR, do not work around them)

- Signed-out players, and builds without accounts (`accountsEnabled()` false), show colours only to others.
- A gnome edited mid-session is not re-fetched; fetched looks live for the page's lifetime.
- The id is unverified (above). Real verification means JWT checks in `mp-server`.

## Checking your change

- `npm test -w packages/gnome` (resolve/prefetch), `npm test -w packages/mp-server` (roster `userId`), plus the game's own tests and build.
- Add a test that a roster/seat built from a `PlayerInfo` with a `userId` keeps it (see `seatHuman` in `games/gnome-blackjack/src/table.test.ts`).
- If you can run it: two signed-in browsers in one match, one wearing gear from the creator; the other must see it. If you cannot, say so in the PR.

## Finding games that may be missing it

```bash
# uses resolveLook but never prefetchLooks (candidates: check whether the game is online)
grep -rl resolveLook games --include='*.ts' | xargs grep -L prefetchLooks
```

Do not edit games you were not asked to work on (`AGENTS.md`); report them in the PR instead.
