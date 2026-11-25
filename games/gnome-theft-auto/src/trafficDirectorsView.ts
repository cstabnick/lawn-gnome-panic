// The traffic-director wardens (GTA batch 3, E28): an HOA traffic gnome on a striped podium in the middle of each
// junction in DIRECTORS. The gnome turns to face the road it is holding, raises its stop/go paddle toward that road,
// and hops when the phase changes. Purely visual: no colliders, no chasing. The signal logic lives in trafficDirectors.ts.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { createGnomeModel, type GnomeModel } from '@lawn/gnome';
import { heightAt } from './terrain';
import { randomTownLook } from './gnomes';
import { DIRECTORS, directorFacing, directorSignal, nowSeconds, type Director, type DirectorSignal } from './trafficDirectors';

export interface DirectorViews {
  /** Turn, pose and show/hide every warden. t = nowSeconds(); (px, pz) = the camera/player position. */
  update(dt: number, t: number, px: number, pz: number): void;
  /** Remove everything from the scene. */
  dispose(): void;
}

/** Wardens farther than this from the player are hidden (metres). */
const VIEW_DISTANCE = 250;
/** Podium footprint and height (metres). */
const PODIUM_WIDTH = 1.4;
const PODIUM_HEIGHT = 0.6;
/** Shirt colour of the HOA uniform. */
const HOA_GREEN = 0x2f6b3a;
/** Hop length (seconds) and height (metres) on a phase change. */
const HOP_TIME = 0.25;
const HOP_HEIGHT = 0.12;
/** Time constant (seconds) of the turn and arm easing: ~95% of the way in 0.4 s. */
const EASE_TAU = 0.13;
/** Paddle arm raised toward the held road (rotation.x; negative raises the arm, as in the gnome's air pose). */
const ARM_RAISED = -1.6;

interface Warden {
  director: Director;
  group: THREE.Group;
  gnome: GnomeModel;
  lift: THREE.Group;
  lastSignal: DirectorSignal | null;
  hopLeft: number;
  yaw: number;
  visible: boolean;
}

const _wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/** A podium of the traffic-podium prefab fitted to the footprint and height, or a red/white cylinder stack. */
function buildPodium(): THREE.Object3D {
  if (getPrefab('traffic-podium')) {
    const p = buildPrefab('traffic-podium', { lights: false });
    const box = new THREE.Box3().setFromObject(p);
    const size = box.getSize(new THREE.Vector3());
    const sx = size.x > 0 ? PODIUM_WIDTH / Math.max(size.x, size.z || size.x) : 1;
    const sy = size.y > 0 ? PODIUM_HEIGHT / size.y : 1;
    p.scale.set(sx, sy, sx);
    // Keep the base on the ground after scaling.
    p.position.y = -box.min.y * sy;
    const holder = new THREE.Group();
    holder.add(p);
    return holder;
  }
  const holder = new THREE.Group();
  const stripes = 3;
  const h = PODIUM_HEIGHT / stripes;
  for (let i = 0; i < stripes; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: i % 2 ? 0xffffff : 0xd93636, roughness: 0.7 });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(PODIUM_WIDTH / 2, PODIUM_WIDTH / 2, h, 16), mat);
    m.position.y = h * (i + 0.5);
    m.castShadow = true;
    m.receiveShadow = true;
    holder.add(m);
  }
  return holder;
}

function buildWarden(d: Director, t: number): Warden {
  const group = new THREE.Group();
  group.name = `director:${d.id}`;
  group.position.set(d.x, heightAt(d.x, d.z), d.z);

  group.add(buildPodium());

  const look = randomTownLook({ hat: 0xf2c230, shirt: HOA_GREEN });
  look.equipment = { head: 'hoa-traffic-hat', hand: 'stop-go-paddle' };
  const gnome = createGnomeModel(look);
  const lift = new THREE.Group();
  lift.position.y = PODIUM_HEIGHT;
  lift.add(gnome.object);
  group.add(lift);

  const yaw = directorFacing(d, t);
  gnome.object.rotation.y = yaw;
  return { director: d, group, gnome, lift, lastSignal: null, hopLeft: 0, yaw, visible: true };
}

export function createDirectorViews(scene: THREE.Scene): DirectorViews {
  let wardens: Warden[] = [];
  const t0 = nowSeconds();
  for (const d of DIRECTORS) {
    const w = buildWarden(d, t0);
    wardens.push(w);
    scene.add(w.group);
  }

  return {
    update(dt: number, t: number, px: number, pz: number): void {
      const k = 1 - Math.exp(-Math.max(0, dt) / EASE_TAU);
      for (const w of wardens) {
        const d = w.director;
        const near = Math.hypot(d.x - px, d.z - pz) <= VIEW_DISTANCE;
        if (w.visible !== near) {
          w.visible = near;
          w.group.visible = near;
        }
        if (!near) continue;

        const signal = directorSignal(d, t);
        if (w.lastSignal !== null && signal !== w.lastSignal) w.hopLeft = HOP_TIME;
        w.lastSignal = signal;
        if (w.hopLeft > 0) {
          w.hopLeft = Math.max(0, w.hopLeft - dt);
          const p = 1 - w.hopLeft / HOP_TIME;
          w.lift.position.y = PODIUM_HEIGHT + Math.sin(Math.PI * p) * HOP_HEIGHT;
        } else {
          w.lift.position.y = PODIUM_HEIGHT;
        }

        // Turn toward the held road along the shortest way round.
        const target = directorFacing(d, t);
        w.yaw += _wrap(target - w.yaw) * k;
        w.gnome.object.rotation.y = w.yaw;

        // Paddle arm up toward the held road; both arms down while the junction clears.
        const arms = w.gnome.arms;
        const raised = signal === 'clear' ? 0 : ARM_RAISED;
        arms.right.rotation.x += (raised - arms.right.rotation.x) * k;
        arms.left.rotation.x += (0 - arms.left.rotation.x) * k;
      }
    },
    dispose(): void {
      // Geometry and materials are shared (prefab template cache, gnome model), so only the scene links are removed.
      for (const w of wardens) w.group.removeFromParent();
      wardens = [];
    },
  };
}
