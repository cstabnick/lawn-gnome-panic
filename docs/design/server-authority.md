# Server authority: one room runtime for every online game

Status: **proposal**. Nothing here is built yet. It says how online games can move decisions from players' browsers
to the server, one game at a time, while keeping one consolidated multiplayer service and leaving room for a faster
language than Node later.

## Why

Today `packages/mp-server` matchmakes and relays. It never simulates a game: one player's browser per match is the
host, and game messages are opaque to the server. That was the right start (cheap, one service for every game), but
it trusts every client:

- **Gnome Front.** The host's browser runs the whole match, so the host can do anything. Guests also send outcomes:
  `{k: 'dmg', v, d}` means "I hit soldier v for d damage", and the host applies it. Any guest can kill anyone.
- **Gnomes of Gnomomia.** Characters live in localStorage. `ehit` carries a damage number and `card` carries level and
  hp, both chosen by the client. `SaveService.PutSave` stores whatever the client sends, so a cloud save copies the
  client's claims. The open-world notes (`docs/design/gnomomia/open-world.md`, "Next steps") already plan a move to
  intents.
- **Every game.** Frames are capped at 64 KB and chat is rate-limited, but relay traffic has no per-player budget, and
  players are anonymous to the server (no account id), so nothing it decides could be tied to a durable save.

The underlying problem is that **clients send outcomes, not intents**. No transport or encoding fixes that; only moving
the decision does.

## Goals

- Move control to the server **per game, where it is worth it**. Most games stay relay-only.
- **One service.** No game server per game. Games plug into one runtime, the way games surface party slices to Gnome
  Party.
- **Language-neutral contract.** Game server logic runs as TypeScript in Node today; a game, or the generic gateway, can
  move to Rust, Go or C# later without changing the rest.
- **Generic persistence** that the platform service offers to every game, with a clear rule for who may write what.

## Non-goals

- A generic entity-replication or ECS engine. Game rules stay per game; only the plumbing is shared. A snapshot-delta
  helper can join `packages/` once two games need one.
- gRPC or Connect from the browser for realtime traffic (see "Transport and encoding").
- Moving single-player games or casual co-op games to the server.

## Authority tiers

Each online game chooses a tier. Tiers are cumulative.

| Tier | The server... | Fits |
|---|---|---|
| 0 Relay | forwards opaque messages (today) | music-room, gnaft, gnome-golf, casual co-op |
| 1 Relay + guard | also checks each message with the game's decoder and enforces per-player rate and byte budgets before fan-out | every game; cheap |
| 2 Arbiter | owns outcomes (damage, loot, XP, saves); clients still own their own movement, checked for speed and teleports | Gnomes of Gnomomia |
| 3 Authoritative sim | runs the whole sim headless at 20-30 Hz; clients send inputs and predict only their own movement | Gnome Front; turn-based games (blackjack, bowling) cost little here because they tick only on events |

`GameRules` in `packages/mp/src/protocol.ts` gains one field:

```ts
authority: 'relay' | 'guard' | 'server'; // 'server' covers tiers 2 and 3; the game's room decides how much it owns
```

## Architecture

Split the server into two roles. Both run in the current `mp-server` process at first; the split is about the
boundary, not deployment.

```
 browser ──WS──▶ ┌──────────────────────── gateway (generic) ────────────────────────┐
                 │ sockets · hello/auth · matchmaking · rate limits · relay (tier 0/1) │
                 └───────────────┬─────────────────────────────────────┬───────────────┘
                     room contract (messages)                  Connect (service identity)
                                 ▼                                      ▼
                 ┌─── room host ───┐                     ┌──── platform-server (Go) ────┐
                 │ one room per    │  Persist / Grant /  │ saves · inventory · stats ·  │
                 │ match, game's   │ ─── Commit ───────▶ │ match records · world state  │
                 │ RoomLogic       │                     └──────────────────────────────┘
                 └─────────────────┘
```

- **Gateway (generic, shared by every game):** owns sockets, `hello`, identity, matchmaking, room codes, chat, rate
  limits, interest filtering, and the plain relay for tier 0/1 games. For `authority: 'server'` games it creates a
  room instead of choosing a browser host, and routes the match's relays to the room. This is the part that must be
  fast across all games (fan-out to thousands of sockets), so if a rewrite is ever needed it is the first candidate,
  and Go fits next to `platform-server`.
- **Room host:** runs rooms. Today: one Node `worker_thread` per authoritative room, loading the game's room module, so
  one game's slow tick or crash cannot stall relay traffic for the rest. Later: separate processes, in any language,
  speaking the same contract.

### What clients see

Almost nothing changes. The server is a host that never leaves: rooms use the reserved player id `0` (`nextId` in
`mp-server/src/index.ts` starts at 1), `match.hostId` is `0`, `host` hand-overs never happen, and a client sends to
the room with the existing `{t: 'relay', to: 0, d}`. Gnome Front's `host.ts` / `guest.ts` split already has this
shape: `host.ts` becomes the room, and `guest.ts` keeps its snapshot handling while its outgoing messages change from
outcomes to inputs.

## The room contract

The contract is a **message protocol, not a TypeScript interface**, so any language can implement it. It goes in
`proto/gnome/room/v1/room.proto` next to the platform API. A sketch:

```proto
// Gateway -> room. One stream per room.
message ToRoom {
  oneof msg {
    Create  create  = 1; // game id, seed, room code, config bytes, optional Restore checkpoint
    Join    join    = 2; // player id, name, character, color, account id (empty for guests), resumed flag
    Leave   leave   = 3; // player id, reason
    Input   input   = 4; // from player id, payload bytes (the game's own message, opaque to the gateway)
    Tick    tick    = 5; // dt_ms, server time; sent at the room's tick_hz (0 = no ticks, events only)
    Drain   drain   = 6; // the server is going down: checkpoint now
  }
}

// Room -> gateway.
message FromRoom {
  oneof msg {
    Hello   hello   = 1; // tick_hz, contract version
    Send    send    = 2; // to player ids (empty = everyone), payload bytes
    Persist persist = 3; // world-state checkpoint: key, bytes
    Commit  commit  = 4; // match result for the platform: grants, stats, server-save writes, idempotency key
    Kick    kick    = 5; // player id, reason (cheat check failed, protocol abuse)
    End     end     = 6; // reason
  }
}
```

Rules every room follows, in any language. They keep the option of rewriting a room open at no cost today:

- **No I/O except the contract.** No `fetch`, database, files or timers. Time comes from `Tick`; persistence goes out
  as `Persist` / `Commit`, and the gateway calls the platform.
- **Seeded randomness only**, from `Create.seed`. A room fed the same inputs produces the same output.
- **Payloads are bytes.** The gateway never parses them. JSON inside is fine; a game can switch to its own protobuf or
  FlatBuffers when its bandwidth calls for it.
- **Per-player views.** A room sends each player only what they may see. That is interest management and stops
  wallhacks: a client cannot reveal what it was never sent.

### The TypeScript side (today)

A game surfaces its room the way it surfaces party slices: `games/<name>/src/server/index.ts` exports
`export const room: RoomLogic`. The room host finds it by game id. A small adapter in a new `packages/room`
(`@lawn/room`) turns the contract messages into calls:

```ts
export interface RoomLogic<In = unknown, Out = unknown> {
  tickHz: number;                                  // 0 = event-driven
  decode(raw: unknown): In | null;                 // validate an intent; reuse the game's read* checks
  create(ctx: RoomCtx, seed: number, restore?: Uint8Array): void;
  join(p: RoomPlayer): void;                       // RoomPlayer has the account id when signed in
  leave(id: number, reason: string): void;
  input(from: number, msg: In): void;              // intents only: move, fire, cast, attack(target)
  tick(dtMs: number): void;
}
// RoomCtx: send(to, msg), persist(key, bytes), commit(result), kick(id, why), end(why). Nothing else.
```

A tier-1 game exports only `decode` (and optional budgets); the gateway runs it before relaying.

The room imports the game's **sim** modules, never its view. That requires a one-time refactor per game (see "Per-game
plans"), done the way slices do it: the game and its room call the same functions, and no code is copied.

### Other languages (later, when needed)

Two paths, chosen per game when the time comes:

1. **Out-of-process rooms.** The room host speaks `ToRoom` / `FromRoom` over a gRPC bidirectional stream or a Unix
   socket to a process in any language. That is server to server, where gRPC streaming works well. The most flexible
   path, and each room runs isolated.
2. **WebAssembly rooms.** A room is a Wasm module that exports `create/join/leave/input/tick` over byte buffers and
   imports the `RoomCtx` calls. Node runs Wasm today; a Go host (wazero) or Rust host (wasmtime) runs the same module
   later. The same module can also run in the browser for client prediction, so the client and server sims never
   drift apart, which is the hidden cost of "server in Rust, client in TypeScript". TypeScript does not compile to
   Wasm well, so this suits a game written for it, not a port of an existing one.

**Conformance tests** keep implementations honest: a set of language-neutral test vectors per game (inputs in, expected
`FromRoom` messages out, given a seed) that any room implementation must pass, like the party slice contract test.

### Performance

Node is unlikely to be the gateway's bottleneck for a long time. Per-room sim CPU and GC pauses at 30 Hz are more
likely. So the most valuable speed option is being able to rewrite **one** heavy game's room, which the contract
gives. Per-room metrics (below) say which game that is before anyone rewrites anything.

## Transport and encoding

- **Realtime stays on WebSockets.** gRPC-Web and Connect in browsers support unary and server-streaming calls only,
  with no bidirectional streams, and HTTP/2 head-of-line blocking hurts at 20 Hz. WebTransport (unreliable datagrams)
  is a later option for tier-3 games; the contract does not care how bytes reach the gateway.
- **Protobuf is the contract language:** for the room contract, and for the platform calls rooms trigger. Not
  required for game payloads. Range and plausibility checks are what make a payload safe, and proto does not do them;
  the existing tuple-JSON plus `read*` validators (Gnomomia's `readPose`, `readEnemySyncList`) are already compact
  and become each game's `decode`.

## Identity

`hello` gains an optional Keycloak access token (the same one `@lawn/platform` already holds). The gateway checks it
against the platform and attaches the account id to the player, and rooms get it in `Join`. Guests still play; a room
just cannot commit server-owned progress for them (or commits it to a guest account, if the platform's guest accounts
cover it). Without this step nothing a room decides survives the match.

## Persistence: generic primitives in the platform

The platform already has `SaveService` (one revision-guarded blob per account per game, written by the client) and
`InventoryService` (`ClaimUnlock` from clients, `GrantUnlock` from services, with `claim_policy` deciding which). This
proposal extends that split between what a client may write and what only a service may write:

| Primitive | Written by | For | Status |
|---|---|---|---|
| Client save | client | settings, cosmetic choices, single-player progress | exists (`SaveService`) |
| Server save | rooms only (service identity) | competitive progress: Gnomomia level, gear, quests | new: a second namespace on `SaveService`, same shape and revision guard |
| Unlocks | rooms via `GrantUnlock` | items earned in an authoritative match | exists; rooms make `SERVER_GRANT` usable for game rewards |
| Ledger | rooms only | append-only grants and spends (currency, consumables) keyed by idempotency key (`matchId:n`), so a retry never grants twice | new |
| Stats and leaderboards | rooms only | atomic counters and best scores per game | new |
| Match records | rooms only | immutable result (players, outcome, duration, room version): feeds achievements and cheat review | new |
| World state | rooms only | persistent shard state (a Gnomomia zone), checkpointed with `Persist`, handed back in `Create.restore` | new |

Rules:

- The platform stores opaque bytes plus a schema version per game and per key; each game owns its own migrations.
  Each game gets size quotas.
- Rooms never write on every tick. They checkpoint world state every N seconds and on `Drain`, and make **one atomic
  `Commit` per match** (ledger + stats + match record + server-save writes) with an idempotency key.
- **Anything a client writes is cosmetic.** Leaderboards, the economy and trade read only data a room wrote.
- Single-player games keep client saves. Cheating alone is fine; it just never reaches a leaderboard.

## Operations

- **Lifecycle.** Today a deploy drains (matches play out) or ends matches with `ended`. Rooms get `Drain`: checkpoint,
  then players reconnect to the new pod with their resumable seat token, and the room is recreated from its
  checkpoint. Persistent worlds need this before they can run longer than `MATCH_MAX_MS`.
- **Observability.** Per room: tick duration (p50/p99), inputs and bytes in/out, rejected inputs by reason, kicks.
  These add to the OTel metrics already behind `ENABLE_OTEL_METRICS`.
- **Input logs.** Rooms are deterministic given seed + inputs, so recording inputs per room (cheap) allows replays for
  debugging and cheat review.
- **Cost.** A tier-3 room spends cluster CPU for every match, where a browser host was free. That is a reason to keep
  most games at tiers 0-2, and to watch the tick metrics before raising player caps.
- **Scaling.** More replicas of the same image; the gateway routes a match to the replica that holds its room (sticky
  by match id). Still one service to deploy.

## Per-game plans

**Gnome Front (tier 3).**
1. Now, with no server work: the host checks guest `dmg` against the shot lines it already receives in `me.sh`, plus
   the weapon's fire rate and range. That closes the worst hole while the rest is built.
2. Split sim from view: `combat.ts` and `conquest.ts` create meshes inside sim code. three's math classes run fine in
   Node; the sim must emit events that the view draws, never touch the scene.
3. `host.ts` becomes the room. Guests send inputs (move, aim, fire, use) instead of `dmg`; the room checks hits with
   lag compensation (a short history of soldier poses, rewound to the shooter's view time). Clients predict their own
   soldier and reconcile with snapshots. Bots run in the room.

**Gnomes of Gnomomia (tier 2).** Its exposure is the economy and persistence, not physics.
1. Clients keep owning movement; the room checks speed and teleports against the previous pose.
2. The room owns enemies per zone (replacing per-zone browser authority and `ehand` handoffs, and their dropped DoTs
   and boss timers). `ehit {d}` becomes `attack {target}`; the room computes damage from its own `GameState`, built
   from the server save.
3. XP, loot and quests go out as `Commit` to the server save and unlocks. The client's `PutSave` stops covering those
   fields.
4. The zone state checkpoints as world state, so the shard survives deploys.

**Pilot: Gnome Blackjack or Gnome Bowling (tier 3, event-driven).** No physics and small state, so they prove the
plumbing (rooms, reserved host id, contract, `Commit`) before the hard games depend on it.

## Phases

1. **Guard (tier 1, every game).** Per-player relay message and byte budgets per game, an Origin check on the WebSocket
   upgrade, and the optional per-game `decode` hook. Gnome Front's host-side `dmg` check.
2. **Identity.** Token in `hello`, account id on players.
3. **Room runtime.** `room.proto`, `@lawn/room`, worker-thread room host, `authority` in `GameRules`, reserved id 0,
   per-room metrics. Pilot game moves to it, with a conformance test.
4. **Platform primitives.** Server save namespace, ledger, stats, match records, `Commit`; world state with
   `Persist`/`Drain`.
5. **Gnomomia at tier 2.**
6. **Gnome Front at tier 3,** after its sim/view split.

Each phase stands alone: stopping after any of them leaves the system better than it was.

## Open questions

- Does the room host stay a module inside `mp-server`, or become its own package (`packages/room-host`) from day one?
  The proposal assumes inside, with the boundary enforced by the contract.
- Should the gateway call the platform directly for `Commit`, or should rooms get a narrow Connect client with a
  service token? (The proposal assumes the gateway, so rooms keep no I/O.)
- Guests and server-owned progress: commit to guest accounts, or keep guests out of competitive progress?
- Tier 2 movement checks: how strict before they kick a player with a bad connection? Probably log-only at first,
  with thresholds tuned from the rejected-input metrics.
- Is a deterministic sim a requirement for tier 3 (replays, Wasm prediction), or only a goal?
