# Blackjack strategy simulation

Finds the optimal **hit / stand** decision for every hand and the optimal **split / don't split** decision for every pair, against every dealer upcard, and checks the result with a Monte Carlo simulation of hands from a 6-deck shoe.

No dependencies. Node 18+.

```
node tools/blackjack-sim/simulate.mjs              # 500k hands per policy
node tools/blackjack-sim/simulate.mjs --hands=2000000 --seed=7
```

Output in `tools/blackjack-sim/results/`:

| File | What |
| --- | --- |
| `strategy-hit-stand.csv` | Stand EV, hit EV and optimal action for every hard/soft total × dealer upcard |
| `strategy-split.csv` | Split EV (total bet), no-split EV and decision for every pair × dealer upcard |
| `policy-ev.csv` | Monte Carlo EV per hand for each policy |
| `chart-hit-vs-stand.svg` | Hit vs stand EV by hard total, one panel per dealer upcard |
| `chart-split-vs-nosplit.svg` | Split vs no-split EV by pair, one panel per pair rank |
| `chart-policy-ev.svg` | Monte Carlo EV per hand by policy, ±2 standard errors |

## Method

1. **Exact (infinite deck).** Dynamic programming over hand states. Dealer distribution is computed recursively from the upcard. `value(hard, ace, upcard)` is the best of standing or hitting once and then playing optimally. A pair's split EV is two independent hands, each played optimally, with no re-split. Split aces get one card each.
2. **Monte Carlo (6-deck shoe).** Reshuffled at 75% penetration, same seed for every policy so they see the same cards. For each dealt hand the code also computes the DP's predicted EV, which lets the simulation check the table against realized results.

## Rules modelled

- Dealer stands on all 17s (S17). There is no dealer peek: a natural is just 21.
- Blackjack pays even money, not 3:2, so naturals are not a separate outcome. This is the main reason the house edge here (about -4%) is worse than textbook basic strategy (about -0.5%).
- No doubling, no double after split, no surrender, split at most once.
- Payout per unit bet: win +1, lose -1, push 0.

## Results (default run, 300k hands per policy, seed 1)

Optimal hit/stand decisions (H = hit, S = stand), hard totals:

- Hard 12: hit vs 2, 3, 7–A; stand vs 4–6.
- Hard 13–16: stand vs 2–6, hit vs 7–A.
- Hard 17+: always stand. Hard 11 and under: always hit.
- Soft 18 (A,7): stand vs 2–8, hit vs 9, 10, A.

Pairs (P = split, otherwise play the hand as shown above):

- A,A: split vs 2–10, hit vs A.
- 2,2 and 3,3: split vs 4–7 (hit vs 2, 3, 8–A).
- 4,4 and 5,5: never split.
- 6,6: split vs 3–6 (hit vs 2, 7–A).
- 7,7: split vs 2–7 (hit vs 8–A).
- 8,8: split vs 2–9 (hit vs 10, A) — the DP prefers hard 16 vs 10 over splitting here, under these rules.
- 9,9: split vs 2–6, 8, 9 (stand vs 7, 10, A).
- 10,10: always stand.

Monte Carlo EV per hand (300k hands each):

| Policy | EV / hand |
| --- | --- |
| Optimal (hit/stand + split) | -0.040 ± 0.002 |
| Optimal hit/stand, never split | -0.045 ± 0.002 |
| Hit to 17 | -0.078 ± 0.002 |
| Always stand | -0.188 ± 0.002 |

The infinite-deck DP predicts -0.043 for the same dealt hands. The 6-deck simulation gives -0.040, within about two standard errors.

Splitting is worth about 0.5 percentage points per hand under these rules. Standing on everything is far worse than any table-based policy.

## Limits

- Infinite-deck tables ignore card removal and cannot be used to count cards.
- No doubling, surrender or 3:2 blackjack payout. Adding those would change the numbers and the tables.
- Only the optimal policy is compared directly with the DP prediction. The other policies are only compared against each other.
