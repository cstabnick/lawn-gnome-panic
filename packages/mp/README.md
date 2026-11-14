# @lawn/mp: shared multiplayer code

One matchmaking + relay server (`packages/mp-server`) serves every online game in the repo. This package holds
what the server and the browser games share:

- `src/protocol.ts`: the wire protocol (hello, queue, relay, chat, telemetry) and `GAMES`, the per-game rules.
  Each game has its own queues, room codes and matches; they never mix.
- `src/client.ts`: `serverUrl()` and `createNetClient(url, game, hello)`, a small WebSocket client.
- `src/textFilter.ts`: the player name and chat filter (`checkName`, `censorText`).
- `src/interp.ts`: `Interp`, a snapshot-interpolation buffer: shows a remote player a little in the past, blended between timestamped samples, so jittery relay traffic plays back smoothly.

The server never simulates a game: one player's browser per match is the host, and game messages (the `d` of a
relay) are opaque to it. Each game defines its own game messages on top (`games/sample-3d/src/net/protocol.ts`, `games/gnome-front/src/net/protocol.ts`,
`games/gnaft/src/net.ts`).

| Game | Players | Starts | Drop-in |
|---|---|---|---|
| lawn-gnome-panic (sample-3d) | 2-20 | 15 s public / 45 s room code | no |
| gnome-front | 2-24 | 15 s / 45 s | yes: humans take bot slots, bots fill the rest |
| gnaft | 1-8 | at once | yes: friends join the running raft with the room code |
| gnome-golf | 1-12 | at once (a lobby; the host starts the round) | yes: newcomers join mid-round; the scorecard notes the hole they joined on |
| gnome-bowling | 2-4 | 10 s / 20 s | no |

Adding a game: add its id and rules to `GAMES`, then use `createNetClient(serverUrl(), '<id>', ...)` in the game.

Run the server locally: `npm run dev -w packages/mp-server` (ws://localhost:8787/ws; the games use it on
localhost, or point a page at another one with `?mp=ws://host/ws`). Tests: `npm test -w packages/mp-server`.
Hosting: `docs/hosting.md`.
