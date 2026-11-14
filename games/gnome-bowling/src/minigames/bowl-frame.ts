// Bowl Frame: one frame of ten-pin, four lanes side by side, every gnome bowling at once. Most pins wins.
// Built from the game's own modules: physics (simulateThrow), npc (npcThrow), lane and pins (the scene pieces).
// Rules and design: docs/roadmaps/gnome-party/2I-bowling-slice.md. Party rules: packages/party/README.md.
import * as THREE from 'three';
import { createGnomeModel, type GnomeModel, type PlayerState } from '@lawn/gnome';
import type { MinigameDef, MinigameView, PadState, ViewCtx } from '@lawn/party';
import { BALL, LOOK_COLORS, PIN_SPOTS, THROW, type SimResult, type ThrowInput } from '../config';
import { simulateThrow } from '../physics';
import { NPCS, NPC_ORDER, npcThrow } from '../npc';
import { buildLaneMeshes } from '../lane';
import { buildPinModel, poseFromSample } from '../pins';

/** Seat k's lane is shown at x = (k - 1.5) * LANE_SPACING. The sim never needs the offset. */
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
  first: number;
  total: number;
  strike: boolean;
  spare: boolean;
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

/** Clamps an input to the throw ranges and rounds it, so the state stays small and host and view replay the same throw. */
function clampThrow(i: ThrowInput): ThrowInput {
  return {
    x: r4(clamp(i.x, -THROW.xRange, THROW.xRange)),
    aim: r4(clamp(i.aim, -THROW.aimRange, THROW.aimRange)),
    speed: r3(clamp(i.speed, THROW.speedMin, THROW.speedMax)),
    spin: r3(clamp(i.spin, -1, 1)),
  };
}

const rank = (l: Lane): number => (l.strike ? 2 : l.spare ? 1 : 0);
/** A lane that is still bowling sorts after every finished one when places are decided at the time cap. */
const finishedAt = (l: Lane): number => (l.ball === 2 ? l.doneAt : Infinity);

/** True when lane a places above lane b: more pins, then strike over spare over neither, then the earlier finish. */
function beats(a: Lane, b: Lane): boolean {
  if (a.total !== b.total) return a.total > b.total;
  if (rank(a) !== rank(b)) return rank(a) > rank(b);
  return finishedAt(a) < finishedAt(b);
}

const offsetOf = (k: number): number => (k - 1.5) * LANE_SPACING;

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
        first: 0,
        total: 0,
        strike: false,
        spare: false,
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
        lane.total += knocked;
        if (lane.ball === 0) {
          lane.first = knocked;
          lane.strike = knocked === 10;
          lane.ball = lane.strike ? 2 : 1;
        } else {
          lane.spare = lane.first + knocked === 10;
          lane.ball = 2;
        }
        lane.flight = null;
        lane.readyAt = s.t + READY_AFTER_S;
        if (lane.ball === 2) lane.doneAt = s.t;
        return;
      }
      const i = inputs[k];
      if (!i || s.t < lane.readyAt) return;
      const c = clampThrow(i);
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
    hud.style.cssText = 'position:absolute;left:0;right:0;top:10px;display:flex;justify-content:space-around;pointer-events:none;font:700 18px system-ui;text-shadow:0 2px 4px #000';
    ui.appendChild(hud);

    interface LaneView {
      root: THREE.Group;
      pins: THREE.Group[];
      ball: THREE.Mesh;
      gnome: GnomeModel;
      pose: PlayerState;
      /** The gnome's x in lane coordinates, smoothed toward lane.x. */
      x: number;
      /** The replayed flight, cached by its start time. */
      cache: { t0: number; before: boolean[]; sim: SimResult } | null;
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
      tag.style.cssText = `text-align:center;color:#${seat.color.toString(16).padStart(6, '0')}`;
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
      return l.ball < 2 && l.flight === null && s.t >= l.readyAt;
    };

    return {
      render(s, dt) {
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
              v.cache = { t0: f.t0, before, sim: simulateThrow(f.input, before) };
            }
            const { sim, before } = v.cache;
            const idx = Math.min(sim.ball.length - 1, Math.max(0, Math.floor((s.t - f.t0) / sim.sampleDt)));
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

          const text = `${seats[k].name}  ${lane.total}${lane.strike ? '  STRIKE!' : lane.spare ? '  SPARE!' : ''}`;
          if (text !== v.text) {
            v.text = text;
            v.tag.textContent = text;
          }
        });
        // Behind and above my lane, looking down it; the middle when watching.
        const cx = mySeat === null ? 0 : offsetOf(mySeat);
        camera.position.set(cx, 2.4, -4.2);
        camera.lookAt(cx, 0.4, 18);
      },

      input(pad: Readonly<PadState>, s: Readonly<S>): I {
        const now = performance.now();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        const canThrow = ready(s);
        const p = pad.pointer;
        if (p?.down) {
          if (!drag) drag = { x: p.x, y: p.y, myX0: myX, trail: [] };
          drag.trail.push({ x: p.x, y: p.y, t: now });
          while (drag.trail.length > 2 && now - drag.trail[0].t > TRAIL_MS) drag.trail.shift();
          // Dragging right moves the ball right on screen, which is -x (the bowler's right).
          myX = clamp(drag.myX0 - ((p.x - drag.x) * canvasW()) / 2 / DRAG_PX_PER_M, -THROW.xRange, THROW.xRange);
        } else if (drag) {
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
