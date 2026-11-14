// Race mode (GNOME W FRIENDS): the other players' carts, gnomes and balls, drawn from their relayed poses.
// Each remote player gets a 2-seat cart in their colour, their gnome, their ball and a name tag. Poses are played
// back from a short buffer a little in the past (@lawn/mp/interp), so the ~8 Hz updates move smoothly at the
// sender's real pace. Nothing is in the scene outside online race play.
import * as THREE from 'three';
import { Interp } from '@lawn/mp/interp';
import { lookWithHat, type Ctx, type Golfer, type RacePose, type System } from './config';
import { createCartModel, type CartModel } from './cartModel';
import { createGnomeModel } from './models/gnome';
import type { GnomeModel, PlayerState } from './models/config';

const BALL_RADIUS = 0.12;
/** Ease rate for the gnome only, so it does not jump between its seat, its spot and the thrown arc. */
const EASE = 10;
/** Moves farther than this (yd) between poses are snapped to instead of slid to. */
const SNAP_DIST = 60;

// Playback sample: cart x y z facing speed (0-4), golfer x y z facing (5-8), ball x y z (9-11),
// riding, throwing, ball shown (12-14; flags switch, never blend).
const P_CART = 0;
const P_GOLFER = 5;
const P_BALL = 9;
const P_RIDING = 12;
const P_THROWING = 13;
const P_BALL_SHOWN = 14;

function newBuf(): Interp {
  return new Interp({ pos: [0, 1, 2], snapDist: SNAP_DIST, angles: [3, 8], steps: [P_RIDING, P_THROWING, P_BALL_SHOWN] });
}

function poseSample(race: RacePose): number[] {
  const ballShown = race.mode === 'golf' && race.phase !== 'title' && race.phase !== 'card' && race.phase !== 'final';
  return [
    race.cart.x, race.cart.y, race.cart.z, race.cart.facing, race.riding ? race.cart.speed : 0,
    race.golfer.x, race.golfer.y, race.golfer.z, race.golfer.facing,
    race.ball.x, race.ball.y, race.ball.z,
    race.riding ? 1 : 0, race.mode === 'disc' && race.phase === 'flight' ? 1 : 0, ballShown ? 1 : 0,
  ];
}
/** Name tag size in yards, and how far above the gnome's feet it floats. */
const TAG_W = 2.2;
const TAG_H = 0.7;
const TAG_LIFT = 2.4;
/** Canvas pixels for the name tag (same aspect as TAG_W x TAG_H). */
const TAG_PX_W = 440;
const TAG_PX_H = 140;

interface Entry {
  cart: CartModel;
  gnome: GnomeModel;
  ps: PlayerState;
  ball: THREE.Mesh;
  tag: THREE.Sprite;
  tagTex: THREE.CanvasTexture;
  tagCanvas: HTMLCanvasElement;
  tagKey: string;
  gnomePos: THREE.Vector3;
  gnomeYaw: number;
  /** Pose playback, and the last pose object pushed into it (a new one arrives with each 'pose' message). */
  buf: Interp;
  lastPose: RacePose | null;
  out: number[];
  /** True until the first frame: the shown pose starts exactly at the target. */
  fresh: boolean;
}

const tmpTarget = new THREE.Vector3();

function wrapAngle(a: number): number {
  const t = Math.PI * 2;
  return ((a + Math.PI) % t + t) % t - Math.PI;
}

/** Move cur toward target: ease, or snap when first shown or when far away. */
function approach(cur: THREE.Vector3, target: THREE.Vector3, k: number, snap: boolean): void {
  if (snap || cur.distanceTo(target) > SNAP_DIST) cur.copy(target);
  else cur.lerp(target, k);
}

/** Move a yaw toward target along the shortest arc. */
function approachYaw(cur: number, target: number, k: number, snap: boolean): number {
  if (snap) return target;
  return cur + wrapAngle(target - cur) * k;
}

function disposeTree(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}

function cssColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawTag(canvas: HTMLCanvasElement, name: string, color: number, line: string): void {
  const c = canvas.getContext('2d');
  if (!c) return;
  c.clearRect(0, 0, TAG_PX_W, TAG_PX_H);
  c.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(c, 4, 4, TAG_PX_W - 8, TAG_PX_H - 8, 26);
  c.fill();
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  // Shrink the name until it fits the backing.
  let size = 52;
  c.font = `bold ${size}px sans-serif`;
  while (size > 18 && c.measureText(name).width > TAG_PX_W - 40) {
    size -= 2;
    c.font = `bold ${size}px sans-serif`;
  }
  c.fillStyle = cssColor(color);
  c.fillText(name, TAG_PX_W / 2, 50);
  c.font = '600 30px sans-serif';
  c.fillStyle = '#ffffff';
  c.fillText(line, TAG_PX_W / 2, 102);
}

function makeEntry(scene: THREE.Scene, g: Golfer, race: RacePose): Entry {
  const cart = createCartModel({ color: g.color });
  const gnome = createGnomeModel(lookWithHat(g.color, g.look));
  // Lay the gnome flat (rotation.x) before turning it to its facing (rotation.y).
  gnome.object.rotation.order = 'YXZ';
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
  );
  const tagCanvas = document.createElement('canvas');
  tagCanvas.width = TAG_PX_W;
  tagCanvas.height = TAG_PX_H;
  const tagTex = new THREE.CanvasTexture(tagCanvas);
  const tag = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: true }),
  );
  tag.scale.set(TAG_W, TAG_H, 1);
  tag.renderOrder = 10;
  scene.add(cart.group, gnome.object, ball, tag);
  return {
    cart,
    gnome,
    ps: {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      facing: 0,
      grounded: true,
      jumpsUsed: 0,
      stamina: 1,
      staminaDelay: 0,
      sprinting: false,
      exhausted: false,
    },
    ball,
    tag,
    tagTex,
    tagCanvas,
    tagKey: '',
    gnomePos: new THREE.Vector3(),
    gnomeYaw: 0,
    buf: newBuf(),
    lastPose: null,
    out: poseSample(race),
    fresh: true,
  };
}

function removeEntry(scene: THREE.Scene, e: Entry): void {
  scene.remove(e.cart.group, e.gnome.object, e.ball, e.tag);
  disposeTree(e.cart.group);
  disposeTree(e.gnome.object);
  disposeTree(e.ball);
  e.tag.material.dispose();
  e.tagTex.dispose();
}

export function createRemotes(ctx: Ctx): System {
  const entries = new Map<number, Entry>();

  function clear(): void {
    for (const e of entries.values()) removeEntry(ctx.scene, e);
    entries.clear();
  }

  function updateEntry(e: Entry, g: Golfer, race: RacePose, dt: number): void {
    const snap = e.fresh;
    e.fresh = false;
    const k = 1 - Math.exp(-EASE * dt);

    // New pose message: into the playback buffer. A new hole starts from its tee instead of sliding there.
    if (race !== e.lastPose) {
      if (e.lastPose && e.lastPose.hole !== race.hole) e.buf.clear();
      e.lastPose = race;
      e.buf.push(poseSample(race), race.ms);
    }
    const p = e.out;
    e.buf.sample(p);
    const riding = p[P_RIDING] === 1;
    const throwing = p[P_THROWING] === 1;
    const ballShown = p[P_BALL_SHOWN] === 1;

    // Cart: straight from the playback.
    e.cart.group.position.set(p[P_CART], p[P_CART + 1], p[P_CART + 2]);
    e.cart.group.rotation.y = p[P_CART + 3];
    e.cart.animate(dt, p[P_CART + 4]);

    // Gnome: on the cart's seat 0 while riding, otherwise standing at its spot; lying flat while a gnome is thrown.
    let gnomeTarget: THREE.Vector3;
    let gnomeFacing: number;
    if (throwing) {
      gnomeTarget = tmpTarget.set(p[P_BALL], p[P_BALL + 1], p[P_BALL + 2]);
      gnomeFacing = p[P_GOLFER + 3];
    } else if (riding) {
      gnomeTarget = tmpTarget.copy(e.cart.seats[0]);
      e.cart.group.updateMatrixWorld(true);
      e.cart.group.localToWorld(gnomeTarget);
      gnomeFacing = p[P_CART + 3] + e.cart.seatFacing[0];
    } else {
      gnomeTarget = tmpTarget.set(p[P_GOLFER], p[P_GOLFER + 1], p[P_GOLFER + 2]);
      gnomeFacing = p[P_GOLFER + 3];
    }
    // While riding or thrown the target already moves smoothly; the ease only covers hopping on and off.
    approach(e.gnomePos, gnomeTarget, riding || throwing ? Math.max(k, 0.5) : k, snap);
    e.gnomeYaw = approachYaw(e.gnomeYaw, gnomeFacing, k, snap);
    e.ps.position.copy(e.gnomePos);
    e.ps.velocity.set(0, 0, 0);
    e.ps.facing = e.gnomeYaw;
    e.ps.grounded = true;
    e.gnome.update(e.ps, dt);
    // Arms after update so they win: wheel arms while riding, relaxed otherwise.
    const armX = riding ? -1.2 : 0;
    e.gnome.arms.left.rotation.set(armX, 0, 0);
    e.gnome.arms.right.rotation.set(armX, 0, 0);
    e.gnome.object.rotation.x = throwing ? -Math.PI / 2 : 0;

    // Ball: golf mode while the hole is being played; hidden in disc mode.
    e.ball.position.set(p[P_BALL], p[P_BALL + 1], p[P_BALL + 2]);
    e.ball.visible = ballShown;

    // Name tag: redraw only when its text changes.
    const line = race.finishedS !== null ? 'Finished' : `Hole ${race.hole + 1} · ${g.strokes} strokes`;
    const key = `${g.name}\u0000${g.color}\u0000${line}`;
    if (key !== e.tagKey) {
      e.tagKey = key;
      drawTag(e.tagCanvas, g.name, g.color, line);
      e.tagTex.needsUpdate = true;
    }
    e.tag.position.set(e.gnomePos.x, e.gnomePos.y + TAG_LIFT, e.gnomePos.z);
  }

  return {
    update(dt: number): void {
      const o = ctx.state.online;
      if (!o || !o.started || o.format !== 'race') {
        clear();
        return;
      }
      const seen = new Set<number>();
      for (const g of o.golfers) {
        if (g.id === o.me || g.left || g.race === null) continue;
        seen.add(g.id);
        let e = entries.get(g.id);
        if (!e) {
          e = makeEntry(ctx.scene, g, g.race);
          entries.set(g.id, e);
        }
        updateEntry(e, g, g.race, dt);
      }
      for (const [id, e] of entries) {
        if (!seen.has(id)) {
          removeEntry(ctx.scene, e);
          entries.delete(id);
        }
      }
    },
  };
}
