# @lawn/vehicle

One vehicle-handling model for every driving mechanic in the arcade, from a mower in a crime parody to a real driving game.
Pure TypeScript maths: no three.js, no DOM, no game code. Based on the research note [`docs/design/driving-physics-research.md`](../../docs/design/driving-physics-research.md)
(single rigid body, four raycast wheels, layered input / assists / drivetrain / suspension-tyre core / presentation).

First user: Gnome Theft Auto, opt-in with `?drive=sim` (offline for now). See `games/gnome-theft-auto/src/simdrive.ts` for how a game plugs in.

## Use it

```ts
import { CASUAL, VehicleController, v3 } from '@lawn/vehicle';

const car = new VehicleController(CASUAL);           // or SIMCADE, HYBRID, or your own VehicleConfig
car.place(v3(x, 0, z), yaw);                         // at rest on the road under (x, z)
// every render frame (runs whole 60 Hz ticks inside, caps catch-up at 0.1 s):
car.update(frameDt, { steer, throttle, brake, handbrake, source: 'keyboard' });
const pose = car.renderPose();                       // interpolated { pos (CoM), quat } for the mesh
car.telemetry;                                       // speed, slip, rpm, per-wheel compression/slip/forces: audio, camera, HUD
```

Conventions: SI units; right-handed, y up; vehicle-local +z forward and +x **left** (three.js), so yaw `a` faces `(sin a, 0, cos a)`.
`steer` is -1 (left) .. +1 (right). `body.pos` is the centre of mass; `rideHeight` is how high it sits at rest.

## Pieces

| File | Layer | What |
|---|---|---|
| `input.ts` | 1 | `createInputConditioner`: deadzone + gamma for analog sources, asymmetric speed- and lateral-G-aware smoothing for keys / arrow buttons, Auto-Accelerate |
| `assists.ts` | 2 | Physical speed-curvature steer limit with rear-slip backoff, counter-steer, friction-circle TCS, bicycle-model ESC. All bounded; the tyres stay the source of truth |
| `drivetrain.ts` | 3 | One contract (torque, reflected inertia, normalised rpm), two modes: 5-parameter direct drive and 6-speed combustion with an idle floor and auto-shift |
| `tire.ts`, `controller.ts` | 4 | Simplified 4-parameter Pacejka, normalised combined slip, implicit Bernard-Clover relaxation (parked cars stay parked on slopes), asymmetric spring-dampers, progressive bump stop, anti-roll bars, `wheelLoadRatio`, `forceAppHeightBlend`, Ackermann, ABS, LSD, aero |
| `ground.ts` | | `GroundProbe` (`cast(origin, dir, maxDist)`): the game's ground. Flat, sloped and moving-platform probes included; supply a heightfield one for hills |
| `config.ts` | | `VehicleConfig`, presets `SIMCADE` / `HYBRID` / `CASUAL`, `withOverrides`, `scaleConfig` (a smaller or bigger car of the same family), `retuneDirectDrive` (set top speed and pickup) |

The fixed-tick order in `controller.ts` follows the note's 11 steps: snapshot, input, kinematics, assists, Ackermann, probes, suspension, drivetrain, torque split with TCS and LSD, tyres and wheel spin (brakes last), aero / ESC / safeguards.

## Make a new car type

Override a few fields on a preset (no code), scale it, then set its speed:

```ts
let cfg = scaleConfig(CASUAL, 0.6);                  // 60% size; mass and spring rates scale with it
cfg = retuneDirectDrive(cfg, 20 /* m/s top */, 10 /* m/s² launch */);
cfg = withOverrides(cfg, { mobileInput: { autoAccelerate: false } });
```

## Tests

`npm test -w packages/vehicle`: drop settling at 60 and 30 Hz, 15° slope hold, 0-100 and top speed, 100-0 braking, Ackermann angles and circle,
binary-input highway corner with and without assists, moving platform, render-rate independence, scaling, reverse.

## Status (POC) and backlog

Measured on the reference 1450 kg chassis: Casual 0-100 in 5.6 s, 100-0 in 25 m; Simcade 100-0 in 40 m. Known gaps against the note's targets:

- Simcade launch is slower than the note's (0-100 about 7.3 s, top about 234 km/h against 5.0-5.5 s and 215-222): the combustion torque curve and gearing are generic, not tuned.
- Simcade braking is 40 m against 31-35 m; the 30 Hz drop test settles to 0.3 m/s rather than fully still.
- Not built yet: drift intent / control assist and the kart-drift state machine, airborne landing snap, spherecast probes, the ramp test, Layer 1 tilt calibration and touch UI templates, Layer 5 (chase camera, multi-RPM audio, haptics), vehicle-vs-vehicle contact (the host game does it), per-wheel body forces on dynamic ground bodies.
- Real-device 60 FPS check on a phone.
