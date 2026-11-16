// Gnome Sprint: a 100 m dash for four gnomes. Alternate A and D (or the ◀ ▶ buttons) to run; the same key twice is
// a stumble that costs most of the speed and ignores taps for a moment. Fastest time wins.
// Pure simulation (init/step/cpu/result) lives here with the view; the shared run model is in olympic/run.ts.
import * as THREE from 'three';
import type { MinigameDef, PadState, SeatInfo } from '@lawn/party';
import { placesFrom } from '../olympic/rank';
import { RUN, cpuSkill, cpuTaps, advanceCpu, newRunner, stepRunner, type Runner, type TapInput } from '../olympic/run';
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
  css,
  followCamera,
  laneX,
  poseRacer,
  textSprite,
} from '../olympic/field';

// ---- Tuning ----
/** Finish line, metres from the start. */
const DIST = 100;
/** The race ends this many seconds after the first finisher, even if others are still running. */
const GRACE_S = 6;
/** Hard time cap, seconds. */
const MAX_S = 30;
/** How fast a finished gnome jogs down the track, m/s per second. */
const JOG_DECEL = 6;
/** A finished gnome jogs no further than this past the line. */
const JOG_PAST = 12;
/** Taps on the HUD hint before it hides. */
const HINT_TAPS = 6;
/** Speed-bar and camera offsets (view only). */
const CAM_FOCUS_AHEAD = 3;
const CAM_OFFSET = new THREE.Vector3(-11, 5, -5);
const EASE_Z = 15;
const EASE_ROT = 12;
/** Face-plant angle while stunned (radians). */
const STUMBLE_TILT = 1.2;

// ---- State and input ----
interface I {
  taps: number;
  slips: number;
  acts: number;
}

interface Seat {
  r: Runner;
  z: number;
  fin: number | null;
  skill: number;
}

interface S {
  t: number;
  seats: Seat[];
  firstFin: number | null;
}

/** Rounds a float for the wire so the state stays small. */
function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

const def: MinigameDef<S, I> = {
  meta: {
    id: 'oly-sprint',
    title: 'Gnome Sprint',
    game: 'gnomylpics',
    goal: 'Run 100 m faster than everyone.',
    controls: 'Alternate A and D (or tap ◀ ▶). The same key twice is a stumble!',
    maxSeconds: MAX_S,
  },

  init(seats: readonly SeatInfo[], rng: () => number): S {
    return {
      t: 0,
      seats: seats.map(() => ({ r: newRunner(), z: 0, fin: null, skill: cpuSkill(rng) })),
      firstFin: null,
    };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    s.seats.forEach((seat, k) => {
      if (seat.fin === null) {
        stepRunner(seat.r, inputs[k], RUN, dt);
        seat.z += seat.r.v * dt;
        if (seat.z >= DIST) {
          seat.fin = round3(s.t - (seat.z - DIST) / Math.max(seat.r.v, 0.01));
          s.firstFin ??= s.t;
        }
      } else {
        seat.r.v = Math.max(0, seat.r.v - JOG_DECEL * dt);
        seat.z = Math.min(DIST + JOG_PAST, seat.z + seat.r.v * dt);
      }
      advanceCpu(seat.r, seat.skill, dt, rng);
    });
  },

  cpu(s, seat, rng) {
    return cpuTaps(s.seats[seat].r, s.seats[seat].skill, rng);
  },

  result(s, timeUp) {
    const allDone = s.seats.every((x) => x.fin !== null);
    const graceOver = s.firstFin !== null && s.t >= s.firstFin + GRACE_S;
    if (!(allDone || graceOver || timeUp)) return null;
    // Finished seats score above every unfinished one (1000 - time is higher for faster); unfinished seats rank by distance.
    return placesFrom(
      s.seats.map((x) => (x.fin !== null ? 1000 - x.fin : x.z)),
      true,
    );
  },

  createView(ctx) {
    const { scene, camera, ui, seats, mySeat } = ctx;
    addSkyAndLights(scene);
    addGrass(scene, 70, 180, -30);
    addTrack(scene, 130, { z0: -10 });
    addLine(scene, 0, 0xffffff, 0.15);
    addLine(scene, DIST, 0xffffff, 0.4);
    addDistanceMarkers(scene, 10, 90, 10);

    // Finish arch: two posts and a crossbar at z = DIST, with a label above.
    const postX = 2 * LANE_W + 0.4;
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 0.15), postMat);
      post.position.set(sx * postX, 1.5, DIST);
      post.castShadow = true;
      scene.add(post);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(postX * 2, 0.15, 0.15), postMat);
    bar.position.set(0, 3, DIST);
    bar.castShadow = true;
    scene.add(bar);
    const finishLabel = textSprite('FINISH', '#ffd54f', 0.6);
    finishLabel.position.set(0, 3.8, DIST);
    scene.add(finishLabel);

    const racers = addRacers(scene, seats);
    const dz = seats.map(() => 0);
    const rot = seats.map(() => 0);

    const board = createBoard(ui, seats, mySeat);
    board.hint('Alternate A ◀ ▶ D  (same key twice = stumble)');

    const tapper = mySeat !== null ? createTapper(ui) : null;
    let seenSlip = tapper ? tapper.lastSlipAt : -Infinity;
    let finBannered = false;

    // Speed bar for my seat only.
    let speedFill: HTMLDivElement | null = null;
    let speedBar: HTMLDivElement | null = null;
    if (mySeat !== null) {
      speedBar = document.createElement('div');
      speedBar.style.cssText =
        'position:absolute;left:12px;bottom:28vh;width:160px;height:14px;border:2px solid #fff;border-radius:8px;overflow:hidden;pointer-events:none';
      speedFill = document.createElement('div');
      speedFill.style.cssText = `height:100%;width:0%;background:${css(seats[mySeat].color)}`;
      speedBar.appendChild(speedFill);
      ui.appendChild(speedBar);
    }

    return {
      render(s, dt) {
        const k1 = 1 - Math.exp(-dt * EASE_Z);
        const kr = 1 - Math.exp(-dt * EASE_ROT);
        s.seats.forEach((seat, k) => {
          dz[k] += (seat.z - dz[k]) * k1;
          const racer = racers[k];
          poseRacer(racer, laneX(k), 0, dz[k], seat.r.v, dt);
          // Stumble: face-plant while stunned, ease back up afterwards.
          const target = seat.r.stun > 0 ? STUMBLE_TILT : 0;
          rot[k] += (target - rot[k]) * kr;
          racer.model.object.rotation.x = rot[k];
          board.set(k, seat.fin !== null ? `${seat.fin.toFixed(2)} s` : `${Math.floor(seat.z)} m`);
        });

        if (mySeat !== null) {
          const mine = s.seats[mySeat];
          if (tapper && tapper.lastSlipAt !== seenSlip) {
            seenSlip = tapper.lastSlipAt;
            board.banner('STUMBLE!', '#ff5252', 700);
          }
          if (mine.fin !== null && !finBannered) {
            finBannered = true;
            board.banner(`${mine.fin.toFixed(2)} s`, '#ffd54f', 2000);
          }
          board.hint(mine.r.taps < HINT_TAPS ? 'Alternate A ◀ ▶ D  (same key twice = stumble)' : '');
          if (speedFill) speedFill.style.width = `${Math.min(100, (mine.r.v / RUN.max) * 100)}%`;
        }

        const focusZ = mySeat !== null ? dz[mySeat] : dz[0];
        followCamera(camera, new THREE.Vector3(0, 1, focusZ + CAM_FOCUS_AHEAD), CAM_OFFSET, dt);
      },
      input(pad: Readonly<PadState>, _s: Readonly<S>): I {
        if (!tapper) return { taps: 0, slips: 0, acts: 0 };
        return tapper.sample(pad);
      },
      dispose() {
        tapper?.dispose();
        speedBar?.remove();
      },
    };
  },
};

export default def;
