# Gnomylpics

The Gnome Olympics: six quick events for four gnomes, played only inside [Gnome Party](../gnome-party/). This is a **party-only** game (`"lawn": { "partyOnly": true }` in `package.json`): it is not on the landing page and has no game loop of its own; it only surfaces party slices from `src/minigames/`.

Question it answers: do two-key, everyone-at-once track events (and a rhythm jam) make good party minigames?

## Events

| Slice | Event | How |
|---|---|---|
| `oly-sprint` | Gnome Sprint | 100 m. Alternate A and D; the same key twice is a stumble (face-plant, speed lost, taps ignored briefly). |
| `oly-triple-jump` | Triple Gnome Jump | Run up, JUMP before the red line, then JUMP as you land: hop, skip, jump. Best of 2. |
| `oly-mower-toss` | Mower Toss | Alternate to spin the mower, THROW when the needle is near 45°. Best of 2. |
| `oly-lawn-dart` | Lawn Dart Javelin | Run up, hold THROW to aim, release before the foul line. Best of 2. |
| `oly-grass-mow` | Grass Mowing | Steer a mower on a shared lawn; every patch you cut first is yours. 40 s. |
| `oly-gnome-hero` | Gnome Hero | A random beat-driven 4-lane jam (A S D F or arrows). Every gnome's hits play notes. |

## Run

```
npm run dev -w games/gnomylpics      # http://localhost:5192 lists the events; #minigame=<id> plays one vs 3 CPUs
npm test -w games/gnomylpics         # slice contract tests + unit tests
npm run dev -w games/gnome-party     # the events turn up in the party (#mini=<id> loops one)
```

## Code

- `src/minigames/oly-*.ts`: one event each (rules + view). `src/minigames/index.ts` lists them.
- `src/olympic/run.ts`: the alternating-tap model (speed, stumble, CPU tapper). `taps.ts`: keyboard / touch tap input. `field.ts`: the stadium kit (track, gnomes, camera, scoreboard). `rank.ts`: places.
- `src/hero/`: Gnome Hero's seeded chart and its WebAudio jam.

Tuning numbers sit at the top of each file. Plan: `docs/roadmaps/gnomylpics.md`.
