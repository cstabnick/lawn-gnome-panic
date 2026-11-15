// Bowl Frame: the game's side-by-side mode (lanes.ts) for four lanes and one frame, every gnome bowling at once.
// Most pins wins. The rules (rack, pins, frame, places), the swipe, the lanes, pins and light are the game's own;
// what is left here is the party glue: the shots counter, the CPU's timing, the drag-to-line-up input and the camera.
// Rules and design: docs/roadmaps/gnome-party/2I-bowling-slice.md. Party rules: packages/party/README.md.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel, type PlayerState } from '@lawn/gnome';
import type { MinigameDef, MinigameView, PadState, ViewCtx } from '@lawn/party';
import { BALL, THROW, type SimResult, type ThrowInput } from '../config';
import { clampThrow, simulateThrow } from '../physics';
import { NPCS, NPC_ORDER, npcThrow } from '../npc';
import { addAlleyLight, buildLaneMeshes } from '../lane';
import { ballAtSample, buildPinModel, posePinsAt, rackPins } from '../pins';
import {
  bowlLane, laneDone, laneMarks, laneOffset, lanePins, laneReady, lastBigMark, newLane, placeLanes, tickLane, type Lane,
} from '../lanes';
import { SWIPE, speedFor, swipeThrow, trimSwipe, type SwipeSample } from '../swipe';

/** One frame each. */
const FRAMES = 1;
/** Where the gnome stands, behind the foul line (lane coordinates). */
const GNOME_Z = -0.9;
/** A CPU bowler starts its run-up this long after its lane is ready. */
const CPU_THINK_S = 0.7;
const DRAG_PX_PER_M = 300;
const KEY_SPEED_M_S = 0.4;
const CHARGE_S = 1;

interface SeatLane extends Lane {
  /** The host's count of throws it has started on this lane (the view's shots counter is acknowledged when this catches up). */
  lastShots: number;
}
interface S { t: number; lanes: SeatLane[] }
interface I extends ThrowInput { shots: number }

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const r3 = (v: number): number => Math.round(v * 1e3) / 1e3;
const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;

/** A throw rounded for the wire: the state goes to every seat, and short numbers keep it small. */
function forWire(i: ThrowInput): ThrowInput {
  const c = clampThrow(i);
  return { x: r4(c.x), aim: r4(c.aim), speed: r3(c.speed), spin: r3(c.spin) };
}

const def: MinigameDef<S, I> = {
  meta: {
    id: 'bowl-frame',
    title: 'Bowl Frame',
    game: 'gnome-bowling',
    goal: 'Knock down the most pins in one frame.',
    controls: 'Drag sideways to line up, then swipe up to bowl (keys: ←/→ move, hold Space, release to bowl).',
    maxSeconds: 45,
  },

  init(seats) {
    return { t: 0, lanes: seats.map(() => ({ ...newLane(), lastShots: 0 })) };
  },

  step(s, inputs, dt) {
    s.t += dt;
    s.lanes.forEach((lane, k) => {
      tickLane(lane, s.t, FRAMES);
      const i = inputs[k];
      if (!i || !laneReady(lane, s.t, FRAMES)) return;
      const c = forWire(i);
      lane.x = c.x;
      // A counter, not a flag: a throw happens once per increase of shots.
      if (i.shots > lane.lastShots) {
        lane.lastShots = i.shots;
        bowlLane(lane, c, s.t, FRAMES);
      }
    });
  },

  cpu(s, seat, rng) {
    const lane = s.lanes[seat];
    // One call per ball: step launches the throw in the same tick, so the flight is set before the next call.
    if (laneReady(lane, s.t, FRAMES) && s.t >= lane.readyAt + CPU_THINK_S) {
      return { ...npcThrow(NPCS[NPC_ORDER[seat]], lane.standing, rng), shots: lane.lastShots + 1 };
    }
    return { x: lane.x, aim: 0, speed: THROW.speedMin, spin: 0, shots: lane.lastShots };
  },

  result(s, timeUp) {
    if (!timeUp && !s.lanes.every((l) => laneDone(l, FRAMES))) return null;
    return placeLanes(s.lanes, FRAMES);
  },

  report(s) {
    const lanesOut = s.lanes;
    return {
      stats: [
        { key: 'pins', label: 'Pins', format: 'int', better: 'higher' },
        { key: 'marks', label: 'Marks', format: 'text' },
      ],
      values: lanesOut.map((l) => ({
        pins: lanePins(l),
        marks: laneMarks(l).join(' ') || null,
      })),
      notes: lanesOut.map((l) => {
        if (l.rolls.length === 0) return null;
        const big = lastBigMark(l);
        if (big === 'X') return 'Strike!';
        if (big === '/') return 'Spare';
        if (laneMarks(l).includes('-')) return 'Gutter ball';
        return null;
      }),
    };
  },

  createView(ctx: ViewCtx): MinigameView<S, I> {
    const { scene, camera, renderer, ui, seats, mySeat } = ctx;
    addAlleyLight(scene, renderer, 6);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ color: 0x140a24, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.65, 15);
    scene.add(floor);

    const hud = document.createElement('div');
    hud.style.cssText = 'position:absolute;inset:0;pointer-events:none;font:700 18px system-ui;text-shadow:0 2px 4px #000;overflow:hidden';
    ui.appendChild(hud);

    interface LaneView {
      root: THREE.Group;
      pins: THREE.Group[];
      ball: THREE.Mesh;
      gnome: GnomeModel;
      pose: PlayerState;
      /** The gnome's x in lane coordinates, smoothed toward lane.x. */
      x: number;
      /** The replayed throw, cached by its start time. el is the replay's own clock (seconds into the throw). */
      cache: { t0: number; sim: SimResult; el: number } | null;
      tag: HTMLElement;
      text: string;
    }

    const views: LaneView[] = seats.map((seat, k) => {
      const root = buildLaneMeshes();
      root.position.x = laneOffset(k, seats.length);
      scene.add(root);
      const pins = Array.from({ length: 10 }, () => {
        const g = buildPinModel();
        root.add(g);
        return g;
      });
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(BALL.radius, 24, 16),
        new THREE.MeshStandardMaterial({ color: seat.color, roughness: 0.25 }),
      );
      ball.castShadow = true;
      root.add(ball);
      const gnome = createGnomeModel(seat.look);
      scene.add(gnome.object);
      const pose: PlayerState = {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        facing: 0,
        grounded: true,
        jumpsUsed: 0,
      };
      const tag = document.createElement('div');
      tag.style.cssText = `position:absolute;top:52px;transform:translateX(-50%);white-space:nowrap;color:#${seat.color.toString(16).padStart(6, '0')}`;
      hud.appendChild(tag);
      return { root, pins, ball, gnome, pose, x: 0, cache: null, tag, text: '' };
    });

    // ---- my input: drag sideways to line up, swipe up to bowl (the game's swipe); keys move and charge ----
    let myX = 0;
    let shots = 0;
    let thrown: Omit<ThrowInput, 'x'> = { aim: 0, speed: THROW.speedMin, spin: 0 };
    let drag: { x: number; myX0: number; samples: SwipeSample[] } | null = null;
    let keyDown = false;
    let keyStart = 0;
    let last = performance.now();

    const canvasW = (): number => renderer.domElement.clientWidth || 1;
    const canvasH = (): number => renderer.domElement.clientHeight || 1;
    /** A pad pointer (NDC, y up) as a screen-px swipe sample (y down). */
    const toPx = (p: { x: number; y: number }, t: number): SwipeSample => ({
      x: ((p.x + 1) / 2) * canvasW(),
      y: ((1 - p.y) / 2) * canvasH(),
      t,
    });
    const fire = (t: Omit<ThrowInput, 'x'>): void => {
      shots += 1;
      thrown = t;
    };
    const ready = (s: Readonly<S>): boolean => {
      if (mySeat === null) return false;
      const l = s.lanes[mySeat];
      // shots <= lastShots: the host has taken my last throw, so a double tap cannot queue a second ball.
      return laneReady(l, s.t, FRAMES) && shots <= l.lastShots;
    };

    // Camera first: the labels are placed where their lanes project on screen.
    const placeTag = (v: LaneView): void => {
      const p = new THREE.Vector3(v.root.position.x, 1.0, 6).project(camera);
      v.tag.style.left = `${((p.x + 1) / 2) * canvasW()}px`;
    };

    return {
      render(s, dt) {
        // Behind and above my lane, looking down it; the middle when watching.
        const cx = mySeat === null ? 0 : laneOffset(mySeat, seats.length);
        camera.position.set(cx, 2.4, -4.2);
        camera.lookAt(cx, 0.4, 18);
        camera.updateMatrixWorld();

        const ease = 1 - Math.exp(-dt * 15);
        views.forEach((v, k) => {
          const lane = s.lanes[k];
          v.x += (lane.x - v.x) * ease;
          v.pose.position.set(v.root.position.x + v.x, 0, GNOME_Z);
          v.gnome.update(v.pose, dt);

          const f = lane.flight;
          if (f) {
            // Replay the throw from its input on the rack it met: the same deterministic simulation the host ran.
            if (!v.cache || v.cache.t0 !== f.t0) {
              v.cache = { t0: f.t0, sim: simulateThrow(f.input, lane.standing), el: Math.max(0, s.t - f.t0) };
            } else {
              v.cache.el += dt;
            }
            // The replay runs on its own clock; snapshots (15/s) only correct it when it drifts past 0.25 s.
            const target = s.t - f.t0;
            if (Math.abs(v.cache.el - target) > 0.25) v.cache.el = target;
            const { sim, el } = v.cache;
            const at = el / sim.sampleDt;
            const b = ballAtSample(sim, at);
            v.ball.visible = true;
            v.ball.position.set(b.x, b.y, b.z);
            v.ball.rotation.x = b.roll;
            posePinsAt(v.pins, sim, at);
          } else {
            v.cache = null;
            v.ball.visible = !laneDone(lane, FRAMES);
            v.ball.position.set(v.x, 0.35, GNOME_Z + 0.3);
            v.ball.rotation.x = 0;
            rackPins(v.pins, lane.standing);
          }

          placeTag(v);
          const mark = lastBigMark(lane);
          const text = `${seats[k].name}  ${lanePins(lane)}${mark === 'X' ? '  STRIKE!' : mark === '/' ? '  SPARE!' : ''}`;
          if (text !== v.text) {
            v.text = text;
            v.tag.textContent = text;
          }
        });
      },

      input(pad: Readonly<PadState>, s: Readonly<S>): I {
        const now = performance.now();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        const canThrow = ready(s);
        const p = pad.pointer;
        if (p?.down) {
          if (!drag) drag = { x: p.x, myX0: myX, samples: [] };
          drag.samples.push(toPx(p, now));
          trimSwipe(drag.samples, now);
          // Dragging right moves the ball right on screen, which is -x (the bowler's right).
          myX = clamp(drag.myX0 - ((p.x - drag.x) * canvasW()) / 2 / DRAG_PX_PER_M, -THROW.xRange, THROW.xRange);
        } else if (drag) {
          // The release is a sample too: a fast flick ends between two pointer frames, so it must count.
          const prev = drag.samples[drag.samples.length - 1];
          drag.samples.push(p ? toPx(p, now) : { ...prev, t: now });
          const r = canThrow ? swipeThrow(drag.samples, SWIPE.defaultSpin, 0, canvasW(), canvasH()) : null;
          if (r) fire({ aim: r.aim, speed: r.speed, spin: r.spin });
          drag = null;
        } else {
          if (pad.x) myX = clamp(myX - pad.x * KEY_SPEED_M_S * dt, -THROW.xRange, THROW.xRange);
          if (pad.a && !keyDown) {
            keyDown = true;
            keyStart = now;
          } else if (!pad.a && keyDown) {
            keyDown = false;
            // No meter on screen here, so the hold ramps 0 -> full over CHARGE_S instead of the game's swinging meter.
            if (canThrow) fire({ aim: 0, speed: speedFor((now - keyStart) / 1000 / CHARGE_S), spin: SWIPE.defaultSpin });
          }
        }
        return { x: myX, ...thrown, shots };
      },
    };
  },
};

export default def;
