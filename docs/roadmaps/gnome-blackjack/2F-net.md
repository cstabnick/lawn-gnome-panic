Epic: 2 (all modules, in parallel)
Depends on: none

(First read `docs/roadmaps/gnome-blackjack/_env.md`: environment and repo rules.)

## Goal
Online play: `src/net.ts` joins the shared matchmaking server as game `'gnome-blackjack'` (already registered in `packages/mp/src/protocol.ts`: 1-5 players, opens at once, late join), relays the host's table snapshots and the clients' inputs, and reports status. The host-side logic is already in app.ts; this file is only the transport.

## Read first
- `games/gnome-blackjack/src/net.ts`: the stub you replace (keep `NetMsg`, `NetHandlers`, `Net`, `createNet`).
- `games/gnome-blackjack/src/app.ts`: how each handler is used (read only).
- `packages/mp/src/client.ts`: `serverUrl()`, `createNetClient<G>(url, game, hello)`, `NetClient` (connect/queue/leave/send/chat/drop/onMessage/onClose).
- `packages/mp/src/protocol.ts`: `ServerMsg` ('welcome', 'queued', 'match', 'joined', 'relay', 'left', 'host', 'beat', 'ended', 'chat', 'error'), `PlayerInfo`, `MATCH_SILENT_S` (8: a member who relays nothing for 8 s is dropped).
- `games/gnome-bowling/src/net.ts`: a working example of the same pattern (connect, queue, lost connection, pings, visibilitychange). Reuse its structure; do not import from it.
- `games/gnome-blackjack/src/config.ts`: `NetStatus`, `TableState`, `TableInput`, `SEAT_COUNT`.

## Change
- `src/net.ts`:
  - `import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client'` and types from `@lawn/mp/protocol`.
  - `available()`: `serverUrl() !== ''`.
  - `start(code, name, character)`: if already in a queue/match, leave it first (as `leave()`). Status `{ status: 'connecting', message: 'Connecting…', code, humans: 1 }`. Create the client once (`createNetClient<NetMsg>(serverUrl(), 'gnome-blackjack', { name, character })`), `await connect()`; on failure status `{ status: 'error', message: 'Offline: could not reach the server', ... }` and stop (the offline table keeps running; call no handler). Then `queue(code, character, name)`.
  - Messages (ignore all while not active):
    - 'queued': message 'Finding a table…'.
    - 'match': remember `members` (Set of ids), `hostId`, `myId = m.you`; status `{ status: 'online', message: code ? 'Private table' : 'Online table', code, humans: m.players.length }`; `h.onMatch(m.you, m.hostId, m.players)`.
    - 'joined': add to members, humans + 1, `h.onJoined(m.player)`.
    - 'relay': drop unless `members.has(m.from)`. `{k:'snap'}`: only from `hostId`, and only if `s` looks like a table (object, `Array.isArray(s.seats) && s.seats.length === SEAT_COUNT`, `typeof s.phase === 'string'`, `Array.isArray(s.bubbles)`, `Array.isArray(s.dealer)`) → `h.onSnapshot(s)`. `{k:'in'}`: validate (`bet` with finite number `amount`; `ready`; `act` with `a` in hit/stand/double) → `h.onInput(m.from, i)`. `{k:'ping'}`: nothing.
    - 'left': remove from members, humans − 1, `h.onLeft(m.id)`. 'host': `hostId = m.hostId`, `h.onHost(m.hostId)`.
    - 'chat': `h.onChat(m.from, m.text)` while in a match.
    - 'ended', or the socket closing while in a queue/match (not during connect): status `{ status: 'error', message: 'Connection lost: playing offline', code: null, humans: 1 }`, call `h.onLost()` once if a match was running, `drop()` the client.
    - 'error': outside a match: status error with `m.message`; inside a match ignore (e.g. chat-rate).
  - `leave()`: `client.leave()`, status `{ status: 'off', message: 'Offline', code: null, humans: 1 }`; if a match was running call `h.onLost()` (the app goes back to its own table).
  - `sendSnapshot(s)`: `client.send(null, { k: 'snap', s })`. `sendInput(i)`: `client.send(hostId, { k: 'in', i })`. `chat(text)`: `client.chat(text)`. All no-ops outside a match.
  - `update(dt)`: while in a match, send `{ k: 'ping' }` to everyone every 2 s (the host's snapshots also count, but clients need pings). On `visibilitychange` back to visible, ping at once.
  - `status`: a getter returning the current `NetStatus` object (replace the object on change).

## Contract
```ts
export type NetMsg = { k: 'snap'; s: TableState } | { k: 'in'; i: TableInput } | { k: 'ping' };
export interface NetHandlers {
  onMatch(you: number, hostId: number, players: PlayerInfo[]): void;
  onJoined(p: PlayerInfo): void;
  onLeft(id: number): void;
  onHost(hostId: number): void;
  onSnapshot(s: TableState): void;
  onInput(from: number, i: TableInput): void;
  onChat(from: number, text: string): void;
  onLost(): void;
}
export interface Net {
  readonly status: NetStatus;
  available(): boolean;
  start(code: string | null, name: string, character: string): void;
  leave(): void;
  sendSnapshot(s: TableState): void;
  sendInput(i: TableInput): void;
  chat(text: string): void;
  update(dt: number): void;
}
export function createNet(h: NetHandlers): Net;
```

## Done when
- `npx tsc --noEmit -p games/gnome-blackjack` passes for your file.
- `npm test -w packages/mp-server` passes (the server accepts the new game id; it starts its own servers on test ports).

## Out of scope
table.ts, cards.ts, banter.ts, mutter.ts, scene.ts, hud.ts, app.ts, config.ts, characters.ts, and everything in packages/.
