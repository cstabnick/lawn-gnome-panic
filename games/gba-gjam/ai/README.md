# GBA GJAM — Bot AI, Evaluation & Experimentation Framework

This directory (`games/gba-gjam/ai/`) holds the bot evaluation harness, experimentation process, saved experiment data, and external Python/ML tooling.
Because it sits outside `src/` and `public/`, Vite never bundles it into `dist/`, and `npm run site` / `deploy/site.Dockerfile` never include it in the production site image.

## Quick Start

```bash
# Fun-metrics scorecard (60 mirror matches + skill ladder + ablations + personas)
npm run eval:scorecard -w games/gba-gjam -- --n 60 --label x

# Run the 9-bot baseline round-robin (288 full 4-quarter matches, ~5s)
npm run eval:baseline -w games/gba-gjam

# Run all 5 designed strategy experiments (710 matches, ~13s)
npm run eval:experiments -w games/gba-gjam

# Render a 4x-speed tactical MP4 replay of any bot matchup & seed!
npm run replay -w games/gba-gjam -- --home shove-hound --away champion-v1 --seed 61000 --speed 4

# Run unit tests & production build
npm test -w games/gba-gjam && npm run build -w games/gba-gjam
```

## Key Documents & Results

- **[RESEARCH_ROUND_5.md](./RESEARCH_ROUND_5.md)**: playtest feedback round (pace, steal spam, inbound protection, blocks, pump fake, slower passes), `npm run eval:fakes`.
- **[RESEARCH_ROUND_4.md](./RESEARCH_ROUND_4.md)**: fun-metrics scorecard (`npm run eval:scorecard`), CRN knob sweep (`npm run eval:sweep`), the home-side bug and the feel retune.

- **[EXPERIMENT_PROCESS.md](./EXPERIMENT_PROCESS.md)** — The v2 7-step repeatable human workflow (possession telemetry, dual-league 60Hz/150ms evaluation, median/IQR stats, `sweepParameters`, and 4x MP4 film review).
- **[EXPERIMENT_PLAN_V2.md](./EXPERIMENT_PLAN_V2.md)** — Planned Wave 2 & 3 roadmap (**Experiments 6–12**) aimed at dethroning `shove-hound` with `champion-v2` and testing the Human-Fair 150ms League & mixed duos.
- **[PROCESS_RETROSPECTIVE.md](./PROCESS_RETROSPECTIVE.md)** — Analysis of Wave 1 results and the problems that drove the v2 process upgrades.
- **[results/baseline/REPORT.md](./results/baseline/REPORT.md)** — 9-bot baseline leaderboard, Elo ratings, and head-to-head matrix (`leaderboard.json` + `matches.csv` alongside it).
- **[results/experiments/INDEX.md](./results/experiments/INDEX.md)** — Summary index linking all 5 experiment reports (`exp1` through `exp5`, each with `REPORT.md` + `results.json`).

## Built-in Bot Roster (`src/ai/bots/`)

All bots implement `BotController` (`src/ai/types.ts`) and are selectable directly in GBA GJAM's **Exhibition → 🧠 Bot AI** menu as well as in the headless evaluation harness:

| Bot ID | Name | Strategy Archetype |
|---|---|---|
| `classic` | Classic Jam | Original built-in AI (balanced, human-paced steal probability) |
| `script-sniper` | Downtown Sniper | Sandboxed JS script hunting wing 3-pointers |
| `script-rusher` | Rim Rusher | Sandboxed JS script turbo-driving to the rim |
| `shove-hound` | Shove Hound | High-pressure turbo-shove defense + fast-break dunks (current #1 Elo) |
| `arc-architect` | Arc Architect | Pure 3PT floor spacing, drops turbo before shooting, contest-avoidance passing |
| `fire-feeder` | Fire Feeder | Hot-hand / ON FIRE streak specialist |
| `alley-oop-express` | Alley-Oop Express | Coordinated 2-man rim cuts and airborne alley-oop lobs |
| `lockdown-counter` | Lockdown Counter | Rim-protecting shot-blocker + transition counter-attack |
| `hybrid-ace` | Hybrid Ace | Stat-aware Expected-Value (EV) offense + configurable defense |
| `champion-v1` | Champion v1 | Synthesis candidate from Experiments 1–4 (#2 Elo, 85.2% RR) |

## Architecture

Every bot in `JamSimulation` (`src/sim.ts`) implements the generic `BotController` interface (`src/ai/types.ts`):

```ts
interface BotController {
  readonly id: string;
  readonly name: string;
  decide(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput;
}
```

### 1. GameState Access (`GameStateSnapshot`)

`captureGameState(sim)` produces a pure JSON-serializable snapshot every tick:

- `tick`, `phase` (`tipoff` | `live` | `scored` | `quarterBreak` | `finished`), `quarter`, `clockSec`, `shotClock`, `score: [home, away]`, `inboundTeam`
- `court`: `{ halfX, halfZ, hoopX, hoopY, threePtRadius }`
- `ball`: `{ pos: [x,y,z], vel: [x,y,z], carrier, mode, shooter, passTarget, isThreeAttempt, onFire, lastTouchTeam }`
- `players[0..3]`: `{ index, team, name, pos: [x,y,z], vel: [x,y,z], facing, grounded, turbo, streak, onFire, stunTimer, shoveTimer, stealCooldown, isShooting, shootHold, isDunking, stats }`

In the browser, `window.__GBA_JAM__` also exposes:
- `getGameState()` — returns the current `GameStateSnapshot` (or `null` outside a match)
- `setBot(slot, botController)` — hot-swaps any player slot (`0..3`) at runtime

### 2. Sandboxed JavaScript Bot Scripts

User/custom JS bot scripts run inside an **isolated Web Worker** (`src/ai/scriptLoader.ts`) rather than main-thread `eval()`:
- No access to `window`, `document`, `localStorage`, `sessionStorage`, `fetch`, `WebSocket`, `XMLHttpRequest`, or `indexedDB`
- Enforces a per-tick watchdog timeout (default `250ms`) so infinite loops are terminated safely
- Built-in example scripts live in `src/ai/scripts/`:
  - `classic-jam.js`
  - `downtown-sniper.js`
  - `rim-rusher.js`

### 3. Python POC (`poc_bot.py`)

Run the zero-dependency Python 3 policy server:

```bash
python games/gba-gjam/ai/poc_bot.py
```

Then in GBA GJAM:
1. Go to **Exhibition -> 🧠 Bot AI**
2. Set Home or Away bots to **Python / Remote HTTP** (`http://127.0.0.1:8765/decide`)
3. Optionally choose **📺 Bot vs Bot** to watch Python play against Classic Jam AI!
