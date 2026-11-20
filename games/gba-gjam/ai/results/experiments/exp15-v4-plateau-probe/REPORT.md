# Experiment 15: Next-Wave Counter-Strategies vs. Champion v3 (Plateau Probe)

## Experiment Card
- **League:** `Unrestricted (60Hz)`
- **Question:** Can any further threshold or defensive shift meaningfully beat `champion-v3` (>55% over N=24)?
- **Controlled Variables:** 4x45s, 60Hz, `pro`, side-swapped, `N=24` per candidate vs `champion-v3`, balanced rosters, seed base `110000`.

## Results vs. Champion v3 (N = 24 each)
| Candidate | W-L | Win% (95% CI) | Score | Mean Diff | Med Diff [IQR] | PPP | Poss(s) | ShvSuf | ShvTO |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Early Pass (passThreat=2.45) | 10-14 | 41.7% (24.5%–61.2%) | 104.2 – 126.0 | -21.8 | -140.0 [-202.3..204.3] | 1.22 | 0.70s | 44.6 | 37.3 |
| Selective 3PT (ev=2.45) | 12-12 | 50.0% (31.4%–68.6%) | 119.6 – 107.5 | +12.0 | -24.5 [-189.0..229.5] | 1.41 | 0.64s | 38.2 | 42.8 |
| Tight Double (dblR=9.0) | 13-11 | 54.2% (35.1%–72.1%) | 111.9 – 109.0 | +2.9 | +105.5 [-216.0..193.0] | 1.33 | 0.65s | 39.1 | 40.5 |
| Off-Ball Shove (offTurbo=40) | 12-12 | 50.0% (31.4%–68.6%) | 116.8 – 112.3 | +4.5 | +22.5 [-220.8..212.3] | 1.37 | 0.64s | 40.8 | 41.2 |
| Conserve Turbo (shoveMin=26) | 11-13 | 45.8% (27.9%–64.9%) | 105.2 – 112.8 | -7.6 | -63.5 [-197.5..193.3] | 1.25 | 0.68s | 40.9 | 37.4 |
