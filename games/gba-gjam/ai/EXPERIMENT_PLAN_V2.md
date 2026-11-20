# GBA GJAM — Bot Strategy Experiment Plan (Wave 2 & 3: Experiments 6–12)

This roadmap defines the next **7 structured experiments** using the upgraded **v2 Experimentation Process** ([EXPERIMENT_PROCESS.md](./EXPERIMENT_PROCESS.md)), incorporating possession telemetry (`PPP`, `avgPossessionSec`, `shovesSuffered`), median/IQR point differentials, dual-league testing (`Unrestricted 60Hz` vs. `Human-Fair 150ms`), `sweepParameters()`, and 4× MP4 replay review.

Goal: **Dethrone `shove-hound` (Elo 2165) in the Unrestricted League with `champion-v2`**, and discover the true meta in the **Human-Fair 150ms League**.

---

## Experiment 6: Inbound & Transition Anti-Shove Blitz
- **League:** `Unrestricted (60Hz)`
- **Question:** Can an immediate inbound lead-pass or sideline sprint break `shove-hound`'s mid-court trap?
- **Hypothesis:** In `src/sim.ts`, `setupInbound` spawns the ball-handler at `x = -9.1` and the teammate 4.0m ahead at `x = -5.1`, while defenders start at `x = +2.2` and `+5.2`. Executing a **tick-1 forward lead-pass** to the teammate (or sprinting diagonally to the sideline before cutting in) will cut `shovesSuffered` against `shove-hound` by **>40%** and lift `champion-v1` win rate vs `shove-hound` from 5% to **>35%**.
- **Control:** `champion-v1` (drives straight from inbound)
- **Treatments:**
  - `exp6-inbound-pass`: Immediately passes forward on inbound when `|p.pos[0] + dir * 9.1| < 1.5` and teammate is ahead & clear.
  - `exp6-sideline-arc`: Sprints to `z = ±4.6` sideline to create lateral separation before cutting to `dunkReach`.
  - `exp6-pass-plus-arc`: Combines both.
- **Controlled Variables:** 4×45s, 60Hz, `pro`, side-swapped, `N = 20` vs `shove-hound` + `N = 12` vs `hybrid-ace`, balanced rosters, seed base `71000`.
- **Success Criteria:** `shovesSuffered` drops by ≥40% vs `shove-hound` and `medianDiff` improves by ≥+60 PPG.
- **Replay Seed to Watch:** `npm run replay -w games/gba-gjam -- --home exp6-inbound-pass --away shove-hound --seed 71000 --speed 4`

---

## Experiment 7: Quick-Release 3PT vs. Immediate Turbo-Dunk (Eliminating Hesitation)
- **League:** `Unrestricted (60Hz)`
- **Question:** Does applying Experiment 3's finding (quick-release jump shots) and banning lateral wing-hunting under pressure make `champion-v1` competitive against `shove-hound`?
- **Hypothesis:** Removing apex-wait (`shootHold >= 0.06` instead of `vel.y <= 0.35`) and switching to immediate rim-attack whenever any defender is within `4.5m` will cut `avgPossessionSec` by **>25%**, reduce `shovesSuffered`, and raise `PPP` vs `shove-hound` and `hybrid-ace`.
- **Control:** `champion-v1` (strict apex + wing-hunting for high-3PT players)
- **Treatments:**
  - `exp7-quick-release`: Quick-release 3PT only.
  - `exp7-no-wing-hunt`: Never detour to wing if defender `< 4.5m`; attack `dunkReach` directly.
  - `exp7-both`: Both combined.
- **Controlled Variables:** 4×45s, 60Hz, `pro`, side-swapped, `N = 20` vs `shove-hound` and `hybrid-ace`, balanced & shooter rosters, seed base `72000`.
- **Success Criteria:** Treatment beats Control H2H (`>60%`, positive `medianDiff`) and cuts `shovesSuffered` vs `shove-hound` by ≥30%.

---

## Experiment 8: Pre-Emptive Off-Ball Shoving & 2v1 Trap Defense
- **League:** `Unrestricted (60Hz)`
- **Question:** On defense, what is the optimal turbo threshold for the *secondary* defender to shove the off-ball opponent vs. pinching to double-team the ball-handler?
- **Hypothesis:** Aggressively shoving the off-ball receiver (`offBallShoveTurboMin = 28`) stuns the opponent's pass outlet for `0.85s`, preventing anti-shove pass-outs and increasing `shoveTurnovers` by **+15%/game** without hurting rim protection.
- **Control:** `shove-hound` (`offBallShoveTurboMin = 55`, double-team radius `6.0m`)
- **Treatments:** Parameter sweep across `offBallShoveTurboMin ∈ {24, 35, 55, Infinity}` × `doubleTeamRadius ∈ {5.0, 7.5, 11.0}`.
- **Controlled Variables:** 4×45s, 60Hz, `pro`, side-swapped, `N = 12` per matchup against `{shove-hound, champion-v1, hybrid-ace}`, balanced rosters, seed base `73000`.
- **Success Criteria:** Best config beats `shove-hound` H2H (`>55%`, positive `medianDiff`) while increasing total `shoveTurnovers/g`.

---

## Experiment 9: Dunk-Reach Perimeter Geometry (Earliest Shove-Immune Launch)
- **League:** `Unrestricted (60Hz)`
- **Question:** Does steering toward the *closest safe point on the `dunkReach` perimeter* (~6.2m from hoop) instead of steering toward the rim (`hx - dir * 0.9`) trigger shove-immune dunks sooner?
- **Hypothesis:** Once `startDunk()` fires, the dunker is 100% immune to shoves (`sim.ts:799`). Steering along a vector that maximizes clearance from the nearest defender while crossing `dHoop <= dunkReach - 0.1` will trigger dunks **0.25–0.45s earlier** per possession, reducing `shovesSuffered` and lifting `PPP`.
- **Control:** Straight-line drive to `hx - dir * 0.9` with simple Z-weave.
- **Treatment:** Tangent-avoidance vector steering toward the nearest unguarded arc point on radius `dunkReach - 0.2`.
- **Controlled Variables:** 4×45s, 60Hz, `pro`, side-swapped, `N = 20` vs `shove-hound`, balanced & dunker rosters, seed base `74000`.
- **Success Criteria:** Lower `avgPossessionSec`, lower `shovesSuffered`, and `>55%` win rate vs control.

---

## Experiment 10: Automated Parameter Search (`sweepParameters`) → `champion-v2` Promotion Gauntlet
- **League:** `Unrestricted (60Hz)`
- **Question:** Can we synthesize the winning mechanics from Experiments 6–9 and optimize their continuous thresholds via `sweepParameters()` to pass all 5 v2 Champion Promotion Criteria?
- **Hypothesis:** Optimizing `{ shoveTurboMin, passThreatDist, threeEvThreshold, dunkLaunchMargin, doubleTeamRadius }` via `sweepParameters()` against `{shove-hound, champion-v1, hybrid-ace, fire-feeder}` will yield a **`champion-v2`** that achieves **#1 Elo**, beats `shove-hound` **>60%** (positive `medianDiff`), and scores **>65%** across `pro-teams`.
- **Control:** Current #1 `shove-hound` & prior candidate `champion-v1`.
- **Treatment:** Top candidate from `sweepParameters()` validated on an *unseen* test seed range (`90000+`) to prevent overfitting to sweep seeds!
- **Success Criteria:** Passes all 5 v2 Promotion Criteria in `EXPERIMENT_PROCESS.md` (including 4× MP4 film inspection!).

---

## Experiment 11: Dual-League Meta Shift — Unrestricted (60Hz) vs. Human-Fair (150ms)
- **League:** `Human-Fair (150ms)` vs. `Unrestricted (60Hz)`
- **Question:** How does the entire 10-bot Elo hierarchy change when bots are restricted to human-realistic **150ms reaction cadence** (`decisionCadenceMs: 150`)?
- **Hypothesis:** At 150ms cadence, defenders cannot trigger frame-perfect turbo-shoves the instant `d < 1.65`, cutting `shoveTurnovers/g` by **>50%**. As a result, `shove-hound`'s dominance will shrink dramatically, and spacing/shooting/lob strategies (`hybrid-ace`, `arc-architect`, `alley-oop-express`, `champion-v1`) will rise to the top!
- **Setup:** Full 10-bot round-robin at `decisionCadenceMs: 150` (`6 games/pair = 270 matches`, seed base `75000`), directly compared side-by-side against the 60Hz Unrestricted 10-bot leaderboard from Exp 5.
- **Success Criteria:** Quantify Elo rank delta (`rank_150ms - rank_60Hz`) and `shoveTurnovers/g` drop for every bot; crown the inaugural **Human-Fair League Champion**.
- **Replay Seed to Watch:** `npm run replay -w games/gba-gjam -- --home shove-hound --away hybrid-ace --seed 75000 --cadence 150 --speed 4`

---

## Experiment 12: Asymmetric 2-Bot Duo Synergy (Mixed Teams)
- **League:** `Both (Unrestricted 60Hz & Human-Fair 150ms)`
- **Question:** Does pairing two *complementary* bot archetypes on the same team (e.g., Slot 0 = `shove-hound` enforcer + Slot 1 = `arc-architect` spacer, or `lockdown-counter` + `alley-oop-express`) beat homogeneous two-of-a-kind teams?
- **Hypothesis:** On asymmetric Pro rosters (e.g., Redcap Rockets: 90-3PT shooter + 90-dunk/90-def big), assigning a specialist bot to each player slot (`arc-architect` on the shooter + `shove-hound` on the big) will outperform homogeneous teams by matching decision policy to stat profile.
- **Controlled Variables:** 4×45s, `pro`, `pro-teams` rosters, side-swapped, `N = 12` per pair across 4 mixed duos vs top 3 homogeneous teams, seed base `76000`.
- **Success Criteria:** At least one mixed duo achieves >55% win rate and higher `PPP` than the best homogeneous team on `pro-teams`.
