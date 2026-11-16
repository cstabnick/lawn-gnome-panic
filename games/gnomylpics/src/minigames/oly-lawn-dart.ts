// Lawn Dart Javelin: a Gnome Party slice of gnomylpics. Alternate A and D to run up, then HOLD the throw button to
// raise the aim angle and RELEASE to throw a giant lawn dart before the red foul line. Best of two throws; longest wins.
//
// Rules that keep a slice working in the party (packages/party/README.md):
//  - init/step/cpu/result are pure: no DOM, no three objects in the state, and only the rng argument for randomness.
//  - State S and input I are plain JSON. S stays under 2 KB. Input is a level; one-off actions are counters.
import * as THREE from 'three';
import type { MinigameDef, SeatInfo } from '@lawn/party';
import { soleWinner } from '@lawn/party';
import { advanceCpu, cpuSkill, cpuTaps, newRunner, RUN, stepRunner, type Runner } from '../olympic/run';
import { bestMark, placesFrom } from '../olympic/rank';
import { createTapper } from '../olympic/taps';
import {
  addDistanceMarkers,
  addGrass,
  addLine,
  addRacers,
  addSkyAndLights,
  addTrack,
  createBoard,
  followCamera,
  laneX,
  poseRacer,
} from '../olympic/field';

const FOUL = 20; // foul line z
const MIN_THROW_Z = 2; // throws before this are ignored
const THROW_BASE = 8;
const THROW_PER_RUN = 1.6; // throw speed = THROW_BASE + run speed * THROW_PER_RUN (m/s)
const ANGLE_MIN = 15;
const ANGLE_MAX = 75;
const AIM_S = 0.9; // holding AIM_S seconds sweeps the angle MIN..MAX
const G = 9.8;
const H0 = 1.8;
const THROWS = 2;
const PAUSE = 1.5;
const ROUND_S = 40;
const DEFAULT_ANGLE = 40;

type Ph = 'run' | 'fly' | 'wait' | 'done';

interface Seat {
  r: Runner;
  z: number;
  ph: Ph;
  t0: number;
  relZ: number;
  vel: number;
  ang: number;
  fly: number;
  n: number;
  marks: (number | null)[];
  skill: number;
  cpuZ: number;
  cpuAng: number;
}
interface S {
  t: number;
  seats: Seat[];
}
interface I {
  taps: number;
  slips: number;
  acts: number;
  angle: number;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

/** Aim angle (degrees) for a throw button held holdS seconds. */
export function angleFromHold(holdS: number): number {
  return clamp(ANGLE_MIN + (holdS / AIM_S) * (ANGLE_MAX - ANGLE_MIN), ANGLE_MIN, ANGLE_MAX);
}

/** Launch components of a throw at speed vel (m/s) and angle ang (degrees). */
function flightOf(vel: number, ang: number): { vy: number; vh: number; fly: number } {
  const a = (ang * Math.PI) / 180;
  const vy = vel * Math.sin(a);
  const vh = vel * Math.cos(a);
  const fly = (vy + Math.sqrt(vy * vy + 2 * G * H0)) / G;
  return { vy, vh, fly };
}

/** The mark of a seat's current throw: how far past the foul line the dart stuck. */
function markOf(seat: Seat): number {
  const f = flightOf(seat.vel, seat.ang);
  return round2(seat.relZ + f.vh * seat.fly - FOUL);
}

/** Draws a new CPU throw plan (where it throws and at what angle). */
function planCpu(seat: Seat, rng: () => number): void {
  seat.cpuZ = FOUL - 0.5 - (1 - seat.skill) * 4 * rng();
  seat.cpuAng = round2(40 + (rng() * 2 - 1) * (1 - seat.skill) * 20);
}

function makeDart(color: number): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.6, roughness: 0.4 }),
  );
  shaft.rotation.x = Math.PI / 2;
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.25, 12),
    new THREE.MeshStandardMaterial({ color: 0x607d8b, metalness: 0.7, roughness: 0.3 }),
  );
  tip.rotation.x = Math.PI / 2;
  tip.position.z = 0.725;
  g.add(shaft, tip);
  const finMat = new THREE.MeshStandardMaterial({ color });
  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i * 2 * Math.PI) / 3;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.12, 0.2), finMat);
    fin.position.set(0, 0.06, -0.5);
    pivot.add(fin);
    g.add(pivot);
  }
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  return g;
}

/** A vertical aim meter at bottom-right: 15..75 degrees, a green band at 35..45, the number on top. */
function makeMeter(ui: HTMLElement) {
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'position:absolute;right:4vw;bottom:22vh;width:26px;height:180px;display:none;pointer-events:none;' +
    'font:800 18px system-ui;color:#fff;text-shadow:0 2px 4px #000';
  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.45);border-radius:13px;overflow:hidden';
  const band = document.createElement('div');
  band.style.cssText = 'position:absolute;left:0;right:0;bottom:33.33%;height:16.67%;background:rgba(76,175,80,0.6)';
  const fill = document.createElement('div');
  fill.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:0%;background:#ffd54f';
  const label = document.createElement('div');
  label.style.cssText = 'position:absolute;top:-30px;left:-30px;right:-30px;text-align:center';
  bar.append(band, fill);
  wrap.append(bar, label);
  ui.appendChild(wrap);
  return {
    set(angle: number | null): void {
      if (angle === null) {
        wrap.style.display = 'none';
        return;
      }
      wrap.style.display = 'block';
      fill.style.height = `${((angle - ANGLE_MIN) / (ANGLE_MAX - ANGLE_MIN)) * 100}%`;
      label.textContent = `${Math.round(angle)}°`;
    },
    dispose(): void {
      wrap.remove();
    },
  };
}

const def: MinigameDef<S, I> = {
  meta: {
    id: 'oly-lawn-dart',
    title: 'Lawn Dart Javelin',
    game: 'gnomylpics',
    goal: 'Throw the lawn dart the farthest past the red line in two tries.',
    controls: 'Alternate A and D to run; hold THROW (Space or the button) to aim, release to throw before the red line.',
    maxSeconds: ROUND_S,
  },

  init(seats: readonly SeatInfo[], rng: () => number): S {
    return {
      t: 0,
      seats: seats.map(() => {
        const seat: Seat = {
          r: newRunner(),
          z: 0,
          ph: 'run',
          t0: 0,
          relZ: 0,
          vel: 0,
          ang: DEFAULT_ANGLE,
          fly: 0,
          n: 0,
          marks: [],
          skill: cpuSkill(rng),
          cpuZ: 0,
          cpuAng: DEFAULT_ANGLE,
        };
        planCpu(seat, rng);
        return seat;
      }),
    };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    s.seats.forEach((seat, k) => {
      const inp = inputs[k];
      const newActs = stepRunner(seat.r, inp, RUN, dt);
      if (seat.ph === 'run') {
        seat.z += seat.r.v * dt;
        // A throw must come before the foul line; a press after crossing it is a foul.
        if (newActs > 0 && seat.z >= MIN_THROW_Z && seat.z <= FOUL) {
          seat.ang = round2(clamp(inp ? inp.angle : DEFAULT_ANGLE, ANGLE_MIN, ANGLE_MAX));
          seat.vel = round2(THROW_BASE + seat.r.v * THROW_PER_RUN);
          seat.relZ = seat.z;
          seat.fly = round3(flightOf(seat.vel, seat.ang).fly);
          seat.ph = 'fly';
          seat.t0 = s.t;
        } else if (seat.z > FOUL) {
          seat.marks.push(null);
          seat.ph = 'wait';
          seat.t0 = s.t;
        }
      } else if (seat.ph === 'fly') {
        // The thrower jogs to a stop.
        seat.z = Math.min(FOUL - 0.2, seat.z + seat.r.v * dt);
        if (s.t - seat.t0 >= seat.fly + 0.3) {
          seat.marks.push(markOf(seat));
          seat.ph = 'wait';
          seat.t0 = s.t;
        }
      } else if (seat.ph === 'wait') {
        if (s.t - seat.t0 >= PAUSE) {
          seat.n += 1;
          if (seat.n >= THROWS) {
            seat.ph = 'done';
          } else {
            seat.z = 0;
            seat.r.v = 0;
            seat.ph = 'run';
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
    const acts = me.ph === 'run' && me.z >= me.cpuZ ? me.r.acts + 1 : me.r.acts;
    return { ...i, acts, angle: me.cpuAng };
  },

  result(s, timeUp) {
    const allDone = s.seats.every((x) => x.ph === 'done');
    if (!allDone && !timeUp) return null;
    return placesFrom(
      s.seats.map((x) => bestMark(x.marks)),
      true,
    );
  },

  report(s, places, seats) {
    const best = s.seats.map((x) => bestMark(x.marks));
    const fouls = s.seats.map((x) => x.marks.filter((m) => m === null).length);
    const w = soleWinner(places);
    const who = w === null ? null : (seats[w]?.name ?? null);
    const d = w === null ? null : best[w];
    const headline = who && d !== null ? `${who} launched the dart ${d.toFixed(2)} m` : undefined;
    return {
      headline,
      stats: [
        { key: 'dist', label: 'Distance', unit: 'm', format: '2dp', better: 'higher' },
        { key: 'fouls', label: 'Fouls', format: 'int' },
      ],
      values: s.seats.map((_, k) => ({ dist: best[k], fouls: fouls[k] })),
      notes: fouls.map((f, k) => {
        if (f === 1) return 'Fouled once';
        if (f > 1) return `Fouled ${f} times`;
        return best[k] === null ? 'No valid throw' : null;
      }),
    };
  },

  createView(ctx) {
    const { scene, camera, ui, seats, mySeat } = ctx;
    addSkyAndLights(scene);
    addGrass(scene, 80, 160, -20);
    addTrack(scene, FOUL + 5, { z0: -5 });
    addLine(scene, FOUL, 0xff1744, 0.2);
    addDistanceMarkers(scene, FOUL + 10, FOUL + 90, 10, FOUL);

    const racers = addRacers(scene, seats);
    const board = createBoard(ui, seats, mySeat);
    const tapper = createTapper(ui, mySeat === null ? { tapButtons: false } : { actLabel: 'HOLD TO THROW', actOn: 'release' });
    const meter = makeMeter(ui);

    // Darts per seat, one per throw index, created when first needed and left where they landed.
    const darts: THREE.Group[][] = seats.map(() => []);
    const dartOf = (k: number, n: number): THREE.Group => {
      const list = darts[k];
      let d: THREE.Group | undefined = list[n];
      if (!d) {
        d = makeDart(seats[k].color);
        scene.add(d);
        list[n] = d;
      }
      return d;
    };

    const shown = seats.map(() => 0); // eased gnome z per seat
    const focus = new THREE.Vector3();
    const offset = new THREE.Vector3();
    let started = false;
    let clock = 0;
    let seenMarks = 0;
    let lastSlipSeen = tapper.lastSlipAt;
    let lastActs = 0;
    let angle = DEFAULT_ANGLE;

    return {
      render(s, dt) {
        if (!started) {
          started = true;
          clock = s.t;
          s.seats.forEach((seat, k) => {
            shown[k] = seat.z;
          });
          seenMarks = mySeat === null ? 0 : s.seats[mySeat].marks.length;
        }
        // Local clock for flights: free-runs with dt, pulled gently towards the state's time.
        clock += dt;
        if (Math.abs(s.t - clock) > 0.25) clock = s.t;
        else clock += (s.t - clock) * Math.min(1, dt * 3);

        const k01 = 1 - Math.exp(-dt * 15);
        s.seats.forEach((seat, k) => {
          if (Math.abs(seat.z - shown[k]) > 5) shown[k] = seat.z;
          shown[k] += (seat.z - shown[k]) * k01;
          const x = laneX(k);
          const z = shown[k];
          poseRacer(racers[k], x, 0, z, seat.ph === 'run' ? seat.r.v : 0, dt);

          if (seat.ph === 'run') {
            const d = dartOf(k, seat.n);
            d.visible = true;
            const aiming = k === mySeat && tapper.actDown;
            d.position.set(x + 0.25, 1.3, z);
            d.rotation.set(aiming ? -(angleFromHold(tapper.holdS) * Math.PI) / 180 : 0, 0, 0);
          } else if (seat.ph === 'fly') {
            const d = dartOf(k, seat.n);
            d.visible = true;
            const f = flightOf(seat.vel, seat.ang);
            const tau = clamp(clock - seat.t0, 0, seat.fly);
            d.position.set(x, H0 + f.vy * tau - 0.5 * G * tau * tau, seat.relZ + f.vh * tau);
            d.rotation.set(-Math.atan2(f.vy - G * tau, f.vh), 0, 0);
          } else {
            // wait or done: the last throw's dart is either stuck in the turf or was a foul (not thrown).
            const idx = seat.marks.length - 1;
            if (idx >= 0) {
              const d = dartOf(k, idx);
              const landed = seat.marks[idx] !== null;
              d.visible = landed;
              if (landed) {
                const f = flightOf(seat.vel, seat.ang);
                d.position.set(x, 0.15, seat.relZ + f.vh * seat.fly);
                d.rotation.set(-Math.atan2(f.vy - G * seat.fly, f.vh), 0, 0);
              }
            }
          }
        });

        // Camera: my seat (seat 0 when watching). Follow the dart once it is in flight or has landed.
        const f = mySeat ?? 0;
        const fs = s.seats[f];
        const lastM = fs.marks.length - 1;
        if (fs.ph === 'fly' || ((fs.ph === 'wait' || fs.ph === 'done') && lastM >= 0 && fs.marks[lastM] !== null)) {
          const idx = fs.ph === 'fly' ? fs.n : lastM;
          focus.copy(dartOf(f, idx).position);
          offset.set(-7, 5, -10);
        } else {
          focus.set(laneX(f), 1, shown[f]);
          offset.set(-8, 4, -6);
        }
        followCamera(camera, focus, offset, dt);

        // Board rows: best mark, else FOUL, else a dash, plus the throw count.
        s.seats.forEach((seat, k) => {
          const best = bestMark(seat.marks);
          const txt = best !== null ? `${best.toFixed(2)} m` : seat.marks.includes(null) ? 'FOUL' : '—';
          board.set(k, `${txt}  (${Math.min(seat.n + 1, THROWS)}/${THROWS})`);
        });

        if (mySeat !== null) {
          const me = s.seats[mySeat];
          if (me.marks.length > seenMarks) {
            seenMarks = me.marks.length;
            const m = me.marks[me.marks.length - 1];
            if (m === null) board.banner('FOUL!', '#ff5252');
            else board.banner(`${m.toFixed(2)} m`, '#ffd54f');
          }
          if (tapper.lastSlipAt !== lastSlipSeen) {
            lastSlipSeen = tapper.lastSlipAt;
            if (me.ph === 'run') board.banner('STUMBLE!', '#ff5252', 600);
          }
          board.hint(me.ph === 'run' ? 'Alternate A/D — hold THROW to aim, release before the line' : '');
          meter.set(tapper.actDown ? angleFromHold(tapper.holdS) : null);
        } else {
          board.hint('');
          meter.set(null);
        }
      },

      input(pad) {
        const c = tapper.sample(pad);
        if (c.acts > lastActs) {
          lastActs = c.acts;
          angle = Math.round(angleFromHold(tapper.holdS) * 100) / 100;
        }
        return { ...c, angle };
      },

      dispose() {
        tapper.dispose();
        meter.dispose();
      },
    };
  },
};

export default def;
