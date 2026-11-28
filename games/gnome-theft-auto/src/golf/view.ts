// Hedgeworth's ball, aim line and golf camera. three.js only; reads the round state.
import * as THREE from 'three';
import { CLUBS, previewShot } from '@lawn/golf';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab } from '@lawn/prefabs';
import { courseGroundY, golfEnv, golfStart, golfToWorld } from './course';
import { ballWorld } from './round';
import { HOLES, toGolf, type RoundState } from './types';

export interface GolfView {
  /** Every frame: draw the ball (at rest or in flight), the aim line and landing preview while aiming. s = null hides all. */
  update(dt: number, s: RoundState | null): void;
  /** Drive the camera for the address view and the ball flight; false (camera untouched) otherwise. */
  applyCamera(s: RoundState | null, dt: number): boolean;
  dispose(): void;
}

const BALL_PREFAB_R = 0.016; // radius of the golf-ball prefab at scale 1
const BALL_R = 0.09; // drawn radius, metres (a real ball would vanish at distance)
const TRACER_SECONDS = 1.5;
const MAX_CAM_STEP = 30;
const CAM_RATE = 6;
const PREVIEW_LIFT = 0.06;

function easeFactor(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * Math.max(0, dt));
}

function makeRing(radius: number, color: number, opacity: number): THREE.Mesh {
  const mat = flatLayer(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }), LAYER.marker);
  const m = new THREE.Mesh(new THREE.RingGeometry(radius * 0.8, radius, 40), mat);
  m.rotation.x = -Math.PI / 2;
  m.visible = false;
  return m;
}

export function createGolfView(scene: THREE.Scene, camera: THREE.PerspectiveCamera): GolfView {
  const root = new THREE.Group();
  root.name = 'golf-view';
  scene.add(root);

  const ball = buildPrefab('golf-ball', { scale: BALL_R / BALL_PREFAB_R });
  ball.visible = false;
  root.add(ball);
  const tee = buildPrefab('golf-tee', { scale: 3 });
  tee.visible = false;
  root.add(tee);

  const tracerMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  const tracer = new THREE.Line(new THREE.BufferGeometry(), tracerMat);
  tracer.frustumCulled = false;
  tracer.visible = false;
  root.add(tracer);

  const aimMat = new THREE.LineDashedMaterial({ color: 0xffd23f, dashSize: 0.7, gapSize: 0.4, transparent: true, opacity: 0.9 });
  const aimLine = new THREE.Line(new THREE.BufferGeometry(), aimMat);
  aimLine.frustumCulled = false;
  aimLine.visible = false;
  root.add(aimLine);
  const landRing = makeRing(1.2, 0xffd23f, 0.85);
  root.add(landRing);
  const pinRing = makeRing(0.8, 0xffffff, 0.8);
  root.add(pinRing);

  let previewKey = '';
  let clock = 0;
  let prevBall: THREE.Vector3 | null = null;
  let speed = 0;
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const goalPos = new THREE.Vector3();
  const goalLook = new THREE.Vector3();
  let camReady = false;

  function setPreview(s: RoundState): void {
    const key = `${s.club}|${s.aimYaw.toFixed(4)}|${s.ball.x.toFixed(2)}|${s.ball.z.toFixed(2)}|${s.lie}|${s.hole}`;
    if (key === previewKey) return;
    previewKey = key;
    const pin = HOLES[s.hole].pin;
    const res = previewShot(golfEnv(), golfStart(s.ball.x, s.ball.z), s.club, s.lie, s.aimYaw, toGolf(pin.x, pin.z));
    const putt = CLUBS[s.club].launch <= 0;
    const pts = res.points.map((p) => {
      const w = golfToWorld(p);
      return new THREE.Vector3(w.x, putt ? courseGroundY(w.x, w.z) + PREVIEW_LIFT : w.y, w.z);
    });
    aimLine.geometry.dispose();
    aimLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    aimLine.computeLineDistances();
    aimLine.visible = pts.length > 1;
    const last = pts[pts.length - 1];
    if (last && !putt) {
      landRing.position.set(last.x, courseGroundY(last.x, last.z) + 0.03, last.z);
      landRing.visible = true;
    } else landRing.visible = false;
  }

  function setTracer(s: RoundState): void {
    const f = s.flight;
    if (s.phase !== 'flight' || !f || f.result.points.length < 2) { tracer.visible = false; return; }
    const { points, sampleDt } = f.result;
    const iNow = Math.min(points.length - 1, Math.floor(f.t / sampleDt));
    const iFrom = Math.max(0, iNow - Math.round(TRACER_SECONDS / sampleDt));
    const pts: THREE.Vector3[] = [];
    for (let i = iFrom; i <= iNow; i++) { const w = golfToWorld(points[i]); pts.push(new THREE.Vector3(w.x, w.y, w.z)); }
    const b = ballWorld(s);
    pts.push(new THREE.Vector3(b.x, b.y, b.z));
    tracer.geometry.dispose();
    tracer.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    tracer.visible = pts.length > 1;
  }

  function moveCamera(pos: THREE.Vector3, look: THREE.Vector3, dt: number): void {
    if (!camReady) { camPos.copy(camera.position); camera.getWorldDirection(camLook).multiplyScalar(10).add(camPos); camReady = true; }
    const k = easeFactor(CAM_RATE, dt);
    const step = goalPos.copy(pos).sub(camPos).multiplyScalar(k);
    if (step.length() > MAX_CAM_STEP) step.setLength(MAX_CAM_STEP);
    camPos.add(step);
    camLook.lerp(look, k);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
  }

  return {
    update(dt, s) {
      if (!s) {
        ball.visible = tee.visible = tracer.visible = aimLine.visible = landRing.visible = pinRing.visible = false;
        prevBall = null;
        previewKey = '';
        return;
      }
      clock += dt;
      const b = ballWorld(s);
      const onTee = s.lie === 'tee' && s.phase !== 'flight';
      ball.position.set(b.x, b.y + (onTee ? 0.05 : 0), b.z);
      ball.visible = true;
      tee.position.set(b.x, courseGroundY(b.x, b.z), b.z);
      tee.visible = onTee;
      const here = new THREE.Vector3(b.x, b.y, b.z);
      speed = prevBall && dt > 0 ? here.distanceTo(prevBall) / dt : 0;
      prevBall = here;
      setTracer(s);
      if (s.phase === 'aim' || s.phase === 'swing') setPreview(s);
      else { aimLine.visible = false; landRing.visible = false; previewKey = ''; }
      const pin = HOLES[s.hole].pin;
      pinRing.position.set(pin.x, courseGroundY(pin.x, pin.z) + 0.04, pin.z);
      pinRing.scale.setScalar(1 + 0.12 * Math.sin(clock * 3));
      pinRing.visible = s.phase !== 'done';
    },

    applyCamera(s, dt) {
      if (!s || s.phase === 'walk' || s.phase === 'holed' || s.phase === 'done') { camReady = false; return false; }
      const b = ballWorld(s);
      if (s.phase === 'aim' || s.phase === 'swing') {
        const putt = CLUBS[s.club].launch <= 0;
        const fx = Math.sin(s.aimYaw);
        const fz = Math.cos(s.aimYaw);
        const back = putt ? 3 : 4.5;
        const up = putt ? 1.6 : 2.2;
        const ahead = putt ? 8 : 25;
        const gy = courseGroundY(b.x, b.z);
        goalPos.set(b.x - fx * back, gy + up, b.z - fz * back);
        const lx = b.x + fx * ahead;
        const lz = b.z + fz * ahead;
        goalLook.set(lx, courseGroundY(lx, lz) + 1, lz);
      } else {
        let dx = 0;
        let dz = 0;
        if (s.flight) { dx = b.x - s.flight.from.x; dz = b.z - s.flight.from.z; }
        const len = Math.hypot(dx, dz);
        if (len < 0.5) { dx = Math.sin(s.aimYaw); dz = Math.cos(s.aimYaw); } else { dx /= len; dz /= len; }
        const settling = speed < 3 && s.flight !== null && s.flight.t > 0.5;
        const back = settling ? 6 : 8;
        const up = settling ? 2 : 4;
        const px = b.x - dx * back;
        const pz = b.z - dz * back;
        goalPos.set(px, Math.max(b.y + up, courseGroundY(px, pz) + 1.5), pz);
        goalLook.set(b.x, b.y, b.z);
      }
      const pos = goalPos.clone();
      const look = goalLook.clone();
      moveCamera(pos, look, dt);
      return true;
    },

    dispose() {
      scene.remove(root);
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
      });
      tracerMat.dispose();
      aimMat.dispose();
    },
  };
}
