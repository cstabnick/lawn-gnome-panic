# GBA GJAM — Future Research Plan (Wave 3+: Post-Balance Meta)

With `DEFAULT_BALANCE_CONFIG` promoted ([src/balance.ts](../src/balance.ts), Health `98.2` at 150ms / `93.2` at 60Hz), the degenerate 93% 3PT and 100% turbo-shove loops are resolved. This plan outlines the next 4 research tracks to deepen gameplay balance and AI quality.

---

## Track 1: Alley-Oop Counterplay & Pass-Interception Physics (Balance Round 4)
- **Observed Gap:** In the balanced 150ms leaderboard ([results/balance/REPORT.md](./results/balance/REPORT.md)), `alley-oop-express` jumped to **#1 (87.5%, 19.8 alley-oops/g)** because passes are 100% uninterceptable and alley-oops bypass normal contest/block windows.
- **Hypothesis:** Adding tunable `passInterceptRadius` / `passInterceptChance` (when a defender stands between passer and receiver) and `alleyOopBlockChance` to `SimBalanceConfig` will bring `alley-oop-express` from `87.5%` down into the `60–75%` parity band without killing lobs.
- **Success Gate:** `alley-oop-express` stays top-3 (`>= 60%` win rate) while `3P` / `hybrid` / `lockdown` bots remain competitive (`>= 45%`), maintaining Health Score `>= 95`.

---

## Track 2: Re-Evolving `champion-v3` on Balanced Physics
- **Observed Gap:** `champion-v2` was tuned for the pre-balance 60Hz meta (`quickRelease: true`, `threeEvThreshold: 2.05`), which now incurs `earlyReleasePenalty: 0.28` and `contestScale: 1.4`.
- **Hypothesis:** Re-running `sweepParameters()` against the balanced 9-bot field with **strict apex 3PT timing**, **opportunistic alley-oop lobs**, and **loose-ball chase** after `shoveKnocksLoose: true` will produce a `champion-v3` that reclaims #1 Elo in both 150ms and 60Hz leagues.
- **Success Gate:** Beats `alley-oop-express` and `champion-v2` H2H (`> 55%` over `N >= 20`, positive `medianDiff`) in the balanced 150ms league.

---

## Track 3: Cross-Roster Archetype Parity (`shooter` / `dunker` / `pro-teams`)
- **Observed Gap:** Rounds 1–3 tuned on `balanced` rosters (where `arc-architect` scored `18.8%` at `39.8%` 3P%).
- **Hypothesis:** Evaluating `DEFAULT_BALANCE_CONFIG` across `shooter`, `dunker`, and `pro-teams` rosters will verify whether 90-3PT rosters reward `arc-architect` / `hybrid-ace` spacing or if `threeStatScale` / `contestScale` need a light bump (`+0.004` stat scale) so elite shooters separate from average shooters.
- **Success Gate:** `arc-architect` wins `>= 55%` on `shooter` rosters; `alley-oop-express` / `shove-hound` lead on `dunker` rosters; `hybrid` / `champion` lead on `balanced` and `pro-teams`.

---

## Track 4: Difficulty-Tiered Human-Fun AI (`rookie` / `pro` / `allstar`) & RL Self-Play
- **Observed Gap:** Built-in `classic` improved from `1.6 PPG` to `24.2 PPG` after balance tuning, but still went `0-32` against strategic bots because of its artificial random steal throttle.
- **Experiments:**
  1. **Tiered Cadence Bots:** Map `rookie` (`280ms` cadence + `hybrid-ace` / `classic`), `pro` (`180ms` cadence + `hybrid-ace`), and `allstar` (`120ms` cadence + balanced `champion-v3` / `alley-oop-express`) and verify human-realistic scorelines.
  2. **Multi-Agent RL / Joint 2-Gnome Coordination ([poc_bot.py](./poc_bot.py)):** Train a centralized 2-gnome policy on `DEFAULT_BALANCE_CONFIG` for coordinated pick-and-roll screens, alley-oop timing, and `streak === 2` On-Fire denial.
