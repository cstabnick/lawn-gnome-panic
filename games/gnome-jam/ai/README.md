# GBA GJAM — Bot AI & ML Experimentation Framework

This directory (`games/gnome-jam/ai/`) holds external Python / ML tooling and documentation.
Because it sits outside `src/` and `public/`, Vite never bundles it into `dist/`, and `npm run site` / `deploy/site.Dockerfile` never include it in the production site image.

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
  - `classic-jam.js` (the original GBA GJAM AI encoded as a standalone script)
  - `downtown-sniper.js`
  - `rim-rusher.js`

### 3. Python POC (`poc_bot.py`)

Run the zero-dependency Python 3 policy server:

```bash
python games/gnome-jam/ai/poc_bot.py
```

Then in GBA GJAM:
1. Go to **Exhibition -> 🧠 Bot AI**
2. Set Home or Away bots to **Python / Remote HTTP** (`http://127.0.0.1:8765/decide`)
3. Optionally choose **📺 Bot vs Bot** to watch Python play against Classic Jam AI!
