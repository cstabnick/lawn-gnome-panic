# Server authority: one room runtime for every online game

Status: **proposal, revised after review**. Nothing here is built yet. It says how online games can move decisions
from players' browsers to the server, one game at a time, while keeping one consolidated multiplayer service and
leaving room for a faster language than Node later.

The revision puts **accounts for everyone** and **generic progress primitives** (ledger, stats, leaderboards) first,
because games need persistent, queryable values (Gnome Blackjack's chip budget) before they need server-run rules.
Those primitives are what rooms write to later, so building them first wastes nothing. The review answers are under
"Decisions".

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
- **Gnome Blackjack.** Chips reset to `START_CHIPS` every visit. A persistent budget needs somewhere to keep a balance
  that other services (leaderboards, the `/me/` page) can read, and today the only option is the client's save blob.
- **Every game.** Frames are capped at 64 KB and chat is rate-limited, but relay traffic has no per-player budget, and
  players are anonymous to the server (no account id), so nothing it decides could be tied to a durable save.

The underlying problem is that **clients send outcomes, not intents**. No transport or encoding fixes that; only moving
the decision does. But the *storage* for those outcomes does not have to wait for that move: a balance can live on the
server, written by the client for now and by a room later, without any change to how it is read.

## Goals

- **One account shape for every player.** Guests are real accounts with a random identity; signing in upgrades one.
- **Generic progress primitives** (currencies, stats, leaderboards, items) that every game uses through one catalog
  and one write call, with no per-game endpoints. Who may write each value is data, not code.
- Move control to the server **per game, where it is worth it**. Most games stay relay-only.
- **One service.** No game server per game. Games plug into one runtime, the way games surface party slices to Gnome
  Party.
- **Language-neutral contract.** Game server logic runs as TypeScript in Node today; a game, or the generic gateway, can
  move to Rust, Go or C# later without changing the rest.

## Non-goals

- A generic entity-replication or ECS engine. Game rules stay per game; only the plumbing is shared. A snapshot-delta
  helper can join `packages/` once two games need one.
- Per-game endpoints on the platform. A game's logic runs in its room, never as an RPC on `platform-server`.
- gRPC or Connect from the browser for realtime traffic (see "Transport and encoding").
- Moving single-player games or casual co-op games to the server.

## Accounts for everyone

`proto/gnome/user/v1/user.proto` already reserves `CreateGuest` and `ACCOUNT_STATE_GUEST`. Implement them:

- **First visit:** when accounts are enabled for the build and the browser has neither a Keycloak session nor a guest
  credential, `@lawn/platform` calls `CreateGuest`. The platform creates a `GUEST` account with a random `user_id` and
  random gnome name, and returns a **guest credential**: a long random secret that the platform exchanges for short-lived
  access tokens, the same shape of token Keycloak issues. The browser keeps the credential next to the Keycloak session
  (a cookie on the platform's origin where the platform is same-site with the arcade, localStorage otherwise, since
  Safari blocks third-party cookies).
- **Every call is an account call.** `SaveService`, `ProgressService`, `InventoryService` and the matchmaker accept
  either token. No service branches on guest vs. signed in; the account shape is the same.
- **Upgrade, not replace.** Signing in while holding a guest credential links that guest account to the Keycloak user
  in place (`GUEST` -> `LINKED`), keeping its `user_id`, so every balance, stat and item carries over. If the Keycloak
  user already has an account, the two are merged (see "Open questions").
- **No guarantee for guests.** A guest's progress lasts as long as their credential. Clearing site data loses it, and
  moving it to another device means copying the credential (later, a short transfer code). Signing in is what makes
  progress follow the player. Guests do not expire for now, but the platform may purge long-idle guests later.
- **Builds without accounts** (`accountsEnabled()` is false) keep today's local-only behaviour.

## Progress primitives: `gnome.progress.v1`

One service on `platform-server` stores every value a game wants persisted and queryable beyond its save blob. It
never knows a game's rules; it enforces only what the game declares in its catalog.

### The catalog

Each game declares its resources as data in `games/<name>/progress.json`, copied into the platform image at build (like
the `Game` enum mirror). The platform rejects ops on undeclared resources.

```jsonc
// games/gnome-blackjack/progress.json
{
  "currencies": {
    "chips": { "start": 100, "floor": 0, "cap": 1000000, "writers": "client",
               "clientLimits": { "perOp": 5000, "perDay": 50000 },
               "refill": { "below": 10, "to": 100, "cooldownS": 3600 } }
  },
  "stats": {
    "hands_played": { "kind": "counter", "writers": "client" },
    "biggest_win":  { "kind": "max", "writers": "client", "leaderboard": true },
    "peak_chips":   { "kind": "max", "writers": "client", "leaderboard": true }
  }
}
```

- **Currencies:** integer balances with a floor, a cap, an optional starting balance and an optional refill rule
  (blackjack's "broke, here are 100 chips" becomes data).
- **Stats:** `counter`, `max`, `min` or `last`. `leaderboard: true` makes a stat rankable. **Hiscores are max stats;
  metrics are counters.**
- **Items** stay defined by `InventoryService`'s catalog (`ItemDef`), with its `claim_policy`. The progress service can
  grant them in the same atomic write (below), so a match result never half-applies.

### Who may write: the writer policy

Every resource names its writers. This is the split between client claims and server authority, decided per resource:

| `writers` | Who may write | Trust |
|---|---|---|
| `client` | the player's own browser, within `clientLimits` (per op, per day), idempotent | bounded cheating; fine for casual play |
| `room` | only a room, through `Commit` (service identity) | server-decided; what the economy, trade and ranked leaderboards read |

Every ledger entry records which kind of writer made it. A leaderboard over a `client` stat is a casual board; a
ranked board accepts only `room` stats. Moving a game to server authority is a **one-line catalog change**
(`"writers": "client"` -> `"room"`): balances, reads and leaderboards stay the same, and only the client's write path
changes (it stops calling `Apply` and starts sending intents to its room). A game may also bump a resource's `epoch` to
reset balances that were earned under client trust.

### The API

```proto
service ProgressService {
  // [caller or service] Atomic batch of ops for one account and game. Every op is checked against the catalog and
  // the writer policy; any failure (unknown resource, below floor, over a client limit) fails the whole batch.
  // `idempotency_key` makes retries safe: a repeat returns the first result without applying anything.
  rpc Apply(ApplyRequest) returns (ApplyResponse);
  // [caller] Balances, stats and items for one game (or several), for the game and the /me/ page.
  rpc Get(GetRequest) returns (GetResponse);
  // [open] Top N and the caller's rank for one leaderboard stat.
  rpc Leaderboard(LeaderboardRequest) returns (LeaderboardResponse);
}

message Op {
  oneof op {
    Credit   credit    = 1; // currency id, amount
    Debit    debit     = 2; // currency id, amount; fails below the floor
    StatAdd  stat_add  = 3; // counter
    StatSet  stat_set  = 4; // max / min / last apply their own rule
    Grant    grant     = 5; // item id, through InventoryService's store
  }
}
```

- **Deltas, not blobs.** Ops commute, so two tabs or two devices never conflict the way save blobs do, and there is no
  revision guard to retry against.
- **Append-only ledger** under the balances, so every change has a writer, a reason and a time. That feeds cheat
  review, support ("where did my chips go?") and metrics.
- **Per-game quotas** on ops per minute and ledger size.

### Other primitives

| Primitive | Written by | For | Status |
|---|---|---|---|
| Client save | client | settings, cosmetic choices, single-player progress | exists (`SaveService`) |
| Progress (currencies, stats, leaderboards) | per resource: client or room | budgets, hiscores, metrics, economy | new: `gnome.progress.v1` |
| Items | per item: `claim_policy` | cosmetic unlocks, earned items | API exists (`InventoryService`), not implemented |
| Server save | rooms only | competitive progress: Gnomomia level, gear, quests | new: a second namespace on `SaveService`, same shape and revision guard |
| Match records | rooms only | immutable result (players, outcome, duration, room version, seed): feeds achievements, replays and cheat review | new |
| World state | rooms only | persistent shard state (a Gnomomia zone), checkpointed with `Persist`, handed back in `Create.restore` | new |

Rules:

- Rooms never write on every tick. They checkpoint world state every N seconds and on `Drain`, and make **one atomic
  `Commit` per match**: an `Apply` batch (currencies, stats, item grants) plus the match record and server-save writes,
  under one idempotency key (`matchId`).
- **The writer policy is the trust boundary.** Anything a client may write is treated as a claim; anything only a room
  may write is a fact. Single-player games stay on client writers: cheating alone is fine, it just never reaches a
  ranked board.

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

A game's tier and its progress writers move together: a game whose resources are `"writers": "room"` must run at
`'server'`.

## Architecture

Split the server into two roles. Both run in the current `mp-server` process (decided: the room host stays a module
inside `mp-server`, with the boundary enforced by the contract, not by deployment).

```
 browser ──WS──▶ ┌──────────────────────── gateway (generic) ────────────────────────┐
    │            │ sockets · hello/auth · matchmaking · rate limits · relay (tier 0/1) │
    │            └───────────────┬─────────────────────────────────────┬───────────────┘
    │                room contract (messages)                  Connect (service identity)
    │                            ▼                                      ▼
    │            ┌─── room host ───┐                     ┌──── platform-server (Go) ────┐
    │            │ one room per    │ ─── Commit ───────▶ │ accounts (guest + linked) ·  │
    │            │ match, game's   │     Persist         │ saves · progress · items ·   │
    │            │ RoomLogic       │                     │ match records · world state  │
    │            └─────────────────┘                     └──────────────────────────────┘
    │                                                                   ▲
    └──────────── Connect (account token): GetSave/PutSave, Get, client-writer Apply ┘
```

- **Gateway (generic, shared by every game):** owns sockets, `hello`, identity, matchmaking, room codes, chat, rate
  limits, interest filtering, and the plain relay for tier 0/1 games. For `authority: 'server'` games it creates a
  room instead of choosing a browser host, and routes the match's relays to the room. It is also the only thing that
  calls the platform on a room's behalf (`Commit`, `Persist`). This is the part that must be fast across all games
  (fan-out to thousands of sockets), so if a rewrite is ever needed it is the first candidate, and Go fits next to
  `platform-server`.
- **Room host:** runs rooms. Today: one Node `worker_thread` per authoritative room, loading the game's room module, so
  one game's slow tick or crash cannot stall relay traffic for the rest. Later: separate processes, in any language,
  speaking the same contract.
- **Browsers talk to the platform directly** for saves, reads and client-writer `Apply`, as they do for saves today.

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
    Join    join    = 2; // player id, name, character, color, account id (always set; guests are accounts), resumed flag
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
    Commit  commit  = 4; // match result: progress ops per account, item grants, server-save writes, match record, idempotency key
    Kick    kick    = 5; // player id, reason (cheat check failed, protocol abuse)
    End     end     = 6; // reason
  }
}
```

Rules every room follows, in any language. They keep the option of rewriting a room open at no cost today:

- **No I/O except the contract.** No `fetch`, database, files or timers. Time comes from `Tick`; persistence goes out
  as `Persist` / `Commit`, and the gateway calls the platform.
- **Deterministic** (see "Determinism"). Randomness comes only from `Create.seed`; time only from `Tick`. A room fed
  the same seed and inputs produces the same output.
- **Payloads are bytes.** The gateway never parses them. JSON inside is fine; a game can switch to its own protobuf or
  FlatBuffers when its bandwidth calls for it.
- **Per-player views.** A room sends each player only what they may see. That is interest management and stops
  wallhacks (and, for card games, peeking at the deck): a client cannot reveal what it was never sent.

### The TypeScript side (today)

A game surfaces its room the way it surfaces party slices: `games/<name>/src/server/index.ts` exports
`export const room: RoomLogic`. The room host finds it by game id. A small adapter in a new `packages/room`
(`@lawn/room`) turns the contract messages into calls:

```ts
export interface RoomLogic<In = unknown, Out = unknown> {
  tickHz: number;                                  // 0 = event-driven
  decode(raw: unknown): In | null;                 // validate an intent; reuse the game's read* checks
  create(ctx: RoomCtx, seed: number, restore?: Uint8Array): void;
  join(p: RoomPlayer): void;                       // RoomPlayer has the account id
  leave(id: number, reason: string): void;
  input(from: number, msg: In): void;              // intents only: move, fire, cast, attack(target)
  tick(dtMs: number): void;
}
// RoomCtx: send(to, msg), persist(key, bytes), commit(result), kick(id, why), end(why). Nothing else.
```

A tier-1 game exports only `decode` (and optional budgets); the gateway runs it before relaying.

The room imports the game's **sim** modules, never its view. That requires a one-time refactor per game (see "Per-game
plans"), done the way slices do it: the game and its room call the same functions, and no code is copied.

### Reducer rooms: the easy path for event-driven games

Turn-based and event-driven games (blackjack, slots, bowling) don't need the full `RoomLogic`. Their rules are already
a pure reducer, so `@lawn/room` offers an adapter that builds a room from one:

```ts
export interface ReducerRules<S, In, View> {
  decode(raw: unknown): In | null;
  init(seed: number, config: unknown): S;
  join?(s: S, p: RoomPlayer): void;
  leave?(s: S, id: number): void;
  act(s: S, from: number, input: In): Effect[];    // Effect = progress op for an account, or "match over"
  tick?(s: S, dtMs: number): Effect[];
  view(s: S, player: number): View;                // what this player may see (hides the dealer's hole card)
}
export function reducerRoom<S, In, View>(rules: ReducerRules<S, In, View>): RoomLogic<In, View>;
```

The adapter keeps the state, calls `act`/`tick`, sends each player their `view`, and batches effects into `Commit`.
Gnome Blackjack's `table.ts` (`newTable(seed)`, `applyInput`, `tickTable`, `snapshot`) already has this shape and
already avoids `Math.random` and the DOM, so its room is mostly re-exports plus a `view` that redacts the deck.

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
They depend on determinism.

### Determinism

Decided: **rooms are deterministic** unless a game makes a written case otherwise. Same seed, same inputs, same tick
sequence, same room version and runtime: same output. That buys replays from input logs, conformance vectors, and
reproducible cheat review.

Where it meets the current code, and why none of it blocks:

- **`Math.random()` in sim code.** Gnome Blackjack's rules already avoid it. Gnome Front's sim calls it about 25 times
  (`bots.ts`, `botAim.ts`, `soldiers.ts`, `combat.ts`); Gnomes of Gnomomia and Gnome Bowling have similar counts across
  sim and view. Swapping sim calls for a seeded RNG passed in from the room is mechanical and happens during each game's
  sim/view split anyway. View-only randomness (particles, audio variation) stays as is.
- **Wall-clock time** (`Date.now()`, `performance.now()`). Sim code must take `dt` from `Tick` instead. Same refactor.
- **Floating point across engines.** JavaScript does not guarantee identical results for `Math.sin`, `Math.atan2` and
  friends across engines (V8, SpiderMonkey, JavaScriptCore). So determinism is guaranteed **per runtime**: the room
  host pins its Node version, and a replay records the room version and Node version. It is not guaranteed between the
  server and a player's browser, and does not need to be: client prediction already reconciles against server
  snapshots. Bit-identical client/server sims are only possible with the Wasm path.
- **Physics.** No game uses a physics engine today (Gnome Front's movement and hits are hand-written math on three's
  vector classes). If one is added, it must be one with a deterministic mode (Rapier has one), or the game makes the written case.

### Performance

Node is unlikely to be the gateway's bottleneck for a long time. Per-room sim CPU and GC pauses at 30 Hz are more
likely. So the most valuable speed option is being able to rewrite **one** heavy game's room, which the contract
gives. Per-room metrics (below) say which game that is before anyone rewrites anything.

## Transport and encoding

- **Realtime stays on WebSockets.** gRPC-Web and Connect in browsers support unary and server-streaming calls only,
  with no bidirectional streams, and HTTP/2 head-of-line blocking hurts at 20 Hz. WebTransport (unreliable datagrams)
  is a later option for tier-3 games; the contract does not care how bytes reach the gateway.
- **Protobuf is the contract language:** for the room contract, and for the platform calls (saves, progress, items).
  Not required for game payloads. Range and plausibility checks are what make a payload safe, and proto does not do
  them; the existing tuple-JSON plus `read*` validators (Gnomomia's `readPose`, `readEnemySyncList`) are already
  compact and become each game's `decode`.

## Identity in `hello`

`hello` gains the player's access token (Keycloak or guest; the same token `@lawn/platform` already holds). The gateway
verifies it (locally against the platform's signing keys, or with `VerifyToken`) and attaches the account id to the
player, and rooms get it in `Join`. Because every player has an account, there is no "guest who cannot be committed
for": a room commits a guest's chips to their guest account exactly as it does for a signed-in player. Builds without
accounts, and old clients, still connect without a token; their matches cannot be at `authority: 'server'` with room
writers.

## Operations

- **Lifecycle.** Today a deploy drains (matches play out) or ends matches with `ended`. Rooms get `Drain`: checkpoint,
  then players reconnect to the new pod with their resumable seat token, and the room is recreated from its
  checkpoint. Persistent worlds need this before they can run longer than `MATCH_MAX_MS`. Short event-driven rooms
  (blackjack) can skip checkpoints at first: a drained hand is void, bets are refunded in the `Commit`.
- **Observability.** Per room: tick duration (p50/p99), inputs and bytes in/out, rejected inputs by reason, kicks. Per
  progress resource: ops by writer, rejected ops by reason (floor, client limit, unknown resource). These add to the
  OTel metrics already behind `ENABLE_OTEL_METRICS`.
- **Input logs.** Rooms are deterministic, so recording inputs per room (cheap) allows replays for debugging and cheat
  review.
- **Cost.** A tier-3 room spends cluster CPU for every match, where a browser host was free. That is a reason to keep
  most games at tiers 0-2, and to watch the tick metrics before raising player caps.
- **Scaling.** More replicas of the same image; the gateway routes a match to the replica that holds its room (sticky
  by match id). Still one service to deploy.

## Per-game plans

**Gnome Blackjack (pilot: progress first, then a reducer room).**
1. With phase 1: `progress.json` declares `chips` (client writer, refill rule) and a few stats. The client reads its
   balance with `Get` on load and sends each settled hand as one `Apply` (debit bet, credit payout, stat updates) keyed
   by hand id. Chips persist and are queryable; cheating is bounded by `clientLimits` and accepted.
2. With phase 4: `src/server/index.ts` exports `reducerRoom(...)` over `table.ts`; the host's browser stops running the
   table. The catalog flips `chips` to `"writers": "room"`, and the client stops calling `Apply`. Slots move with it.

**Gnomes of Gnomomia (tier 2).** Its exposure is the economy and persistence, not physics.
1. Clients keep owning movement; the room checks speed and teleports against the previous pose. These checks are
   **planned, not optional**: they ship log-only first, with thresholds tuned from the rejected-input metrics, then
   enforce (correct the pose, then kick on repeat) as usage grows.
2. The room owns enemies per zone (replacing per-zone browser authority and `ehand` handoffs, and their dropped DoTs
   and boss timers). `ehit {d}` becomes `attack {target}`; the room computes damage from its own `GameState`, built
   from the server save.
3. XP, loot and quests go out as `Commit` to the server save, progress and items. The client's `PutSave` stops covering
   those fields.
4. The zone state checkpoints as world state, so the shard survives deploys.

**Gnome Front (tier 3).**
1. Now, with no server work: the host checks guest `dmg` against the shot lines it already receives in `me.sh`, plus
   the weapon's fire rate and range. That closes the worst hole while the rest is built.
2. Split sim from view: `combat.ts` and `conquest.ts` create meshes inside sim code. three's math classes run fine in
   Node; the sim must emit events that the view draws, never touch the scene. Sim randomness moves to a seeded RNG.
3. `host.ts` becomes the room. Guests send inputs (move, aim, fire, use) instead of `dmg`; the room checks hits with
   lag compensation (a short history of soldier poses, rewound to the shooter's view time). Clients predict their own
   soldier and reconcile with snapshots. Bots run in the room.

## Phases

1. **Accounts for everyone + progress primitives.** `CreateGuest`, guest credentials and tokens, guest-to-linked
   upgrade in `@lawn/platform` and `platform-server`. `gnome.progress.v1` (catalog, `Apply`, `Get`, `Leaderboard`)
   with client writers only. Gnome Blackjack keeps its chips. The `/me/` page shows balances and stats.
2. **Guard (tier 1, every game).** Per-player relay message and byte budgets per game, an Origin check on the WebSocket
   upgrade, and the optional per-game `decode` hook. Gnome Front's host-side `dmg` check.
3. **Identity.** Token in `hello`, account id on players.
4. **Room runtime.** `room.proto`, `@lawn/room` with `reducerRoom`, worker-thread room host, `authority` in
   `GameRules`, reserved id 0, `Commit` (room writers on `Apply`, match records), per-room metrics. Gnome Blackjack
   moves to a reducer room with a conformance test, and its chips flip to room writers.
5. **Persistent rooms + Gnomomia at tier 2.** Server save namespace, world state with `Persist`/`Drain`, movement
   checks (log-only, then enforced).
6. **Gnome Front at tier 3,** after its sim/view split.

Each phase stands alone: stopping after any of them leaves the system better than it was. Phase 1 needs none of the
room work and can start now.

## Decisions

From review of the first draft:

- **Room host location:** a module inside `mp-server`, the boundary enforced by the contract. Split it into its own
  package only if deployment needs it.
- **Who calls the platform for `Commit`:** the gateway, so rooms keep no I/O. A narrow Connect client for rooms with a
  service token makes sense later and is deferred until a room needs to read from the platform mid-match.
- **Guests:** guests keep existing and need no account to play, but they go through the same backend as an auto-created
  `GUEST` account with a random identity. Their progress is kept but not guaranteed; signing in upgrades the same
  account and makes progress follow them. (See "Accounts for everyone".)
- **Tier 2 movement checks:** not needed now, but planned: they will be implemented as usage grows (log-only first,
  then enforced). Nothing should assume they won't exist.
- **Determinism:** required for rooms unless a game makes a written case. The frictions with the current code are
  listed under "Determinism"; none blocks it.
- **Client-written persistent values are allowed** (Gnome Blackjack's chips) as long as they go through the progress
  service, so they are queryable now and can move to room writers later without changing their readers.

## Open questions

- **Merging accounts.** A guest signs in to a Keycloak user that already has an account. Proposed default: keep the
  linked account; add currencies (capped), keep the better value of max/min stats, add counters, union items; the
  guest's save blobs are offered through the existing save-choice UI. Is adding currencies too generous?
- **Catalog home.** `games/<name>/progress.json` copied into the platform image keeps games owning their data, but means
  a catalog change needs a platform deploy. Alternative: the platform loads catalogs from the published site at start.
- **Casual leaderboards.** Should boards over client-written stats be shown at all, or only on the player's own `/me/`
  page until the game has room writers?
- **Guest credential transfer.** A short transfer code ("enter this on your other device") before or after sign-in
  ships? It is cheap, but sign-in covers the same need.
