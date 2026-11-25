# @lawn/jam

GBA GJAM's headless 2-on-2 arcade basketball, extracted so other games can run a real match. No Vite, no DOM, no Worker: `JamSimulation` runs in plain Node. Depends on `three` (vectors only) and `@lawn/gnome` (types only).

## Court frame

Metres. +x is the home team's attacking hoop (players 0,1 are home; 2,3 away). `yaw` / `facing` is the direction a player looks. Constants: `COURT_HALF_X` 11.5, `COURT_HALF_Z` 6.2, `HOOP_X` 10.1, `HOOP_Y` 3.05, `THREE_PT_RADIUS` 5.4.

## API

```ts
import { JamSimulation, normalizeBotInput } from '@lawn/jam';
const sim = new JamSimulation(matchConfig, callbacks);   // callbacks: SimCallbacks
const idle = normalizeBotInput(null);
while (sim.phase !== 'finished') sim.step(1 / 60, idle, idle); // p1 / p2 input; bots drive the rest
```

- Sim: `JamSimulation`, `SimPlayer`, `SimBall`, `SimCallbacks`, `DunkState`.
- Types: `MatchConfig`, `MatchResult`, `PlayerBoxScore`, `GnomePlayerProfile`, `PlayerStats`, `Difficulty`, `OpponentMode`, `DunkStyle`, `AnnouncerEvent`, `PlayerControlInput`.
- Balance: `DEFAULT_BALANCE_CONFIG`, `ORIGINAL_BALANCE_CONFIG`, `SimBalanceConfig`.
- Court: `COURT_HALF_X`, `COURT_HALF_Z`, `HOOP_X`, `HOOP_Y`, `THREE_PT_RADIUS`.
- Bots: `createClassicBot`, the pure preset bots (`createShoveHoundBot`, ...), `BotController`, `BotInput`, `GameStateSnapshot`, `captureGameState`, `normalizeBotInput`.
- `mulberry32(seed)`: seeded PRNG (the sim uses `Math.random`; wrap a match in a seeded `Math.random` for reproducible runs).

## Bot factory seam

Slots without an explicit bot are built by a swappable factory:

```ts
type BotFactory = (assignment: BotSlotAssignment | undefined, opts: CreateBotOptions) => BotController;
setBotFactory(f | null);
```

The default builds the classic bot for `undefined`/`'classic'`, the pure preset bots by id, and the classic bot for anything that needs a host (scripts, remote HTTP). GBA GJAM registers its own factory (Worker scripts, remote bot) at module load of `src/ai/index.ts`.

## Tests

`npm test -w packages/jam`, `npx tsc --noEmit -p packages/jam`.
