// Life on the coast (E11 issue 3B): residents, vignettes, ambient sound. Saltbucket Shore should feel lived in: every
// district tells a few small stories with props and no text. Props come from @lawn/prefabs (getPrefab guards a missing
// id); decals (towels, footprints, wet planks) are flat planes on the decal layer; signs use coastSign.
// Props on a deck (pier, ship) stand at the deck height; the boardwalk at its deck top; the beach on the ground.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import type { JobsDeps } from '../jobs/types';
import type { Blip } from '../types';
import { heightAt } from '../terrain';
import { registerCull } from '../cull';
import { createAmbientGnomes, type AmbientGnomeDef } from '../ambientGnomes';
import { playAt } from '../sound/bus';
import { CAST } from '../cutscene/cast';
import { COAST } from './config';
import { coastSign } from './sign';
import type { CoastPart } from './types';

export type CoastDistrict = 'boardwalk' | 'pier' | 'beach' | 'ship';

export interface VignetteProp {
  prefab: string;
  x: number;
  z: number;
  yaw?: number;
  scale?: number;
}

export interface VignetteDecal {
  kind: 'towel' | 'footprint' | 'wet';
  x: number;
  z: number;
  /** Size along x and z before yaw, metres. */
  w: number;
  d: number;
  yaw?: number;
}

export interface VignetteSign {
  text: string;
  x: number;
  z: number;
  yaw: number;
  w: number;
  h: number;
  post: number;
}

export interface CoastVignette {
  district: CoastDistrict;
  id: string;
  props: readonly VignetteProp[];
  decals?: readonly VignetteDecal[];
  signs?: readonly VignetteSign[];
}

/** The story vignettes of each district (lore: saltbucket-boardwalk, long-spoon-pier, the-last-tube, the-bathtub-queen). */
export const COAST_VIGNETTES: readonly CoastVignette[] = [
  // ---- Saltbucket Boardwalk (north of the promenade, clear of the stalls' fronts) ----
  {
    district: 'boardwalk',
    id: 'candyfloss-dropped',
    props: [
      { prefab: 'beach-ball', x: -120, z: 1122 },
      { prefab: 'bird-gull', x: -117.5, z: 1120.5, yaw: 0.5 },
      { prefab: 'bird-gull', x: -123, z: 1124, yaw: -1 },
      { prefab: 'site-cone', x: -126, z: 1119 },
    ],
  },
  {
    district: 'boardwalk',
    id: 'tin-shy-sulk',
    props: [
      { prefab: 'gta-can-cola', x: -34, z: 1119 },
      { prefab: 'gta-can-cola', x: -30, z: 1119 },
      { prefab: 'gta-can-cola', x: -26, z: 1119 },
      { prefab: 'tennis-ball', x: -22, z: 1121 },
      { prefab: 'tennis-ball', x: -21.2, z: 1122.4 },
      { prefab: 'tennis-ball', x: -23.6, z: 1123 },
      { prefab: 'party-hat', x: -19, z: 1118 },
    ],
  },
  {
    district: 'boardwalk',
    id: 'lost-property',
    props: [
      { prefab: 'straw-boater', x: 176, z: 1120 },
      { prefab: 'pointy-hat', x: 178, z: 1120.6, yaw: 0.8 },
      { prefab: 'fc-sun-hat', x: 177, z: 1122.6 },
      { prefab: 'umbrella-hat', x: 180.4, z: 1122.2, yaw: -0.4 },
    ],
  },

  // ---- Long Spoon Pier (deck at COAST.pier.deckY) ----
  {
    district: 'pier',
    id: 'rod-and-bucket',
    props: [
      { prefab: 'fishing-rod', x: 303.3, z: 1150, yaw: Math.PI / 2 },
      { prefab: 'tin-pail', x: 302, z: 1153 },
      { prefab: 'bait-sock-fly', x: 302.6, z: 1154.6 },
    ],
  },
  {
    district: 'pier',
    id: 'boots-by-the-bowl',
    props: [
      { prefab: 'court-boots', x: 306.5, z: 1240 },
      { prefab: 'court-boots', x: 308.5, z: 1240 },
    ],
  },
  {
    district: 'pier',
    id: 'marram-mid-clean',
    props: [
      { prefab: 'tin-pail', x: 298.5, z: 1226 },
      { prefab: 'grizzle-brush', x: 300.5, z: 1227.5, yaw: 0.6 },
    ],
    decals: [
      { kind: 'wet', x: 302.3, z: 1206, w: 2.2, d: 1.6 },
      { kind: 'wet', x: 302.3, z: 1213, w: 2.2, d: 1.6 },
      { kind: 'wet', x: 302.3, z: 1220, w: 2.2, d: 1.6 },
    ],
  },

  // ---- The beach (on the sand, z 1145..1185) ----
  {
    district: 'beach',
    id: 'castle-rivalry',
    props: [
      { prefab: 'sandcastle', x: -160, z: 1178, scale: 2 },
      { prefab: 'sandcastle', x: -146, z: 1184, scale: 3 },
      { prefab: 'capture-flagpole', x: -146, z: 1184.6, scale: 1 },
    ],
  },
  {
    district: 'beach',
    id: 'towel-and-the-sea',
    props: [{ prefab: 'red-book', x: -30, z: 1177.6, yaw: 0.3 }],
    decals: [
      { kind: 'towel', x: -30, z: 1178, w: 2.2, d: 1.3, yaw: 0.3 },
      { kind: 'footprint', x: -28, z: 1181.5, w: 0.5, d: 0.9, yaw: 0.05 },
      { kind: 'footprint', x: -27.4, z: 1184, w: 0.5, d: 0.9, yaw: 0.05 },
      { kind: 'footprint', x: -26.6, z: 1186.4, w: 0.5, d: 0.9, yaw: 0.05 },
      { kind: 'footprint', x: -26, z: 1188.6, w: 0.5, d: 0.9, yaw: 0.05 },
    ],
  },
  {
    district: 'beach',
    id: 'lawn-sharks-warning',
    props: [{ prefab: 'life-ring-back', x: 99.4, z: 1184.6 }],
    signs: [{ text: 'LAWN SHARKS\nSmaller. Meaner. Mostly grass.', x: 96, z: 1181.5, yaw: 0, w: 2.6, h: 0.9, post: 1 }],
  },

  // ---- The Bathtub Queen (deck at COAST.ship.deckY) ----
  {
    district: 'ship',
    id: 'half-painted-rail',
    props: [
      { prefab: 'pot', x: 280, z: 1264 },
      { prefab: 'grizzle-brush', x: 281.3, z: 1264.8, yaw: 1.1 },
    ],
  },
  {
    district: 'ship',
    id: 'souvenir-crates',
    props: [
      { prefab: 'cargo-crate', x: 310, z: 1264 },
      { prefab: 'cargo-crate', x: 312.4, z: 1264.3 },
      { prefab: 'mower-scrap-panel', x: 309.8, z: 1263.4, yaw: 0.4 },
    ],
  },
  {
    district: 'ship',
    id: 'tour-rope-and-a-hat',
    props: [
      { prefab: 'site-barrier', x: 318, z: 1263 },
      { prefab: 'fc-sun-hat', x: 317, z: 1264.4 },
    ],
  },
];

/** The residents (AmbientGnomeDef, made by createAmbientGnomes). Deck residents use `surface: 'rooftop'` so they stand ON
 *  the planks (boardwalk, pier, the Queen's deck). Marram, Driftwood and Bilge wear their cast looks (R-239). Lore voices: saltbucket-boardwalk, the-last-tube, the-bathtub-queen. */
export const COAST_RESIDENTS: readonly AmbientGnomeDef[] = [
  {
    id: 'coast-marram-spokewheel', name: 'Marram Teaspoon', idle: 'point',
    x: -256, z: 1110, yaw: Math.PI,
    look: CAST.marram.look,
    bubble: 'Hat on, hands in, wait for the bell.',
  },
  {
    id: 'coast-driftwood-tube', name: 'Driftwood', idle: 'wrench-fix',
    x: 146, z: 1152, yaw: 0.2,
    look: CAST.driftwood.look,
    bubble: 'The sharks are lawn sharks. Smaller. Meaner. Mostly grass.',
  },
  {
    id: 'coast-lifeguard-chair', name: 'Lookout Lenny', idle: 'guard-stand',
    x: 56.5, z: 1172.5, yaw: -0.3,
    look: { hat: 0xd93636, shirt: 0xffd23f, beard: null, glasses: true },
    bubble: 'Eyes open. Mostly. Wake me if something drowns.',
  },
  {
    id: 'coast-sal-candyfloss', name: 'Spun Sugar Sal', idle: 'vendor-call',
    x: -152, z: 1112, yaw: 0, surface: 'rooftop',
    look: { hat: 0xff3b9a, shirt: 0xf4f4f8, beard: null, hair: { color: 0x6b3a1e, style: 'pigtails' }, dress: true },
    bubble: 'Candyfloss is a vegetable. Sal says so. Do not argue with the cart.',
  },
  {
    id: 'coast-sunbather-ned', name: 'Burnt Ned', idle: 'lean-back',
    x: -105.5, z: 1171, yaw: Math.PI,
    look: { hat: 0xf08a24, shirt: 0xf4f4f8, skin: 0xd9825a, beard: null },
    bubble: 'Factor fifty. I am factor fifty. Nothing else is factor anything.',
  },
  {
    id: 'coast-sunbather-bev', name: 'Bev Nell', idle: 'lean-back',
    x: -66, z: 1177.5, yaw: Math.PI,
    look: { hat: 0xf08bb4, shirt: 0x7cf0ff, beard: null, dress: true },
    bubble: 'Four hours on the deck chair. The sea has not moved. Neither have I.',
  },
  {
    id: 'coast-angler-spur', name: 'Reel Ruth', idle: 'fish',
    x: 297.4, z: 1176, yaw: -Math.PI / 2, surface: 'rooftop',
    look: { hat: 0xc9892b, shirt: 0x24324f, beard: 0xbbbbbb, glasses: true },
    bubble: 'Nothing bites the pier. Something bit the pier once. Long story.',
  },
  {
    id: 'coast-captain-bilge', name: 'Captain Samphire Bilge', idle: 'look-around',
    x: 262, z: 1160, yaw: -Math.PI / 2,
    look: CAST.samphire.look,
    bubble: 'Mind the cannons. They are for show. Mostly.',
  },
  {
    id: 'coast-queen-deckhand', name: 'Mopsy Brine', idle: 'sweep',
    x: 306, z: 1271, yaw: 0.6, surface: 'rooftop',
    look: { hat: 0xe8e4d4, shirt: 0xb23a3a, beard: null, hair: { color: 0x4a2f22, style: 'pigtails' } },
    bubble: 'Swabbed it Tuesday. The sea put it back. I take it personally.',
  },
  {
    id: 'coast-queen-lookout', name: 'Pennant Pru', idle: 'look-around',
    x: 319, z: 1272, yaw: Math.PI / 2, surface: 'rooftop',
    look: { hat: 0x2d5a7b, shirt: 0xeadfc2, beard: 0xcfcfcf, glasses: true },
    bubble: 'Nothing on the horizon but the HOA. And that is a hedge.',
  },
];

const decalMats = new Map<string, THREE.Material>();
function decalMat(kind: VignetteDecal['kind']): THREE.Material {
  let m = decalMats.get(kind);
  if (!m) {
    const color = kind === 'towel' ? 0xe0584a : kind === 'footprint' ? 0x9c8260 : 0x5a4632;
    m = flatLayer(new THREE.MeshStandardMaterial({ color, roughness: 0.95, transparent: kind === 'wet', opacity: kind === 'wet' ? 0.7 : 1 }), LAYER.decal);
    decalMats.set(kind, m);
  }
  return m;
}

/** The surface height for a prop of this district at (x, z). */
function surfaceY(district: CoastDistrict, x: number, z: number): number {
  switch (district) {
    case 'boardwalk': return heightAt(x, z) + COAST.boardwalk.deckLift;
    case 'beach': return heightAt(x, z);
    case 'pier': return COAST.pier.deckY;
    case 'ship': return COAST.ship.deckY;
  }
}

function shadowed<T extends THREE.Object3D>(g: T): T {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

function propAt(scene: THREE.Scene, p: VignetteProp, y: number): void {
  if (!getPrefab(p.prefab)) return;
  const obj = buildPrefab(p.prefab, { lights: false });
  obj.position.set(p.x, y, p.z);
  obj.rotation.y = p.yaw ?? 0;
  obj.scale.setScalar(p.scale ?? 1);
  scene.add(shadowed(obj));
  registerCull(obj, 'prop');
}

function decalAt(scene: THREE.Scene, d: VignetteDecal, y: number): void {
  const g = new THREE.Group();
  g.position.set(d.x, y + 0.02, d.z);
  g.rotation.y = d.yaw ?? 0;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.d), decalMat(d.kind));
  plane.rotation.x = -Math.PI / 2;
  g.add(plane);
  scene.add(g);
  registerCull(g, 'prop');
}

/** Blips for the minimap (the boardwalk and the pier are the places to go). */
const BLIPS: Blip[] = [
  { x: 0, z: 1115, color: '#f2b134', label: 'Saltbucket Boardwalk' },
  { x: 300, z: 1245, color: '#9aa7b0', label: 'Long Spoon Pier' },
];

/** Sound timers: surf and the buoy bell now and then, gulls less often; only within this range of the player. */
const SOUND_RANGE = 120;

export function installCoastLife(deps: JobsDeps): CoastPart {
  for (const v of COAST_VIGNETTES) {
    for (const p of v.props) propAt(deps.scene, p, surfaceY(v.district, p.x, p.z));
    for (const d of v.decals ?? []) decalAt(deps.scene, d, surfaceY(v.district, d.x, d.z));
    for (const s of v.signs ?? []) {
      const sign = coastSign(s.text, { w: s.w, h: s.h, post: s.post });
      sign.position.set(s.x, surfaceY(v.district, s.x, s.z), s.z);
      sign.rotation.y = s.yaw;
      deps.scene.add(shadowed(sign));
      registerCull(sign, 'prop');
    }
  }

  const residents = createAmbientGnomes(deps.scene, COAST_RESIDENTS);

  let surfT = 6 + Math.random() * 6;
  let bellT = 10 + Math.random() * 10;
  let gullT = 20 + Math.random() * 15;

  const inRange = (x: number, z: number, px: number, pz: number): boolean => Math.hypot(x - px, z - pz) <= SOUND_RANGE;

  return {
    update(dt: number): void {
      const p = deps.player;
      residents.update(dt, p.x, p.z);

      surfT -= dt;
      if (surfT <= 0) {
        surfT = 8 + Math.random() * 12;
        const spots = COAST.soundSpots.surf;
        const near = spots[Math.floor(Math.random() * spots.length)];
        if (inRange(near[0], near[1], p.x, p.z)) playAt('surf-wash', { x: near[0], z: near[1] }, { bus: 'ambience' });
      }
      bellT -= dt;
      if (bellT <= 0) {
        bellT = 8 + Math.random() * 12;
        const spots = COAST.soundSpots.buoyBell;
        const at = spots[Math.floor(Math.random() * spots.length)];
        if (inRange(at[0], at[1], p.x, p.z)) playAt('buoy-bell', { x: at[0], z: at[1] }, { bus: 'ambience' });
      }
      gullT -= dt;
      if (gullT <= 0) {
        gullT = 20 + Math.random() * 15;
        const spots = COAST.soundSpots.surf;
        const at = spots[Math.floor(Math.random() * spots.length)];
        if (inRange(at[0], at[1], p.x, p.z)) playAt('gull', { x: at[0], z: at[1] }, { bus: 'ambience' });
      }
    },
    blips: () => BLIPS,
  };
}
