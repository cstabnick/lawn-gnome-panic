// Golf ball, tee peg, flight tracer and the aim preview (dotted line, landing ring, yardage label).
// Read-only on state: positions come from state.ball / state.flight and the phase.
import * as THREE from 'three';
import { PHYS, ROUND, type Ctx, type ShotResult, type System } from './config';
import { heightAt } from './course';
import { previewLanding } from './physics';
import { currentHole, fmtDistance } from './round';

const DOT_COUNT = 40;
const DOT_RADIUS = 0.12;
const DOT_OPACITY = 0.7;
const TRACER_OPACITY = 0.85;
const BALL_MARKER_SCALE = 0.012;
const LABEL_SCALE_X = 0.2;
const LABEL_SCALE_Y = 0.05;
const LABEL_W = 256;
const LABEL_H = 64;
const TEE_LIFT = 0.06;

/** White dot with a dark outline, for the far-view ball marker. */
function makeDotTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const g = c.getContext('2d');
  if (g) {
    g.beginPath();
    g.arc(16, 16, 11, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = '#1b1b1b';
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

/** Position on the flight path at `time` seconds after impact (linear between samples, clamped to the end). */
function flightPoint(f: ShotResult, time: number, out: THREE.Vector3): void {
  const pts = f.points;
  const last = pts.length - 1;
  const idx = Math.min(last, Math.max(0, time / f.sampleDt));
  const i = Math.floor(idx);
  const j = Math.min(i + 1, last);
  out.lerpVectors(pts[i], pts[j], idx - i);
}

export function createBall(ctx: Ctx): System {
  const { scene, state } = ctx;
  const radius = PHYS.ballRadius;
  const tmp = new THREE.Vector3();

  // Ball
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0x333333 }),
  );
  ball.castShadow = true;
  scene.add(ball);

  // Tee peg
  const peg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }),
  );
  peg.castShadow = true;
  peg.visible = false;
  scene.add(peg);

  // Far-view ball marker
  const marker = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeDotTexture(), transparent: true, depthTest: false, sizeAttenuation: false }),
  );
  marker.scale.setScalar(BALL_MARKER_SCALE);
  marker.renderOrder = 10;
  marker.visible = false;
  scene.add(marker);

  // Tracer
  const tracerMat = new THREE.LineBasicMaterial({ color: 0xfff6a0, transparent: true, opacity: TRACER_OPACITY });
  const tracer = new THREE.Line(new THREE.BufferGeometry(), tracerMat);
  tracer.frustumCulled = false;
  tracer.visible = false;
  scene.add(tracer);
  let tracerFlight: ShotResult | null = null;

  function buildTracer(f: ShotResult): void {
    const pts = f.points;
    const arr = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    tracer.geometry.dispose();
    tracer.geometry = geom;
    tracerFlight = f;
  }

  // Aim preview
  const aimGroup = new THREE.Group();
  aimGroup.visible = false;
  scene.add(aimGroup);

  const dotGeom = new THREE.CircleGeometry(DOT_RADIUS, 12);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: DOT_OPACITY });
  const dots: THREE.Mesh[] = [];
  for (let i = 0; i < DOT_COUNT; i++) {
    const d = new THREE.Mesh(dotGeom, dotMat);
    d.rotation.x = -Math.PI / 2;
    aimGroup.add(d);
    dots.push(d);
  }

  // Ring: base geometry has outer radius 1, scaled to r each frame (pulsing).
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthTest: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 5;
  aimGroup.add(ring);
  let ringRadius = 1;

  // Yardage label
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = LABEL_W;
  labelCanvas.height = LABEL_H;
  const labelCtx = labelCanvas.getContext('2d');
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthTest: false, sizeAttenuation: false }),
  );
  label.scale.set(LABEL_SCALE_X, LABEL_SCALE_Y, 1);
  label.renderOrder = 11;
  aimGroup.add(label);
  let labelText = '';

  function drawLabel(text: string): void {
    labelText = text;
    if (!labelCtx) return;
    labelCtx.clearRect(0, 0, LABEL_W, LABEL_H);
    labelCtx.fillStyle = 'rgba(10,30,20,0.55)';
    labelCtx.fillRect(0, 0, LABEL_W, LABEL_H);
    labelCtx.font = 'bold 34px system-ui, sans-serif';
    labelCtx.textAlign = 'center';
    labelCtx.textBaseline = 'middle';
    labelCtx.fillStyle = '#ffffff';
    labelCtx.shadowColor = '#000000';
    labelCtx.shadowBlur = 4;
    labelCtx.fillText(text, LABEL_W / 2, LABEL_H / 2 + 2);
    labelTex.needsUpdate = true;
  }

  let aimKey = '';

  /** Recomputes the landing point and everything placed from it, only when the aim inputs change. */
  function updateAim(): void {
    const b = state.ball;
    const key = `${b.x},${b.z},${state.club},${state.lie},${state.aimYaw.toFixed(3)}`;
    if (key === aimKey) return;
    aimKey = key;

    const L = previewLanding(b, state.club, state.lie, state.aimYaw, currentHole(state).pin);
    const dx = L.x - b.x;
    const dz = L.z - b.z;
    const dist = Math.hypot(dx, dz);
    const putt = state.club === 'PT';
    const apexish = Math.min(18, 0.08 * dist);

    for (let i = 0; i < DOT_COUNT; i++) {
      const s = (i + 1) / (DOT_COUNT + 1);
      const x = b.x + dx * s;
      const z = b.z + dz * s;
      const arc = putt ? 0 : 4 * apexish * s * (1 - s);
      dots[i].position.set(x, heightAt(x, z) + 0.05 + arc, z);
    }

    const gy = heightAt(L.x, L.z);
    ringRadius = Math.max(0.6, dist * 0.025);
    ring.position.set(L.x, gy + 0.06, L.z);
    label.position.set(L.x, gy + 2, L.z);

    const text = fmtDistance(dist, state.lie);
    if (text !== labelText) drawLabel(text);
  }

  return {
    update() {
      const phase = state.phase;
      const f = state.flight;
      const inFlight = phase === 'flight' && f !== null;
      const inResult = phase === 'result' && f !== null;
      const aiming = phase === 'aim' || phase === 'swing';

      // Ball: where it is, and whether it is shown at all.
      let base = state.ball;
      let visible = phase !== 'holed';
      if (inFlight && f) {
        flightPoint(f, state.phaseTime, tmp);
        base = tmp;
      } else if (inResult && f) {
        base = f.end;
        if (f.endLie === 'water' || f.holed) visible = false;
      }
      const teeLift =
        state.lie === 'tee' && phase !== 'flight' && phase !== 'result' && phase !== 'drive' && phase !== 'holed'
          ? TEE_LIFT
          : 0;
      ball.position.set(base.x, base.y + radius + teeLift, base.z);
      ball.visible = visible;

      // Tee peg under the ball while it sits on the tee.
      const pegShown = state.lie === 'tee' && (phase === 'intro' || phase === 'aim' || phase === 'swing');
      peg.visible = pegShown;
      if (pegShown) peg.position.set(state.ball.x, state.ball.y + 0.03, state.ball.z);

      // Far-view marker, following the ball in flight and at rest.
      marker.visible = (inFlight || inResult) && visible;
      if (marker.visible) marker.position.copy(ball.position);

      // Tracer.
      if ((inFlight || inResult) && f) {
        if (f !== tracerFlight) buildTracer(f);
        tracer.visible = true;
        const n = f.points.length;
        if (inFlight) {
          tracer.geometry.setDrawRange(0, Math.min(n, Math.floor(state.phaseTime / f.sampleDt) + 1));
          tracerMat.opacity = TRACER_OPACITY;
        } else {
          tracer.geometry.setDrawRange(0, n);
          tracerMat.opacity = TRACER_OPACITY * (1 - Math.min(1, state.phaseTime / ROUND.resultSeconds));
        }
      } else {
        tracer.visible = false;
      }

      // Aim preview.
      aimGroup.visible = aiming;
      if (aiming) {
        updateAim();
        ring.scale.setScalar(ringRadius * (1 + 0.06 * Math.sin(4 * state.time)));
      }
    },
  };
}
