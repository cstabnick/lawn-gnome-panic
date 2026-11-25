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

interface Bear {
  c: Critter;
  spot: BearSpot;
  /** Everything built for this bear's pose (the bear itself is a critter). */
  props: THREE.Object3D[];
  tube?: THREE.Object3D;
}
interface SnowcapState { t: number; bears: Bear[] }

// Per-runtime state: the RegionLife object is a shared constant, so a runtime's own state is kept by key.
const states = new WeakMap<CritterRuntime, SnowcapState>();

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

function addPoseProps(rt: CritterRuntime, b: Bear): void {
  const { x, z, yaw } = b.spot;
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  switch (b.spot.pose) {
    case 'nap':
      break;
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
      const mx = x + fx * 0.5, mz = z + fz * 0.5;
      const mug = critterMesh('cocoa-mug', 0.3);
      mug.position.set(mx, heightAt(mx, mz) + 0.85, mz);
      rt.scene.add(mug);
      b.props.push(mug);
      break;
    }
  }
}

/** The Bear Deck sign on the Fells: a signpost with the main plate and a small sunscreen plate, both facing south. */
function addBearDeck(rt: CritterRuntime): void {
  const x = BEAR_DECK.x, z = BEAR_DECK.z + 9;
  const post = critterMesh('signpost', 1);
  post.position.set(x, heightAt(x, z), z);
  rt.scene.add(post);
  const y = heightAt(x, z);
  const main = textPlate('BEAR DECK\nPlease do not wake the bears.\nThey are not asleep.', x, y + 1.6, z + 0.04, 0, { w: 1.2, h: 0.6 });
  const small = textPlate('SUNSCREEN: FACTOR 50. ATTITUDE: FACTOR 100.', x, y + 0.9, z + 0.04, 0, { w: 0.9, h: 0.25 });
  rt.scene.add(main, small);
}

export const snowcapLife: RegionLife = {
  id: 'snowcap',
  groups: [],

  init(rt) {
    const st: SnowcapState = { t: 0, bears: [] };
    states.set(rt, st);
    for (const spot of SNOWCAP_BEARS) {
      const c = rt.spawn('polar-bear', spot.x, spot.z, { region: REGION, group: GROUP, mode: 'script', yaw: spot.yaw });
      const b: Bear = { c, spot, props: [] };
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
      if (far) continue;

      // Pose: set every frame, since the runtime draws the bear from c.y / c.yaw / c.tip after this update.
      const obj = c.object;
      const sx = b.spot.x, sz = b.spot.z;
      switch (b.spot.pose) {
        case 'nap': {
          c.yaw = b.spot.yaw;
          c.tip = 1;
          c.y = heightAt(sx, sz) + 0.25;
          if (obj) obj.scale.y = 1 + 0.03 * Math.sin(Math.PI * 2 * 0.25 * st.t);
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
          break;
        }
      }

      // A shrug (from a shot) lifts the arms and turns the head, as on the Fells.
      const shrugT = Number(c.data.shrugT ?? 0);
      const arm0 = part(c, 'arm-0');
      const arm1 = part(c, 'arm-1');
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
