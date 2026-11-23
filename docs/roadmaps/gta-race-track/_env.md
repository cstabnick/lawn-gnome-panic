# Environment for every gta-race-track issue

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a62cce95dbd33afc5` (a git
  worktree). Run every command from there. Use absolute paths with the Read/Edit/Write tools.
- Node: in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"` (put it on its own line, not chained with git); in
  PowerShell `$env:Path = "C:\Program Files\nodejs;" + $env:Path`. Dependencies are installed: never run `npm install`.
- Never run `git commit`, `git stash`, `git checkout` or `git reset`. Never start a dev server.
- Eight other workers are editing other files of `games/gnome-theft-auto` and `packages/prefabs` at the same time.
  Edit ONLY the files your issue lists. `npx tsc --noEmit -p games/gnome-theft-auto` may show errors in another
  worker's file while they work; only your files must be clean.
- The game: Gnome Theft Auto (three.js r16x, TypeScript, Vite). World units are metres; x east, z south, y up. A yaw of
  0 faces +z; `yaw = Math.atan2(dx, dz)`; to turn a direction into a yaw use that formula.
- Repo rules that apply: anything laid flat on the ground or on another surface takes a draw layer
  (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`, layers ground 0, tint 1, area 2, road 3, edge 4, marking 5,
  decal 6, marker 7), boxes that touch must not share a face; UI goes in its own container appended to `#ui`, never
  restyle `#ui`; every UI works on a phone (touch, 44 px targets, 390x844 portrait); new objects come from
  `@lawn/prefabs` (`buildStaticPrefabs`, `buildPrefab`).
- The track module (already written, read it): `games/gnome-theft-auto/src/raceTrack/track.ts`. Its API:
  - `TRACK` (`width` 14, `shoulder` 4, `barrierOffset` 12.5, `jumps`, `reserve`, `gates` 12), `START_OFFSET`
  - `trackSamples(): readonly TrackSample[]` (one per metre from the start line; fields `s, x, z, tx, tz, nx, nz, yaw,
    lift, bank, curv`; (tx,tz) = unit direction of travel, (nx,nz) = unit LEFT normal; curv > 0 turns left, < 0 right;
    1/|curv| is the corner radius), `trackLength()` (~1224 m), `sampleAt(s)`, `trackFrame(s, lat)` → `{x, z, yaw}` of
    a point `lat` m left of the centre line, `roadLiftAt(sample, lat)`
  - `locate(x, z, reach?, hint?, window?)` → `{ i, s, lat, dist } | null` (nearest sample; pass last frame's `i` as
    `hint` so a car never snaps to a neighbouring part of the track), `onTrack`, `onTrackRoad`
  - `gates()`, `crossedGate(gate, ax, az, bx, bz)`, `class GateTracker` (`update(dt, x, z)` returns
    `'start' | 'gate' | 'lap' | null`; fields `next`, `laps`, `lapTime`, `passed`; `reset()`)
  - `gridSlot(slot)` → `{x, z, yaw}` (slot 0 = pole), `PIT_LANE`, `PIT_LANE_WIDTH`, `SPEEDWAY_GLAZE`, `RACE_DESK`,
    `BARRIER_GAPS`, `interface Deck { x, z, y, yaw, w, d }`
  - Ground height anywhere: `heightAt(x, z)` from `games/gnome-theft-auto/src/terrain.ts` (it already includes the
    track's rises, banking and jumps).
