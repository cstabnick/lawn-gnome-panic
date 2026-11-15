// Oly Mower Toss: the gnome hammer throw. Alternate A/D to spin a push mower round and round, then press THROW
// while the swinging angle needle is near 45 degrees. Faster spin = farther. Best of two throws; longest wins.
// The logic at the top is pure (no DOM, no three in S); the view at the bottom builds the scene and overlay.
import * as THREE from 'three';
import type { MinigameDef, ViewCtx } from '@lawn/party';
import { advanceCpu, cpuSkill, cpuTaps, newRunner, SPIN, stepRunner, type Runner, type TapInput } from '../olympic/run';
import { bestMark, placesFrom } from '../olympic/rank';
import { createTapper } from '../olympic/taps';
import {
  addDistanceMarkers,
  addGrass,
  addRacers,
  addSkyAndLights,
  createBoard,
  css,
  followCamera,
  laneX,
  poseRacer,
  type Racer,
} from '../olympic/field';

// ---- constants (all tuning numbers) ----
const SPIN_S = 5; // seconds of spinning; then the mower is let go automatically
const MIN_SPIN_S = 0.3; // a THROW earlier than this is ignored
const PERIOD = 1.4; // the angle needle sweeps MIN..MAX..MIN in this time
const NEEDLE_MIN = 10;
const NEEDLE_MAX = 80; // degrees
const REL_PER_SPIN = 1.1; // launch m/s per rad/s of spin (SPIN.max 30 -> 33 m/s)
const G = 9.8;
const H0 = 1.0; // gravity, release height (m)
const SKID = 0.15; // extra skid distance = horizontal speed * SKID, slid over SKID_S
const SKID_S = 0.5;
const THROWS = 2;
const PAUSE = 1.5;
const TARGET_DEG = 45;
const THROW_Z = 0.9; // the mower leaves the throwing circle this far along +z
const ORBIT_R = 0.9; // the mower's radius around the gnome while spinning
const ORBIT_Y = 0.5;
const CAM_SPIN_FOCUS = new THREE.Vector3(0, 1, 6);
const CAM_SPIN_OFFSET = new THREE.Vector3(0, 5, -12);
const CAM_MOWER_OFFSET = new THREE.Vector3(-6, 6, -12);
const HINT_SPIN = 'Alternate A/D to spin — THROW near 45°';

// ---- state and input ----
type Ph = 'spin' | 'fly' | 'wait' | 'done';

interface Seat {
  r: Runner;
  ph: Ph;
  t0: number; // start of the current phase
  ang: number; // release angle, degrees
  vel: number; // launch speed, m/s
  fly: number; // flight time, s
  dist: number; // landing distance, m
  n: number; // throw index
  marks: number[];
  skill: number;
  cpuRel: number; // CPU only: seconds of spinning before it looks for the release
  cpuTol: number; // CPU only: degrees from 45 it accepts
}

interface S {
  t: number;
  seats: Seat[];
}

type I = TapInput;

// ---- pure helpers ----
const round2 = (x: number): number => Math.round(x * 100) / 100;
const round3 = (x: number): number => Math.round(x * 1000) / 1000;

/** The swinging angle needle, degrees, `since` seconds after the spin began. */
function needle(since: number): number {
  return NEEDLE_MIN + (NEEDLE_MAX - NEEDLE_MIN) * (0.5 - 0.5 * Math.cos((2 * Math.PI * since) / PERIOD));
}

function vyOf(v: number, deg: number): number {
  return v * Math.sin((deg * Math.PI) / 180);
}

function vhOf(v: number, deg: number): number {
  return v * Math.cos((deg * Math.PI) / 180);
}

function flightTime(v: number, deg: number): number {
  const vy = vyOf(v, deg);
  return (vy + Math.sqrt(vy * vy + 2 * G * H0)) / G;
}

function planCpu(seat: Seat, rng: () => number): void {
  seat.cpuRel = 1.6 + seat.skill * 2 + rng() * 0.5;
  seat.cpuTol = 4 + (1 - seat.skill) * 20;
}

/** A push mower prop: red body, black U-handle, four wheels, a stripe in the seat colour. Origin at ground centre. */
function makeMower(color: number): THREE.Group {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xd32f2f });
  const black = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const stripe = new THREE.MeshStandardMaterial({ color });
  const part = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  part(new THREE.BoxGeometry(0.6, 0.3, 0.8), red, 0, 0.3, 0);
  part(new THREE.BoxGeometry(0.62, 0.04, 0.5), stripe, 0, 0.485, 0.1);
  part(new THREE.BoxGeometry(0.05, 0.8, 0.05), black, -0.25, 0.55, -0.5);
  part(new THREE.BoxGeometry(0.05, 0.8, 0.05), black, 0.25, 0.55, -0.5);
  part(new THREE.BoxGeometry(0.6, 0.05, 0.05), black, 0, 0.95, -0.5);
  for (const x of [-0.33, 0.33]) {
    for (const z of [-0.3, 0.3]) {
      const wheel = part(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 12), black, x, 0.15, z);
      wheel.rotation.z = Math.PI / 2;
    }
  }
  g.scale.setScalar(0.7);
  return g;
}

const def: MinigameDef<S, I> = {
  meta: {
    id: 'oly-mower-toss',
    title: 'Mower Toss',
    game: 'gnomylpics',
    goal: 'Throw the mower the farthest in two tries.',
    controls: 'Alternate A and D to spin, then THROW (Space or the button) when the needle is near 45°.',
    maxSeconds: 35,
  },

  init(seats, rng) {
    return {
      t: 0,
      seats: seats.map(() => {
        const seat: Seat = {
          r: newRunner(),
          ph: 'spin',
          t0: 0,
          ang: 0,
          vel: 0,
          fly: 0,
          dist: 0,
          n: 0,
          marks: [],
          skill: cpuSkill(rng),
          cpuRel: 0,
          cpuTol: 0,
        };
        planCpu(seat, rng);
        return seat;
      }),
    };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    s.seats.forEach((seat, k) => {
      const newActs = stepRunner(seat.r, inputs[k] ?? null, SPIN, dt);
      if (seat.ph === 'spin') {
        const since = s.t - seat.t0;
        if ((newActs > 0 && since >= MIN_SPIN_S) || since >= SPIN_S) {
          seat.ang = round2(needle(since));
          seat.vel = round2(seat.r.v * REL_PER_SPIN);
          seat.fly = round3(flightTime(seat.vel, seat.ang));
          seat.dist = round2(vhOf(seat.vel, seat.ang) * (seat.fly + SKID));
          seat.ph = 'fly';
          seat.t0 = s.t;
        }
      } else if (seat.ph === 'fly') {
        if (s.t - seat.t0 >= seat.fly + SKID_S) {
          seat.marks.push(seat.dist);
          seat.ph = 'wait';
          seat.t0 = s.t;
        }
      } else if (seat.ph === 'wait') {
        if (s.t - seat.t0 >= PAUSE) {
          seat.n += 1;
          if (seat.n >= THROWS) {
            seat.ph = 'done';
          } else {
            seat.ph = 'spin';
            seat.t0 = s.t;
            seat.r.v = 0;
            planCpu(seat, rng);
          }
        }
      }
      advanceCpu(seat.r, seat.skill, dt, rng);
    });
  },

  cpu(s, seat, rng) {
    const me = s.seats[seat];
    const i = cpuTaps(me.r, me.skill, rng);
    if (me.ph === 'spin') {
      const since = s.t - me.t0;
      if (since >= me.cpuRel && Math.abs(needle(since) - TARGET_DEG) <= me.cpuTol) {
        return { taps: i.taps, slips: i.slips, acts: me.r.acts + 1 };
      }
      return i;
    }
    return { taps: me.r.taps, slips: me.r.slips, acts: me.r.acts };
  },

  result(s, timeUp) {
    if (!timeUp && !s.seats.every((x) => x.ph === 'done')) return null;
    return placesFrom(
      s.seats.map((x) => bestMark(x.marks)),
      true,
    );
  },

  // The release angle is not kept per throw (only the latest one), so it is not reported.
  report(s) {
    return {
      stats: [{ key: 'distance', label: 'Distance', unit: 'm', format: '2dp', better: 'higher' }],
      values: s.seats.map((x) => ({ distance: bestMark(x.marks) })),
      notes: s.seats.map((x) => (x.marks.length === 0 ? 'No valid throw' : null)),
    };
  },

  createView(ctx: ViewCtx) {
    const { scene, camera, ui, seats, mySeat } = ctx;
    addSkyAndLights(scene);
    addGrass(scene, 80, 200, -20);
    for (let k = 0; k < seats.length; k++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 1.0, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(laneX(k), 0.02, 0);
      scene.add(ring);
    }
    addDistanceMarkers(scene, 10, 120, 10);

    const racers: Racer[] = addRacers(scene, seats);
    const mowers = seats.map((seat) => {
      const m = makeMower(seat.color);
      m.traverse((o) => {
        if (o instanceof THREE.Mesh) o.castShadow = true;
      });
      scene.add(m);
      return m;
    });
    const spinA: number[] = seats.map(() => 0);
    const tumble: number[] = seats.map(() => 0);
    const flagCount: number[] = seats.map(() => 0);
    const prevPh: (Ph | null)[] = seats.map(() => null);

    const addFlag = (k: number, dist: number): void => {
      const x = laneX(k);
      const z = THROW_Z + dist;
      const pole = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 1.4, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
      pole.position.set(x, 0.7, z);
      pole.castShadow = true;
      scene.add(pole);
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.5, 0.15);
      shape.lineTo(0, 0.3);
      shape.closePath();
      const flag = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshStandardMaterial({ color: css(seats[k].color), side: THREE.DoubleSide }),
      );
      flag.position.set(x, 1.1, z);
      scene.add(flag);
    };

    // The needle gauge and spin bar: only for my seat, only while spinning.
    let gauge: HTMLDivElement | null = null;
    let needleEl: HTMLDivElement | null = null;
    let barFill: HTMLDivElement | null = null;
    if (mySeat !== null) {
      gauge = document.createElement('div');
      gauge.style.cssText =
        'position:absolute;right:4vw;bottom:calc(6vh + 170px);display:none;align-items:flex-end;gap:12px;pointer-events:none';
      const dial = document.createElement('div');
      dial.style.cssText =
        'position:relative;width:180px;height:90px;border-radius:90px 90px 0 0;background:rgba(0,0,0,0.5);' +
        'overflow:hidden;border:3px solid rgba(255,255,255,0.7);box-sizing:border-box';
      const wedge = document.createElement('div');
      wedge.style.cssText =
        'position:absolute;inset:0;background:conic-gradient(from 0deg at 50% 100%, transparent 0deg 40deg, ' +
        '#4caf50 40deg 50deg, transparent 50deg 360deg)';
      dial.appendChild(wedge);
      needleEl = document.createElement('div');
      needleEl.style.cssText =
        'position:absolute;left:50%;bottom:0;width:4px;height:84px;margin-left:-2px;background:#ffffff;' +
        'transform-origin:50% 100%;transform:rotate(0deg)';
      dial.appendChild(needleEl);
      const bar = document.createElement('div');
      bar.style.cssText =
        'position:relative;width:20px;height:90px;border-radius:6px;background:rgba(0,0,0,0.5);overflow:hidden';
      barFill = document.createElement('div');
      barFill.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:0%;background:#ffd54f';
      bar.appendChild(barFill);
      gauge.append(dial, bar);
      ui.appendChild(gauge);
    }

    const board = createBoard(ui, seats, mySeat);
    const tapper = createTapper(ui, mySeat === null ? { tapButtons: false } : { actLabel: 'THROW' });
    let lastSeenSlip = tapper.lastSlipAt;
    let clock = 0;

    return {
      render(s, dt) {
        clock += dt;
        if (Math.abs(s.t - clock) > 0.25) clock = s.t;
        else clock += (s.t - clock) * Math.min(1, dt * 3);

        s.seats.forEach((seat, k) => {
          const x = laneX(k);
          const racer = racers[k];
          const mower = mowers[k];

          // Events: a release and a landing for my seat get a banner.
          const prev = prevPh[k];
          if (prev !== null && prev !== seat.ph) {
            if (prev === 'spin' && seat.ph === 'fly' && k === mySeat) {
              board.banner(`${seat.ang.toFixed(0)}°`, '#ffffff', 900);
            }
            if (prev === 'fly' && seat.ph === 'wait' && k === mySeat) {
              board.banner(`${seat.dist.toFixed(2)} m`, '#ffd54f', 1500);
            }
          }
          prevPh[k] = seat.ph;

          while (flagCount[k] < seat.marks.length) {
            addFlag(k, seat.marks[flagCount[k]]);
            flagCount[k] += 1;
          }

          const vel = seat.vel;
          if (seat.ph === 'spin') {
            spinA[k] += seat.r.v * dt;
            const a = spinA[k];
            racer.pose.position.set(x, 0, 0);
            racer.pose.velocity.set(0, 0, 0);
            racer.pose.facing = a;
            racer.pose.grounded = true;
            racer.model.update(racer.pose, dt);
            racer.model.arms.left.rotation.x = -1.4;
            racer.model.arms.right.rotation.x = -1.4;
            racer.label.position.set(x, 1.9, 0);
            mower.position.set(x + Math.sin(a) * ORBIT_R, ORBIT_Y, Math.cos(a) * ORBIT_R);
            mower.rotation.set(0, a + Math.PI / 2, 0);
            tumble[k] = 0;
          } else {
            poseRacer(racer, x, 0, 0, 0, dt);
            const vy = vyOf(vel, seat.ang);
            const vh = vhOf(vel, seat.ang);
            if (seat.ph === 'fly') {
              const el = clock - seat.t0;
              if (el <= seat.fly) {
                const tau = Math.max(0, el);
                mower.position.set(x, H0 + vy * tau - 0.5 * G * tau * tau, THROW_Z + vh * tau);
                tumble[k] += dt * 8;
                mower.rotation.x = tumble[k];
              } else {
                const u = Math.min(1, (el - seat.fly) / SKID_S);
                mower.position.set(x, 0, THROW_Z + vh * seat.fly + vh * SKID * u);
                mower.rotation.x = (tumble[k] % (2 * Math.PI)) * Math.exp(-(el - seat.fly) * 8);
              }
            } else {
              mower.position.set(x, 0, THROW_Z + vh * (seat.fly + SKID));
              mower.rotation.x = 0;
            }
          }
        });

        // Camera: the spin view while the focused seat spins, otherwise its mower.
        const focus = mySeat ?? 0;
        if (s.seats[focus].ph === 'spin') {
          followCamera(camera, CAM_SPIN_FOCUS, CAM_SPIN_OFFSET, dt);
        } else {
          followCamera(camera, mowers[focus].position, CAM_MOWER_OFFSET, dt);
        }

        // Scoreboard rows, the hint and the gauge.
        s.seats.forEach((seat, k) => {
          const best = bestMark(seat.marks);
          board.set(k, `${best === null ? '—' : `${best.toFixed(2)} m`}  (${Math.min(seat.n + 1, 2)}/2)`);
        });
        const mine = mySeat === null ? null : s.seats[mySeat];
        const spinning = mine !== null && mine.ph === 'spin';
        board.hint(spinning ? HINT_SPIN : '');
        if (gauge && needleEl && barFill && mine !== null) {
          gauge.style.display = spinning ? 'flex' : 'none';
          if (spinning) {
            needleEl.style.transform = `rotate(${90 - needle(clock - mine.t0)}deg)`;
            barFill.style.height = `${Math.min(1, mine.r.v / SPIN.max) * 100}%`;
          }
        }
      },
      input(pad, s) {
        const i = tapper.sample(pad);
        if (mySeat !== null && tapper.lastSlipAt !== lastSeenSlip) {
          lastSeenSlip = tapper.lastSlipAt;
          if (s.seats[mySeat].ph === 'spin') board.banner('SLIP!', '#ff5252', 700);
        }
        return i;
      },
      dispose() {
        tapper.dispose();
        gauge?.remove();
      },
    };
  },
};

export default def;
