// Bolt-ons: spoiler, seat cover, hood ornament, extras and underglow, each placed at a mount point.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab, type Vec3 } from '@lawn/prefabs';
import type { Loadout, VehicleMounts } from './types';

export interface FittingsBuild {
  /** Everything that rides on the body shell (spoiler, seat cover, ornament, extras). */
  group: THREE.Group;
  /** Things that stay down at road level whatever the ride height (the underglow). Added to the body root, not the shell. */
  ground: THREE.Group;
  /** Per-frame animation: underglow pulse. */
  update(dt: number): void;
}

const DEG2RAD = Math.PI / 180;

/** The scale every fitting is built at: a fitting is authored for a 1.2-wide vehicle, so it is scaled by the body width over 1.2. */
export function fittingScale(mounts: Pick<VehicleMounts, 'width'>): number {
  return mounts.width / 1.2;
}

/**
 * Build the spoiler (point 'rear'), seat cover ('seat'), ornament ('hood'), every extra (each extra's point: dice 'dash', flag 'rear', pipes 'side',
 * mudflaps at the rear wheels, bunting 'top', plate 'rear', roobar 'front', bell 'dash') and the underglow (a flat additive glow quad under the body) from the loadout.
 * Also the grille (front), bumper (front), canopy (top), mirror pair (dash), exhaust (rear) and the epic-3 extras (fairylights, toolbox, cooler, windsock).
 * Prefab ids are `glaze-<slot>-<id>`, built with buildPrefab and scaled by mounts.width / 1.2. A fitting whose mount point is missing is skipped. Nothing in the group is tinted by the body paint.
 */
export function buildFittings(mounts: VehicleMounts, loadout: Loadout): FittingsBuild {
  const group = new THREE.Group();
  group.name = 'glaze-fittings';
  const ground = new THREE.Group();
  const k = fittingScale(mounts);
  const P = mounts.points;

  // Builds one prefab holder at `at` (body-local). Null when the prefab does not exist.
  const place = (prefabId: string, at: Vec3, opts: { mirrorX?: boolean; rotY?: number } = {}): THREE.Group | null => {
    if (!getPrefab(prefabId)) return null;
    const holder = new THREE.Group();
    holder.add(buildPrefab(prefabId, { shadows: true }));
    holder.position.set(at[0], at[1], at[2]);
    holder.scale.set(opts.mirrorX ? -k : k, k, k);
    holder.rotation.y = (opts.rotY ?? 0) * DEG2RAD;
    return holder;
  };

  // Adds a fitting at `at` when there is a point to put it on.
  const put = (prefabId: string, at: Vec3 | null, opts?: { mirrorX?: boolean; rotY?: number }): void => {
    if (!at) return;
    const holder = place(prefabId, at, opts);
    if (holder) group.add(holder);
  };

  // A mount point nudged by an offset, or null when the point is missing.
  const off = (p: Vec3 | undefined, dx: number, dy: number, dz: number): Vec3 | null =>
    p ? [p[0] + dx, p[1] + dy, p[2] + dz] : null;

  if (loadout.spoiler !== 'none') put(`glaze-spoiler-${loadout.spoiler}`, P.rear ?? null);
  if (loadout.seat !== 'none') put(`glaze-seat-${loadout.seat}`, P.seat ?? null);
  if (loadout.ornament !== 'none') put(`glaze-ornament-${loadout.ornament}`, P.hood ?? null);

  if (loadout.grille !== 'stock') put(`glaze-grille-${loadout.grille}`, off(P.front, 0, -0.08 * k, 0.02));
  if (loadout.bumper !== 'stock') put(`glaze-bumper-${loadout.bumper}`, off(P.front, 0, -0.2 * k, 0.02));
  if (loadout.canopy !== 'none') put(`glaze-canopy-${loadout.canopy}`, P.top ?? null);
  if (loadout.mirror !== 'none') {
    // One mirror authored on the left (+x) side; the right one is the same prefab mirrored.
    const mirrorId = `glaze-mirror-${loadout.mirror}`;
    put(mirrorId, off(P.dash, 0.5 * mounts.width, 0, 0));
    put(mirrorId, off(P.dash, -0.5 * mounts.width, 0, 0), { mirrorX: true });
  }
  if (loadout.exhaust !== 'none') {
    // The twin pair sits in the middle; every other exhaust is a single pipe on the right.
    const shift = loadout.exhaust === 'twin' ? 0 : -0.3 * k;
    put(`glaze-exhaust-${loadout.exhaust}`, off(P.rear, shift, -0.1 * k, 0));
  }

  const rearWheels = mounts.wheels.filter((w) => !w.front);

  for (const id of loadout.extras) {
    switch (id) {
      case 'dice':
        put('glaze-extra-dice', off(P.dash, 0.18 * k, 0, 0));
        break;
      case 'flag':
        put('glaze-extra-flag', off(P.rear, 0.42 * k, 0, 0));
        break;
      case 'pipes': {
        const side = P.side;
        // Stand the pipes 4 cm proud of the body side so their mounting plate does not share a face with it (docs/rendering.md rule 5).
        const out = 0.04 * k;
        const up = 0.025 * k; // and 2.5 cm above the deck top its plate would otherwise lie on
        put('glaze-extra-pipes', side ? [side[0] + out, side[1] + up, side[2]] : null);
        put('glaze-extra-pipes', side ? [-side[0] - out, side[1] + up, side[2]] : null, { mirrorX: true });
        break;
      }
      case 'mudflaps':
        for (const w of rearWheels) {
          put('glaze-extra-mudflaps', [w.at[0] + w.side * 0.12 * k, w.at[1] - 0.15 * k, w.at[2] - 0.34 * k], { mirrorX: w.side === -1 });
        }
        break;
      case 'bunting':
        put('glaze-extra-bunting', P.top ?? null);
        break;
      case 'plate':
        put('glaze-extra-plate', off(P.rear, 0, -0.18 * k, -0.02));
        break;
      case 'roobar':
        put('glaze-extra-roobar', P.front ?? null);
        break;
      case 'bell':
        put('glaze-extra-bell', off(P.dash, -0.18 * k, 0, 0));
        break;
      case 'fairylights':
        put('glaze-extra-fairylights', P.top ?? null);
        break;
      case 'toolbox':
        put('glaze-extra-toolbox', off(P.rear, -0.28 * k, 0.02 * k, -0.02));
        break;
      case 'cooler':
        put('glaze-extra-cooler', off(P.rear, 0.18 * k, 0.02 * k, 0.12 * k));
        break;
      case 'windsock':
        put('glaze-extra-windsock', off(P.rear, -0.42 * k, 0, 0));
        break;
    }
  }

  let t = 0;
  let glowMat: THREE.MeshBasicMaterial | null = null;

  if (loadout.underglow !== null) {
    const zMid = (P.front?.[2] ?? mounts.length / 2) - mounts.length / 2;
    // One material per build (not shared) so each vehicle pulses on its own.
    // A marker-layer draw offset (docs/rendering.md) keeps the glow above any road or ground layer at every distance.
    glowMat = flatLayer(new THREE.MeshBasicMaterial({
      color: loadout.underglow,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }), LAYER.marker);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(mounts.width * 0.95, mounts.length * 0.95), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, 0.06, zMid);
    glow.renderOrder = 1;
    ground.add(glow);
  }

  return {
    group,
    ground,
    update(dt: number) {
      t += dt;
      if (glowMat) glowMat.opacity = 0.4 + 0.12 * Math.sin(t * 3);
    },
  };
}
