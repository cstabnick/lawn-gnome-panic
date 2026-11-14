Epic: 5. Co-op over the shared matchmaking server
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic` (Windows, Git Bash). Game: `games/gnaft` (Vite + TypeScript strict + three@0.187.0). If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed: do not run `npm install` or add packages.
- **Other workers are editing other files in `games/gnaft/src` at the same time.** Edit ONLY the file(s) listed under Change. Never edit `config.ts`, `rules.ts`, `input.ts`, `main.ts`, `gnome.ts`, `mowerModels.ts` or another system's file unless your Change section lists it. A constant you need that is not in config.ts: declare it as a local `const` at the top of your file.
- Keep every existing exported function name and signature in your file exactly.
- Do not run `vite build`, `npm run dev`, or start any server. Do not `git commit`.
- All art is generated in code from three.js primitives (`MeshStandardMaterial`, `BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `SphereGeometry`, ...). No external assets. Set `castShadow = true` on solid meshes above the water.
- UI rule: if you create DOM, append your own container to `ctx.ui` (the shared `#ui` element) and style only your own elements inline. Never restyle, hide or clear `#ui` itself. `#ui` has `pointer-events:none`; set `pointer-events:auto` on your own clickable elements only.


## Goal
`games/gnaft/src/net.ts` turns Gnaft into drop-in co-op: players who type the same room code share one raft. The first player hosts (runs the world); friends join as guests, see each other's gnomes and build, fish, mow and sail together.

## Read first
- games/gnaft/src/net.ts: the stub (keep `export function createNet(ctx: Ctx): System`)
- games/gnaft/src/config.ts: `GameState.netRole`, `NetRole`, `CoopState`, `CoopPlayer`, `COOP`, `PlayerState`, `CHARACTERS`, `GnomeModel`, `RAFT_TOP`, `TILE_SIZE`
- games/gnaft/src/rules.ts: the "co-op" section at the top: `netHook`, `NetAction`, `applyNetAction`, `WorldSnap`, `snapshotWorld`, `applyWorld`; and `notify`
- packages/mp/src/client.ts: `serverUrl()`, `createNetClient<G>(url, game, hello)`, `NetClient<G>`
- packages/mp/src/protocol.ts: `ServerMsg<G>` (welcome, queued, match, joined, relay, left, host, beat, ended, error), `PlayerInfo`
- games/gnaft/src/gnome.ts: only `createGnomeModel(look: GnomeLook): GnomeModel` (model.object is a THREE.Group; `model.update(p: PlayerState, dt)` poses it at p.position, walking when p.velocity is non-zero)

## How the server works (already built, do not change it)
One WebSocket per player. `client.connect()` then `client.queue(code, 'gnorman', name)`. Gnaft rooms start at once: the first player in a room code gets `{t:'match', hostId: <me>, you, players:[me]}`; a later player in the same code gets `{t:'match', hostId: <first player>, players:[everyone]}` and everyone already there gets `{t:'joined', player}`. `client.send(to, d)` relays `d` to one player (to = id) or everyone else (to = null): they receive `{t:'relay', from, d}`. If the host leaves, everyone gets `{t:'left', id}` and then `{t:'host', hostId}` (the next player). A member who relays nothing for 8 s is dropped, so keep sending 'me' messages while in a raft.

## Change
- games/gnaft/src/net.ts (only this file). Imports: `createNetClient`, `serverUrl`, `type NetClient` from `'@lawn/mp/client'`; `type PlayerInfo`, `type ServerMsg` from `'@lawn/mp/protocol'`; `startAudio` from `./audio`.
  1. **Messages** (the relay payload; declare in net.ts):
     ```ts
     type CoopMsg =
       | { k: 'snap'; w: WorldSnap; acks: Record<string, number> } // host -> all, COOP.snapHz; acks[playerId] = last action seq applied
       | { k: 'me'; x: number; y: number; z: number; f: number; sw: 0 | 1 } // everyone -> all, COOP.meHz (round to 2 decimals)
       | { k: 'act'; seq: number; a: NetAction };                   // guest -> host, one per action
     ```
  2. **Requests from the UI.** Each frame read `state.coop.request` and set it back to null.
     - `{ name, code }`: if `serverUrl()` is '' set status 'error', message 'Online play is not set up for this build.'. Otherwise create the client `createNetClient<CoopMsg>(url, 'gnaft', { name, character: 'gnorman' })`, set status 'connecting', `coop.code = code`, `await client.connect()` (on rejection: status 'error', message = the error's message), then `client.queue(code, 'gnorman', name)`. Register `onMessage` and `onClose` once per client.
     - `'leave'`: `client.leave()`, `client.drop()`, then the "leaving" rules below.
  3. **Server messages.**
     - `match`: remember `me = m.you`, `hostId = m.hostId`, fill `state.coop.players` from `m.players` (`host: id === hostId`, `me: id === me`), status 'in'.
       - If `hostId === me`: `state.netRole = 'host'` (the host keeps its own world). If `state.mode === 'title'`, set `state.mode = 'play'` and call `startAudio()`.
       - Else: `state.netRole = 'guest'`, `netHook.forward = (a) => client.send(hostId, { k: 'act', seq: ++seq, a })` (remember `lastActAt = performance.now()`). Wait for the first snapshot (below) before entering play.
     - `joined`: add the player to `coop.players`; `notify(state, \`${name} climbed aboard!\`)`. If I am host, immediately send a snapshot to that player only (`client.send(player.id, ...)`).
     - `left`: remove the player and their puppet; `notify(state, \`${name} left the raft.\`)`.
     - `host`: `hostId = m.hostId`; update the `host` flags. If it is me: `state.netRole = 'host'`, `netHook.forward = null`, `notify(state, 'The host left. You are now hosting the raft.')`.
     - `error`: status 'error', message = m.message (if not yet in a raft).
     - `ended`, or the socket closing while in a raft: run the leaving rules with message m.reason / 'Lost the connection to the raft.'.
  4. **Leaving rules.** Remove all puppets, `coop.players = []`, `coop.code = ''`, `netHook.forward = null`. A host becomes `netRole = 'solo'` and keeps playing (status 'off'). A guest was playing in someone else's world: notify the message, set status 'error' with the message, and `setTimeout(() => location.reload(), 2500)` (reloading returns to the guest's own saved raft).
  5. **Relay messages** (`t: 'relay'`, payload `m.d`):
     - `snap` (guests only): apply with `applyWorld(state, d.w)` unless the guest has sent actions the host has not applied yet (`(d.acks[me] ?? 0) < seq`) and the last action was less than `COOP.ackWaitS` seconds ago; then skip this snapshot (the next one will include them). On the first applied snapshot: put the gnome on the raft tile nearest the origin (`position.set(t.i * TILE_SIZE, RAFT_TOP, t.j * TILE_SIZE)`, `velocity.set(0,0,0)`, `swimming = false`, `grounded = true`), set `state.mode = 'play'` if it was 'title', and `startAudio()`.
     - `act` (host only): `applyNetAction(state, d.a)`; `acks[from] = Math.max(acks[from] ?? 0, d.seq)`.
     - `me`: the sender's puppet target.
  6. **Sending.** While status is 'in': every `1 / COOP.meHz` s send `me` to everyone (always, in every mode, so the server never thinks we went silent). If host: every `1 / COOP.snapHz` s send `{ k: 'snap', w: snapshotWorld(state), acks }` to everyone.
  7. **Puppets** (other players' gnomes; never one for me). For each player in a raft with me: `createGnomeModel({ ...CHARACTERS.gnorman.look, hat: color, shirt: <color darkened 40%> })`, added to `ctx.scene`, driven by a private `PlayerState` (`position`, `velocity`, `facing`, `grounded: true`, `jumpsUsed: 0`, `swimming`). Each frame move it toward the latest `me` target (exponential, rate 12/s), set velocity from that movement (so the walk cycle plays), turn `facing` toward `f` along the shortest angle, then `model.update(fake, dt)`. Hidden until the first `me`. A name label above it: a `THREE.Sprite` with a `CanvasTexture` of the name drawn in the player's colour on a dark translucent rounded box, positioned 2.0 m above the feet, about 1.6 x 0.4 m.

## Contract
`export function createNet(ctx: Ctx): System`. main.ts calls it first every frame (before the world systems) and skips seagull/shark updates while `state.netRole === 'guest'`. coopUi.ts writes `state.coop.request` and reads `status`, `message`, `code`, `players`.
```ts
// rules.ts (already implemented; do not edit)
export const netHook: { forward: ((a: NetAction) => void) | null };
export function applyNetAction(s: GameState, a: NetAction): void;
export function snapshotWorld(s: GameState): WorldSnap;
export function applyWorld(s: GameState, w: WorldSnap): void;
// packages/mp/src/client.ts
export function serverUrl(): string;
export function createNetClient<G>(url: string, game: 'gnaft' | ..., hello: { name: string; character: string }): NetClient<G>;
```

## Done when
- `npx tsc --noEmit -p games/gnaft` reports no errors in `src/net.ts`.
- Reading the code: a guest forwards actions through `netHook.forward`, the host applies them with `applyNetAction`, and the host sends snapshots that guests apply with `applyWorld`.

## Out of scope
Every file except games/gnaft/src/net.ts (rules.ts, config.ts, main.ts, coopUi.ts, packages/mp, packages/mp-server).
