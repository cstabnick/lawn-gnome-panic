# GBA GJAM — Experimentation Process Retrospective & Path to Champion v2

After building 7 new bots, running a 288-match baseline round-robin, and executing 5 structured experiments (**998 total full 4-quarter matches** at 60Hz), here are our finalized thoughts on the experimentation process itself — what worked, what surprised us, what needs tightening, and how to use this system to build a true Champion.

---

## 1. What Worked Really Well in the Process

1. **Deterministic 60Hz Headless Simulation Is a Superpower.**
   - Running ~710 full 4-quarter matches took **12.87 seconds** (~18ms per game). That speed turns strategy design from "guess and eyeball one match in the browser" into a tight scientific loop where you can test a hypothesis with statistical rigor in seconds.
   - Mulberry32 seeded RNG (`withSeededRandom`) makes every single match 100% reproducible, so regressions and improvements are completely auditable.

2. **Measuring Mechanism Metrics (Not Just W/L) Prevented False Conclusions.**
   - In **Experiment 3**, win rate alone said `Apex OFF` beat `Apex ON` (72.2% vs 66.7%). Looking at the mechanism metrics (`3P%`: 95.2% vs 95.8%, `3PA/g`: **80.2 vs 56.9**, `PPG`: **229.0 vs 164.0**) immediately explained *why*: on a 90-3PT shooter, quick-release only lost 0.6pp of accuracy while gaining **+41% shot volume/tempo**!
   - In **Experiment 4**, `Funnel ON` didn't just lose the gauntlet (16–32 vs 35–13) — its **On-Fire/g actually dropped** from `2.2` to `0.8`! Without tracking `avgFire`, we might have assumed "On-Fire isn't valuable," when the real cause was that **passing into traffic during pass-flight lets shove defenders steal the ball and break streaks**.

3. **Strict Champion Promotion Gates Saved Us from Shipping a False Champion.**
   - `champion-v1` climbed to **#2 overall (Elo 2020, 46–8, 85.2% RR)** and crushed 8 of the 9 baseline bots (**46–2**). Without our explicit promotion gate (`>55%` H2H vs prior #1 `shove-hound` + `>60%` pro-teams gauntlet), it would have been tempting to declare victory. The gate rightly flagged **`ITERATE`** because `shove-hound` still beat `champion-v1` 19–1.

4. **Side-Swapping + Cross-Roster Validation Exposed Overfitting.**
   - Experiment 1 proved `hybrid-ace` generalized across Shooter (95.8%), Dunker (79.2%), and Balanced (91.7%) rosters, whereas pure `arc-architect` collapsed to 8.3% on Dunker rosters.
   - Experiment 5's `pro-teams` check showed `champion-v1`'s win rate dropped from 85.2% (balanced) to 53.1% (pro-teams top-4), highlighting that asymmetric stat rosters change which skills matter most.

---

## 2. Biggest Strategic Discoveries About GBA GJAM's Real Meta

The data revealed a clear hierarchy of mechanics in `src/sim.ts`:

1. **Turbo-Shove Is King (Exp 2):** Because `tryStealOrShove` with turbo (`>= 22`) is a **100% guaranteed turnover + 0.85s stun** with no foul limit and only a `0.55s` cooldown, `Relentless Shove` beat `Balanced Shove` (7–5), crushed `Steal-Poke Only` (12–0), and annihilated `Passive` (12–0).
2. **Tempo + Shove-Immunity Beats Marginal Shot-EV (Exp 3 & 5):**
   - `shove-hound` averages **198.9 PPG** and **99.4 dunks/g** (~100% FG) because once a player triggers a dunk (reachable from **~6.2m out** with turbo!), `sim.ts` makes them **100% immune to shoves** (`if (opp.dunk) continue`).
   - Any offense that hesitates—whether hunting a wing 3PT spot, waiting for jump-shot apex, or passing laterally—gives a relentless shover the 0.3–0.5s needed to close within `1.65m` and force a turnover.
3. **Classic Built-in AI Is Artificially Throttled:** `classic` went 0–64 in baseline largely because it gates steals behind `Math.random() < 1.6 * diffScale * ctx.dt` instead of acting immediately when in range. That's great for human playability, but it means `classic` is not a useful benchmark for competitive bot development—`shove-hound` and `hybrid-ace` are the real sparring partners.

---

## 3. Refinements to Make the Process Even Stronger

As you continue using this framework to devise new strategies, consider these upgrades to the process:

1. **Add Possession-Level Telemetry (`turnoversLost`, `shovesSuffered`, `avgPossessionSec`).** Right now we see `steals` and `shoveTurnovers` for the defense, and we can infer tempo from `PPG` and `FGA`, but directly logging `shovesSuffered` and `avgPossessionSec` per bot will make offensive vulnerability immediately obvious.
2. **Track a "Human-Fair" League Alongside the "Unrestricted" League.** Because unrestricted bots can press shove on the exact tick `d < 1.65` with zero reaction delay, the unrestricted meta is hyper-fast (~200 PPG). If you also want bots that are fun to play *against* as a human, add a separate **Reaction-Limited League** (e.g., 150ms decision cadence) alongside the **Unrestricted Champion League**.
3. **Automate Parameter Sweeps & Evolutionary Search.** Now that `runSeries` runs 20 games in ~0.35s, you can wrap any parameterized bot in a grid search or CMA-ES / evolutionary loop (or connect `ai/poc_bot.py` for RL) and still validate the winner through the exact same 6-step Experiment Card & Promotion Gate!
4. **Watch Out for Mirror-Match Snowballing.** In high-shove matchups (`shove-hound` vs `champion-v1`), whoever gets the first 2–3 stops builds an On-Fire + turbo advantage and snowballs to +150 point margins. Using `N >= 20` games and inspecting **median** diff alongside **mean** diff helps prevent one blowout from distorting analysis.

---

## 4. Recommended Next 5 Experiments to Create `champion-v2` (and Beat `shove-hound`!)

Everything in Experiments 1–5 points directly at how to dethrone `shove-hound` (`Elo 2165`):

- **Experiment 6: Inbound & Transition Anti-Shove Blitz.**
  - *Hypothesis:* `shove-hound` scores most of its steals right after inbound (`x = -9.1`). If the inbounder immediately sprints to the opposite sideline OR executes a **forward lead-pass** to the teammate (who starts 4m ahead at `baseX + 4.0`!) on tick 1 of inbound, the receiver starts beyond midcourt and reaches `dunkReach` before `shove-hound` can make contact.
- **Experiment 7: Quick-Release 3PT vs. Immediate Turbo-Dunk (Removing Hesitation).**
  - *Hypothesis:* Applying Exp 3's finding (`quick-release` instead of apex-wait) to `champion-v1` and banning lateral wing-hunting when a defender is within `4.0m` will cut turnovers against `shove-hound` by >50% and lift PPG above 180.
- **Experiment 8: Pre-Emptive Off-Ball Shoving & Screen Disruption.**
  - *Hypothesis:* On defense, having the secondary defender aggressively turbo-shove the *off-ball* opponent (threshold `turbo >= 30` instead of `52`) removes the opponent's pass outlet and forces 1v2 traps.
- **Experiment 9: Dunk-Reach Spacing Geometry (Maximizing 6.2m Launch Windows).**
  - *Hypothesis:* Instead of steering to `hx - dir * 0.9` (under the basket), steering along the shortest vector to the **outer perimeter of `dunkReach`** (`dHoop <= dunkReach - 0.15`) while curving *away* from the closest defender triggers shove-immune dunks 0.3–0.5s sooner.
- **Experiment 10: Parameter Optimization (`champion-v2`) via Automated Search + Promotion Gauntlet.**
  - *Hypothesis:* Taking the winning mechanics from Exps 6–9 and running a seeded coordinate/evolutionary sweep over key thresholds (`shoveTurboMin`, `passThreatDist`, `threeEvThreshold`, `dunkLaunchMargin`), then validating on the full 10-bot + `pro-teams` promotion gauntlet, will produce a `champion-v2` that beats `shove-hound` `>65%` and claims #1 Elo.
