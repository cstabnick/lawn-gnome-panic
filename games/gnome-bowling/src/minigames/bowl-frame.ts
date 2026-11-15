// Bowl Frame: one frame of ten-pin, four lanes side by side, every gnome bowling at once. Most pins wins.
// Built from the game's own modules: physics (simulateThrow), npc (npcThrow), lane and pins (the scene pieces).
// Rules and design: docs/roadmaps/gnome-party/2I-bowling-slice.md. Party rules: packages/party/README.md.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel, type PlayerState } from '@lawn/gnome';
import type { MinigameDef, MinigameView, PadState, ViewCtx } from '@lawn/party';
import { BALL, LOOK_COLORS, PIN_SPOTS, THROW, type SimResult, type ThrowInput } from '../config';
import { clampThrow, simulateThrow } from '../physics';
import { NPCS, NPC_ORDER, npcThrow } from '../npc';
import { buildLaneMeshes } from '../lane';
import { buildPinModel, poseFromSample } from '../pins';
import { frameMarks } from '../scoring';

/** Seat k's lane is shown at x = (1.5 - k) * LANE_SPACING: seat 0 on the left, as in the HUD. The sim never needs the offset. */
const LANE_SPACING = 2.4;
/** Where the gnome stands, behind the foul line (lane coordinates). */
const GNOME_Z = -0.9;
/** Seconds from the last pin falling to the next state change (the pinsetter's sweep). */
const RESOLVE_AFTER_S = 0.6;
/** Seconds between a resolved ball and the next throw being allowed. */
const READY_AFTER_S = 0.8;
/** A CPU bowler starts its run-up this long after its lane is ready. */
const CPU_THINK_S = 0.7;
const DRAG_PX_PER_M = 300;
const SWIPE_MIN_PX_S = 500;
const SWIPE_MAX_PX_S = 2500;
const KEY_SPEED_M_S = 0.4;
const CHARGE_S = 1;
const TRAIL_MS = 150;

interface Flight { input: ThrowInput; t0: number; dur: number; down: boolean[] }
interface Lane {
  standing: boolean[];
  /** Balls thrown so far in this frame (0, 1 or 2). */
  ball: 0 | 1 | 2;
  /** Pins knocked by each ball so far, in order. The total, strike and spare all come from this. */
  rolls: number[];
  /** The host's count of throws it has started on this lane (the view's shots counter is acknowledged when this catches up). */
  lastShots: number;
  readyAt: number;
  doneAt: number;
  x: number;
  flight: Flight | null;
}
interface S { t: number; lanes: Lane[] }
interface I extends ThrowInput { shots: number }

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const r3 = (v: number): number => Math.round(v * 1e3) / 1e3;
const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;

/**
 * A throw as it goes into the state: clamped (clampThrow, the same as the game) then rounded. Rounding is slice-only:
 * the state is sent to every seat, and short numbers keep it small and make host and view replay the same throw.
 */
function forWire(i: ThrowInput): ThrowInput {
  const c = clampThrow(i);
  return { x: r4(c.x), aim: r4(c.aim), speed: r3(c.speed), spin: r3(c.spin) };
}

const total = (l: Lane): number => l.rolls.reduce((a, b) => a + b, 0);
/** Scoreboard marks of the first frame (the only one this slice bowls): 'X' strike, '/' spare, digits, '-' zero. */
const marks = (l: Lane): string[] => frameMarks(l.rolls)[0] ?? [];
const isStrike = (l: Lane): boolean => marks(l)[0] === 'X';
const isSpare = (l: Lane): boolean => marks(l).includes('/');

const rank = (l: Lane): number => (isStrike(l) ? 2 : isSpare(l) ? 1 : 0);
/** A lane that is still bowling sorts after every finished one when places are decided at the time cap. */
const finishedAt = (l: Lane): number => (l.ball === 2 ? l.doneAt : Infinity);

/** True when lane a places above lane b: more pins, then strike over spare over neither, then the earlier finish. */
function beats(a: Lane, b: Lane): boolean {
  const ta = total(a);
  const tb = total(b);
  if (ta !== tb) return ta > tb;
  if (rank(a) !== rank(b)) return rank(a) > rank(b);
  return finishedAt(a) < finishedAt(b);
}

const offsetOf = (k: number): number => (1.5 - k) * LANE_SPACING;

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
    return {
      t: 0,
      lanes: seats.map(() => ({
        standing: Array.from({ length: 10 }, () => true),
        ball: 0,
        rolls: [],
        lastShots: 0,
        readyAt: 0,
        doneAt: 0,
        x: 0,
        flight: null,
      })),
    };
  },

  step(s, inputs, dt) {
    s.t += dt;
    s.lanes.forEach((lane, k) => {
      if (lane.ball === 2) return;
      const f = lane.flight;
      if (f) {
        if (s.t < f.t0 + f.dur + RESOLVE_AFTER_S) return;
        // The pins that were down this ball are now down for good.
        const knocked = f.down.filter(Boolean).length;
        lane.standing = lane.standing.map((up, p) => up && !f.down[p]);
        lane.rolls.push(knocked);
        if (lane.ball === 0 && knocked < 10) lane.ball = 1;
        else lane.ball = 2;
        lane.flight = null;
        lane.readyAt = s.t + READY_AFTER_S;
        if (lane.ball === 2) lane.doneAt = s.t;
        return;
      }
      const i = inputs[k];
      if (!i || s.t < lane.readyAt) return;
      const c = forWire(i);
      lane.x = c.x;
      // A counter, not a flag: a throw happens once per increase of shots.
      if (i.shots > lane.lastShots) {
        lane.lastShots = i.shots;
        const r = simulateThrow(c, lane.standing);
        lane.flight = { input: c, t0: s.t, dur: r3(r.duration), down: r.down };
      }
    });
  },

  cpu(s, seat, rng) {
    const lane = s.lanes[seat];
    // One call per ball: step launches the throw in the same tick, so the flight is set before the next call.
    if (lane.ball < 2 && lane.flight === null && s.t >= lane.readyAt + CPU_THINK_S) {
      return { ...npcThrow(NPCS[NPC_ORDER[seat]], lane.standing, rng), shots: lane.lastShots + 1 };
    }
    return { x: lane.x, aim: 0, speed: THROW.speedMin, spin: 0, shots: lane.lastShots };
  },

  result(s, timeUp) {
    const done = s.lanes.every((l) => l.ball === 2);
    if (!done && !timeUp) return null;
    // A place is the number of lanes that beat this one; equal lanes share.
    return s.lanes.map((a) => s.lanes.filter((b) => beats(b, a)).length);
  },

  createView(ctx: ViewCtx): MinigameView<S, I> {
    const { scene, camera, renderer, ui, seats, mySeat } = ctx;
    renderer.shadowMap.enabled = true;
    scene.background = new THREE.Color(LOOK_COLORS.background);
    scene.fog = new THREE.Fog(LOOK_COLORS.background, 30, 70);
    // Lights as in the base game's app: hemisphere fill and a key light over the lanes.
    scene.add(new THREE.HemisphereLight(0xfff0f8, 0x302040, 1.1));
    const key = new THREE.DirectionalLight(0xfff4e8, 2.0);
    key.position.set(2, 8, 4);
    key.target.position.set(0, 0, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera;
    sc.left = -6;
    sc.right = 6;
    sc.top = 16;
    sc.bottom = -16;
    sc.near = 0.5;
    sc.far = 40;
    scene.add(key, key.target);
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
      /** The replayed flight, cached by its start time. el is the replay's own clock (seconds into the flight). */
      cache: { t0: number; before: boolean[]; sim: SimResult; el: number } | null;
      tag: HTMLElement;
      text: string;
    }

    const views: LaneView[] = seats.map((seat, k) => {
      const root = buildLaneMeshes();
      root.position.x = offsetOf(k);
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

    // ---- my input: drag sideways to line up, swipe up to bowl; keys move and charge ----
    let myX = 0;
    let shots = 0;
    let aim = 0;
    let speed: number = THROW.speedMin;
    let drag: { x: number; y: number; myX0: number; trail: { x: number; y: number; t: number }[] } | null = null;
    let keyDown = false;
    let keyStart = 0;
    let last = performance.now();

    const canvasW = (): number => renderer.domElement.clientWidth || 1;
    const canvasH = (): number => renderer.domElement.clientHeight || 1;
    const fire = (sp: number, ai: number): void => {
      shots += 1;
      speed = sp;
      aim = ai;
    };
    const ready = (s: Readonly<S>): boolean => {
      if (mySeat === null) return false;
      const l = s.lanes[mySeat];
      // shots <= lastShots: the host has taken my last throw, so a double tap cannot queue a second ball.
      return l.ball < 2 && l.flight === null && s.t >= l.readyAt && shots <= l.lastShots;
    };

    // Camera first: the labels are placed where their lanes project on screen.
    const placeTag = (v: LaneView): void => {
      const p = new THREE.Vector3(v.root.position.x, 1.0, 6).project(camera);
      v.tag.style.left = `${((p.x + 1) / 2) * canvasW()}px`;
    };

    return {
      render(s, dt) {
        // Behind and above my lane, looking down it; the middle when watching.
        const cx = mySeat === null ? 0 : offsetOf(mySeat);
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
            // Replay the throw from its inputs: the same deterministic simulation the host ran.
            if (!v.cache || v.cache.t0 !== f.t0) {
              // Standing before this ball = standing now, plus the pins it knocked down.
              const before = lane.standing.map((up, p) => up || f.down[p]);
              v.cache = { t0: f.t0, before, sim: simulateThrow(f.input, before), el: Math.max(0, s.t - f.t0) };
            } else {
              v.cache.el += dt;
            }
            // The replay runs on its own clock; snapshots (15/s) only correct it when it drifts past 0.25 s.
            const target = s.t - f.t0;
            if (Math.abs(v.cache.el - target) > 0.25) v.cache.el = target;
            const { sim, before } = v.cache;
            const idx = Math.min(sim.ball.length - 1, Math.max(0, Math.floor(v.cache.el / sim.sampleDt)));
            const b = sim.ball[idx];
            v.ball.visible = true;
            v.ball.position.set(b.x, b.y, b.z);
            v.ball.rotation.x = b.roll;
            v.pins.forEach((g, p) => {
              const track = sim.pins[p];
              if (!before[p] || track.length === 0) {
                g.visible = false;
                return;
              }
              const pin = track[Math.min(idx, track.length - 1)];
              if (pin.y < -0.3) {
                g.visible = false;
                return;
              }
              poseFromSample(g, pin);
              g.visible = true;
            });
          } else {
            v.cache = null;
            v.ball.visible = lane.ball < 2;
            v.ball.position.set(v.x, 0.35, GNOME_Z + 0.3);
            v.ball.rotation.x = 0;
            v.pins.forEach((g, p) => {
              const [px, pz] = PIN_SPOTS[p];
              g.visible = lane.standing[p];
              g.position.set(px, 0, pz);
              g.quaternion.identity();
            });
          }

          placeTag(v);
          const text = `${seats[k].name}  ${total(lane)}${isStrike(lane) ? '  STRIKE!' : isSpare(lane) ? '  SPARE!' : ''}`;
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
        const trim = (): void => {
          if (!drag) return;
          while (drag.trail.length > 2 && now - drag.trail[0].t > TRAIL_MS) drag.trail.shift();
        };
        if (p?.down) {
          if (!drag) drag = { x: p.x, y: p.y, myX0: myX, trail: [] };
          drag.trail.push({ x: p.x, y: p.y, t: now });
          trim();
          // Dragging right moves the ball right on screen, which is -x (the bowler's right).
          myX = clamp(drag.myX0 - ((p.x - drag.x) * canvasW()) / 2 / DRAG_PX_PER_M, -THROW.xRange, THROW.xRange);
        } else if (drag) {
          // The release is a sample too: a fast flick ends between two pointer frames, so it must count.
          const prev = drag.trail[drag.trail.length - 1];
          drag.trail.push({ x: p ? p.x : prev.x, y: p ? p.y : prev.y, t: now });
          trim();
          const first = drag.trail[0];
          const latest = drag.trail[drag.trail.length - 1];
          if (canThrow && first && latest && latest.t > first.t) {
            const dyPx = ((latest.y - first.y) * canvasH()) / 2; // + is up
            const dxPx = ((latest.x - first.x) * canvasW()) / 2;
            const v = dyPx / ((latest.t - first.t) / 1000);
            if (v > SWIPE_MIN_PX_S) {
              fire(
                THROW.speedMin + clamp((v - SWIPE_MIN_PX_S) / (SWIPE_MAX_PX_S - SWIPE_MIN_PX_S), 0, 1) * (THROW.speedMax - THROW.speedMin),
                clamp((-dxPx / Math.max(dyPx, 1)) * THROW.aimRange, -THROW.aimRange, THROW.aimRange),
              );
            }
          }
          drag = null;
        } else {
          if (pad.x) myX = clamp(myX - pad.x * KEY_SPEED_M_S * dt, -THROW.xRange, THROW.xRange);
          if (pad.a && !keyDown) {
            keyDown = true;
            keyStart = now;
          } else if (!pad.a && keyDown) {
            keyDown = false;
            if (canThrow) {
              const charge = clamp((now - keyStart) / 1000 / CHARGE_S, 0, 1);
              fire(THROW.speedMin + charge * (THROW.speedMax - THROW.speedMin), 0);
            }
          }
        }
        return { x: myX, aim, speed, spin: 0, shots };
      },
    };
  },
};

export default def;
