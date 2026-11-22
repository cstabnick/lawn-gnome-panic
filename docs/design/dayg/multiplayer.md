# Multiplayer: PvPvE on `@lawn/mp`

## What playing with others is like

- **Solo is a full game.** NPCs cover every social role: trading, company, betrayal, war. Nothing needs another
  player.
- **Small groups (2–6) are the sweet spot.** Watches, carrying more, splitting up to scout. A group of players is a
  "pack" to the simulation: NPCs judge it, trust it and post quests for it.
- **Strangers are PvPvE.** A room's world holds up to 16 players. Other players can be friends, traders or the worst
  thing in the world. Killing a player costs standing with any faction that sees it or hears of it, unless they're
  wanted, so "friendly unless you're a raider" is the default social contract, and it is the simulation that enforces
  it.
- **Safe zones** are not a rule: they are big settlements whose norms forbid violence inside the walls and whose guards
  act on it.

## Room modes

Each room picks one when it is made:

| Mode | Players can hurt players | For |
|---|---|---|
| **Full** | anywhere outside havens | DayZ-style PvPvE |
| **Haven peace** | only inside marked war zones (regions two factions are at war over) | open rooms with strangers (default) |
| **Co-op** | never (friendly fire off) | friends' rooms, solo |

NPCs can always fight players and each other in every mode; the simulation doesn't change.

## Death and respawn

- You shatter, your gear stays on the body, and your gnome rises as a Hatless wearing what it wore
  ([hatless.md](hatless.md)). The death recap ([crafting.md](crafting.md#death-recap)) shows what happened.
- **Respawn** as a new gnome (your same look from `@lawn/gnome`; core fact 7) with a starter kit (a rag, a candle, a
  stub of bread):
  - at the **Lychgate Waystation** (always), or
  - at the **Bath House** or the **Willow** edge spawns (chosen at random, the "coast"), or
  - at a haven where you hold a **bed** (rented, or given at Sworn rank) — at most once per real hour, so a bed is a
    home, not a checkpoint.
- **Where you fell** is a rough circle on your map for one sun-day. Getting your gear back is the classic first
  quest of a new life; friends can grab it for you.
- **What you keep**: your standing with factions drops by half (a new gnome is a stranger, but people remember the
  name), your skills are lost except what **lineage** passes on ([survival.md](survival.md#skills)), and everything in
  caches and in a haven **home cache** is still yours.
- **Home cache**: every player gets a free small locked niche at the Waystation (12 bulk) and can rent bigger ones in
  other havens. Things in a home cache are safe from everything except that haven falling.

## Logging out

- Logging out takes **20 seconds** of sitting still (DayZ-style). Interrupted by damage or moving.
- Inside a haven or on your bed: instant.
- After that, your gnome **leaves the world**: it can't be found, killed or looted, and its needs stop. On logging
  in, it comes back on the same spot, with 5 seconds of fade-in during which nothing can target it.
- Pulling the plug mid-fight: the gnome stays for 60 seconds, AI-controlled (it crouches and tries to back off), then
  leaves.

## Getting around

The map is meant to feel big, but a 60-minute session shouldn't be all walking:

- **Spawn near friends**: joining a friend's room puts you at the haven nearest to them where you're allowed in.
- **Caravan rides**: pay a caravan to ride its cart between havens. The ride is real (it takes the caravan's time, at
  L1) and can be ambushed. You can play while riding (watch, shoot) or log out on the cart, which counts as a bed.
- **Ferries and rafts**: the Willow Folk ferry across the Drowned Corner; rafts can be built ([crafting.md](crafting.md)).
- **Zip lines and gliding**: faction-built zip lines between high places, and `funeral-ribbon` gliding down.
- **The drain and the catacombs**: dark and dangerous short cuts under the map.
- No teleport, no fast-travel menu.

## Rooms

DayG is **room-based only**. There is no quick play and no matchmaking queue.

- **Every world is a room.** "New world" makes a room with a seed, a mode, a player cap (up to 16) and a room code.
  You join a room by its code or an invite link, never by a queue. Solo play is a room of one, and the same save rules apply.
- **Members.** Anyone who has joined a room becomes a member. A member can come back to it from the "My worlds" list.
  The room's creator can make it **invite-only** (members can't pass the code on), remove members, and close the room.
- **One world per room.** A full room is full; it does not open a new shard.
- **Hosted by a player, in the browser.** Whoever is in the room hosts it: the first member to open it, then a hand-off
  whenever the host leaves ([architecture](#architecture)). There is no dedicated server for worlds. The relay only
  passes messages, as in every game here.
- **The world calendar only runs while someone is in the room** ([world.md](world.md#time-two-clocks)). Nobody comes
  back to a world that moved on without them.

## Cloud saves: always synced

Online play needs a signed-in account (`@lawn/platform`), so every save lives in the cloud.

- **The world save** (`seed + snapshot + event log`, which includes every character in it) is written by the host to
  the cloud **every 5 real minutes, on every host hand-off and when the last player leaves**. It is stored once per
  room, and every member can read and write it, not just the host.
- **Each member's copy is kept in sync**: on joining, a member's client checks the room's newest save revision and
  downloads it if theirs is older. Every client keeps a local copy (IndexedDB) of the newest snapshot it has seen. So
  any member can host next time, even if the last host's device is gone.
- **Conflicts**: the save with the highest world tick wins (each save carries its tick and the host that wrote it).
  Two members can't host the same room at once: the relay room is one match, and the second to open it joins as a
  guest.
- **Your character** is saved inside the world save. Your **account** keeps your gnome look, achievements, cosmetics
  and the archive of chronicles you took part in, through `@lawn/cloudsave` (merge mode), as the other games do.
- **Offline solo**: a world played signed out stays local (IndexedDB) and uploads the first time you sign in.

**Platform work this needs**: today the platform's SaveService keeps one save per account per game, up to 512 KiB
(`packages/cloudsave/README.md`). DayG needs **room saves**: keyed by room, shared by the room's members, revision
guarded, and up to 8 MiB (sent in 512 KiB parts with a manifest). That is a new RPC on `packages/platform-server`
and a small client in `@lawn/cloudsave`, planned as part of phase 5 ([process.md](process.md)).

## The first hour

The Lychgate Waystation runs a **newcomer's job board** (simulated quests filtered to easy ones near the gate) and one
hand-written storylet, **The Gate Book**: a Waystation clerk asks you to carry the arrivals book to the Tap, which
walks you through the Forecourt, the Lower Walk and your first climb, and introduces the Truce. Hints come as advice from
NPCs, never as markers.

## Architecture

The repo's rule: **the server only relays; one browser hosts.** DayG keeps it as it is.

```
           ┌──────────────── mp-server (relay only, unchanged) ───────────────┐
           │                                                                   │
 player A (host) ── sim worker: world sim L1/L2 + L0 for A          player B, C …
   main thread: render, input, L0 near A                              send input + their L0 body state
                                                                      receive world deltas for their area
```

- **One sim core, two runners.** `games/dayg/src/sim/` is pure TypeScript, no DOM, deterministic from
  `(seed, inputs)` with an injected RNG. The same code runs:
  1. in the **headless simulator** (`npm run sim -w games/dayg`, Node), only for evaluation;
  2. in a **Web Worker** in the hosting player's browser. This is the only way a world runs for players.
- **Authority split.** The host owns the world: NPCs, Hatless, items, containers, factions, prices. Each player's
  client owns its own body's movement (like the repo's other free-roam games) and sends it with inputs; the host checks
  that it's possible (speed, walls) and has the final say on every hit, pickup and trade.
- **Interest management.** The host sends each player only what's near them: L0 entities in their chunks, L1
  summaries of nearby regions, and a slow trickle of world news (faction changes, price rumours) at 0.2 Hz.
- **Players spread out.** Each player keeps their own L0 bubble, so two players at opposite ends of the map cost two
  bubbles. A room's cap is set by its host's device: 4 players with a phone host, 16 with a desktop host. If a phone
  host would push the room over its cap, hosting goes to a desktop member when one is there; otherwise the room tells
  the newcomer it is full.
- **Host hand-off.** `resumable: true`. When the host leaves, the next host gets the latest world snapshot (sent to
  every client every 5 min, chunked, compressed, and also on leave) and replays the inputs since. Determinism makes
  this exact.

`GAMES` row: `dayg`, 1–16 players, **room code only** (no public queue), starts at once, drop-in yes, `resumable`.

## Snapshot size

A world is `seed + snapshot + event log`. Only changed containers and living entities are stored; the untouched world
comes from the seed and the hand-made map. Target: under 4 MiB compressed at day 30 and under 8 MiB at day 120 (the
room save limit). The evaluation tracks it.

## Mobile

- Touch controls in [survival.md](survival.md#controls).
- **Phone inventory**: one list, with a tab per open container (you, your bag, the crate in front of you). Tap an item
  for an action sheet (use, equip, move to the other tab, drop, split); filters by tag (food, tools, medicine). No
  drag needed. Desktop adds drag and drop and the two-panel view.
- A phone can host: the world sim in a worker uses about 2–4 ms per real second at L2 for a full world (target, checked in
  the performance metrics); L0 budget 120 visible Hatless.
- Backgrounded phones are suspended: the game reconnects with `resumable` and, if it was the host, hands hosting over.
