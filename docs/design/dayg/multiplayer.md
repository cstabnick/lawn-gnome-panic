# Multiplayer: PvPvE on `@lawn/mp`

## What playing with others is like

- **Solo is a full game.** NPCs cover every social role: trading, company, betrayal, war. Nothing needs another
  player.
- **Small groups (2–6) are the sweet spot.** Watches, carrying more, splitting up to scout. A group of players is a
  "pack" to the simulation: NPCs judge it, trust it and post quests for it.
- **Strangers are PvPvE.** A shared world holds up to 32 players. Other players can be friends, traders or the worst
  thing in the world. Killing a player costs standing with any faction that sees it or hears of it, unless they're
  wanted, so "friendly unless you're a raider" is the default social contract, and it is the simulation that enforces
  it.
- **Safe zones** are not a rule: they are big settlements whose norms forbid violence inside the walls and whose guards
  act on it.

## Room modes

Each world picks one when it is made (public worlds list theirs in the browser):

| Mode | Players can hurt players | For |
|---|---|---|
| **Full** | anywhere outside havens | DayZ-style PvPvE |
| **Haven peace** | only inside marked war zones (regions two factions are at war over) | most public worlds (default) |
| **Co-op** | never (friendly fire off) | friends' worlds, solo |

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

- **Spawn near friends**: joining a friend's world puts you at the haven nearest to them where you're allowed in.
- **Caravan rides**: pay a caravan to ride its cart between havens. The ride is real (it takes the caravan's time, at
  L1) and can be ambushed. You can play while riding (watch, shoot) or log out on the cart, which counts as a bed.
- **Ferries and rafts**: the Willow Folk ferry across the Drowned Corner; rafts can be built ([crafting.md](crafting.md)).
- **Zip lines and gliding**: faction-built zip lines between high places, and `funeral-ribbon` gliding down.
- **The drain and the catacombs**: dark and dangerous short cuts under the map.
- No teleport, no fast-travel menu.

## Friends' worlds

- **Room code** from the menu: "new world with friends" makes a co-op or haven-peace world and a code.
- The world's snapshot is saved to **every member's** cloud slot (`@lawn/cloudsave`), so any member can host it next
  time; the newest snapshot wins. No one device owns the group's world.
- The world calendar only runs while someone is in it ([world.md](world.md#time-two-clocks)).

## The first hour

The Lychgate Waystation runs a **newcomer's job board** (simulated quests filtered to easy ones near the gate) and one
hand-written storylet, **The Gate Book**: a Waystation clerk asks you to carry the arrivals book to the Tap, which
walks you through the Forecourt, the Lower Walk and your first climb, and introduces the Truce. Hints come as advice from
NPCs, never as markers.

## Architecture

The repo's rule: **the server only relays; one browser hosts.** DayG keeps it, with one extension that needs no new
server code.

```
           ┌──────────────── mp-server (relay only, unchanged) ───────────────┐
           │                                                                   │
 player A (host) ── sim worker: world sim L1/L2 + L0 for A          player B, C …
   main thread: render, input, L0 near A                              send input + their L0 body state
                                                                      receive world deltas for their area
```

- **One sim core, three runners.** `games/dayg/src/sim/` is pure TypeScript, no DOM, deterministic from
  `(seed, inputs)` with an injected RNG. The same code runs:
  1. in the **headless simulator** (`npm run sim -w games/dayg`, Node) for evaluation;
  2. in a **Web Worker** in the hosting browser;
  3. in a **headless host** (`npm run host -w games/dayg`, Node): a script that joins a room through the relay as an
     ordinary client and hosts it. The relay does not know it is not a browser, so the server stays relay-only.
     This is how a public world keeps running when no player is online.
- **Authority split.** The host owns the world: NPCs, Hatless, items, containers, factions, prices. Each player's
  client owns its own body's movement (like the repo's other free-roam games) and sends it with inputs; the host checks
  that it's possible (speed, walls) and has the final say on every hit, pickup and trade.
- **Interest management.** The host sends each player only what's near them: L0 entities in their chunks, L1
  summaries of nearby regions, and a slow trickle of world news (faction changes, price rumours) at 0.2 Hz.
- **Players spread out.** Each player keeps their own L0 bubble, so two players at opposite ends of the map cost two
  bubbles. A phone host is capped at 4 players; a desktop host at 16; the headless host at 32.
- **Host hand-off.** `resumable: true`. When the host leaves, the next host gets the latest world snapshot (sent to
  every client every 5 min, chunked, compressed, and also on leave) and replays the inputs since. Determinism makes
  this exact.

`GAMES` row: `dayg`, 1–32 players, starts at once, drop-in yes (one shared world per room; a full room opens a new
shard, as Gnomomia and Club Gnome do).

## Persistence

- A world is `seed + snapshot + event log`. Snapshot size target: under 4 MB compressed for a 30-day world (only
  changed containers and alive entities are stored; the untouched world comes from the seed).
- Solo and private worlds: saved through `@lawn/cloudsave` for signed-in players, `localStorage`/IndexedDB otherwise.
- Public worlds: the headless host writes snapshots to its own disk. A platform-server "world store" can come later if
  we need one; it isn't needed to start.
- **Your character** (gnome, inventory, skills) lives in the world, not in your account. Your account keeps only
  cosmetics (achievement gear) and stats.

## Mobile

- Touch controls in [survival.md](survival.md#controls); the inventory is a two-panel drag-and-drop with tap-to-move
  as well.
- A phone can host: the world sim in a worker uses about 2–4 ms per real second at L2 for a full world (target, checked in
  the performance metrics); L0 budget 120 visible Hatless.
- Backgrounded phones are suspended: the game reconnects with `resumable` and, if it was the host, hands hosting over.
