// Turfton's downtown towers, each styled on its own. world.ts places every tower and pushes its collider; this module
// only decides how it looks and draws all of them as a few merged meshes:
//   facade (atlas, lit windows at night), trim, metal, glow, sign  + one prefab batch for roof gear (tower-roof-gear).
// That is 5 meshes + the batch's 1-2, about what the old plain boxes cost (4 palettes + roof + detail + light = 7).
//
// Who decides what:
//   landmarks.ts   the named towers (13), their owners and hand-made styles (lore: docs/lore/entries/apocrypha/<id>.md)
//   procedural.ts  every other tower, seeded by position, never like its neighbours
//   silhouettes.ts the masses (setbacks, drum, twin, lean...), all inside the footprint and under the collider height
//   crowns.ts / dress.ts / street.ts   roof, facade dressing, ground floor and signs
//   material.ts    the five materials and setTowerNight(f) (app.ts calls it with the atmosphere's night factor)
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildStaticPrefabs, type StaticPrefabPlacement } from '@lawn/prefabs';
import { buildFacadeAtlas } from './facadeAtlas';
import { buildSignAtlas } from './signAtlas';
import { createTowerMaterials } from './material';
import { capFor, facadeWalls, hash2, seeded } from './kit';
import { LANDMARKS as LANDMARK_LIST, landmarkFor } from './landmarks';
import { minorStyle } from './procedural';
import { massesFor } from './silhouettes';
import { buildCrown } from './crowns';
import { dressFacade } from './dress';
import { buildStreetLevel } from './street';
import type { TowerGeoms, TowerSpec, TowerStyle } from './types';

export type { TowerSpec, TowerStyle, LandmarkTower } from './types';
export { setTowerNight } from './material';
export { LANDMARKS } from './landmarks';

/** The specs of the last build, for probes and tests. */
export let lastTowerSpecs: readonly TowerSpec[] = [];
/** The style each spec got in the last build (same order as lastTowerSpecs). */
export let lastTowerStyles: readonly TowerStyle[] = [];

/** Styles for every spec: landmarks first, then minor towers, each told its already-styled neighbours. */
export function styleTowers(specs: readonly TowerSpec[]): TowerStyle[] {
  const styles: (TowerStyle | undefined)[] = specs.map((s) => landmarkFor(s)?.style);
  specs.forEach((s, i) => {
    if (styles[i]) return;
    const near = specs
      .map((o, j) => (j !== i && styles[j] && Math.hypot(o.x - s.x, o.z - s.z) < 75 ? styles[j] : undefined))
      .filter((x): x is TowerStyle => !!x);
    styles[i] = minorStyle(s, near);
  });
  return styles as TowerStyle[];
}

/** Every geometry of every tower, sorted by material (no three.js scene needed: tests call this). */
export function towerGeometry(specs: readonly TowerSpec[], styles: readonly TowerStyle[]): { geoms: TowerGeoms; gear: StaticPrefabPlacement[] } {
  const geoms: TowerGeoms = { facade: [], trim: [], metal: [], glow: [], sign: [] };
  const gear: StaticPrefabPlacement[] = [];
  specs.forEach((spec, i) => {
    const style = styles[i];
    const rnd = seeded(hash2(spec.x, spec.z));
    const masses = massesFor(spec, style);
    for (const m of masses) {
      geoms.facade.push(facadeWalls(m, m.facade ?? style.facade, style.facadeTint));
      geoms.trim.push(capFor(m, style.trim));
    }
    buildCrown(spec, style, masses, geoms, gear, rnd);
    dressFacade(spec, style, masses, geoms, gear, rnd);
    buildStreetLevel(spec, style, masses, geoms, rnd);
  });
  return { geoms, gear };
}

function addMerged(scene: THREE.Scene, geos: THREE.BufferGeometry[], material: THREE.Material, name: string, shadows: boolean): void {
  if (geos.length === 0) return;
  const geo = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (!geo) {
    console.warn(`towers: could not merge ${name}`);
    return;
  }
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name;
  mesh.castShadow = shadows;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

/** Builds every downtown tower's look into the scene. Colliders are world.ts's job; nothing here touches them. */
export function buildTowers(scene: THREE.Scene, specs: readonly TowerSpec[]): void {
  lastTowerSpecs = specs;
  const styles = styleTowers(specs);
  lastTowerStyles = styles;
  const { geoms, gear } = towerGeometry(specs, styles);
  const atlas = buildFacadeAtlas();
  const mats = createTowerMaterials(atlas.map, atlas.glow, buildSignAtlas());
  addMerged(scene, geoms.facade, mats.facade, 'towers-facade', true);
  addMerged(scene, geoms.trim, mats.trim, 'towers-trim', true);
  addMerged(scene, geoms.metal, mats.metal, 'towers-metal', true);
  addMerged(scene, geoms.glow, mats.glow, 'towers-glow', false);
  addMerged(scene, geoms.sign, mats.sign, 'towers-sign', false);
  if (gear.length) scene.add(buildStaticPrefabs(gear, { lights: false, shadows: false, name: 'tower-roof-gear' })); // roof clutter: no shadow pass
}

/** Where each landmark stands (from the last build; block centre before the world is built), for map labels. */
export function landmarkPlaces(): { id: string; name: string; x: number; z: number; poi: boolean }[] {
  return LANDMARK_LIST.map((l) => {
    const s = lastTowerSpecs.find((t) => t.blockX === l.blockX && t.blockZ === l.blockZ && t.slot === l.slot);
    return { id: l.id, name: l.name, x: s?.x ?? l.blockX, z: s?.z ?? l.blockZ, poi: l.poi };
  });
}
