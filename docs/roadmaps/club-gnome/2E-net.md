Epic: 2 (modules)
Depends on: none

(Read `docs/roadmaps/club-gnome/_env.md` first: environment and shared rules.)

## Goal
`games/club-gnome/src/net.ts` puts the player in the one shared online town over `@lawn/mp`: joins the room, relays
my pose and emotes, reports everyone else, carries chat, reconnects by itself.

## Read first
- `games/club-gnome/src/config.ts`: `GAME_ID` ('club-gnome', already in `GAMES` of `packages/mp/src/protocol.ts`:
  1-40 players, opens at once, late join), `AvatarPose`, `EmoteId`, `EMOTES`, `MapId`, `isMapId`, `NetStatus`, `Peer`, `NET`, `ME`.
- `games/club-gnome/src/net.ts`: the stub you replace (keep `TownMsg`, `NetEvents`, `TownNet`, `createNet` exactly).
- `packages/mp/src/client.ts`: `serverUrl()`, `createNetClient(url, game, hello)`, `NetClient` (connect, queue, send, chat, drop, onMessage, onClose).
- `packages/mp/src/protocol.ts`: `ServerMsg` (match, joined, left, relay, chat, error, ended), `PlayerInfo`.
- `packages/mp/src/background.ts`: `steadyInterval(fn, ms)` (keeps running in a hidden tab).

## Change
- `games/club-gnome/src/net.ts`:
  - `export function parseTownMsg(d: unknown): TownMsg | null`: accepts only `{ k: 'pos', m: <MapId>, p: <5 finite
    numbers, |x|,|z| < 500>, t: <finite number> }` and `{ k: 'emo', e: <key of EMOTES> }`; returns a clean copy, else null.
  - `start(name, character, room, offline)`: remember name. If `offline` or `serverUrl() === ''`: report
    `onStatus('unavailable', 1)` (in a microtask) and stay local. Else `createNetClient<TownMsg>(serverUrl(), GAME_ID,
    { name, character })`, report `'connecting'`, `await connect()`, then `queue(room, character, name)`.
  - Messages: `match` → `myId = m.you`, `myColor` = my roster colour, `onPeerJoin` for everyone else, status `'online'`
    with the roster size, and send my pose at once. `joined` → `onPeerJoin`, count + 1, send my pose at once. `left` →
    `onPeerLeave`, count - 1. `relay` → `parseTownMsg(m.d)`: pos → `onPeerPose(from, m, { x, z, facing, moving: p[3] === 1,
    busy: p[4] === 1 }, t)`; emo → `onEmote(from, e)`. `chat` → `onChat(from, name, color, text)`. `error` with code
    `'chat-rate'` → `onChatRate()`; code `'bad-name'` → queue again once with name `Gnome` + 4 random digits.
    `ended` → treat like a dropped link.
  - Dropped link (`onClose`, failed `connect`, or `ended`): `myId = null`, `onReset()`, status `'retrying'`, and try
    again after `NET.retryS[i]` seconds (i grows, the last repeats; reset to 0 once online again). Never more than
    one pending retry. Keep the same client object if you like (`connect()` again) or make a new one.
  - Sending: `setPose(map, pose)` only stores the latest. One `steadyInterval(tick, 50)` (started on the first
    `start`) sends `{ k: 'pos', m, p: [x, z, facing, moving, busy], t: performance.now() }` with x, z, facing rounded
    to 2 decimals, to everyone (`send(null, …)`): when it changed (map, any flag, or |dx|,|dz| > 0.01, |dfacing| > 0.02)
    and at least `1000 / NET.movingHz` ms passed since the last send; or when `NET.idleResendMs` passed (keepalive,
    so the server's 8 s silence limit never drops a still player).
  - `chat(text)`: online → `client.chat(text)` (the server echoes it with my id); else `onChat(ME, name, 0xffffff, text)`.
  - `emote(e)`: online → `send(null, { k: 'emo', e })`; always `onEmote(ME, e)` at once.
  - `onStatus` is reported on every state or player-count change. Never call any `ev` handler synchronously inside
    `createNet` (main.ts is still assigning its result).
- `games/club-gnome/src/net.test.ts` (new, vitest): `parseTownMsg` accepts good pos/emo messages and rejects bad map
  ids, wrong lengths, NaN, huge coordinates, unknown emotes, non-objects.

## Contract
```ts
export type TownMsg =
  | { k: 'pos'; m: MapId; p: [number, number, number, number, number]; t: number }
  | { k: 'emo'; e: EmoteId };
export interface NetEvents {
  onStatus(status: NetStatus, playersInTown: number): void;
  onPeerJoin(p: Peer): void;
  onPeerLeave(id: number): void;
  onPeerPose(id: number, map: MapId, pose: AvatarPose, sentAt: number): void;
  onChat(id: number, name: string, color: number, text: string): void;
  onEmote(id: number, e: EmoteId): void;
  onChatRate(): void;
  onReset(): void;
}
export interface TownNet {
  readonly myId: number | null;
  readonly myColor: number | null;
  start(name: string, character: string, room: string | null, offline?: boolean): void;
  setPose(map: MapId, pose: AvatarPose): void;
  chat(text: string): void;
  emote(e: EmoteId): void;
}
export function createNet(ev: NetEvents): TownNet;
export function parseTownMsg(d: unknown): TownMsg | null;
```
`Peer` = `{ id, name, color, character, userId? }` copied from `PlayerInfo` (include `userId` only when present).
Use getters for `myId` / `myColor` on the returned object so main.ts reads the current values.

## Done when
- `npx tsc --noEmit -p games/club-gnome` shows no error in `net.ts` or `net.test.ts`.
- `npm test -w games/club-gnome -- src/net.test.ts` passes.

## Out of scope
Every other file; nothing under `packages/` (the `club-gnome` entry in `GAMES` already exists).
