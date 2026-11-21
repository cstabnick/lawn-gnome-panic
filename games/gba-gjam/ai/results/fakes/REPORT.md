# Fakes and steal-spam probes

n=80 side-swapped games per row, medium (150 ms) bots, 45 s quarters.

## Steal spam vs base (win rate of the spammer; should be below 50%)

| whiff stun (s) | spammer win rate |
|---:|---:|
| 0 | 52.5% |
| 0.25 | 50.0% |
| 0.45 | 56.3% |
| 0.7 | 50.0% |

## Faker vs waiter (same shot delay, no fake: isolates the fake itself)

| bite base chance | faker win rate vs waiter | faker vs base | waiter vs base | fakes/game | bite rate | reads/game |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 38.8% | 56.3% | 65.0% | 15.1 | 2% | 0.8 |
| 0.3 | 38.8% | 56.3% | 65.0% | 15.1 | 2% | 0.8 |
| 0.62 | 53.8% | 66.3% | 65.0% | 14.6 | 5% | 0.6 |
| 0.9 | 47.5% | 72.5% | 65.0% | 15.0 | 11% | 0.1 |

## Fake vs eager defender (design goal: a blind steal-spammer gets burned, a patient defender does not)

| offence | vs steal-spam defender | vs normal defender |
|---|---:|---:|
| faker (win rate) | 63.7% | 67.5% |
| waiter (win rate) | 56.3% | 57.5% |
