# Levels of simulation detail

The world is too big to simulate in full. Every system runs at three levels of detail, and an entity moves between them
without being created or destroyed (counts are conserved; [evaluation.md](evaluation.md) checks it).

| Level | Where | Tick | What is simulated |
|---|---|---|---|
| **L0 Near** | chunks within ~300 gm of a player (and the floors above and below them) | 20 Hz | bodies, physics, climbing, sight cones, melee and shots, every item |
| **L1 Regional** | regions next to a player-occupied region | 1 Hz | NPCs as agents on the zone graph (with heights), simple combat resolution, Hatless as small groups, caravans as groups |
| **L2 World** | everywhere else | 1 tick per sun-hour (every 5 real min; 96 ticks per world-day) | populations per zone, horde density field, faction stocks and plans, markets, caravans and traders as tokens, foraging regrowth. Society runs on the aggregate rules in [society.md](society.md#at-l2-the-aggregate-rules) |

Which level handles which timescale: seconds (a fight, a herd lunging at gunfire) are L0; minutes (a herd turning
toward a noise, a caravan meeting raiders) are L1; hours and days (drift, markets, faction plans, groups forming) are
L2. The headless sweeps run L2 only, except around bot players.

## Rules

- **Same rules, averaged.** An L2 fight between an NPC group and a herd uses the expected result of the L1 fight with
  matching variance (a fitted table from L1 runs, rebuilt by `npm run sim:calibrate`). The LOD-equivalence test keeps
  them honest.
- **Promotion** (L2 → L1 → L0): a zone with horde density 40 gets 40 Hatless, placed by the zone's scent, noise and
  height rules (Hatless are never placed on High layers; they are placed in `PIT` and `NEST` spots first). NPCs placed at
  L1 get positions from their plan (asleep on a headstone, foraging in the reeds).
- **Demotion** sums them back and keeps each NPC's full state (inventory, ledger, body); only their exact position is
  lost.
- **Hysteresis**: a region stays promoted for 60 s after the last player leaves, so a player walking back and forth
  over a border doesn't churn it.
- **Logged-off players** leave the world entirely ([multiplayer.md](multiplayer.md#logging-out)): nothing can find or
  loot them, and their needs stop.
- **Interiors** are generated on first promotion of their chunk and stored from then on.
- **Budget per device**: desktop host 300 L0 Hatless, phone host 120; beyond that, distant Hatless render as an
  instanced crowd without their own AI (the count stays right).
