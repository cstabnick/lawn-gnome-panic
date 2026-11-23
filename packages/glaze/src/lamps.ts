// Headlights: lamp housings (a new look for the nose) and the beams + glow that switch on at dusk.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { beamColor } from './catalog';
import type { Loadout, VehicleMounts } from './types';

export interface LampBuild {
  /** The housings to add under the body shell (null for the 'stock' lamp or when mounts.lamps is null). */
  housings: THREE.Group | null;
  /** Bulbs + beam cones for the two lamps, in beam colour (catalog beamColor(loadout.beam)); the rig puts these in its stable `lights` group. Always built (even for 'stock' lamp, at mounts.lamps) when mounts.lamps exists. */
  beams: THREE.Group | null;
}

const BULB_GEO = new THREE.SphereGeometry(0.08, 8, 6);
const BEAM_GEO = new THREE.ConeGeometry(0.9, 5.5, 10, 1, true);
const bulbMats = new Map<number, THREE.MeshBasicMaterial>();
const beamMats = new Map<number, THREE.MeshBasicMaterial>();

function bulbMaterial(color: number): THREE.MeshBasicMaterial {
  let m = bulbMats.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color });
    bulbMats.set(color, m);
  }
  return m;
}

function beamMaterial(color: number): THREE.MeshBasicMaterial {
  let m = beamMats.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    beamMats.set(color, m);
  }
  return m;
}

/** Build both from loadout.lamp / loadout.beam at mounts.lamps (scaled by mounts.width / 1.2). The old game headlights were two 0.11 bulbs 0.32 apart with a 0.9 x 5.5 cone beam at 0.14 opacity: keep that feel. */
export function buildLamps(mounts: VehicleMounts, loadout: Loadout): LampBuild {
  if (mounts.lamps === null) return { housings: null, beams: null };
  const [p0, p1] = mounts.lamps;
  const k = mounts.width / 1.2;
  const color = beamColor(loadout.beam);
  const popup = loadout.lamp === 'popup';

  const beams = new THREE.Group();
  beams.name = 'glaze-beams';
  for (const p of [p0, p1]) {
    const lift = popup ? 0.03 * k : 0;
    const bulb = new THREE.Mesh(BULB_GEO, bulbMaterial(color));
    bulb.position.set(p[0], p[1] + lift, p[2]);
    bulb.scale.setScalar(k);
    beams.add(bulb);

    const beam = new THREE.Mesh(BEAM_GEO, beamMaterial(color));
    beam.rotation.x = -Math.PI / 2 + 0.08;
    beam.position.set(p[0], p[1] + 0.04 + lift, p[2] + 2.75);
    beam.scale.setScalar(k);
    beams.add(beam);
  }

  return { housings: buildHousings(mounts, loadout, k), beams };
}

function buildHousings(mounts: VehicleMounts, loadout: Loadout, k: number): THREE.Group | null {
  if (mounts.lamps === null || loadout.lamp === 'stock') return null;
  const id = `glaze-lamp-${loadout.lamp}`;
  if (!getPrefab(id)) return null;
  const [p0, p1] = mounts.lamps;
  const group = new THREE.Group();
  group.name = 'glaze-lamps';

  if (loadout.lamp === 'bar') {
    const holder = new THREE.Group();
    holder.position.set((p0[0] + p1[0]) / 2, p0[1] - 0.1 * k, p0[2]);
    holder.scale.setScalar(k);
    holder.add(buildPrefab(id));
    group.add(holder);
  } else {
    const left = new THREE.Group();
    left.position.set(p0[0], p0[1] - 0.1 * k, p0[2]);
    left.scale.setScalar(k);
    left.add(buildPrefab(id));
    group.add(left);

    const right = new THREE.Group();
    right.position.set(p1[0], p1[1] - 0.1 * k, p1[2]);
    right.scale.setScalar(k);
    right.scale.x = -k;
    right.add(buildPrefab(id));
    group.add(right);
  }

  group.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  return group;
}
