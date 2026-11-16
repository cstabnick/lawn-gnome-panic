// The gnome on its board: pose, crouch, lean, spins, flips, board tricks, grabs, bails, trail.
import * as THREE from 'three';
import { createGnomeModel, getMyGnome, GNORMAN_LOOK, type GnomeModel, type PlayerState } from '@lawn/gnome';
import { PALETTE, type Player } from '../config';
import { boardPose, forwardOf } from '../physics';
import { groundAt, type Ground, type World } from '../world';
import { GRADIENT, addOutline, toonMat, toonify } from './toon';

export interface RiderView {
  /** pos = the interpolated render position (feet on the board). steer = this frame's steer input (lean). */
  update(p: Player, pos: THREE.Vector3, dt: number, steer: number): void;
}

const UP = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;
const DECK_HALF_LEN = 0.675;
const DECK_HALF_W = 0.18;
const DECK_THICK = 0.05;
/** Board centre, below the feet line (pos). */
const DECK_Y = -0.03;
/** The gnome stands on the deck top. */
const FEET_Y = -0.005;
const TRAIL_N = 48;
const TRAIL_STEP_SQ = 0.15 * 0.15;
const TRAIL_SPEED = 14;
const TAIL_HALF_W = 0.13;
const TAIL_Z = -0.6;
const SHADOW_FADE_H = 25;
const TELEPORT_SQ = 8 * 8;

const CYAN = new THREE.Color(PALETTE.cyan);
const PINK = new THREE.Color(PALETTE.pink);
const YELLOW = new THREE.Color(PALETTE.yellow);

function ease(cur: number, target: number, rate: number, dt: number): number {
  return cur + (target - cur) * (1 - Math.exp(-rate * dt));
}
function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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

export function createRider(scene: THREE.Scene, w: World): RiderView {
  // root (at pos, oriented to the ground) > body (lean, flip, tumble) > { boardPivot > deck, riderPivot > gnome }
  const root = new THREE.Group();
  const body = new THREE.Group();
  const boardPivot = new THREE.Group();
  const riderPivot = new THREE.Group();
  root.add(body);
  body.add(boardPivot, riderPivot);
  boardPivot.position.y = DECK_Y;
  riderPivot.position.y = FEET_Y;
  const deck = makeDeck();
  boardPivot.add(deck);
  scene.add(root);

  const look = getMyGnome()?.look ?? { ...GNORMAN_LOOK, hat: PALETTE.pink, shirt: PALETTE.cyan, pants: 0x3a2a6a };
  const gnome: GnomeModel = createGnomeModel(look);
  toonify(gnome.object, 0.02);
  riderPivot.add(gnome.object);

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

  // Smoothed state.
  let lastPos: THREE.Vector3 | null = null;
  let leanCur = 0;
  let tumbleX = 0;
  let tumbleZ = 0;
  let flipCur = 0;
  let crouchCur = 0;
  let liftCur = 0;
  let outCur = 0;
  let gridCur = 0;
  let tiltCur = 0;
  let gI = 0;
  let gM = 0;
  let swayT = 0;

  // Scratch.
  const targetQ = new THREE.Quaternion();
  const basis = new THREE.Matrix4();
  const fwd = new THREE.Vector3();
  const rgt = new THREE.Vector3();
  const upT = new THREE.Vector3();
  const tailL = new THREE.Vector3();
  const tailR = new THREE.Vector3();
  const tmpC = new THREE.Color();
  const groundScratch: Ground = { y: 0, normal: new THREE.Vector3(), island: 0 };
  const idleState: PlayerState = {
    position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0,
  };

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
    shadow.scale.setScalar(0.4 + 0.6 * f);
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
      const a = trailA * (1 - i / n);
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

  return {
    update(p, pos, dt, steer) {
      const h = Math.min(Math.max(dt, 0), 0.1);
      const sp = p.vel.length();
      const air = p.mode === 'air';
      const grind = p.mode === 'grind';
      const onGround = p.mode === 'ground';
      const bail = p.mode === 'bail';

      orient(p, targetQ);
      const teleport = lastPos === null || pos.distanceToSquared(lastPos) > TELEPORT_SQ;
      if (lastPos === null) lastPos = new THREE.Vector3();
      lastPos.copy(pos);
      root.position.copy(pos);
      if (teleport) {
        root.quaternion.copy(targetQ);
        resetTrail();
        leanCur = 0;
        tumbleX = 0;
        tumbleZ = 0;
      } else {
        root.quaternion.slerp(targetQ, 1 - Math.exp(-14 * h));
      }

      // Lean into carves (ground only: in the air steer is spin).
      const leanT = onGround ? -steer * 0.35 * Math.min(1, sp / 20) : 0;
      leanCur = ease(leanCur, leanT, 8, h);

      // Bail tumble, then ease back to the nearest full turn.
      if (bail) {
        tumbleX += 9 * h;
        tumbleZ += 4 * h;
      } else {
        tumbleX = ease(tumbleX, Math.round(tumbleX / TAU) * TAU, 5, h);
        tumbleZ = ease(tumbleZ, Math.round(tumbleZ / TAU) * TAU, 5, h);
      }

      // Front/back flip in the air; on the ground it settles on the nearest whole turn.
      flipCur = air ? p.flip : ease(flipCur, Math.round(flipCur / TAU) * TAU, 6, h);
      body.rotation.set(flipCur + tumbleX, 0, leanCur + tumbleZ);

      // Crouch, lift, grind and grab weights.
      const crouchT = Math.max(onGround ? p.crouch : 0, air && p.grab !== 0 ? 0.6 : 0, grind ? 0.2 : 0);
      crouchCur = ease(crouchCur, crouchT, 12, h);
      outCur = ease(outCur, air || grind ? 1 : 0, 10, h);
      liftCur = ease(liftCur, air && p.trick ? 1 : 0, 14, h);
      gridCur = ease(gridCur, grind ? 1 : 0, 10, h);
      const tiltT = air ? (p.grab === 1 ? 0.25 : p.grab === 2 ? -0.25 : 0) : 0;
      tiltCur = ease(tiltCur, tiltT, 14, h);
      gI = ease(gI, air && p.grab === 1 ? 1 : 0, 14, h);
      gM = ease(gM, air && p.grab === 2 ? 1 : 0, 14, h);

      // Board: its own trick rotation (roll about its length, shove about y, pitch about x), grab tilt, boardslide yaw.
      const bp = boardPose(p);
      boardPivot.rotation.set(bp.pitch, bp.shove + gridCur * (Math.PI / 2), bp.roll + tiltCur);
      riderPivot.position.y = FEET_Y - 0.28 * crouchCur + 0.3 * liftCur;

      // Gnome: the model animates a still pose, then the limbs are set below.
      gnome.update(idleState, h);
      gnome.object.rotation.y = lerp(-Math.PI / 2, 0, gridCur);
      swayT += h * (3 + sp * 0.12);
      const sway = Math.sin(swayT) * 0.05 * Math.min(1, sp / 20) * (1 - outCur);
      gnome.rig.rotation.set(0.3 * crouchCur, 0, sway);
      const restZ = 0.3 + 0.3 * crouchCur;
      const outZ = lerp(restZ, 0.8, outCur);
      gnome.arms.left.rotation.set(gM * 1.6, 0, lerp(outZ, 0.4, gM));
      gnome.arms.right.rotation.set(gI * 1.6, 0, lerp(-outZ, -0.4, gI));

      // Shadow on the ground under the rider.
      updateShadow(pos);

      // Tail corners in world space, then the trail.
      root.updateMatrixWorld(true);
      tailL.set(-TAIL_HALF_W, 0, TAIL_Z).applyMatrix4(deck.matrixWorld);
      tailR.set(TAIL_HALF_W, 0, TAIL_Z).applyMatrix4(deck.matrixWorld);
      updateTrail(p, h, sp);
    },
  };
}
