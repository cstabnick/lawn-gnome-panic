// Pickup-game and shootaround drawing at Drainpipe Court: four gnomes, the ball, its shadow and the steering ring.
import * as THREE from 'three';
import { GNORMAN_LOOK, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab } from '@lawn/prefabs';
import { gnomeState, makeGnome, poseHandsUp, randomTownLook } from '../gnomes';
import { heightAt } from '../terrain';
import { SPORTS_CAST } from '../sports/types';
import type { CourtGnomeView, PickupView } from './types';

export interface CourtRender {
  /** Draw a game frame (null hides the game gnomes and the game ball). */
  game(v: PickupView | null, dt: number): void;
  /** Draw the shootaround ball at (x, y, z), or hide it (null). */
  ball(p: { x: number; y: number; z: number } | null, dt: number): void;
  dispose(): void;
}

const BALL_SCALE = 0.19 / 0.29; // prefab ball is 0.29 m across at scale 1, origin at its base
const BALL_CENTRE = 0.145 * BALL_SCALE;
const SHADOW_LIFT = 0.02;
const RING_LIFT = 0.02;
const RING_R = 0.55;

interface BallRig {
  group: THREE.Group;
  spin: THREE.Group;
  shadow: THREE.Mesh;
  last: THREE.Vector3 | null;
}

function makeBall(parent: THREE.Object3D): BallRig {
  const group = new THREE.Group();
  const ball = buildPrefab('gba-basketball', { scale: BALL_SCALE });
  ball.position.y = -BALL_CENTRE;
  const spin = new THREE.Group();
  spin.add(ball);
  group.add(spin);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 20),
    flatLayer(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }), LAYER.decal),
  );
  shadow.rotation.x = -Math.PI / 2;
  group.visible = false;
  shadow.visible = false;
  parent.add(group, shadow);
  return { group, spin, shadow, last: null };
}

function placeBall(r: BallRig, p: { x: number; y: number; z: number } | null): void {
  if (!p) {
    r.group.visible = false;
    r.shadow.visible = false;
    r.last = null;
    return;
  }
  const dx = r.last ? p.x - r.last.x : 0;
  const dy = r.last ? p.y - r.last.y : 0;
  const dz = r.last ? p.z - r.last.z : 0;
  const moved = Math.hypot(dx, dy, dz);
  r.group.visible = true;
  r.group.position.set(p.x, p.y, p.z);
  if (moved > 0.002) {
    // roll about the axis perpendicular to the travel direction
    const axis = new THREE.Vector3(dz, 0, -dx);
    if (axis.lengthSq() > 1e-9) r.spin.rotateOnWorldAxis(axis.normalize(), moved / 0.095);
    else r.spin.rotation.x += moved * 6;
  }
  if (!r.last) r.last = new THREE.Vector3();
  r.last.set(p.x, p.y, p.z);
  const ground = heightAt(p.x, p.z);
  r.shadow.visible = true;
  r.shadow.position.set(p.x, ground + SHADOW_LIFT, p.z);
  const s = 1 / (1 + Math.max(0, p.y - ground) * 0.35);
  r.shadow.scale.setScalar(s);
  (r.shadow.material as THREE.MeshBasicMaterial).opacity = 0.35 * s;
}

function lookFor(slot: number, name: string, myLook: GnomeLook): GnomeLook {
  if (slot === 0) return myLook;
  if (slot === 1) return { ...GNORMAN_LOOK, ...SPORTS_CAST.pansy.look };
  if (name.includes('Cardoon')) return { ...GNORMAN_LOOK, ...SPORTS_CAST.cardoon.look };
  if (name.includes('Lintel')) return { ...GNORMAN_LOOK, ...SPORTS_CAST.lintel.look };
  return randomTownLook();
}

export function createCourtRender(scene: THREE.Scene, myLook: GnomeLook): CourtRender {
  const root = new THREE.Group();
  root.name = 'court-render';
  scene.add(root);

  let models: GnomeModel[] | null = null;
  const gameBall = makeBall(root);
  const shootBall = makeBall(root);
  let t = 0;

  const ringMat = flatLayer(new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }), LAYER.marker);
  const ring = new THREE.Mesh(new THREE.RingGeometry(RING_R * 0.8, RING_R, 32), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.name = 'court-ring';
  ring.visible = false;
  root.add(ring);

  function build(v: PickupView): void {
    models = [0, 1, 2, 3].map((slot) => {
      const g = v.gnomes.find((q) => q.slot === slot);
      const m = makeGnome(root, lookFor(slot, g?.name ?? '', myLook));
      m.object.visible = false;
      return m;
    });
  }

  function game(v: PickupView | null): void {
    if (!v) {
      if (models) for (const m of models) m.object.visible = false;
      placeBall(gameBall, null);
      ring.visible = false;
      return;
    }
    if (!models) build(v);
    const seen = new Set<number>();
    let controlled: CourtGnomeView | null = null;
    for (const g of v.gnomes) {
      const m = models![g.slot];
      if (!m) continue;
      seen.add(g.slot);
      m.object.visible = true;
      m.update(gnomeState(g.x, g.y, g.z, g.yaw, g.speed), dtNow);
      if (g.air) poseHandsUp(m, t);
      if (g.slot === v.controlled) controlled = g;
    }
    models!.forEach((m, i) => { if (!seen.has(i)) m.object.visible = false; });
    placeBall(gameBall, v.ball);
    if (controlled) {
      ring.visible = true;
      ring.position.set(controlled.x, heightAt(controlled.x, controlled.z) + RING_LIFT, controlled.z);
    } else {
      ring.visible = false;
    }
  }

  let dtNow = 0;
  return {
    game(v, dt) {
      dtNow = dt;
      t += dt;
      game(v);
    },
    ball: (p) => placeBall(shootBall, p),
    dispose() {
      scene.remove(root);
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          const mat = m.material;
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else mat.dispose();
        }
      });
      models = null;
    },
  };
}
