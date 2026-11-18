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
`games/gnaft/src/net.ts`, `games/gnomes-of-gnomomia/src/net/protocol.ts`).

| Game | Players | Starts | Drop-in |
|---|---|---|---|
| lawn-gnome-panic (sample-3d) | 2-20 | 15 s public / 45 s room code | no |
| gnome-front | 1-24 | 15 s / 45 s | yes: humans take bot slots, bots fill the rest |
| gnaft | 1-8 | at once | yes: friends join the running raft with the room code |
| gnome-golf | 1-12 | at once (a lobby; the host starts the round) | yes: newcomers join mid-round; the scorecard notes the hole they joined on |
| gnome-bowling | 2-4 | 10 s / 20 s | no |
| gnome-party | 1-4 | 20 s / 60 s (CPUs fill the empty seats) | no |
| music-room | 1-16 | at once | yes: the public room or a room code |
| gnome-blackjack | 1-5 | at once (the first player hosts; CPU gnomes fill the seats) | yes: a newcomer takes a CPU's seat |
| gnomomia | 1-40 | at once (one shared world; a full room opens a new shard) | yes: everyone joins the running world |

Account id: `hello.userId` (default: `setMyUserId`, which `@lawn/gnome`'s `loadMyGnome` sets) comes back as `PlayerInfo.userId`, unverified, so other players can fetch the gnome's gear.

Dropped connections: a game can say `resumable: true` in its hello (`createNetClient(url, game, { ..., resumable: true })`).
Then a player whose socket closes, or who goes silent for `MATCH_SILENT_S`, keeps their seat for `RESUME_S` (45 s):
calling `connect()` again on the same client sends the welcome's token and gets the same id and seat back (it resolves
`true`, and the welcome carries `resumed` with the host and roster). Nobody else sees a `left` unless the seat is given
up; a host who drops hands hosting over at once, and when everyone dropped the first one back hosts. Messages relayed
while a player was away are lost, so the game catches them up itself (gnome-golf asks its host for a `resync`). Games
without `resumable` keep the old rule: a closed or silent socket leaves the match at once.

Hidden tabs: browsers stop `requestAnimationFrame` in a background tab, and hold plain timers to 1 Hz (once a minute
after about 5 minutes in Chrome), so a game that relays from its frame loop goes silent and is dropped after
`MATCH_SILENT_S`. `@lawn/mp/background` has Worker-driven timers that keep going:
- `whileHidden((dt) => ...)`: steps the game (simulation and net sends, no rendering) about 15 times a second, only
  while the tab is hidden; dt is in seconds, sub-stepped to at most `HIDDEN_MAX_DT`. Every online game calls its
  simulation-and-net step from it, the host included (a hidden host that stops simulating freezes the match).
- `steadyInterval(fn, ms)`: a setInterval that is not throttled in a hidden tab, for heartbeats.
- `onTabHidden(fn)`: single-player games open their pause menu from it.
Phones suspend the page entirely in the background, so online games also reconnect with `resumable` when they come back.

Adding a game: add its id and rules to `GAMES`, then use `createNetClient(serverUrl(), '<id>', ...)` in the game.

Run the server locally: `npm run dev -w packages/mp-server` (ws://localhost:8787/ws; the games use it on
localhost, or point a page at another one with `?mp=ws://host/ws`). Tests: `npm test -w packages/mp-server`.
Hosting: `docs/hosting.md`.
