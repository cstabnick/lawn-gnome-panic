// The promenade's south row and dressing (FX11, G3#6 / D14): rides and kiosks facing the stalls across the walkway,
// bunting between the lamps, bins, a deckchair stack, coin-op telescopes facing the sea, and the gnomes out for a stroll.
import * as THREE from 'three';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';
import { COAST } from './config';
import { Bins, MATS, placeAt, solid } from './deckKit';
import { nightGlowMat } from './nightLights';

/** Stair centres and the benches' x (same as boardwalk.ts; repeated here so the two modules do not import each other). */
export const STAIRS = [-120, 0, 120] as const;
export const BENCHES = [-180, -60, 60, 180] as const;
/** The walkway kept open the whole length, and the south row's z. */
export const WALKWAY = { minZ: 1108, maxZ: 1121 } as const;
const ROW_Z = 1125;
const SCALE = 2.4;

/** The south row: prefab, x, z, yaw (PI: the front faces the promenade, north). Listed so the test can read them. */
export const SOUTH_ROW = [
  { id: 'helter-skelter', x: -152, z: 1125.2, yaw: Math.PI },
  { id: 'punch-booth', x: -90, z: 1125.2, yaw: Math.PI },
  { id: 'mini-carousel', x: 30, z: ROW_Z, yaw: 0.4 },
  { id: 'ice-cream-kiosk', x: 90, z: 1125.4, yaw: Math.PI },
  { id: 'shell-grotto-booth', x: 150, z: 1125.2, yaw: Math.PI },
] as const;
/** Coin telescopes at the rail beside four benches, looking at the sea. */
const TELESCOPES = BENCHES.map((b) => ({ x: b + 4.2, z: 1130.3 }));
/** Seaside bins along the south edge of the walkway, 40-60 m apart. */
const BINS_X = [-170, -105, -45, 20, 75, 135, 195];
const BIN_Z = 1122.6;

const folk = (
  id: string, name: string, x: number, z: number, yaw: number, idle: NonNullable<AmbientGnomeDef['idle']>,
  look: AmbientGnomeDef['look'], bubble: string,
): AmbientGnomeDef => ({ id: 'coast-prom-' + id, name, x, z, yaw, idle, surface: 'rooftop', look, bubble });

/** The gnomes on the promenade (life.ts adds them to the coast residents). Scenes: a couple at a telescope, a parent and
 *  child at the carousel, two at the Punch booth, one in a queue of one. They face south (yaw 0) at what they watch. */
export const PROMENADE_FOLK: readonly AmbientGnomeDef[] = [
  folk('scope-winkle', 'Winkle Dunmore', -55.8, 1129.2, 0, 'look-around',
    { hat: 0x3b6ea5, shirt: 0xe8e0c8, beard: 0xbcbcbc, glasses: true },
    'Two acorns to see the sea. I live next to it. I have never been this close.'),
  folk('scope-agatha', 'Agatha Dunmore', -53.4, 1129.4, 0.3, 'cross-arms',
    { hat: 0xd9a21b, shirt: 0x9b6bd1, beard: null, dress: true, hair: { color: 0x8a8a8a, style: 'pigtails' } },
    'He has been looking at the same wave since Tuesday. It is not a good wave.'),
  folk('carousel-hob', 'Hob Pennywhistle', 27.4, 1121.6, 0, 'tap-foot',
    { hat: 0x2d7a5a, shirt: 0xc0623a, beard: 0x6b4a2a },
    'Eleven rides. I am the one holding the coat.'),
  folk('carousel-pip', 'Little Pip', 30.4, 1121.2, 0.2, 'one-leg',
    { hat: 0xff3b9a, shirt: 0xffd23f, beard: null, freckles: true },
    'Again. Again. Again. Again. Again.'),
  folk('punch-fenn', 'Old Fenn', -91.6, 1121.4, 0, 'hands-on-hips',
    { hat: 0x8d6e4c, shirt: 0x4f7a5a, beard: 0xdddddd, glasses: true },
    'Forty times I have seen this. He still does not duck.'),
  folk('punch-mabel', 'Mabel Crumb', -88.4, 1121.2, -0.2, 'lean-back',
    { hat: 0xe8453c, shirt: 0xf4f4f8, beard: null, dress: true },
    'The gull wins. The gull is a puppet. The gull always wins.'),
  folk('queue-tuppence', 'Tuppence', 90, 1121.2, 0, 'look-around',
    { hat: 0x4fa3d9, shirt: 0xf08bb4, beard: null, hair: { color: 0x4a2f22, style: 'pigtails' } },
    'I am third in the queue. There is nobody in front of me. I am still third.'),
];

// ---- Bunting ----------------------------------------------------------------------------------------------------------

const FLAG_COLORS = [0xe8453c, 0xf2a93b, 0xf4f4f8, 0x4fa3d9, 0x6bbf59] as const;
FLAG_COLORS.forEach((c, i) => {
  MATS['promFlag' + i] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, side: THREE.DoubleSide });
});
MATS.promRope = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
MATS.promBulb = nightGlowMat(0xfff1c4, 2);

/** Lamp globe height above the deck, and how far a string sags per metre of span. */
const STRING_Y = 4.9;
const SAG = 0.04;

/** The lamp posts (same grid as boardwalk.ts boardwalkLamps()). */
function lampGrid(): { xs: number[]; zs: [number, number] } {
  const bw = COAST.boardwalk, R = bw.rect;
  const xs: number[] = [];
  for (let x = R.minX + bw.lampStep / 2; x < R.maxX; x += bw.lampStep) xs.push(x);
  return { xs, zs: [R.minZ + 2.6, R.maxZ - 2.8] };
}

const UP = new THREE.Vector3(0, 1, 0);

/** One string of bunting from (ax, az) to (bx, bz) at height `y`: a sagging rope, triangle flags and a bulb every 1.2 m. */
function bunting(bins: Bins, ax: number, az: number, bx: number, bz: number, y: number, seed: number): void {
  const L = Math.hypot(bx - ax, bz - az);
  const sag = SAG * L;
  const dx = (bx - ax) / L, dz = (bz - az) / L;
  const at = (s: number): THREE.Vector3 => {
    const t = s / L;
    return new THREE.Vector3(ax + (bx - ax) * t, y - sag * 4 * t * (1 - t), az + (bz - az) * t);
  };
  // Rope: segments about 1.2 m long.
  const segs = Math.max(2, Math.round(L / 1.2));
  for (let i = 0; i < segs; i++) {
    const p = at((i / segs) * L), q = at(((i + 1) / segs) * L);
    const d = q.clone().sub(p);
    const len = d.length();
    const g = new THREE.CylinderGeometry(0.018, 0.018, len, 4, 1);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
    const m = p.clone().add(q).multiplyScalar(0.5);
    g.translate(m.x, m.y, m.z);
    bins.add('promRope', g, m.x);
  }
  // Bulbs hang just under the rope.
  for (let s = 0.6; s < L - 0.3; s += 1.2) {
    const p = at(s);
    bins.add('promBulb', new THREE.SphereGeometry(0.08, 6, 4).translate(p.x, p.y - 0.1, p.z), p.x);
  }
  // Flags: triangles 0.4 wide and 0.55 long, point down, colours cycling from `seed`.
  const FW = 0.2, FH = 0.55;
  let k = 0;
  for (let s = 0.3; s < L - 0.2; s += 0.6, k++) {
    const a = at(s - FW), b = at(s + FW);
    const tip = at(s);
    tip.y -= FH;
    const pos = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, tip.x, tip.y, tip.z]);
    const nrm = new Float32Array([-dz, 0, dx, -dz, 0, dx, -dz, 0, dx]);
    const uv = new Float32Array([0, 1, 1, 1, 0.5, 0]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    bins.add('promFlag' + ((k + seed) % FLAG_COLORS.length), g, tip.x);
  }
}

// ---- Build ------------------------------------------------------------------------------------------------------------

/** Dress the boardwalk deck (deck top `deckTop`, absolute y). */
export function buildPromenade(scene: THREE.Scene, boxes: Box[], deckTop: number): void {
  // The south row: rides and kiosks fronting the walkway. Solid, each with a collider from its bounds.
  for (const p of SOUTH_ROW) solid(boxes, placeAt(scene, p.id, p.x, deckTop, p.z, p.yaw, SCALE));
  // A short queue rope at the carousel's front edge.
  for (const dx of [-1.4, 1.4]) placeAt(scene, 'rope-stanchion', 30 + dx, deckTop, 1121.9, 0, 2);

  // Coin telescopes at the rail, tube pointing at the sea (yaw 0).
  for (const t of TELESCOPES) solid(boxes, placeAt(scene, 'coin-telescope', t.x, deckTop, t.z, 0, 1.8));
  // Seaside bins, and the deckchair stack by the middle stairs (clear of the 4 m gap).
  for (const x of BINS_X) solid(boxes, placeAt(scene, 'seaside-bin', x, deckTop, BIN_Z, Math.PI, 2));
  solid(boxes, placeAt(scene, 'deckchair-stack', -4.6, deckTop, 1128.2, 0.2, 2));

  // Bunting along both lamp rows, and across the walkway either side of the entrance (x +-15).
  const { xs, zs } = lampGrid();
  const bins = new Bins();
  const y = deckTop + STRING_Y;
  for (const z of zs) for (let i = 0; i < xs.length - 1; i++) bunting(bins, xs[i], z, xs[i + 1], z, y, i + (z === zs[0] ? 0 : 2));
  for (const x of [-15, 15]) bunting(bins, x, zs[0], x, zs[1], y, x > 0 ? 1 : 3);
  bins.flush(scene);
}

