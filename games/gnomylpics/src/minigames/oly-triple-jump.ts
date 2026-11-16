// Triple Gnome Jump: a Gnome Party slice of gnomylpics. Alternate A/D to sprint down the runway, press JUMP to take
// off before the red foul line, then press JUMP each time you land (hop, skip, jump). Timing keeps your speed.
// Best of two attempts; the longest mark wins.
//
// Rules that keep a slice working in the party (packages/party/README.md):
//  - Built from this game's own olympic kit (src/olympic/*). Never copy game code here.
//  - init/step/cpu/result are pure: no DOM, no three objects in the state, and only the rng argument for randomness.
//  - State S and input I are plain JSON. S stays under 2 KB.
//  - Input is a level sampled 15 times a second online. One-off actions are counters the view increments.
//  - CPU memory (timers, targets) lives in S and step() updates it.
import * as THREE from 'three';
import { STEP_S, type MinigameDef } from '@lawn/party';
import { bestMark, placesFrom } from '../olympic/rank';
import { RUN, advanceCpu, cpuSkill, cpuTaps, newRunner, stepRunner, type Runner, type TapInput } from '../olympic/run';
import { createTapper } from '../olympic/taps';
import {
  LANE_W,
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

// ---- Tuning ----
const RUNWAY = 22; // foul line z
const ZONE = 4; // take-off counts only when z >= RUNWAY - ZONE
const MULT = [0.5, 0.42, 0.62]; // phase distance = vj * MULT[j] (hop, skip, jump)
const AIR = [0.5, 0.45, 0.7]; // seconds in the air per phase
const HEIGHT = [0.6, 0.5, 0.9]; // view only: arc height per phase
const PERFECT = 0.15; // landing timing window (seconds either side of the landing): keeps all speed
const GOOD = 0.3; // landing timing window: keeps GOOD_KEEP of the speed
const GOOD_KEEP = 0.85; // speed kept on a GOOD landing (PERFECT keeps 1.0)
// Online, a JUMP press reaches the host up to one input send plus latency late. The view stamps each press with
// its own clock (the host's time as this screen shows it), and the host judges the press by that stamp, trusting it
// up to LATE_GRACE seconds back. It also waits LATE_GRACE past the GOOD window before calling a FLOP.
const LATE_GRACE = 0.25;
const MAX_EXTRAP = 0.2; // view only: how far past the last snapshot the local clock runs on its own
const ATTEMPTS = 2;
const PAUSE = 1.6; // seconds between attempts
const ROUND_MAX_S = 40;

// View only.
const DISC_R = 0.18;
const DISC_Y = 0.02;
const DISC_COLOR = 0x8a6d3b;
const TAKEOFF_ZONE_COLOR = 0xe08a5a;
const SAND_COLOR = 0xe6c27a;
const FOUL_LINE_COLOR = 0xff1744;
const SAND_FROM = RUNWAY + 8;
const SAND_TO = RUNWAY + 24;
const TRACK_LEN = RUNWAY + 13;
const TRACK_Z0 = -5;

type Ph = 'run' | 'air' | 'wait' | 'done';

interface Seat {
  r: Runner;
  z: number;
  ph: Ph;
  j: number;
  t0: number;
  z0: number;
  z1: number;
  vj: number;
  actT: number;
  att: number;
  marks: (number | null)[];
  msg: string;
  skill: number;
  cpuTake: number;
  cpuOff: number;
}

interface S {
  t: number;
  seats: Seat[];
}

/** TapInput plus `at`: the view clock (state time) when the latest JUMP press went down. */
type I = TapInput & { at?: number };

const round2 = (x: number): number => Math.round(x * 100) / 100;
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** A CPU's plan for one attempt: when it takes off (z) and how far off the landing it presses (seconds). */
function drawPlan(seat: Seat, rng: () => number): void {
  seat.cpuTake = RUNWAY - 0.3 - (1 - seat.skill) * 3 * rng();
  seat.cpuOff = (rng() * 2 - 1) * (1 - seat.skill) * 0.45;
}

function strip(scene: THREE.Scene, z0: number, z1: number, color: number, y: number): void {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(4 * LANE_W, z1 - z0),
    new THREE.MeshStandardMaterial({ color }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, y, (z0 + z1) / 2);
  m.receiveShadow = true;
  scene.add(m);
}

const def: MinigameDef<S, I> = {
  meta: {
    id: 'oly-triple-jump',
    title: 'Triple Gnome Jump',
    game: 'gnomylpics',
    goal: 'Jump the farthest from the red line in two tries.',
    controls: 'Alternate A and D to run, JUMP (Space or the button) before the red line, then JUMP each time you land.',
    maxSeconds: ROUND_MAX_S,
  },

  init(seats, rng) {
    return {
      t: 0,
      seats: seats.map(() => {
        const seat: Seat = {
          r: newRunner(),
          z: 0,
          ph: 'run',
          j: 0,
          t0: 0,
          z0: 0,
          z1: 0,
          vj: 0,
          actT: -1,
          att: 0,
          marks: [],
          msg: '',
          skill: cpuSkill(rng),
          cpuTake: 0,
          cpuOff: 0,
        };
        drawPlan(seat, rng);
        return seat;
      }),
    };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    s.seats.forEach((seat, k) => {
      const inp = inputs[k] ?? null;
      const newActs = stepRunner(seat.r, inp, RUN, dt);
      if (newActs > 0) {
        const at = inp?.at;
        seat.actT = typeof at === 'number' && Number.isFinite(at) ? Math.min(s.t, Math.max(s.t - LATE_GRACE, at)) : s.t;
      }

      if (seat.ph === 'run') {
        seat.z += seat.r.v * dt;
        if (seat.actT >= 0 && seat.z >= RUNWAY - ZONE && seat.z <= RUNWAY) {
          // Take-off.
          seat.vj = seat.r.v;
          seat.j = 0;
          seat.ph = 'air';
          seat.t0 = s.t;
          seat.z0 = seat.z;
          seat.z1 = seat.z + seat.vj * MULT[0];
          seat.actT = -1;
        } else if (seat.actT >= 0 && seat.z <= RUNWAY) {
          // Pressed before the take-off zone: ignored. (Past the red line it falls through to the foul.)
          seat.actT = -1;
        } else if (seat.z > RUNWAY) {
          seat.marks.push(null);
          seat.msg = 'FOUL';
          seat.ph = 'wait';
          seat.t0 = s.t;
        }
      } else if (seat.ph === 'air') {
        const landT = seat.t0 + AIR[seat.j];
        if (seat.j < 2) {
          const late = seat.actT > landT + GOOD;
          if (seat.actT >= 0 && seat.actT >= landT - GOOD && !late && s.t >= landT) {
            // Good landing: press on time, carry on to the next phase.
            const d = Math.abs(seat.actT - landT);
            const keep = d <= PERFECT ? 1 : GOOD_KEEP;
            seat.msg = d <= PERFECT ? 'PERFECT' : 'GOOD';
            seat.z0 = seat.z1;
            seat.vj *= keep;
            seat.j += 1;
            seat.t0 = landT;
            seat.z1 = seat.z0 + seat.vj * MULT[seat.j];
            seat.actT = -1;
          } else if (seat.actT >= 0 && seat.actT < landT - GOOD) {
            // Too early: ignored.
            seat.actT = -1;
          } else if ((seat.actT >= 0 && late) || s.t > landT + GOOD + LATE_GRACE) {
            // Missed the landing press (pressed too late, or no press arrived in time): the jump ends here.
            const mark = round2(seat.z1 - RUNWAY);
            seat.marks.push(mark);
            seat.msg = 'FLOP';
            seat.z = seat.z1;
            seat.ph = 'wait';
            seat.t0 = s.t;
          }
        } else if (s.t >= landT) {
          // Final landing.
          const mark = round2(seat.z1 - RUNWAY);
          seat.marks.push(mark);
          seat.msg = `${mark.toFixed(2)} m`;
          seat.z = seat.z1;
          seat.ph = 'wait';
          seat.t0 = s.t;
        }
      } else if (seat.ph === 'wait') {
        if (s.t - seat.t0 >= PAUSE) {
          seat.att += 1;
          if (seat.att >= ATTEMPTS) {
            seat.ph = 'done';
          } else {
            seat.z = 0;
            seat.r.v = 0;
            seat.ph = 'run';
            seat.actT = -1;
            seat.msg = '';
            drawPlan(seat, rng);
          }
        }
      }

      advanceCpu(seat.r, seat.skill, dt, rng);
    });
  },

  cpu(s, seat, rng) {
    const me = s.seats[seat];
    const i = cpuTaps(me.r, me.skill, rng);
    let acts = me.r.acts;
    // Looks one step ahead: a press made after z has passed the window would land past the take-off zone.
    if (me.ph === 'run' && me.z + me.r.v * STEP_S >= me.cpuTake && me.z <= RUNWAY && me.actT < 0) {
      acts = me.r.acts + 1;
    } else if (me.ph === 'air' && me.j < 2 && me.actT < 0 && s.t >= me.t0 + AIR[me.j] + me.cpuOff) {
      acts = me.r.acts + 1;
    }
    if (me.ph === 'wait' || me.ph === 'done') {
      return { taps: me.r.taps, slips: me.r.slips, acts };
    }
    return { taps: i.taps, slips: i.slips, acts };
  },

  result(s, timeUp) {
    if (!timeUp && !s.seats.every((x) => x.ph === 'done')) return null;
    return placesFrom(
      s.seats.map((x) => bestMark(x.marks, true)),
      true,
    );
  },

  createView(ctx) {
    const { scene, camera, ui, seats, mySeat } = ctx;
    addSkyAndLights(scene);
    addGrass(scene, 60, 120, -20);
    addTrack(scene, TRACK_LEN, { z0: TRACK_Z0 });
    strip(scene, RUNWAY - ZONE, RUNWAY, TAKEOFF_ZONE_COLOR, 0.013);
    addLine(scene, RUNWAY, FOUL_LINE_COLOR, 0.2);
    strip(scene, SAND_FROM, SAND_TO, SAND_COLOR, 0.014);
    addDistanceMarkers(scene, SAND_FROM, RUNWAY + 20, 2, RUNWAY);

    const racers = addRacers(scene, seats);
    const board = createBoard(ui, seats, mySeat);
    const tapper = createTapper(ui, mySeat === null ? { tapButtons: false } : { actLabel: 'JUMP' });

    const dispZ = seats.map(() => 0);
    const drawn = seats.map(() => 0);
    let clock = 0;
    let lastT = -1;
    let sinceSnap = 0;
    let lastMsg = '';
    let lastSlip = -Infinity;
    let pressAt: number | null = null;

    return {
      render(s, dt) {
        // Local clock: runs in real time every frame and eases onto the state's time, extrapolated since the last
        // snapshot (15 a second online), so the arc is smooth and the landing shows when it happens.
        if (s.t !== lastT) {
          lastT = s.t;
          sinceSnap = 0;
        } else {
          sinceSnap += dt;
        }
        const target = s.t + Math.min(sinceSnap, MAX_EXTRAP);
        clock += dt;
        if (Math.abs(target - clock) > 0.25) clock = target;
        else clock += (target - clock) * (1 - Math.exp(-dt * 8));

        s.seats.forEach((seat, k) => {
          let y = 0;
          let z: number;
          let speed: number;
          if (seat.ph === 'air') {
            const u = clamp01((clock - seat.t0) / AIR[seat.j]);
            z = seat.z0 + (seat.z1 - seat.z0) * u;
            y = Math.sin(Math.PI * u) * HEIGHT[seat.j];
            speed = seat.vj;
            dispZ[k] = z;
          } else {
            const target = seat.z;
            if (Math.abs(target - dispZ[k]) > 3) dispZ[k] = target;
            else dispZ[k] += (target - dispZ[k]) * (1 - Math.exp(-dt * 15));
            z = dispZ[k];
            speed = seat.ph === 'run' ? seat.r.v : 0;
          }
          poseRacer(racers[k], laneX(k), y, z, speed, dt);

          // A landing mark for every real jump, drawn once.
          while (drawn[k] < seat.marks.length) {
            const m = seat.marks[drawn[k]];
            drawn[k] += 1;
            if (m === null) continue;
            const disc = new THREE.Mesh(
              new THREE.CircleGeometry(DISC_R, 16),
              new THREE.MeshStandardMaterial({ color: DISC_COLOR }),
            );
            disc.rotation.x = -Math.PI / 2;
            disc.position.set(laneX(k), DISC_Y, RUNWAY + m);
            scene.add(disc);
          }

          const best = bestMark(seat.marks, true);
          const text = best !== null ? `${best.toFixed(2)} m` : seat.marks.length ? 'FOUL' : '—';
          board.set(k, `${text}  (${Math.min(seat.att + 1, 2)}/2)`);
        });

        const myZ = dispZ[mySeat ?? 0];
        followCamera(camera, new THREE.Vector3(0, 1, myZ + 2), new THREE.Vector3(-10, 4.5, -4), dt);

        if (mySeat !== null) {
          const me = s.seats[mySeat];
          if (me.msg !== '' && me.msg !== lastMsg) {
            board.banner(me.msg, me.msg === 'FOUL' || me.msg === 'FLOP' ? '#ff5252' : '#ffd54f', 1000);
          }
          lastMsg = me.msg;
          const slip = tapper.lastSlipAt;
          if (slip !== lastSlip) {
            lastSlip = slip;
            board.banner('STUMBLE!', '#ff5252', 600);
          }
          board.hint(
            me.ph === 'run' ? 'Alternate A/D — JUMP before the red line' : me.ph === 'air' ? 'JUMP as you land!' : '',
          );
        } else {
          board.hint('');
        }
      },
      input(pad) {
        const before = tapper.actDown;
        const i = tapper.sample(pad);
        if (tapper.actDown && !before) pressAt = clock;
        return pressAt === null ? i : { ...i, at: pressAt };
      },
      dispose() {
        tapper.dispose();
      },
    };
  },
};

export default def;
