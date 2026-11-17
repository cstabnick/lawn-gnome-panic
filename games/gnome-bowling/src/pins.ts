// The ten pins and the ball: racked from state.standing between throws, in the bowler's hand during
// the run-up ('approach'), and played back from state.sim during 'roll' and 'result'.
import * as THREE from 'three';
import type { BallSample, Ctx, PinSample, Phase, SimResult, System } from './config';
import { BALL, LANE, LOOK_COLORS, PIN, PIN_SPOTS, THROW } from './config';
import { currentPlayer } from './game';
import { replaySampleIndex } from './replay';

/** Pinsetter sweep after a result, before the next aim or intro. */
const SWEEP_SECONDS = 0.4;
const SWEEP_START_Z = LANE.length - 0.4;
const SWEEP_END_Z = LANE.length + LANE.deckPastHeadPin + 0.3;
/** Where the bowler stands during the run-up (z) and how far they walk. */
const BOWLER_START_Z = -1.2;
const BOWLER_WALK = 1.1;
/** The ball's hand offset from the aim (the right hand is at -x). */
const HAND_DX = -0.25;
const HAND_Y = 0.35;

/** Pin profile for LatheGeometry: [radius, y], base at y = 0. */
const PIN_PROFILE: [number, number][] = [
  [0, 0], [0.03, 0], [0.04, 0.012], [0.054, 0.04], [0.061, 0.11], [0.052, 0.18],
  [0.034, 0.225], [0.023, 0.25], [0.023, 0.27], [0.03, 0.29], [0.032, 0.32],
  [0.029, 0.345], [0.02, 0.365], [0.008, 0.376], [0, PIN.height],
];
/** Red neck stripes: [y, radius]. */
const PIN_STRIPES: [number, number][] = [[0.24, 0.0295], [0.27, 0.0255]];

const BALL_FALLBACK_COLOR = 0x8844ff;
/** Finger hole directions on the ball (not normalised). */
const HOLE_DIRS: [number, number, number][] = [[-0.25, 0.55, 0.8], [0.2, 0.6, 0.77], [0, 0.92, 0.4]];

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Small seeded PRNG so the ball swirls are the same every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerpPin(a: PinSample, b: PinSample, t: number): PinSample {
  return {
    x: THREE.MathUtils.lerp(a.x, b.x, t),
    y: THREE.MathUtils.lerp(a.y, b.y, t),
    z: THREE.MathUtils.lerp(a.z, b.z, t),
    tilt: THREE.MathUtils.lerp(a.tilt, b.tilt, t),
    tiltDir: THREE.MathUtils.lerp(a.tiltDir, b.tiltDir, t),
    spin: THREE.MathUtils.lerp(a.spin, b.spin, t),
  };
}

function lerpBall(a: BallSample, b: BallSample, t: number): BallSample {
  return {
    x: THREE.MathUtils.lerp(a.x, b.x, t),
    y: THREE.MathUtils.lerp(a.y, b.y, t),
    z: THREE.MathUtils.lerp(a.z, b.z, t),
    roll: THREE.MathUtils.lerp(a.roll, b.roll, t),
  };
}

/** One pin, standing on the origin: white body, red neck stripes and hat, two eyes. Built fresh per call. */
export function buildPinModel(): THREE.Group {
  const pinGeo = new THREE.LatheGeometry(
    PIN_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)),
    16,
  );
  const pinMat = new THREE.MeshStandardMaterial({ color: LOOK_COLORS.pinWhite, roughness: 0.3 });
  const redMat = new THREE.MeshStandardMaterial({ color: LOOK_COLORS.pinRed, roughness: 0.4 });
  const stripeGeos = PIN_STRIPES.map(([, r]) => new THREE.CylinderGeometry(r, r, 0.011, 16));
  const hatGeo = new THREE.ConeGeometry(0.03, 0.07, 12);
  const eyeGeo = new THREE.SphereGeometry(0.0065, 8, 6);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });

  const g = new THREE.Group();
  const body = new THREE.Mesh(pinGeo, pinMat);
  body.castShadow = true;
  g.add(body);
  PIN_STRIPES.forEach(([y], k) => {
    const s = new THREE.Mesh(stripeGeos[k], redMat);
    s.position.y = y;
    s.castShadow = true;
    g.add(s);
  });
  const hat = new THREE.Mesh(hatGeo, redMat);
  hat.position.y = 0.39;
  hat.castShadow = true;
  g.add(hat);
  for (const ex of [-0.011, 0.011]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(ex, 0.31, 0.03);
    g.add(eye);
  }
  return g;
}

const spinQ = new THREE.Quaternion();
const tiltQ = new THREE.Quaternion();
const tiltAxis = new THREE.Vector3();
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** Poses a pin group from one recorded sample (position, lean and spin). */
export function poseFromSample(g: THREE.Group, s: PinSample): void {
  g.position.set(s.x, s.y, s.z);
  spinQ.setFromAxisAngle(Y_AXIS, s.spin);
  tiltAxis.set(Math.cos(s.tiltDir), 0, -Math.sin(s.tiltDir));
  tiltQ.setFromAxisAngle(tiltAxis, s.tilt);
  g.quaternion.copy(tiltQ).multiply(spinQ);
}

/** Sample f (fractional, sim.sampleDt apart) of a throw as the two samples around it and the blend between them. */
export function sampleSpan(sim: SimResult, f: number): { i: number; j: number; a: number } {
  const n = sim.ball.length;
  const i = Math.min(Math.max(Math.floor(f), 0), n - 1);
  return { i, j: Math.min(i + 1, n - 1), a: i >= n - 1 ? 0 : clamp01(f - i) };
}

/** The ball at sample f of a throw, interpolated. */
export function ballAtSample(sim: SimResult, f: number): BallSample {
  const { i, j, a } = sampleSpan(sim, f);
  return lerpBall(sim.ball[i], sim.ball[j], a);
}

/** Poses ten pin groups at sample f of a throw; pins that were never in play or have dropped into the pit are hidden. */
export function posePinsAt(pins: readonly THREE.Group[], sim: SimResult, f: number): void {
  const { i, j, a } = sampleSpan(sim, f);
  for (let p = 0; p < 10; p++) {
    const track = sim.pins[p];
    if (!track || track.length === 0 || track[0].y < -0.5) {
      pins[p].visible = false;
      continue;
    }
    const s = lerpPin(sampleAt(track, i), sampleAt(track, j), a);
    if (s.y < -0.3) {
      pins[p].visible = false;
      continue;
    }
    poseFromSample(pins[p], s);
    pins[p].visible = true;
  }
}

/** Racks the pins upright on their spots: the standing ones shown, the rest hidden. */
export function rackPins(pins: readonly THREE.Group[], standing: readonly boolean[]): void {
  for (let p = 0; p < 10; p++) {
    const [x, z] = PIN_SPOTS[p];
    pins[p].position.set(x, 0, z);
    pins[p].quaternion.identity();
    pins[p].visible = standing[p];
  }
}

function sampleAt<T>(track: T[], idx: number): T {
  return track[Math.min(Math.max(idx, 0), track.length - 1)];
}

const ballTextures = new Map<number, THREE.CanvasTexture>();
function ballTexture(color: number): THREE.CanvasTexture {
  const cached = ballTextures.get(color);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#2a1040';
  g.fillRect(0, 0, 512, 256);
  const hex = '#' + color.toString(16).padStart(6, '0');
  const rnd = mulberry32(color ^ 0x9e3779b9);
  g.lineCap = 'round';
  for (let k = 0; k < 16; k++) {
    g.globalAlpha = 0.45 + rnd() * 0.55;
    g.strokeStyle = k % 4 === 0 ? '#2a1040' : hex;
    g.lineWidth = 6 + rnd() * 22;
    g.beginPath();
    g.moveTo(0, rnd() * 256);
    g.bezierCurveTo(170, rnd() * 256, 340, rnd() * 256, 512, rnd() * 256);
    g.stroke();
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  ballTextures.set(color, tex);
  return tex;
}

/** Swirled bowling ball with finger holes. `setColor` swaps the swirl palette (cached per colour). */
export function buildBallModel(initialColor = BALL_FALLBACK_COLOR): {
  group: THREE.Group;
  mesh: THREE.Mesh;
  setColor(color: number): void;
} {
  const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL.radius, 32, 24), mat);
  mesh.castShadow = true;
  group.add(mesh);
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 });
  const holeGeo = new THREE.CircleGeometry(0.014, 14);
  for (const [dx, dy, dz] of HOLE_DIRS) {
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.copy(dir).multiplyScalar(BALL.radius + 0.001);
    hole.lookAt(dir.clone().multiplyScalar(BALL.radius * 3));
    mesh.add(hole);
  }
  let currentColor = -1;
  function setColor(color: number): void {
    if (color === currentColor) return;
    currentColor = color;
    mat.map = ballTexture(color);
    mat.needsUpdate = true;
  }
  setColor(initialColor);
  return { group, mesh, setColor };
}

export function createPins(ctx: Ctx): System {
  const { scene, state } = ctx;

  // ---- pins ----
  const pins: THREE.Group[] = [];
  for (let p = 0; p < 10; p++) {
    const g = buildPinModel();
    g.visible = false;
    scene.add(g);
    pins.push(g);
  }

  // ---- ball ----
  const ball = buildBallModel(BALL_FALLBACK_COLOR);
  const ballGroup = ball.group;
  const ballMesh = ball.mesh;
  ballGroup.visible = false;
  scene.add(ballGroup);

  // ---- pinsetter sweep bar ----
  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(LANE.halfWidth * 2 + 0.2, 0.12, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.7 }),
  );
  bar.position.y = 0.06;
  bar.castShadow = true;
  bar.visible = false;
  scene.add(bar);

  // ---- helpers ----
  function placeUpright(p: number, visible: boolean): void {
    const g = pins[p];
    const [x, z] = PIN_SPOTS[p];
    g.position.set(x, 0, z);
    g.quaternion.identity();
    g.visible = visible;
  }

  function hideAllPins(): void {
    for (const g of pins) g.visible = false;
  }

  function placeBallAt(x: number, y: number, z: number, roll: number, yaw: number): void {
    ballGroup.visible = true;
    ballGroup.position.set(x, y, z);
    ballGroup.rotation.y = yaw;
    ballMesh.rotation.x = roll;
  }

  let prevPhase: Phase = state.phase;
  let sweepT = 0;
  let lastYaw = 0;

  return {
    update(dt: number) {
      const phase = state.phase;
      if (phase !== prevPhase) {
        if ((prevPhase === 'result' || prevPhase === 'replay') && (phase === 'aim' || phase === 'intro')) sweepT = SWEEP_SECONDS;
        prevPhase = phase;
      }
      if (sweepT > 0) sweepT = Math.max(0, sweepT - dt);
      const sweeping = sweepT > 0;

      // Ball colour follows the current bowler.
      ball.setColor(currentPlayer(state)?.color ?? BALL_FALLBACK_COLOR);

      bar.visible = sweeping;
      if (sweeping) {
        bar.position.z = THREE.MathUtils.lerp(SWEEP_START_Z, SWEEP_END_Z, 1 - sweepT / SWEEP_SECONDS);
      }

      if (phase === 'title' || phase === 'lobby' || phase === 'final') {
        for (let p = 0; p < 10; p++) placeUpright(p, true);
        ballGroup.visible = false;
        return;
      }

      if (phase === 'intro' || phase === 'aim') {
        for (let p = 0; p < 10; p++) placeUpright(p, state.standing[p] && !sweeping);
        placeBallAt(state.aimX + HAND_DX, HAND_Y, -1.2, 0, 0);
        return;
      }

      if (phase === 'approach') {
        for (let p = 0; p < 10; p++) placeUpright(p, state.standing[p]);
        const t = clamp01(state.phaseTime / THROW.approachSeconds);
        const e = smooth(t);
        const bowlerZ = BOWLER_START_Z + BOWLER_WALK * e;
        const releaseX = state.input ? state.input.x : state.aimX;
        const handX = THREE.MathUtils.lerp(state.aimX + HAND_DX, releaseX, e);
        let z: number;
        let y: number;
        if (t < 0.6) {
          // Backswing: the ball swings back behind the hip.
          const u = smooth(t / 0.6);
          z = THREE.MathUtils.lerp(bowlerZ, bowlerZ - 0.45, u);
          y = THREE.MathUtils.lerp(HAND_Y, 0.6, u);
        } else {
          // Forward swing down to the release point.
          const u = (t - 0.6) / 0.4;
          const uu = u * u;
          z = THREE.MathUtils.lerp(bowlerZ - 0.45, BALL.releaseZ, uu);
          y = THREE.MathUtils.lerp(0.6, BALL.radius, uu);
        }
        placeBallAt(handX, y, z, 0, 0);
        lastYaw = 0;
        return;
      }

      if (phase === 'roll' || phase === 'result' || phase === 'replay') {
        const sim = state.sim;
        if (!sim || sim.ball.length === 0) {
          hideAllPins();
          ballGroup.visible = false;
          return;
        }
        const n = sim.ball.length;
        const f = phase === 'result' ? n - 1 : phase === 'replay' ? replaySampleIndex(sim, state.phaseTime) : state.rollTime / sim.sampleDt;
        const { i } = sampleSpan(sim, f);

        // Ball: interpolated sample, yawed toward its direction of travel.
        const b = ballAtSample(sim, f);
        const prevK = Math.max(i - 1, 0);
        const nextK = Math.min(i + 1, n - 1);
        const dx = sim.ball[nextK].x - sim.ball[prevK].x;
        const dz = sim.ball[nextK].z - sim.ball[prevK].z;
        if (nextK !== prevK && Math.abs(dz) + Math.abs(dx) > 1e-6) lastYaw = Math.atan2(dx, dz);
        placeBallAt(b.x, b.y, b.z, b.roll, lastYaw);

        // Pins: hidden if they were never in play or have dropped into the pit.
        posePinsAt(pins, sim, f);
        return;
      }

      // Unknown or transitional phase: show nothing.
      hideAllPins();
      ballGroup.visible = false;
    },
  };
}
