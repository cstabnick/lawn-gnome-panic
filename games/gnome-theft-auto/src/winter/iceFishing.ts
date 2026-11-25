// Winter sports (E12): holes in pond ice. On foot on painted ice, E drills a hole (an auger spins in it for ICE.drillS
// seconds); the hole is a dark disc decal on the ice and registers with fishing/waterKind.ts setIceHoleSource, so the
// ordinary rod fishes it ('ice' water). Ice never cracks under anyone.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { iceHoleNear, setIceHoleSource, type IceHole } from '../fishing/waterKind';
import { ICE } from './types';

export interface IceFishingDeps {
  scene: THREE.Scene;
  /** terrain.ts surfaceAt: 'ice' where a hole may be drilled. */
  surfaceAt(x: number, z: number): string;
  heightAt(x: number, z: number): number;
  toast(text: string): void;
  /** A sound id from sound/ids.ts or the game's Sfx (played at the player). */
  play(id: string): void;
  /** A hole was finished (count it in the save, bump the probe). */
  onHole(): void;
}

export interface IceFishing {
  /** On foot at (x, z): the E prompt ('Drill a hole in the ice', or null when not on ice / a hole is already in reach). */
  prompt(x: number, z: number): string | null;
  /** E: start drilling here. True when handled. */
  interact(x: number, z: number): boolean;
  /** Every frame: drilling progress (cancelled when the player moves more than 1 m or leaves the ground), auger spin. */
  update(dt: number, px: number, pz: number, onFoot: boolean): void;
  holes(): readonly IceHole[];
  /** 0..1 while drilling, else -1. */
  drilling(): number;
  /** Debug: drill a hole at (x, z) at once. */
  drillNow(x: number, z: number): boolean;
}

/** How far south of the gnome the auger goes in, metres. */
const DRILL_AHEAD = 0.8;
/** How far the auger sinks over the drill, metres. */
const DRILL_SINK = 0.3;
/** How far the player may move before the drill is cancelled, metres. */
const DRILL_MOVE = 1;

interface Drill {
  /** Where the player stood when drilling started. */
  px: number;
  pz: number;
  /** Where the hole goes. */
  sx: number;
  sz: number;
  baseY: number;
  progress: number;
}

export function createIceFishing(deps: IceFishingDeps): IceFishing {
  const holes: IceHole[] = [];
  /** Scene objects per hole, parallel to `holes`. */
  const marks: THREE.Object3D[][] = [];
  const group = new THREE.Group();
  deps.scene.add(group);
  setIceHoleSource(() => holes);

  const discGeo = new THREE.CircleGeometry(ICE.holeR, 20);
  const discMat = flatLayer(new THREE.MeshBasicMaterial({ color: 0x0d1a24 }), LAYER.marking);
  const ringGeo = new THREE.RingGeometry(ICE.holeR, ICE.holeR + 0.12, 20);
  const ringMat = flatLayer(new THREE.MeshBasicMaterial({ color: 0xe8f2f8 }), LAYER.marking);

  let auger: THREE.Object3D | null = null;
  let drill: Drill | null = null;

  function getAuger(): THREE.Object3D {
    if (!auger) {
      // The ice-auger prefab comes from the lodge kit (A6); until it is in the catalog the auger is an empty group.
      auger = getPrefab('ice-auger') ? buildPrefab('ice-auger', { lights: false }) : new THREE.Group();
      auger.visible = false;
      group.add(auger);
    }
    return auger;
  }

  function addHole(x: number, z: number): void {
    if (holes.length >= ICE.maxHoles) {
      holes.shift();
      for (const o of marks.shift() ?? []) group.remove(o);
    }
    const h = deps.heightAt(x, z);
    holes.push({ x, z, y: h - 0.04, r: ICE.holeR });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, h + 0.02, z);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, h + 0.015, z);
    group.add(disc, ring);
    marks.push([disc, ring]);
  }

  function prompt(x: number, z: number): string | null {
    if (drill) return null;
    if (deps.surfaceAt(x, z) !== 'ice') return null;
    if (iceHoleNear(x, z, ICE.reach)) return null;
    return 'Drill a hole in the ice';
  }

  return {
    prompt,

    interact(x, z) {
      if (prompt(x, z) === null) return false;
      const sx = x, sz = z + DRILL_AHEAD;
      if (deps.surfaceAt(sx, sz) !== 'ice') return false;
      const a = getAuger();
      const baseY = deps.heightAt(sx, sz);
      a.position.set(sx, baseY, sz);
      a.rotation.y = 0;
      a.visible = true;
      drill = { px: x, pz: z, sx, sz, baseY, progress: 0 };
      deps.play('ice-drill');
      return true;
    },

    update(dt, px, pz, onFoot) {
      if (!drill) return;
      if (!onFoot || Math.hypot(px - drill.px, pz - drill.pz) > DRILL_MOVE) {
        drill = null;
        if (auger) auger.visible = false;
        deps.toast('You stopped drilling.');
        return;
      }
      const d = drill;
      d.progress = Math.min(1, d.progress + dt / ICE.drillS);
      const a = getAuger();
      a.rotation.y += 12 * dt;
      a.position.y = d.baseY - DRILL_SINK * d.progress;
      if (d.progress < 1) return;
      drill = null;
      a.visible = false;
      addHole(d.sx, d.sz);
      deps.toast('A hole in the ice. Fish it with your rod.');
      deps.onHole();
    },

    holes: () => holes,

    drilling() {
      return drill ? drill.progress : -1;
    },

    drillNow(x, z) {
      if (deps.surfaceAt(x, z) !== 'ice') return false;
      addHole(x, z);
      return true;
    },
  };
}
