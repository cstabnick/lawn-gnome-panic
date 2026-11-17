// The gnome on its board: pose, crouch, lean, spins, flips, board tricks, grabs, grinds, bails, personality, trail.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome, GNORMAN_LOOK, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { GRABS, GRINDS, PALETTE, type Player } from '../config';
import { boardPose, forwardOf } from '../physics';
import { groundAt, type Ground, type World } from '../world';
import { GRADIENT, addOutline, toonMat, toonify } from './toon';
import { makeTrainCar, TRAIN_HALF_LEN, TRAIN_HALF_W, TRAIN_RIDER_OFFSET, TRAIN_ROOF_Y } from './train';

export interface RiderView {
  /** pos = the interpolated render position (feet on the board). steer = this frame's steer input (lean). */
  update(p: Player, pos: THREE.Vector3, dt: number, steer: number): void;
  /** Replaces the snowboard with a metro train car (denshattack cheatcode). */
  setTrainMode(on: boolean): void;
}

const UP = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;
const DECK_HALF_LEN = 0.675;
const DECK_HALF_W = 0.18;
const DECK_THICK = 0.05;
/** Board centre: the deck's bottom sits at the root (pos), its thickness above it. */
const DECK_Y = DECK_THICK / 2;
/** The gnome stands on the deck top. */
const FEET_Y = DECK_THICK;
/** The whole rider (board + gnome) rides this far above the exact surface on the ground and rails. */
const LIFT = 0.12;
const LIFT_RATE = LIFT / 0.2;
/** Manuals: the board's tip about its end (rad), eased in over 0.1 s and out over 0.15 s. */
const MANUAL_PITCH = 0.32;
const MANUAL_IN = MANUAL_PITCH / 0.1;
const MANUAL_OUT = MANUAL_PITCH / 0.15;
/** Gnome lean over the manual end (rad), and the board roll per unit of balance (rad). */
const MANUAL_LEAN = 0.25;
const MANUAL_ROLL = 0.35;
/** The slap when a manual ends on the ground (s). */
const DROP_T = 0.2;
const TRAIL_N = 48;
const TRAIL_STEP_SQ = 0.15 * 0.15;
const TRAIL_SPEED = 14;
const TAIL_HALF_W = 0.13;
const TAIL_Z = -0.6;
const SHADOW_FADE_H = 25;
const TELEPORT_SQ = 8 * 8;

/** Arm length from the shoulder pivot to the hand centre (sleeve 0.3 + hand). */
const ARM_LEN = 0.32;
/** Grab points on the board (board space): nose / tail ends, and the toe / heel edges between the feet. */
const GRAB_Y = 0.03;
const GRAB_END_Z = 0.6;
const GRAB_EDGE_X = 0.2;
/** Lean limit for a grab (rad, forward lean).  */
const LEAN_MAX = 1.3;
/** Landing: vertical speed (m/s) past which a landing is sketchy (arm windmills). */
const SKETCHY_VY = 18;
/** Aero tuck above this speed (m/s), on the ground. */
const TUCK_SPEED = 35;

/** Torso twist and roll limits for a grab (rad). */
const TWIST_MAX = 1.2;
const ROLL_MAX = 1.0;
/** Extra knee bend a grab may take (m the rider pivot drops). */
const DROP_MAX = 0.3;

const CYAN = new THREE.Color(PALETTE.cyan);
const PINK = new THREE.Color(PALETTE.pink);
const YELLOW = new THREE.Color(PALETTE.yellow);

let riderCount = 0;

function ease(cur: number, target: number, rate: number, dt: number): number {
  return cur + (target - cur) * (1 - Math.exp(-rate * dt));
}
function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function clampSym(x: number, m: number): number {
  return x < -m ? -m : x > m ? m : x;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function frac(x: number): number {
  return x - Math.floor(x);
}
function clampRange(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/** The board: a rounded deck with a graffiti top, cyan glowing edges and an ink outline. */
function makeDeck(): THREE.Mesh {
  const W = DECK_HALF_W;
  const H = DECK_HALF_LEN;
  const c = H - W;
  const shape = new THREE.Shape();
  shape.moveTo(-W, -c);
  shape.lineTo(-W, c);
  shape.absarc(0, c, W, Math.PI, 0, true);
  shape.lineTo(W, -c);
  shape.absarc(0, -c, W, 0, -Math.PI, true);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: DECK_THICK, bevelEnabled: false, curveSegments: 10 });
  // Shape x = across the board, shape y = along it; extrude goes up. Long axis is z, top is +y.
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -DECK_THICK / 2, 0);

  // Graffiti runs along the board: texture u follows z, v follows x.
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getZ(i) / (2 * H) + 0.5;
    uv[i * 2 + 1] = pos.getX(i) / (2 * W) + 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

  const top = new THREE.MeshToonMaterial({ map: makeGraffitiTexture(), gradientMap: GRADIENT });
  const edge = toonMat(PALETTE.cyan, { emissive: PALETTE.cyan, emissiveIntensity: 0.6 });
  const deck = new THREE.Mesh(geo, [top, edge]);
  addOutline(deck, 0.02);
  return deck;
}

function makeGraffitiTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 64;
  const g = cv.getContext('2d');
  if (g) {
    g.fillStyle = '#ff3fa4';
    g.fillRect(0, 0, 256, 64);
    g.strokeStyle = '#ffe14d';
    g.lineWidth = 7;
    g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i <= 8; i++) g.lineTo(i * 32, i % 2 ? 56 : 8);
    g.stroke();
    g.font = 'italic 900 40px Arial, Helvetica, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 6;
    g.strokeStyle = '#17072e';
    g.strokeText('AETHER', 128, 34);
    g.fillStyle = '#2de2e6';
    g.fillText('AETHER', 128, 34);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Pushes a point to the front of a history buffer (index 0 = newest), dropping the oldest. No allocation. */
function pushHistory(buf: Float32Array, v: THREE.Vector3): void {
  buf.copyWithin(3, 0, (TRAIL_N - 1) * 3);
  buf[0] = v.x;
  buf[1] = v.y;
  buf[2] = v.z;
}

/** camera (optional): the trail fades out near it, so the ribbon behind the board never sweeps across the lens. */
export function createRider(scene: THREE.Scene, w: World, camera?: THREE.Camera): RiderView {
  // root (at pos, oriented to the ground) > body (lean, flip, tumble) > manualPivot (tip about an end) > { boardPivot > deck, riderPivot > gnome }
  const root = new THREE.Group();
  const body = new THREE.Group();
  const manualPivot = new THREE.Group();
  const boardPivot = new THREE.Group();
  const riderPivot = new THREE.Group();
  root.add(body);
  body.add(manualPivot);
  manualPivot.add(boardPivot, riderPivot);
  boardPivot.position.y = DECK_Y;
  riderPivot.position.y = FEET_Y;
  const deck = makeDeck();
  const trainCar = makeTrainCar();
  trainCar.visible = false;
  let trainMode = false;
  boardPivot.add(deck, trainCar);
  scene.add(root);

  const look = getMyGnome()?.look ?? { ...GNORMAN_LOOK, hat: PALETTE.pink, shirt: PALETTE.cyan, pants: 0x3a2a6a };
  const gnome: GnomeModel = createGnomeModel(look);
  toonify(gnome.object, 0.02);
  riderPivot.add(gnome.object);
  const hat = gnome.hat;
  const hatBase = hat ? hat.rotation.clone() : null;

  // Blob shadow.
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x2b0a5a, transparent: true, opacity: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24).rotateX(-Math.PI / 2), shadowMat);
  shadow.visible = false;
  scene.add(shadow);

  // Trail: a strip from each tail corner, history kept in flat buffers.
  const histL = new Float32Array(TRAIL_N * 3);
  const histR = new Float32Array(TRAIL_N * 3);
  let histN = 0;
  let trailA = 0;
  const trailPos = new Float32Array(TRAIL_N * 2 * 3);
  const trailCol = new Float32Array(TRAIL_N * 2 * 4);
  const trailIdx = new Uint16Array((TRAIL_N - 1) * 6);
  for (let i = 0; i < TRAIL_N - 1; i++) {
    const a = 2 * i;
    trailIdx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6);
  }
  const trailGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(trailPos, 3).setUsage(THREE.DynamicDrawUsage);
  const colAttr = new THREE.BufferAttribute(trailCol, 4).setUsage(THREE.DynamicDrawUsage);
  trailGeo.setAttribute('position', posAttr);
  trailGeo.setAttribute('color', colAttr);
  trailGeo.setIndex(new THREE.BufferAttribute(trailIdx, 1));
  trailGeo.setDrawRange(0, 0);
  const trailMat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const trail = new THREE.Mesh(trailGeo, trailMat);
  trail.frustumCulled = false;
  scene.add(trail);

  // Per-rider phase, so two riders never move in step.
  riderCount++;
  const seed = riderCount * 0.618;

  // Smoothed state.
  let lastPos: THREE.Vector3 | null = null;
  let clock = 0;
  let leanCur = 0;
  let tumbleX = 0;
  let tumbleZ = 0;
  let flipCur = 0;
  let crouchCur = 0;
  let liftCur = 0;
  let outCur = 0;
  let gridCur = 0;
  let grindYawCur = 0;
  let grindPitchCur = 0;
  let grabPitchCur = 0;
  let grabRollCur = 0;
  let grabW = 0;
  let tuckCur = 0;
  let airTuckCur = 0;
  let swimCur = 0;
  let wooCur = 0;
  let dazeCur = 0;
  let lookA = 0;
  let lookHold = 0;
  let lookT = 3 + seed;
  let lookDir = 1;
  let lookN = 0;
  // Landings and falls.
  let wasAir = false;
  let airTime = 0;
  let airVy = 0;
  let squashT = 1;
  let pumpT = 0;
  let windT = 0;
  let windAng = 0;
  let flailT = 0;
  let grindT = 0;
  // Hat spring (x and z), driven by a wobble target and by landing bumps.
  let hatAx = 0;
  let hatVx = 0;
  let hatAz = 0;
  let hatVz = 0;
  // Lift above the surface, and manuals (tip angle, which end, roll, windmill, the slap timer).
  let liftAmt = 0;
  let manCur = 0;
  let manSide = 1;
  let manRoll = 0;
  let manWind = 0;
  let manualPrev = false;
  let dropT = 0;

  // Scratch.
  const targetQ = new THREE.Quaternion();
  const basis = new THREE.Matrix4();
  const fwd = new THREE.Vector3();
  const rgt = new THREE.Vector3();
  const upT = new THREE.Vector3();
  const tailL = new THREE.Vector3();
  const tailR = new THREE.Vector3();
  const tmpC = new THREE.Color();
  const groundScratch: Ground = { y: 0, normal: new THREE.Vector3(), island: 0, pipe: -1 };
  const idleState: PlayerState = {
    position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0,
  };
  const vZero = new THREE.Vector3();
  const vAnchor = new THREE.Vector3();
  const vL = new THREE.Vector3();
  const vLeft = new THREE.Vector3();
  const vRight = new THREE.Vector3();
  const vCenter = new THREE.Vector3();
  const vBoardFwd = new THREE.Vector3();
  const vBoardX = new THREE.Vector3();
  const vGnomeFwd = new THREE.Vector3();
  const vGnomeO = new THREE.Vector3();
  const vDir = new THREE.Vector3();
  const vShoulder = new THREE.Vector3();
  const reachEuler = new THREE.Euler();
  const reachPose = { x: 0, y: 0, z: 0, d: 0 };
  const vTarget = new THREE.Vector3();
  const armLeft = gnome.arms.left;
  const armRight = gnome.arms.right;
  const legs = gnome.legs;

  function orient(p: Player, out: THREE.Quaternion): void {
    if (p.mode === 'air' || p.normal.lengthSq() < 1e-6) upT.copy(UP);
    else upT.copy(p.normal).normalize();
    forwardOf(p.heading, fwd);
    fwd.addScaledVector(upT, -fwd.dot(upT));
    if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, 1);
    fwd.normalize();
    rgt.crossVectors(upT, fwd);
    basis.makeBasis(rgt, upT, fwd);
    out.setFromRotationMatrix(basis);
  }

  function resetTrail(): void {
    histN = 0;
    trailA = 0;
    trailGeo.setDrawRange(0, 0);
  }

  function updateShadow(pos: THREE.Vector3): void {
    const g = groundAt(w, pos.x, pos.z, pos.y + 0.5, groundScratch);
    const f = g ? clamp01(1 - Math.max(0, pos.y - g.y) / SHADOW_FADE_H) : 0;
    if (!g || f <= 0.001) {
      shadow.visible = false;
      return;
    }
    shadow.visible = true;
    shadow.position.set(pos.x, g.y, pos.z).addScaledVector(g.normal, 0.04);
    shadow.quaternion.setFromUnitVectors(UP, g.normal);
    shadow.scale.setScalar((0.4 + 0.6 * f) * (trainMode ? 3.5 : 1));
    shadowMat.opacity = 0.45 * f;
  }

  function updateTrail(p: Player, h: number, sp: number): void {
    trailA = ease(trailA, p.mode === 'air' || sp > TRAIL_SPEED ? 1 : 0, 3, h);

    // Sample the tail when it has moved far enough.
    if (histN === 0 || sqDist(tailL, histL) > TRAIL_STEP_SQ) {
      pushHistory(histL, tailL);
      pushHistory(histR, tailR);
      histN = Math.min(TRAIL_N, histN + 1);
    }

    const n = histN;
    if (n < 2 || trailA < 0.01) {
      trailGeo.setDrawRange(0, 0);
      return;
    }
    const f = clamp01(p.flow);
    if (f < 0.5) tmpC.copy(CYAN).lerp(PINK, f * 2);
    else tmpC.copy(PINK).lerp(YELLOW, (f - 0.5) * 2);
    const boost = p.boosting ? 1.6 : 1;
    for (let i = 0; i < n; i++) {
      let a = trailA * (1 - i / n);
      if (camera) {
        const cx = histL[i * 3] - camera.position.x;
        const cy = histL[i * 3 + 1] - camera.position.y;
        const cz = histL[i * 3 + 2] - camera.position.z;
        a *= clamp01((Math.sqrt(cx * cx + cy * cy + cz * cz) - 3) / 4); // gone within 3 m, full beyond 7 m
      }
      for (let k = 0; k < 2; k++) {
        const v = i * 2 + k;
        const src = k === 0 ? histL : histR;
        trailPos[v * 3] = src[i * 3];
        trailPos[v * 3 + 1] = src[i * 3 + 1];
        trailPos[v * 3 + 2] = src[i * 3 + 2];
        trailCol[v * 4] = tmpC.r * boost;
        trailCol[v * 4 + 1] = tmpC.g * boost;
        trailCol[v * 4 + 2] = tmpC.b * boost;
        trailCol[v * 4 + 3] = a;
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    trailGeo.setDrawRange(0, (n - 1) * 6);
  }

  function sqDist(v: THREE.Vector3, buf: Float32Array): number {
    const dx = v.x - buf[0];
    const dy = v.y - buf[1];
    const dz = v.z - buf[2];
    return dx * dx + dy * dy + dz * dz;
  }

  /** The grab's point on the board (board space). Toe / heel: the edge in front of / behind the rider. */
  function grabAnchor(spot: 'nose' | 'tail' | 'toe' | 'heel', faceSign: number, out: THREE.Vector3): void {
    const gy = trainMode ? TRAIN_ROOF_Y + 0.02 : GRAB_Y;
    const endZ = trainMode ? TRAIN_HALF_LEN * 0.85 : GRAB_END_Z;
    const edgeX = trainMode ? TRAIN_HALF_W : GRAB_EDGE_X;
    if (spot === 'nose') out.set(0, gy, endZ);
    else if (spot === 'tail') out.set(0, gy, -endZ);
    else if (spot === 'toe') out.set(edgeX * faceSign, gy, 0);
    else out.set(-edgeX * faceSign, gy, 0);
  }

  /** Rig rotation (lean x, twist y, roll z) and extra drop d that put the shoulder ARM_LEN from the target: Newton
   *  steps (minimum norm), clamped. target0 is the grab point in the gnome's frame before the drop. */
  function solveReach(arm: THREE.Object3D, target0: THREE.Vector3, x0: number, y0: number, z0: number, d0: number): void {
    let x = x0;
    let y = y0;
    let z = z0;
    let d = d0;
    const EPS = 0.01;
    for (let it = 0; it < 12; it++) {
      const e = reachError(arm, target0, x, y, z, d);
      if (Math.abs(e) < 0.004) break;
      const gx = (reachError(arm, target0, x + EPS, y, z, d) - e) / EPS;
      const gy = (reachError(arm, target0, x, y + EPS, z, d) - e) / EPS;
      const gz = (reachError(arm, target0, x, y, z + EPS, d) - e) / EPS;
      const gd = (reachError(arm, target0, x, y, z, d + EPS) - e) / EPS;
      const g2 = gx * gx + gy * gy + gz * gz + gd * gd + 1e-4;
      x = clampRange(x - (e * gx) / g2, -0.5, LEAN_MAX);
      y = clampRange(y - (e * gy) / g2, -TWIST_MAX, TWIST_MAX);
      z = clampRange(z - (e * gz) / g2, -ROLL_MAX, ROLL_MAX);
      d = clampRange(d - (e * gd) / g2, 0, DROP_MAX);
    }
    reachPose.x = x;
    reachPose.y = y;
    reachPose.z = z;
    reachPose.d = d;
  }

  /** Distance from the shoulder (rig rotated by x, y, z) to the target (dropped by d), minus the arm length. */
  function reachError(arm: THREE.Object3D, target0: THREE.Vector3, x: number, y: number, z: number, d: number): number {
    reachEuler.set(x, y, z);
    vShoulder.copy(arm.position).applyEuler(reachEuler);
    vTarget.set(target0.x, target0.y + d, target0.z); // the rider pivot drops by d, so the target rises by d in its frame
    return vShoulder.distanceTo(vTarget) - ARM_LEN;
  }

  /** Arm pose (rotation.x, rotation.z) that makes the arm's hanging direction (-y) point along unit d.
   *  Euler XYZ: R = Rx * Rz, so d = (sin z, -cos z cos x, -cos z sin x). */
  function armAim(dx: number, dy: number, dz: number): { ax: number; az: number } {
    return { ax: Math.atan2(-dz, -dy), az: Math.asin(clampSym(dx, 1)) };
  }

  return {
    setTrainMode(on: boolean): void {
      if (trainMode === on) return;
      trainMode = on;
      deck.visible = !on;
      trainCar.visible = on;
    },
    update(p, pos, dt, steer) {
      const h = Math.min(Math.max(dt, 0), 0.1);
      clock += h;
      const sp = p.vel.length();
      const air = p.mode === 'air';
      const grind = p.mode === 'grind';
      const onGround = p.mode === 'ground';
      const bail = p.mode === 'bail';
      const slow = onGround && sp < 12;

      orient(p, targetQ);
      const teleport = lastPos === null || pos.distanceToSquared(lastPos) > TELEPORT_SQ;
      if (lastPos === null) lastPos = new THREE.Vector3();
      lastPos.copy(pos);
      // Lift along the ground normal on the ground and rails (eased to 0 in the air); the trail is corrected below.
      const liftTarget = onGround || grind ? LIFT : 0;
      liftAmt = liftAmt < liftTarget ? Math.min(liftTarget, liftAmt + LIFT_RATE * h) : Math.max(liftTarget, liftAmt - LIFT_RATE * h);
      root.position.copy(pos).addScaledVector(upT, liftAmt);
      if (teleport) {
        root.quaternion.copy(targetQ);
        resetTrail();
        leanCur = 0;
        tumbleX = 0;
        tumbleZ = 0;
        if (air) flailT = 1; // dropped out of the sky: flail for a second
      } else {
        root.quaternion.slerp(targetQ, 1 - Math.exp(-14 * h));
      }

      // Lean into carves (ground only: in the air steer is spin).
      const leanT = onGround ? -steer * 0.35 * Math.min(1, sp / 20) : 0;
      leanCur = ease(leanCur, leanT, 8, h);

      // Bail tumble; once the bail timer is out the rider sits up (no more tumble), then ease to a whole turn.
      if (bail && p.bailT > 0) {
        tumbleX += 9 * h;
        tumbleZ += 4 * h;
      } else {
        tumbleX = ease(tumbleX, Math.round(tumbleX / TAU) * TAU, 5, h);
        tumbleZ = ease(tumbleZ, Math.round(tumbleZ / TAU) * TAU, 5, h);
      }

      // Front/back flip in the air; on the ground it settles on the nearest whole turn.
      flipCur = air ? p.flip : ease(flipCur, Math.round(flipCur / TAU) * TAU, 6, h);
      body.rotation.set(flipCur + tumbleX, 0, leanCur + tumbleZ);

      // Landings: a clean one squashes (and a long air pumps a fist); a sketchy one windmills the arms.
      if (air) {
        airTime += h;
        airVy = p.vel.y;
      } else if (wasAir) {
        if (onGround) {
          if (airVy < -SKETCHY_VY) {
            windT = 0.6;
            hatVx += 9;
          } else {
            squashT = 0;
            hatVx += 4;
            if (airTime > 0.8) pumpT = 0.5;
          }
        }
        airTime = 0;
      }
      wasAir = air;
      if (squashT < 0.3) squashT += h;
      if (pumpT > 0) pumpT = Math.max(0, pumpT - h);
      if (windT > 0) {
        windT = Math.max(0, windT - h);
        windAng += h * 16;
      }
      if (flailT > 0) flailT = Math.max(0, flailT - h);

      // Crouch, lift, grind, tuck and grab weights.
      tuckCur = ease(tuckCur, onGround && sp > TUCK_SPEED ? 1 : 0, 4, h);
      const crouchT = Math.max(onGround ? p.crouch : 0, air && p.grab !== 0 ? 0.6 : 0, grind ? 0.25 : 0, tuckCur * 0.4);
      crouchCur = ease(crouchCur, crouchT, 12, h);
      outCur = ease(outCur, air || grind ? 1 : 0, 10, h);
      liftCur = ease(liftCur, air && p.trick ? 1 : 0, 14, h);
      gridCur = ease(gridCur, grind ? 1 : 0, 10, h);
      airTuckCur = ease(airTuckCur, air && p.airT > 0.6 ? 1 : 0, 6, h);
      swimCur = ease(swimCur, air && Math.abs(p.spinVel) < 3 ? 1 : 0, 6, h);
      wooCur = ease(wooCur, onGround && p.boosting ? 1 : 0, 6, h);
      dazeCur = ease(dazeCur, bail && p.bailT <= 0 ? 1 : 0, 4, h);
      grabW = ease(grabW, air && p.grab !== 0 ? 1 : 0, p.grab !== 0 && air ? 25 : 15, h);
      grindYawCur = ease(grindYawCur, grind ? GRINDS[p.grind?.kind ?? 'fiftyFifty'].yaw : 0, 10, h);
      grindPitchCur = ease(grindPitchCur, grind ? GRINDS[p.grind?.kind ?? 'fiftyFifty'].pitch : 0, 10, h);
      const gDef = GRABS[p.grabKind];
      grabPitchCur = ease(grabPitchCur, air && p.grab !== 0 ? gDef.pitch : 0, 14, h);
      grabRollCur = ease(grabRollCur, air && p.grab !== 0 ? gDef.roll : 0, 14, h);
      if (grind) grindT += h;
      else grindT = 0;

      // Manuals: the board tips about the end that stays on the ground (the pivot sits on that end), rolls with the
      // balance, and the gnome leans over that end. Ending a manual on the ground slaps the board flat with a small dip.
      const man = p.manual;
      if (manualPrev && !man && onGround) {
        manCur = 0;
        dropT = DROP_T;
      }
      manualPrev = man !== null;
      const wantSide = man ? (man.kind === 'nose' ? 1 : -1) : 0;
      if (wantSide !== 0 && Math.abs(manCur) < 0.01) manSide = wantSide; // switch ends only while flat
      const manTarget = wantSide === manSide ? manSide * MANUAL_PITCH : 0;
      const manRate = manTarget !== 0 ? MANUAL_IN : MANUAL_OUT;
      manCur = manCur < manTarget ? Math.min(manTarget, manCur + manRate * h) : Math.max(manTarget, manCur - manRate * h);
      const manW = Math.abs(manCur) / MANUAL_PITCH;
      const bal = man ? man.balance : 0;
      manRoll = ease(manRoll, bal * MANUAL_ROLL, 14, h);
      // Rotation about the end point (on the z axis, so the roll leaves it in place): the pivot is c - R c.
      const zc = manSide * DECK_HALF_LEN;
      manualPivot.rotation.set(manCur, 0, manRoll);
      manualPivot.position.set(0, Math.sin(manCur) * zc, zc * (1 - Math.cos(manCur)));
      let dropOff = 0;
      if (dropT > 0) {
        dropT = Math.max(0, dropT - h);
        dropOff = -0.035 * Math.sin(Math.PI * (1 - dropT / DROP_T));
      }

      // Board: its own trick rotation (roll about its length, shove about y, pitch about x), grab tilt, grind angle.
      const bp = boardPose(p);
      boardPivot.rotation.set(
        bp.pitch + grabPitchCur + grindPitchCur,
        bp.shove + grindYawCur,
        bp.roll + grabRollCur,
      );

      // Knee bounce with speed, squash on a clean landing.
      const bounce = onGround ? Math.sin(clock * (5 + sp * 0.2) + seed) * 0.02 * Math.min(1, sp / 18) : 0;
      const squashOff = squashT < 0.3 ? -0.15 * Math.sin((Math.PI * squashT) / 0.3) : 0;
      riderPivot.position.y = FEET_Y + (trainMode ? TRAIN_RIDER_OFFSET : 0) - 0.28 * crouchCur + 0.3 * liftCur + bounce + squashOff + dropOff;

      // Gnome: the model animates a still pose, then the limbs are set below.
      gnome.update(idleState, h);
      gnome.object.rotation.y = lerp(-Math.PI / 2, 0, gridCur);

      // Base rig pose: crouch lean, the carve and the speed sway, a look-around, a grind wobble, the daze.
      let rigX = 0.3 * crouchCur + 0.25 * tuckCur + 0.1 * airTuckCur;
      let rigZ = Math.sin(clock * (3 + sp * 0.12) + seed) * 0.05 * Math.min(1, sp / 20) * (1 - outCur);
      if (grind) rigZ += Math.sin(clock * 5 + seed) * 0.05 * Math.min(1, grindT / 2);
      // Look-around: every 4-7 s when cruising slowly, the head turns ±0.3 for a second.
      if (slow) {
        lookT -= h;
        if (lookT <= 0) {
          lookDir = -lookDir;
          lookHold = 1;
          lookN++;
          lookT = 4 + 3 * frac(seed + lookN * 0.37);
        }
        lookHold = Math.max(0, lookHold - h);
      } else {
        lookHold = 0;
      }
      lookA = ease(lookA, lookHold > 0 ? 0.3 * lookDir : 0, 4, h);
      if (dazeCur > 0.001) {
        // Dazed: the head sways in a slow circle until the bail is over.
        rigX = lerp(rigX, 0.25 + 0.2 * Math.cos(clock * 2.5), dazeCur);
        rigZ = lerp(rigZ, 0.25 * Math.sin(clock * 2.5), dazeCur);
      }
      // Manual: the gnome leans over the balanced end.
      rigX += MANUAL_LEAN * manSide * manW;
      gnome.rig.rotation.set(rigX, lookA, rigZ);

      // Hat: a damped spring with a little wobble while riding.
      if (hat && hatBase) {
        const wobT = Math.sin(clock * 9 + seed) * 0.03 * Math.min(1, sp / 20);
        const wobZ = Math.cos(clock * 7 + seed) * 0.03 * Math.min(1, sp / 20);
        hatVx += (-40 * (hatAx - wobT) - 4 * hatVx) * h;
        hatAx += hatVx * h;
        hatVz += (-40 * (hatAz - wobZ) - 4 * hatVz) * h;
        hatAz += hatVz * h;
        hat.rotation.set(hatBase.x + hatAx, hatBase.y, hatBase.z + hatAz);
      }

      // Shadow on the ground under the rider.
      updateShadow(pos);

      // Gnome world matrices (the grab needs them), then the grab: the board point, the leaning rig, the aimed arm.
      root.updateMatrixWorld(true);
      const rig = gnome.rig;

      // Arms: base pose, then the overrides in order.
      const restZ = 0.3 + 0.3 * crouchCur;
      const outZ = lerp(restZ, 0.8, outCur);
      const popBack = onGround ? -0.9 * p.crouch : 0; // wind-up: arms back while the pop charges
      let lx = popBack - 0.3 * tuckCur;
      let rx = popBack - 0.3 * tuckCur;
      let lz = outZ + 1.2 * leanCur * (onGround ? 1 : 0); // the outer arm swings out in a carve
      let rz = -outZ + 1.2 * leanCur * (onGround ? 1 : 0);
      const swim = swimCur * Math.sin(clock * 7 + seed) * 0.5;
      lx += swim;
      rx -= swim;
      if (flailT > 0) {
        const f = flailT;
        lx = lerp(lx, Math.sin(clock * 14) * 1.3, f);
        rx = lerp(rx, Math.sin(clock * 14 + Math.PI) * 1.3, f);
      }
      if (windT > 0) {
        const wm = clamp01(windT / 0.2);
        lx = lerp(lx, windAng, wm);
        rx = lerp(rx, windAng + Math.PI, wm);
      }
      if (pumpT > 0) {
        const pw = Math.sin(Math.PI * (1 - pumpT / 0.5));
        rx = lerp(rx, -2.6, pw);
        rz = lerp(rz, -0.3, pw);
      }
      if (wooCur > 0.001) {
        rx = lerp(rx, -2.7, wooCur);
        rz = lerp(rz, -0.2, wooCur);
      }
      if (manW > 0.001) {
        // Manual: arms out wide; past 0.6 balance they windmill, faster as the balance goes further off.
        const wr = clamp01((Math.abs(bal) - 0.6) / 0.3);
        manWind += h * (5 + 15 * wr);
        lz = lerp(lz, 1.5, manW);
        rz = lerp(rz, -1.5, manW);
        if (wr > 0.001) {
          lx = lerp(lx, manWind, wr * manW);
          rx = lerp(rx, manWind + Math.PI, wr * manW);
        }
      }
      if (legs) {
        const legX = -0.6 * airTuckCur + (flailT > 0 ? Math.sin(clock * 12) * 0.8 * flailT : 0);
        legs.left.rotation.x = legX;
        legs.right.rotation.x = -legX;
      }

      // Grab: the grab point on the board, the hand that reaches it (the front hand is the one nearer the nose),
      // the rig leaning toward it, and the arm aimed along the rest of the way.
      if (grabW > 0.001) {
        // Board nose and across directions, and the gnome's facing, all in world space.
        deck.localToWorld(vCenter.copy(vZero));
        vBoardFwd.set(0, 0, 1);
        deck.localToWorld(vBoardFwd).sub(vCenter);
        vBoardX.set(1, 0, 0);
        deck.localToWorld(vBoardX).sub(vCenter);
        gnome.object.localToWorld(vGnomeO.set(0, 0, 0));
        vGnomeFwd.set(0, 0, 1);
        gnome.object.localToWorld(vGnomeFwd).sub(vGnomeO);
        const faceSign = vGnomeFwd.dot(vBoardX) >= 0 ? 1 : -1;
        const spot = gDef.spot;
        grabAnchor(spot, faceSign, vAnchor);
        deck.localToWorld(vAnchor); // world target
        // Which arm is the front one: the shoulder further along the board's nose.
        armLeft.getWorldPosition(vLeft);
        armRight.getWorldPosition(vRight);
        const dotL = vLeft.sub(vCenter).dot(vBoardFwd);
        const dotR = vRight.sub(vCenter).dot(vBoardFwd);
        const frontLeft = dotL >= dotR;
        const useLeft = (gDef.hand === 'front') === frontLeft;
        const arm = useLeft ? armLeft : armRight;
        const lean = grabW;
        // Solve the rig's lean, twist and roll so the shoulder sits one arm length from the grab point, then blend in.
        vL.copy(vAnchor);
        gnome.object.worldToLocal(vL);
        solveReach(arm, vL, rigX, 0, rigZ, 0);
        rig.rotation.set(
          lerp(rigX, reachPose.x, lean),
          lerp(0, reachPose.y, lean),
          lerp(rigZ, reachPose.z, lean),
        );
        riderPivot.position.y -= reachPose.d * lean;
        root.updateMatrixWorld(true);
        // Aim the arm from its shoulder at the target.
        vL.copy(vAnchor);
        rig.worldToLocal(vL);
        vDir.copy(vL).sub(arm.position);
        const len = vDir.length();
        if (len > 1e-5) vDir.divideScalar(len);
        else vDir.set(0, -1, 0);
        const aim = armAim(vDir.x, vDir.y, vDir.z);
        if (useLeft) {
          lx = lerp(lx, aim.ax, grabW);
          lz = lerp(lz, aim.az, grabW);
        } else {
          rx = lerp(rx, aim.ax, grabW);
          rz = lerp(rz, aim.az, grabW);
        }
      }
      armLeft.rotation.set(lx, 0, lz);
      armRight.rotation.set(rx, 0, rz);

      // Tail corners in world space, then the trail.
      root.updateMatrixWorld(true);
      const tw = trainMode ? TRAIN_HALF_W * 0.85 : TAIL_HALF_W;
      const ty = trainMode ? 0.04 : 0;
      const tz = trainMode ? -TRAIN_HALF_LEN : TAIL_Z;
      tailL.set(-tw, ty, tz).applyMatrix4(deck.matrixWorld).addScaledVector(upT, -liftAmt);
      tailR.set(tw, ty, tz).applyMatrix4(deck.matrixWorld).addScaledVector(upT, -liftAmt);
      updateTrail(p, h, sp);
    },
  };
}
