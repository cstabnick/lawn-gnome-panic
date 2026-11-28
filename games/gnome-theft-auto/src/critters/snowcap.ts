// Snowcap Rise locals (E12): four more really chill polar bears (napping on Pail Pond, spinning slowly in a tube on the
// ice, fishing a hole, holding a mug on the Woolly Sock Lodge porch) and the Bear Deck sign on the Fells. Nothing dies,
// nothing is removed (R-021, R-049): a hit bear only shrugs.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { type Critter, type CritterRuntime, critterMesh, type RegionLife } from '../critters';
import { textPlate } from '../homes/pieces';
import { heightAt } from '../terrain';
import { BEAR_DECK, type BearSpot, SNOWCAP_BEARS } from '../winter/types';
import { BEAR_SHRUGS } from './fells';

const REGION = 'north-highlands' as const;
const GROUP = 'snowcap-bears';
const BEAR_SHRUG_S = 1.6;
const BEAR_TOAST_GAP = 8;
const FAR = 200;
const SIP_EVERY = 8;
/** The Bear Deck sign stands this far east of the deck's centre line (at least 6 m, clear of every chair). */
export const SIGN_DX = 9;
const PUFF_NEAR = 150;
/** The mug is a 0.14 m prefab: at bear scale (a 1.7 m bear) it takes about this much to read from a few metres. */
export const MUG_SCALE = 2.4;

interface Puff { sprite: THREE.Sprite; mat: THREE.SpriteMaterial; phase: number }
interface Bear {
  c: Critter;
  spot: BearSpot;
  /** Everything built for this bear's pose (the bear itself is a critter). */
  props: THREE.Object3D[];
  tube?: THREE.Object3D;
  /** Zzz (nap) or steam (mug) sprites, drifting up and fading; only animated near the player. */
  puffs: Puff[];
  /** The mug in the bear's paw, once the bear's model exists to hold it. */
  mug?: THREE.Object3D;
  mugHeld?: boolean;
}
interface SnowcapState { t: number; bears: Bear[] }

// Per-runtime state: the RegionLife object is a shared constant, so a runtime's own state is kept by key.
const states = new WeakMap<CritterRuntime, SnowcapState>();

const mugPos = new THREE.Vector3();
const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** A prefab (or its placeholder) at ground height under (x, z), added to the scene and to the bear's props. */
function place(rt: CritterRuntime, b: Bear, prefab: string, scale: number, x: number, z: number): THREE.Group {
  const m = critterMesh(prefab, scale);
  m.position.set(x, heightAt(x, z), z);
  rt.scene.add(m);
  b.props.push(m);
  return m;
}

function part(c: Critter, name: string): THREE.Object3D | null {
  return c.object?.getObjectByName(name) ?? null;
}

const puffTextures = new Map<string, THREE.Texture>();

/** A soft canvas texture for a puff: a bold "Z" or a blurry steam blob. Null where there is no canvas (tests). */
function puffTexture(kind: 'z' | 'steam'): THREE.Texture | null {
  const hit = puffTextures.get(kind);
  if (hit) return hit;
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  if (!g) return null;
  if (kind === 'z') {
    g.font = 'bold 54px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 7;
    g.strokeStyle = 'rgba(40,70,120,0.9)';
    g.strokeText('Z', 32, 34);
    g.fillStyle = '#ffffff';
    g.fillText('Z', 32, 34);
  } else {
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(cv);
  puffTextures.set(kind, tex);
  return tex;
}

function addPuffs(rt: CritterRuntime, b: Bear, kind: 'z' | 'steam', n: number): void {
  const map = puffTexture(kind);
  if (!map) return;
  for (let i = 0; i < n; i++) {
    const mat = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity: 0 });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    rt.scene.add(sprite);
    b.puffs.push({ sprite, mat, phase: i / n });
  }
}

/** Rise `rise` metres over `period` seconds from (x, y, z), grow and fade; staggered by each puff's phase. */
function animatePuffs(b: Bear, t: number, x: number, y: number, z: number, kind: 'z' | 'steam'): void {
  const period = kind === 'z' ? 4.5 : 2.6;
  const rise = kind === 'z' ? 1.3 : 0.55;
  for (const p of b.puffs) {
    const u = ((t / period) + p.phase) % 1;
    const drift = kind === 'z' ? Math.sin(u * 5 + p.phase * 6) * 0.12 + u * 0.35 : Math.sin(u * 7 + p.phase * 5) * 0.04;
    p.sprite.position.set(x + drift, y + u * rise, z);
    const size = (kind === 'z' ? 0.8 : 0.22) * (0.6 + u * 0.8);
    p.sprite.scale.set(size, size, 1);
    p.mat.opacity = Math.min(1, u * 5) * (1 - u) * (kind === 'z' ? 1 : 0.55);
    p.sprite.visible = true;
  }
}

function addPoseProps(rt: CritterRuntime, b: Bear): void {
  const { x, z, yaw } = b.spot;
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  switch (b.spot.pose) {
    case 'nap': {
      // A striped red-and-white towel under the bear (prefab nap-towel), a folded newspaper beside it.
      const towel = place(rt, b, 'nap-towel', 1, x, z);
      towel.rotation.y = yaw + Math.PI / 2;
      const rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const px = x + rx * 1.5 - fx * 0.2, pz = z + rz * 1.5 - fz * 0.2;
      const paper = place(rt, b, 'pl-newspaper', 2.2, px, pz);
      paper.position.y += 0.03;
      paper.rotation.y = yaw + 0.5;
      addPuffs(rt, b, 'z', 3);
      break;
    }
    case 'tube':
      b.tube = place(rt, b, 'tow-tube', 1, x, z);
      break;
    case 'fish': {
      place(rt, b, 'stool', 1, x, z);
      // A dark hole in the ice in front of the bear, and a rod leaning from its paw over it.
      const hx = x + fx * 1.1, hz = z + fz * 1.1;
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(0.45, 24),
        flatLayer(new THREE.MeshLambertMaterial({ color: 0x1b2b36 }), LAYER.marking),
      );
      hole.rotation.x = -Math.PI / 2;
      hole.position.set(hx, heightAt(hx, hz) + 0.02, hz);
      rt.scene.add(hole);
      b.props.push(hole);
      const holder = new THREE.Group();
      holder.position.set(x + fx * 0.5, heightAt(x, z) + 0.9, z + fz * 0.5);
      holder.rotation.y = yaw;
      const rod = critterMesh('fishing-rod', 1);
      rod.rotation.x = 1.0;
      holder.add(rod);
      rt.scene.add(holder);
      b.props.push(holder);
      break;
    }
    case 'mug': {
      place(rt, b, 'bench', 1, x, z);
      // The mug is held in the bear's paw (attached to its arm once the bear's model exists, see update).
      b.mug = critterMesh('cocoa-mug', MUG_SCALE);
      addPuffs(rt, b, 'steam', 3);
      break;
    }
  }
}

/** The Bear Deck sign on the Fells: a signpost with the main plate and a small sunscreen plate, both facing south. */
function addBearDeck(rt: CritterRuntime): void {
  // Beside the approach path, not in front of the middle bear, angled to face anyone walking up to the deck.
  const x = BEAR_DECK.x + SIGN_DX, z = BEAR_DECK.z + 9;
  const yaw = Math.atan2(BEAR_DECK.x - x, BEAR_DECK.z + 20 - z);
  const sign = new THREE.Group();
  sign.position.set(x, heightAt(x, z), z);
  sign.rotation.y = yaw;
  sign.add(critterMesh('signpost', 1));
  sign.add(
    textPlate('BEAR DECK\nPlease do not wake the bears.\nThey are not asleep.', 0, 1.6, 0.04, 0, { w: 1.2, h: 0.6 }),
    textPlate('SUNSCREEN: FACTOR 50. ATTITUDE: FACTOR 100.', 0, 0.9, 0.04, 0, { w: 0.9, h: 0.25 }),
  );
  rt.scene.add(sign);
}

export const snowcapLife: RegionLife = {
  id: 'snowcap',
  groups: [],

  init(rt) {
    const st: SnowcapState = { t: 0, bears: [] };
    states.set(rt, st);
    for (const spot of SNOWCAP_BEARS) {
      const c = rt.spawn('polar-bear', spot.x, spot.z, { region: REGION, group: GROUP, mode: 'script', yaw: spot.yaw });
      const b: Bear = { c, spot, props: [], puffs: [] };
      addPoseProps(rt, b);
      st.bears.push(b);
    }
    addBearDeck(rt);
  },

  update(rt, ctx) {
    const st = states.get(rt);
    if (!st) return;
    st.t = ctx.time;
    const { dt } = ctx;

    for (const b of st.bears) {
      const c = b.c;
      // The bears never move: undo any vehicle push from the runtime this frame.
      c.mode = 'script';
      c.x = b.spot.x;
      c.z = b.spot.z;
      c.speed = 0;
      const far = Math.hypot(c.x - ctx.playerX, c.z - ctx.playerZ) > FAR;
      for (const p of b.props) p.visible = !far;
      for (const p of b.puffs) p.sprite.visible = p.sprite.visible && !far;
      if (far) continue;
      const near = Math.hypot(c.x - ctx.playerX, c.z - ctx.playerZ) < PUFF_NEAR;
      if (!near) for (const p of b.puffs) p.sprite.visible = false;

      // The mug rides in the bear's paw: hang it on the arm as soon as the bear's model exists.
      if (b.mug && !b.mugHeld) {
        const arm = part(c, 'arm-1');
        if (arm) {
          b.mug.position.set(0.0, -0.42, 0.22);
          arm.add(b.mug);
          b.mugHeld = true;
        }
      }

      // Pose: set every frame, since the runtime draws the bear from c.y / c.yaw / c.tip after this update.
      const obj = c.object;
      const sx = b.spot.x, sz = b.spot.z;
      switch (b.spot.pose) {
        case 'nap': {
          c.yaw = b.spot.yaw;
          c.tip = 1;
          c.y = heightAt(sx, sz) + 0.25;
          if (obj) obj.scale.y = 1 + 0.03 * Math.sin(Math.PI * 2 * 0.25 * st.t);
          // Curled up: chin down on the paws, arms tucked forward under the head.
          const head = part(c, 'head');
          if (head) head.rotation.set(0.55, 0, 0.1);
          if (b.puffs.length && near) animatePuffs(b, st.t, sx, c.y + 1.3, sz, 'z');
          break;
        }
        case 'tube': {
          c.yaw = (c.yaw + 0.15 * dt) % (Math.PI * 2);
          c.y = heightAt(sx, sz) + 0.3;
          if (b.tube) b.tube.rotation.y = c.yaw;
          break;
        }
        case 'fish': {
          c.yaw = b.spot.yaw;
          c.y = heightAt(sx, sz) + 0.45;
          const head = part(c, 'head');
          if (head) head.rotation.z = 0.05 * Math.sin(st.t * 2.1);
          break;
        }
        case 'mug': {
          c.yaw = b.spot.yaw;
          c.y = heightAt(sx, sz) + 0.45;
          // A slow sip every few seconds: the head tips back for a second.
          const phase = st.t % SIP_EVERY;
          const head = part(c, 'head');
          if (head) head.rotation.z = phase < 1 ? 0.3 * Math.sin(Math.PI * phase) : 0;
          if (b.mug && b.puffs.length && near) {
            b.mug.getWorldPosition(mugPos);
            animatePuffs(b, st.t, mugPos.x, mugPos.y + 0.34, mugPos.z, 'steam');
          }
          break;
        }
      }

      // A shrug (from a shot) lifts the arms and turns the head, as on the Fells.
      const shrugT = Number(c.data.shrugT ?? 0);
      const arm0 = part(c, 'arm-0');
      const arm1 = part(c, 'arm-1');
      const napping = b.spot.pose === 'nap';
      if (napping && !(shrugT > 0)) {
        if (arm0) arm0.rotation.x = -0.9;
        if (arm1) arm1.rotation.x = -0.9;
      }
      if (shrugT > 0) {
        const s = Math.sin(Math.PI * (1 - shrugT / BEAR_SHRUG_S));
        if (arm0) arm0.rotation.z = -0.9 * s;
        if (arm1) arm1.rotation.z = 0.9 * s;
        const head = part(c, 'head');
        if (head) head.rotation.z = 0.25 * s;
        c.data.shrugT = shrugT - dt;
      } else {
        if (arm0) arm0.rotation.z = 0;
        if (arm1) arm1.rotation.z = 0;
      }
    }
  },

  onHit(rt, c) {
    if (c.group !== GROUP) return false;
    const now = states.get(rt)?.t ?? 0;
    const shrugT = Number(c.data.shrugT ?? 0);
    if (!(shrugT > 0)) c.data.shrugT = BEAR_SHRUG_S;
    const last = c.data.lastShrugToast as number | undefined;
    if (last === undefined || now - last >= BEAR_TOAST_GAP) {
      c.data.lastShrugToast = now;
      rt.deps.toast(pick(BEAR_SHRUGS));
    }
    return true;
  },
};
