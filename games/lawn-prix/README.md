# Lawn Prix

Gnomes race lawn mowers round a garden track. Pick a ride-on **cart** (fast, heavy, wins bumps) or a push-mower **bike** (quick off the line, turns tight, gets shoved), paint it, and race three CPU gnomes over 3 laps. The mown stripe is the track; the long grass either side slows you to a crawl. Hold drift through a corner and let go for a boost.

The question it answers: is a short mower kart race fun to steer, and do the two vehicles feel different?

## Run

```
npm install                       # once, from the repo root
npm run dev -w games/lawn-prix    # http://localhost:5193
npm run build -w games/lawn-prix
npm test -w games/lawn-prix       # track, sim and party slice tests
```

Controls: W/↑ throttle, S/↓ brake/reverse, A/D or ←/→ steer, Space or Shift drift. Touch: left half of the screen steers (drag), right half is throttle; hold two fingers to drift.

`#minigame` plays the Gnome Party slice (a 3-lap race, four seats) alone against 3 CPUs.

## Adding things

- A vehicle: a `VehicleId` and a `VEHICLES` entry in `src/config.ts`, then its model in `src/scene/mower.ts`. Planned: the combine harvester, huge and painfully slow.
- A colour: `MOWER_COLORS` in `src/config.ts`.
- Tuning (speeds, drift, grass slowdown, CPU skill, camera): all in `src/config.ts`.
- The track: `TRACK.controlPoints` in `src/config.ts` (a closed loop, driven in order).
