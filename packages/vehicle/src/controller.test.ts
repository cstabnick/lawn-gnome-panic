// Headless acceptance tests from the research doc (the ones that make sense without a renderer).
import { describe, expect, it } from 'vitest';
import { CASUAL as CASUAL_AUTO, HYBRID, SIMCADE, retuneDirectDrive, scaleConfig, type VehicleConfig } from './config';
import { VehicleController } from './controller';
import { withOverrides } from './config';
/** Casual preset with the pedal under the player's control (Auto-Accelerate is covered in its own test). */
const CASUAL = withOverrides(CASUAL_AUTO, { mobileInput: { autoAccelerate: false } });
import { movingPlatform, slopeGround } from './ground';
import { type VehicleInput } from './input';
import { rad2deg, v3, len } from './math';

const KMH = 1 / 3.6;
const idle = (): VehicleInput => ({ steer: 0, throttle: 0, brake: 0, handbrake: 0, source: 'keyboard' });
const inp = (o: Partial<VehicleInput>): VehicleInput => ({ ...idle(), ...o });

function run(car: VehicleController, seconds: number, dt: number, f: (t: number) => VehicleInput, each?: (t: number) => void): void {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    car.step(dt, f(i * dt));
    each?.(i * dt);
  }
}
const finite = (car: VehicleController): boolean =>
  [car.body.pos, car.body.vel, car.body.angVel].every((v) => Number.isFinite(v.x + v.y + v.z)) && car.body.pos.y > -1;

describe('1 drop test', () => {
  for (const [name, cfg] of [['simcade', SIMCADE], ['casual', CASUAL]] as const) {
    for (const hz of [60, 30]) {
      it(`${name} settles at ${hz} Hz`, () => {
        const car = new VehicleController(cfg);
        car.place(v3(0, 0.5, 0), 0);
        car.body.pos.y += 0.5;
        run(car, 5, 1 / hz, idle);
        expect(finite(car)).toBe(true);
        expect(Math.abs(car.body.pos.y - car.rideHeight)).toBeLessThan(0.02);
        expect(len(car.body.vel)).toBeLessThan(hz === 30 ? 0.3 : 0.05);
      });
    }
  }
});

describe('2 slope hold', () => {
  for (const [name, cfg] of [['simcade', SIMCADE], ['casual', CASUAL]] as const) {
    it(`${name} holds still on 15 degrees`, () => {
      const a = (15 * Math.PI) / 180;
      const car = new VehicleController(cfg, { ground: slopeGround(a) });
      // Facing downhill (-x is downhill for slopeGround; yaw of -90 deg faces -x).
      car.place(v3(0, 0, 0), -Math.PI / 2, 5);
      run(car, 8, 1 / 60, (t) => (t < 3 ? inp({ brake: 1 }) : idle()));
      const tail: number[] = [];
      run(car, 5, 1 / 60, () => idle(), () => tail.push(len(car.body.vel)));
      expect(finite(car)).toBe(true);
      expect(Math.max(...tail)).toBeLessThan(0.05);
    });
  }
});

describe('3 acceleration and top speed', () => {
  for (const [name, cfg] of [['simcade', SIMCADE], ['casual', CASUAL]] as const) {
    it(`${name} reaches 100 km/h and a sane top speed`, () => {
      const car = new VehicleController(cfg);
      let t100 = -1;
      run(car, 40, 1 / 60, () => inp({ throttle: 1 }), (t) => {
        if (t100 < 0 && car.telemetry.forwardSpeed > 100 * KMH) t100 = t;
      });
      const top = car.telemetry.forwardSpeed / KMH;
      console.log(name, '0-100', t100.toFixed(2), 's  top', top.toFixed(0), 'km/h  gear', car.telemetry.gear);
      expect(t100).toBeGreaterThan(3);
      expect(t100).toBeLessThan(9);
      expect(top).toBeGreaterThan(150);
      expect(top).toBeLessThan(260);
    });
  }
});

describe('4 braking', () => {
  for (const [name, cfg] of [['simcade', SIMCADE], ['casual', CASUAL]] as const) {
    it(`${name} stops from 100 km/h without rolling back`, () => {
      const car = new VehicleController(cfg);
      car.place(v3(), 0, 100 * KMH);
      const x0 = car.body.pos.z;
      let minFwd = 0;
      run(car, 8, 1 / 60, () => inp({ brake: 1 }), () => { minFwd = Math.min(minFwd, car.telemetry.forwardSpeed); });
      const dist = car.body.pos.z - x0;
      console.log(name, '100-0 distance', dist.toFixed(1), 'm');
      expect(dist).toBeGreaterThan(18);
      expect(dist).toBeLessThan(42);
      expect(minFwd).toBeGreaterThan(-0.4); // a small suspension rebound as the nose comes back up
      expect(Math.abs(car.telemetry.forwardSpeed)).toBeLessThan(0.05);
    });
  }
});

describe('5 Ackermann low-speed circle', () => {
  it('full lock at 10 km/h gives a tight scrub-free circle with inner > outer angle', () => {
    const car = new VehicleController(SIMCADE);
    car.place(v3(), 0, 10 * KMH);
    run(car, 4, 1 / 60, () => inp({ steer: 1, throttle: Math.min(1, Math.max(0, (2.78 - car.telemetry.speed) * 0.6)), source: 'stick' }));
    const w = car.telemetry.wheels;
    const inner = rad2deg(Math.abs(w[1].steerRad));
    const outer = rad2deg(Math.abs(w[0].steerRad));
    expect(inner).toBeGreaterThan(outer);
    expect(inner).toBeGreaterThan(36);
    expect(inner).toBeLessThan(38.5);
    expect(outer).toBeGreaterThan(27);
    expect(outer).toBeLessThan(28.5);
    // Radius from speed / yaw rate.
    const radius = car.telemetry.speed / Math.abs(car.telemetry.yawRateRight);
    console.log('turn radius', radius.toFixed(2));
    expect(radius).toBeGreaterThan(3.8);
    expect(radius).toBeLessThan(5.5);
  });
});

describe('6 binary high-speed corner', () => {
  function corner(cfg: VehicleConfig): { peakSlip: number; exit: number } {
    const car = new VehicleController(cfg);
    car.place(v3(), 0, 90 * KMH);
    let peakSlip = 0;
    run(car, 6, 1 / 60, (t) => inp({ throttle: 1, steer: t < 1 ? 1 : 0, source: 'touch-buttons' }), () => {
      peakSlip = Math.max(peakSlip, Math.abs(rad2deg(car.telemetry.sideslip)));
    });
    return { peakSlip, exit: car.telemetry.speed / KMH };
  }
  it('casual preset does not spin out', () => {
    const r = corner(CASUAL);
    console.log('casual corner', r);
    expect(r.peakSlip).toBeLessThan(12);
    expect(r.exit).toBeGreaterThan(110);
  });
  it('hybrid preset stays controllable', () => {
    const r = corner(HYBRID);
    console.log('hybrid corner', r);
    expect(r.peakSlip).toBeLessThan(25);
  });
  it('assists make the corner calmer than the same car without them', () => {
    const bare = corner({ ...CASUAL, steeringAndAssists: { ...CASUAL.steeringAndAssists, speedCurvatureLimitStrength: 0, counterSteerAssist: 0, tractionControlStrength: 0, escYawDampingGain: 0 } });
    const full = corner(CASUAL);
    console.log('bare', bare, 'full', full);
    expect(full.peakSlip).toBeLessThan(bare.peakSlip);
  });
});

describe('7 moving platform', () => {
  it('a parked car on a 5 m/s platform shows no slip against it', () => {
    const car = new VehicleController(CASUAL, { ground: movingPlatform(v3(5, 0, 0)) });
    car.place(v3(), 0);
    car.body.vel = v3(5, 0, 0);
    run(car, 4, 1 / 60, () => idle());
    const rel = Math.hypot(car.body.vel.x - 5, car.body.vel.z);
    expect(rel).toBeLessThan(0.1);
  });
});

describe('8 frame-rate independence', () => {
  it('update() gives the same path at 30, 60 and 120 FPS render rates', () => {
    const ends = [30, 60, 120].map((fps) => {
      const car = new VehicleController(HYBRID);
      car.place(v3(), 0);
      const dt = 1 / fps;
      for (let i = 0; i < fps * 6; i++) {
        const t = i * dt;
        car.update(dt, inp({ throttle: 1, steer: t >= 2 - 1e-6 && t < 3.5 - 1e-6 ? 0.6 : 0, source: 'stick' }));
      }
      return car.body.pos;
    });
    for (const p of ends) expect(Math.hypot(p.x - ends[1].x, p.z - ends[1].z)).toBeLessThan(0.5);
  });
});

describe('scaling', () => {
  it('a small retuned car hits its requested top speed and stays stable', () => {
    const mower = retuneDirectDrive(scaleConfig(CASUAL, 0.55), 20, 10);
    const car = new VehicleController(mower);
    run(car, 30, 1 / 60, () => inp({ throttle: 1 }));
    expect(finite(car)).toBe(true);
    console.log('mower top speed', car.telemetry.forwardSpeed.toFixed(1), 'm/s');
    expect(car.telemetry.forwardSpeed).toBeGreaterThan(15);
    expect(car.telemetry.forwardSpeed).toBeLessThan(23);
  });
  it('reverses from rest on a fresh brake press', () => {
    const car = new VehicleController(CASUAL);
    run(car, 3, 1 / 60, () => inp({ brake: 1 }));
    expect(car.telemetry.forwardSpeed).toBeLessThan(-2);
  });
});

describe('reverse', () => {
  it('direct drive reverse tops out well below forward speed', () => {
    const car = new VehicleController(CASUAL);
    run(car, 12, 1 / 60, () => inp({ brake: 1 }));
    const back = -car.telemetry.forwardSpeed;
    expect(back).toBeGreaterThan(5);
    expect(back).toBeLessThan(30); // 40% of a ~60 m/s top speed
  });
});
