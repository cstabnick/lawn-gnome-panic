# Club Gnome (hub world)

Goal: a Club Penguin-style hub. Everyone's own gnome walks around one shared online town (online by default, guests
welcome, a gentle "nothing is saved without an account" card with sign-in). Tap to walk, text chat with bubbles, emotes,
a map picker. Buildings and places open the arcade's games full screen over the town; the required building is the
**Gnomecino**, the casino, whose tables play Gnome Blackjack. Four maps: Town Square, the Gnomecino, the Arcade, Links Park.

Online: `@lawn/mp` game `club-gnome` (1-40, opens at once, late join). No host: each player relays their own pose;
chat through the server's chat, heard only on your map. Party slice: none (a hub, not a game; backlog row says so).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundation (planner) | package, `config.ts` contracts, stubs for every module, `main.ts` wiring, `GAMES` entry; `tsc` passes | written directly |
| 2 Modules | every module filled; `npm run build -w games/club-gnome`, `npm test -w games/club-gnome`, prefabs + achievements tests, smoke check | 8 parallel |
| 3 Integration (planner) | play-test fixes, docs (README, lore, AGENT_INDEX, party backlog), PR | written directly |

## Epic 2 issues

Shared environment: [club-gnome/_env.md](club-gnome/_env.md). Each issue is its own file:

| Issue | Owns |
|---|---|
| [2A maps](club-gnome/2A-maps.md) | `src/maps.ts`, `src/maps.test.ts` |
| [2B walk](club-gnome/2B-walk.md) | `src/walk.ts`, `src/walk.test.ts` |
| [2C world](club-gnome/2C-world.md) | `src/world.ts` |
| [2D avatars](club-gnome/2D-avatars.md) | `src/avatars.ts` |
| [2E net](club-gnome/2E-net.md) | `src/net.ts`, `src/net.test.ts` |
| [2F hud](club-gnome/2F-hud.md) | `src/hud.ts` |
| [2G account + overlay](club-gnome/2G-account-overlay.md) | `src/account.ts`, `src/overlay.ts` |
| [2H achievements + prefabs](club-gnome/2H-achievements-prefabs.md) | `src/achievements.ts`, `packages/prefabs/src/catalog/casino.ts`, `packages/achievements/src/catalog.ts` |
