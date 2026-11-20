# GBA GJAM — Bot Strategy Experimentation Process (v2)

This document defines the **repeatable human workflow** for devising, testing, visually inspecting, analyzing, and promoting bot strategies in GBA GJAM (`games/gba-gjam`) to iteratively build a **Champion** bot.

> **v2 Upgrades (addressing `PROCESS_RETROSPECTIVE.md`):**
> 1. **Possession-Level Telemetry:** Tracks `possessions`, `avgPossessionSec`, `ppp` (Points Per Possession), `shovesSuffered`, and `turnoversLost` so offensive vulnerability and tempo are directly visible.
> 2. **Dual-League Evaluation:** Supports both **Unrestricted 60Hz League** (`decisionCadenceMs: 0`) and **Human-Fair League** (`decisionCadenceMs: 150`, simulating 150ms human reaction cadence via `wrapWithReactionCadence`).
> 3. **Snowball-Resistant Statistics:** Reports **Median Point Differential (`medianDiff`)** and **IQR (`p25..p75`)** alongside mean `avgDiff` so a single On-Fire blowout doesn't skew analysis.
> 4. **Automated Parameter Sweeps:** Provides `sweepParameters()` in `src/ai/eval.ts` for deterministic grid/coordinate search before running a full promotion gauntlet.
> 5. **4× Speed MP4 Visual Replay Inspection:** Every experiment or matchup can render a 4×-speed tactical MP4 (`npm run replay -w games/gba-gjam`) so you can *watch* why a bot won or lost after the fact.

---

## Core Principles

1. **Hypothesis First, Code Second.** Never tweak constants blindly. Every experiment starts with a written causal hypothesis linking a specific game mechanic in `src/sim.ts` to a predicted shift in both a *mechanism metric* (e.g., `shovesSuffered`, `ppp`, `avgPossessionSec`, `3P%`) and *win rate*.
2. **Isolate One Variable.** Lock defense when testing offense; lock offense when testing defense. Use typed option flags on existing bots for clean A/B and factorial ablations.
3. **Eliminate Environmental Bias.**
   - **Side-swapping:** Every series alternates Home/Away every game so tip-off order and court direction cancel out.
   - **Deterministic seeds:** `withSeededRandom(seed)` makes every match 100% reproducible—including its 4× MP4 replay!
   - **Roster control:** Primary A/B tests run on **mirrored balanced rosters** (`balanced`); Champion candidates must also generalize across `shooter`, `dunker`, and `pro-teams`.
4. **Measure Beyond Mean Win/Loss.** Always inspect:
   - **Win% + 95% Wilson CI**
   - **Mean AND Median Point Diff + IQR `[p25, p75]`** (guards against snowballing outliers)
   - **Possession Economics:** `PPP` (Points Per Possession), `avgPossessionSec` (tempo), `shovesSuffered`, `turnoversLost`
   - **Box-Score Mechanics:** `FG%`, `3P% (3PA)`, `Dunks/g`, `Steals (Shove TO)/g`, `Blocks/g`, `On-Fire/g`, `Alley-Oops/g`
5. **Watch the Film (4× MP4 Replay).** Whenever a hypothesis fails or surprises you (e.g., `shove-hound` beating `champion-v1`), render a 4× MP4 of a representative seed (`npm run replay -w games/gba-gjam -- --home shove-hound --away champion-v1 --seed 61000 --speed 4`) to inspect positioning, turbo bars, stun rings, and spacing directly.
6. **Version & Archive Everything.** Every run writes `results.json` + `REPORT.md` under `games/gba-gjam/ai/results/experiments/expN-<slug>/`. Never overwrite past experiments.

---

## The 7-Step Experiment Loop

```text
  1. OBSERVE & WATCH FILM
        │  Read telemetry (PPP, shovesSuffered, medianDiff) + watch 4x MP4 replay
        ▼
  2. HYPOTHESIZE & FILL EXPERIMENT CARD
        │  Pick League (Unrestricted 60Hz vs Human-Fair 150ms), control, N, success gate
        ▼
  3. IMPLEMENT ISOLATED VARIANT (or Parameter Grid)
        │  Add typed option flags or new BotController in src/ai/bots/
        ▼
  4. RUN DETERMINISTIC HARNESS (or sweepParameters)
        │  npm run eval:experiments -w games/gba-gjam
        ▼
  5. DIAGNOSE NUMBERS + WATCH OUTLIER REPLAY
        │  Check medianDiff, IQR, PPP, shovesSuffered; render 4x MP4 of a key loss/win
        ▼
  6. DECIDE: PROMOTE / ITERATE / REJECT
        │  Apply Champion Promotion Criteria below
        ▼
  7. LOG NEXT HYPOTHESIS
           Record what broke or surprised you -> feed back into Step 1
```

---

## Dual-League Policy

Because unrestricted 60Hz bots can trigger `tryStealOrShove` on the exact frame `d < 1.65`, we evaluate strategies in two distinct leagues:

| League | Setting | Purpose |
|---|---|---|
| **Unrestricted Champion League** | `decisionCadenceMs: 0` (60Hz) | Maximum-strength AI research, pure mechanical optimization, bot-vs-bot championship. |
| **Human-Fair League** | `decisionCadenceMs: 150` (~6.7 Hz) | Realistic reaction-time bots that are fun and fair to play *against* as a human player. |

---

## Champion Promotion Criteria (v2)

A candidate `champion-v(N+1)` replaces the current Champion in its league only if **ALL** of the following hold:
1. **#1 Elo:** Ranks #1 in the full round-robin Elo ladder on balanced rosters.
2. **Head-to-Head vs. Prior Champion:** Beats the prior Champion with `> 55%` win rate **AND** positive `medianDiff` over `N >= 20` side-swapped games.
3. **Cross-Roster Robustness:** Maintains `> 60%` aggregate win rate across `pro-teams` rosters (not overfit to one stat profile).
4. **Film Check:** At least one 4× MP4 replay inspected to confirm wins come from intended strategy rather than an unintended sim glitch.
5. **Zero Regressions:** Passes `npm test -w games/gba-gjam` and `npm run build -w games/gba-gjam`.

---

## Experiment Card Template (v2)

```markdown
### Experiment N: <Short Title>
- **League:** `Unrestricted (60Hz)` | `Human-Fair (150ms)` | `Both`
- **Question:** What strategic or mechanical question are we answering?
- **Hypothesis:** If we change <X>, then <mechanism metric: e.g. shovesSuffered / PPP / avgPossessionSec> will move <direction>, lifting Win% and medianDiff vs control.
- **Control:** `<bot-id>`
- **Treatment(s):** `<variant-1>`, `<variant-2>`, ... (or `sweepParameters` grid)
- **Controlled Variables:** 4×45s quarters, 60Hz sim (`dt = 1/60`), `pro` difficulty, side-swapped Home/Away, deterministic seed base `<seed>`, roster mode `<balanced|shooter|dunker|pro-teams>`, `N = <even>`.
- **Success Criteria:** <Win%, medianDiff, and mechanism metric thresholds>
- **Replay Seed(s) to Watch:** `--home <A> --away <B> --seed <S> --speed 4`
- **Result Summary & Decision:** `PROMOTE` / `ITERATE` / `REJECT`
```

---

## Quick Commands

```bash
# Run 9-bot baseline round-robin (288 matches)
npm run eval:baseline -w games/gba-gjam

# Run experiments suite
npm run eval:experiments -w games/gba-gjam

# Render a 4x-speed tactical MP4 replay of ANY bot matchup & seed!
npm run replay -w games/gba-gjam -- --home shove-hound --away champion-v1 --seed 61000 --speed 4

# Verify unit tests & production build
npm test -w games/gba-gjam && npm run build -w games/gba-gjam
```
