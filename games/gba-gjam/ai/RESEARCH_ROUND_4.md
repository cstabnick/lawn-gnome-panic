# Research round 4: fun metrics and a realistic-feel retune

Plan and issues: `docs/roadmaps/gba-gjam-fun-metrics.md`. Playbook: possession and trajectory stats (excitement index, leverage, lead changes, early-lead AUC), a skill ladder and ablation bench, common-random-number sweeps, Spearman knob-to-metric maps. All in TypeScript, no new dependencies.

Complaints: a touch too fast; the big slam dunk was unstoppable free points.

## Tools added

- `ai/events.ts` `recordMatch`: score, possession, pass and pooled on-fire shot logs per match.
- `ai/analytics.ts`: GEI, win-probability model, leverage, AUC, Cliff's delta / A12, Wilcoxon, Latin hypercube, Nash.
- `ai/bench.ts` + `ai/scorecard.ts`: `npm run eval:scorecard -w games/gba-gjam -- --n 60 --label x [--orig]`.
- `ai/sweep.ts`: `npm run eval:sweep -w games/gba-gjam -- --configs 60 --seeds 12 --label x` (edit `SWEEP_KNOBS` per round).
- New sim knobs: `moveSpeedScale`, `dunkWindupSec`, `dunkContestRadius`, `dunkContestFailChance`, `dunkFireContestable`, `dunkLandingRecoverySec`.

## Lessons

1. **The sim had a home-side bug.** Same-bot mirror matches were won by the home team 70-97% (about 34 vs 15 points). Cause: players updated in fixed order 0..3, so the home team always acted first (loose balls, steals). Away got a smaller share of the ball and dunks, and a human 2P/online guest on the away side was handicapped too. Fix: alternate the update order each tick (`sim.ts`), regression test in `sim.test.ts`. After the fix every bot sits near 50%. Lesson: run a mirror match before trusting any other metric.
2. **Superhuman bots hide the problem.** The 60 ms "strong" bot rushed the rim regardless of dunk reach (51% of scores were dunks). The scorecard now fits mirror metrics on the 150 ms tier, the human-fair proxy.
3. **Dunk share is almost one knob.** `dunkBaseReach` vs dunk share: Spearman 0.92. Reach 2.8 -> 1.9 puts dunks at about 25% of scores. The contest knobs mostly change who wins a dunk, not how many are tried.
4. **Possession length and passing are driven by shove turnovers.** `shoveTurnoverChance` vs possession seconds: rho -0.80, vs passes: -0.76. If shoving the carrier usually strips the ball, nobody holds it long enough to pass.
5. **Skill depth trades against flow.** Cutting shove turnover to 0.12 gave the best flow but strong vs weak fell to 43%: fast reactions were being paid for by shove steals. 0.25 keeps skill at 72%.
6. **Slower is not free.** A slower `moveSpeedScale` raises passes per possession (rho -0.58) and lowers points; 0.78 plays visibly calmer than 1.0 while keeping 35 points a team.

## Scorecard (n=60, 150 ms mirror, seeds 10000+)

| Metric | Original v1 | Prior default | **New default** | Target |
|---|---:|---:|---:|---|
| Points per team | 97.3 | 40.2 | **34.9** | 30-60 |
| Dunk share | 89% | 34% | **24.9%** | 10-25% |
| Possession s | 0.90 | 2.26 | **2.56** | 4-9 (miss) |
| Passes / possession | 0.47 | 0.84 | **1.01** | 1.5+ (miss) |
| Lead changes | 0.78 | 2.35 | **3.15** | 4+ (miss) |
| Early-lead AUC @50% | 0.997 | 0.86 | **0.88** | <0.85 (miss) |
| Median GEI | 0.51 | 2.69 | **2.25** | 3-7 (miss) |
| Strong vs weak | 100% | 93% | **72%** | >70% |
| Garbage-time share | 82% | 30% | **31%** | <35% |

Promoted changes: `moveSpeedScale 0.78`, `dunkBaseReach 1.9`, `shoveTurnoverChance 0.25`, `stealBaseChance 0.26`, plus the contest/windup/recovery defaults from the roadmap.

## What is still wrong

- **Alley-oop-express now dominates the persona field** (Nash weight 1.0, 88-94% against most others). Passes cannot be intercepted. Next round: `passInterceptChance` / `alleyOopBlockChance` (see RESEARCH_PLAN_V3 Track 1).
- **Possessions stay short (2.6 s) and passes low (1.0).** The knobs do not move this much; the bots shoot early. It needs a pass-first persona bot, or a pass-rewarding mechanic (open-teammate shot bonus), not more tuning.
- Median GEI and early-lead AUC are borderline. Score-step win-probability paths are coarse because few baskets are scored; a clock-sampled WP trace would be better.
- Persona Nash entropy is 0 (one dominant persona); see above.

## What bots cannot tell us

Whether the slower speed feels good, whether the visible dunk gather reads as "I can stop that", and whether passing feels worth it. Bots measure structural health; a human playtest decides. Try `npm run dev -w games/gba-gjam` (http://localhost:5201), play a few quarters against Pro AI, and say whether it should be slower still or whether dunks need more or less counterplay.
