# GBA GJAM — Wave 2 & 3 Experimentation Retrospective (Experiments 6–15)

Across **Experiments 6–15** (**4,850 full 4-quarter matches** across **Unrestricted 60Hz** and **Human-Fair 150ms** leagues), we broke `shove-hound`'s 2165 Elo reign, **promoted `champion-v2` (Elo 2211)**, tested `champion-v3`, and ultimately hit a clear **strategic & mechanical plateau** where further heuristic/threshold tweaks failed to produce statistically meaningful gains.

---

## 1. Key Breakthroughs & Results Summary

1. **Quick-Release 3PT Eliminated the Shove Window (Exp 7):**
   - Switching from strict apex release (`vel.y <= 0.35`) to quick-release (`shootHold >= 0.06`) flipped `champion-v1` vs `shove-hound` from **4–16** (`-157.5` medDiff, `0.29` PPP) to **13–7** (`+101.0` medDiff, `1.25` PPP) on balanced rosters, and **14–6** on shooter rosters.
2. **Full-Court 2v1 Pinching > Off-Ball Shoving (Exp 8):**
   - Sweeping `offBallShoveTurboMin × doubleTeamRadius` showed that off-ball shoves waste 22 turbo on a non-carrier. Setting `offBallShoveTurboMin = Infinity` and `doubleTeamRadius = 11.0–14.0` achieved **32–4 (88.9%)** with `101.2 ShvTO/g`.
3. **Dunk-Reach Perimeter Geometry Beat Straight-Line Rim Drives (Exp 9):**
   - Steering to the safest point on the outer `dunkReach` perimeter cut `shovesSuffered` vs `shove-hound` from `96.8` to `28.4` (**15–5**, `+189.5` medDiff on balanced; **19–1**, `+188.5` medDiff on dunker), though it was neutral/negative when combined with high-volume 3PT bots in `champion-v2`.
4. **Automated `sweepParameters()` Promoted `champion-v2` (Exp 10):**
   - Synthesizing Exps 7–8 (`quickRelease: true`, `dunkPerimeter: false`, `passThreatDist: 1.85`, `threeEvThreshold: 2.05`, `doubleTeamRadius: 14.0`, `offBallShoveTurboMin: Infinity`) and validating on **unseen seeds (`90000+`)** passed all 3 quantitative promotion gates:
     - **#1/11 Elo (2211)**, **56–4 (93.3%)**, **262.4 PPG**, **2.30 PPP**, **0.38s/poss**, **11.9 ShvSuf/g**.
     - **12–8 (60.0%, +51.0 medDiff)** vs `shove-hound` on balanced rosters.
     - **23–9 (71.9%)** on the `pro-teams` cross-roster gauntlet.
5. **150ms Human-Fair League & Duo Synergy (Exps 11–12):**
   - Under 150ms human reaction cadence, `champion-v1` (Elo 2149, 51–9), `shove-hound` (2133, 51–9), and `champion-v2` (2127, 50–10) converged into a 3-way tie because 9-tick decision latency blunts frame-perfect 3PT quick-release and shoves.
   - On `pro-teams` at 150ms, the mixed duo **`ChampionV2(0) + ShoveHound(1)`** topped the leaderboard (**76.4%**, Elo 1720), beating both homogeneous `shove-hound` (75.0%) and `champion-v2` (72.2%).

---

## 2. Where & Why Progress Stopped (Exps 13–15)

1. **150ms Human-Fair Plateau (Exp 13):**
   - All 6 candidate upgrades (`inboundPass`, `mateDunkPass`, `wideSwat`, `dunkPerimeter`, `all`, `150ms-adapt`) went **exactly 10–10 (50.0%)** against `champion-v2` with bimodal snowball IQRs around **`[-215 .. +216]`**.
2. **`champion-v3` Failed H2H Gate (Exp 14):**
   - Adding `inboundPass + mateDunkPass` (`champion-v3`) scored #1/12 in the round-robin (Elo 2156, 59–7) and 24–8 (75.0%) on `pro-teams`, **but** only went **10–10 (50.0%, +1.0 medDiff)** H2H vs `champion-v2` on balanced and **9–11** vs `v3-all`.
3. **Threshold & Defense Variations Hit Noise Floor (Exp 15):**
   - Five counter-strategies (`early-pass`, `selective-3pt`, `tight-dbl`, `offball-shove`, `conserve-turbo`) all landed between **41.7% and 54.2%** (`10–14` to `13–11`) against `champion-v3`—statistically indistinguishable from 50/50 coinflips under bimodal On-Fire snowballing.

### Root Cause of the Ceiling
At the top end (`champion-v2` vs `champion-v3`), matches are **bimodal snowball coinflips** (`IQR [-220 .. +212]`):
- **0.38s/possessions + 93.6% 3PT + 100% guaranteed turbo-shove turnovers** mean whichever team wins the **tip-off or first 1–2 defensive stops** immediately builds an **On-Fire + infinite-turbo** feedback loop and runs away by +150 to +250 points.
- Once both teams execute optimal immediate 3PT/dunk launches and instant `d < 1.62m` turbo-shoves, **stateless single-frame heuristics have extracted ~100% of the available edge** in `src/sim.ts`.

---

## 3. Proposed New Areas to Research in the Problem Space

1. **Game-Balance & Sim-Mechanic Tuning (`src/sim.ts`):**
   - The biggest bottleneck to strategic depth is that `tryStealOrShove` with turbo is a **100% guaranteed turnover + 0.85s stun** with no foul/fatigue penalty, and `quickRelease` 3s still hit **~93%**.
   - Research how adding **shove cooldown/foul escalation**, **minimum jump-shot hold/arc penalty** for quick-release 3s, or **pass-interception physics** shifts the Nash equilibrium from 260 PPG 0.38s-possession blitzes back toward basketball spacing, pick-and-roll, and alley-oops.
2. **RL / Self-Play & Stateful Joint-Team Policies (`ai/poc_bot.py`):**
   - Current bots are stateless `decide(state, ctx)` functions acting independently per player.
   - Explore **multi-agent RL (PPO / self-play)** or **centralized 2-player coordination** (coordinated inbound screens, synchronized 2v1 trap angles, and *deliberate On-Fire streak denial* when an opponent is at `streak === 2`).
3. **Tip-Off & Snowball-Mitigation Research:**
   - Because `[-220..+212]` IQRs show tip-off and first-possession variance dominates H2H outcomes, study **tip-off positioning/timing** and **variance-reduced evaluation** (e.g., paired mirrored tip-off seeds or Elo across 50+ game sets) to separate true 2–3% edges from first-possession noise.
4. **Human-Fun & Adaptive Difficulty Bot Design:**
   - `classic` went `0–66` (Elo 284) because it is artificially throttled, while `champion-v2` scores 262 PPG at 60Hz.
   - Research **rubber-banding / expressive human-fun bots** at 150–250ms cadence that use alley-oops, blocks, and varied shot selection to create close, exciting games against human players rather than 200-point blowouts.
