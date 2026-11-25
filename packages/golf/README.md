# @lawn/golf: shared golf maths

Pure golf rules extracted from Gnome Golf so other games can play the same golf. No three.js, no DOM. Units are yards,
y is up, yaw `a` points along `(sin a, 0, cos a)`.

- `tuning.ts`: `CLUBS`, `CLUB_ORDER`, `LIES`, `PHYS`, `SWING`, `HoleDef`, `TEE_HALF`, `FRINGE` and the plain types.
- `physics.ts`: `simulateShot(env, start, shot, lie, wind, pin, opts?)` and `previewShot` play a shot on any course given
  as a `CourseEnv` (`heightAt`, `gradientAt`, `lieAt`, optional `collide`). Plus `estimateCarry`, `powerFor`,
  `launchSpeed`, `liePower`, `powerScale`, `windVelocity`. Results use plain `{x,y,z}` points.
- `swing.ts`: the three-tap meter. `swingTap(sw)` and `swingStep(sw, dt, club, scale?)` mutate a `SwingState` and return
  `start` / `power` / `fire` events (or null). Sounds and phase changes are the caller's.
- `scoring.ts`: `scoreName`, `seededWindFrom(seed, hole, maxWind)`, `restingSpot` (water costs a stroke and goes back),
  `seaMowerCatch`, `playableLie`.
- `course.ts`: `createCourse` (Gnome Golf's island), `distToPath`, `holeLength`, and `featureLie(holes, x, z)`, the lie
  from hole features alone, for courses with no island.

```ts
import { simulateShot, swingTap, swingStep, featureLie } from '@lawn/golf';
const env = { heightAt: () => 1, gradientAt: () => ({ gx: 0, gz: 0 }), lieAt: (x, z) => featureLie(holes, x, z) };
const flight = simulateShot(env, { x, y: 1, z }, { club: 'DR', power: 1, accuracy: 0, yaw }, 'tee', wind, hole.pin);
```

Gnome Golf keeps its three.js `ShotResult` and course singletons and wraps these (`games/gnome-golf/src/physics.ts`).
Test: `npm test -w packages/golf`.
