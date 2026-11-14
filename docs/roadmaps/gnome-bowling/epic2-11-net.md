Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/net.ts` lets 2-4 people bowl one game together online through the repo's shared matchmaking/relay server: quick match or a room code, turns taken in order, every throw replayed on every screen.

## Read first
- `packages/mp/src/client.ts`: `serverUrl()`, `createNetClient(url, game, hello)` → `NetClient` (`connect()`, `queue(code, character, name)`, `leave()`, `send(to, d)`, `drop()`, `onMessage(fn)`, `onClose(fn)`, `id`, `connected`, `lastHeardAt`)
- `packages/mp/src/protocol.ts`: `ServerMsg` ('welcome', 'queued' {code, players, startsInS}, 'match' {matchId, seed, hostId, you, players: PlayerInfo[]}, 'relay' {from, d}, 'left' {id}, 'host', 'beat', 'ended' {reason}, 'error' {message, code}), `PlayerInfo {id, name, character, color}`, `MATCH_SILENT_S` (8: a player who relays nothing for 8 s is dropped!), `GAMES['gnome-bowling']` (2-4 players)
- `games/gnome-bowling/src/config.ts`: `NetApi`, `NetStatus`, `ThrowInput`, `LookId`, `LOOKS`, `MAX_ONLINE_PLAYERS`, `GameState`, `Ctx`
- `games/gnome-bowling/src/game.ts`: `hooks.onLocalThrow`, `queueRemoteThrow`, `removePlayer`, `newGame`, `makePlayer`, `toLobby`, `toTitle`
- `games/gnaft/src/net.ts` lines 1-200 for how another game in this repo uses the client (connection handling style)

## Change
- `games/gnome-bowling/src/net.ts`: `createNet(ctx): System & NetApi`. Import from `'@lawn/mp/client'` and `'@lawn/mp/protocol'` (type-only where possible).

## Messages (the relay payload `d`)
```ts
type BowlMsg =
  | { k: 'throw'; turn: number; input: ThrowInput; down: number } // the bowler -> everyone, once per ball
  | { k: 'ping' };                                                 // everyone -> everyone, every 2 s (keeps us inside MATCH_SILENT_S)
```

## Behaviour
- `available()`: `serverUrl() !== ''`.
- `quickMatch(name, look)` / `joinRoom(code, name, look)`: set `state.net = { status: 'connecting', message: 'Connecting…', code: code-or-null, waiting: 0, startsInS: 0 }`, `toLobby(state)`, create the client lazily (`createNetClient<BowlMsg>(serverUrl(), 'gnome-bowling', { name, character: look })`), `await connect()` (on failure: status 'error', message "Could not reach the server"), then `queue(code /* null for quick */, look, name)`.
- 'queued' → status 'queued', `waiting = players`, `startsInS`, message "Waiting for bowlers…". 'error' with code 'bad-name' → status 'error' with the message.
- 'match' → players = `m.players` sorted by `id` ascending (everyone gets the same order); build (with a local helper `const isLookId = (v: string): v is LookId => Object.prototype.hasOwnProperty.call(LOOKS, v)`) `makePlayer(p.name, isLookId(p.character) ? p.character : 'gnorman', p.color, p.id === m.you, p.id)`; `newGame(state, players, 'online')`; status 'playing'. Set `hooks.onLocalThrow = (turn, input, down) => client.send(null, { k: 'throw', turn, input, down })`.
- 'relay' with `k: 'throw'` → `queueRemoteThrow(state, from, d.turn, d.input, d.down)` (validate the shape: numbers finite, turn integer ≥ 0, down 0..1023; drop junk).
- 'left' → `removePlayer(state, id)`. 'ended' or socket close while playing → status 'error', message "Connection lost", and leave the players able to read the scoreboard; `toTitle(state)` after 4 s if still in a game.
- Every 2 s while in a match, `send(null, { k: 'ping' })`. Also respond to `document.visibilitychange` (hidden → nothing special; the server drops us after 8 s if the tab sleeps — that's acceptable).
- `leave()`: `client.leave()`, `hooks.onLocalThrow = null`, status 'off'. If the phase goes to 'title' while connected (hud MENU button), call `leave()` yourself in `update`.
- `update(dt)`: ping timer, the 'title' check above, and update `state.net.startsInS` countdown smoothly between 'queued' messages.
- Debug: `?mp=ws://host/ws` already works via `serverUrl()`.

## Contract
`export function createNet(ctx: Ctx): System & NetApi`. main.ts constructs it first with `ctx.net` unset (do not read `ctx.net` inside createNet). Nothing else exported.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in net.ts
- Optional real check (only you start a server in this epic, on its default port 8787): `npm run dev -w packages/mp-server` in the background, then a tiny node script with the `ws`-free global `WebSocket` (Node 22 has it) that connects two clients with `game: 'gnome-bowling'`, queues both with room code `TEST1`, and sees a 'match' for both. Stop the server afterwards.

## Out of scope
The server (`packages/mp-server`), the protocol file, menu.ts (it calls your NetApi). Do not edit any other file.
