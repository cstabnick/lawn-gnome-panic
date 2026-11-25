// The High Tarn on Snowcap Rise (E31): a cold lake worth the walk. A stone bothy, a little jetty, a cairn, a board,
// three vignettes (the Cold Swim, the Bothy Guestbook, the Optimist's Picnic), and a warden who came for the quiet.
import * as THREE from 'three';
import { flatLayer, LAYER } from '@lawn/depth';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';
import { heightAt, waterAt } from '../terrain';
import { textPlate } from '../homes/pieces';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { pieceBox, placePieces, prefabBounds, roadDist, seeded, type Piece } from './place';

/** The site rectangle (natural, sloped ground). */
export const HIGH_TARN_SITE = { minX: 880, maxX: 1120, minZ: -1680, maxZ: -1520 } as const;

const BOTHY = { x: 1075, z: -1605, yaw: -Math.PI / 2 };
const JETTY_SHORE_X = 1042;
const JETTY_Z = -1610;
const JETTY_YAW = -Math.PI / 2;
const BOARD = { x: 1068, z: -1570 };
const MILESTONE = { x: 1064.5, z: -1310 };
const CAIRN = { x: 1000, z: -1668 };

/** Water surface height at the tarn's middle. */
function tarnSurface(): number {
  return waterAt(990, -1610)?.surface ?? heightAt(990, -1610);
}

/** The jetty piece: near end on the east shore, far end (+z local) out over the water. */
function jettyPiece(): Piece {
  const lb = prefabBounds('tarn-jetty');
  const deckTop = tarnSurface() + 0.4;
  const topLocal = lb.isEmpty() ? 0.5 : lb.max.y;
  const zmin = lb.isEmpty() ? 0 : lb.min.z;
  return { id: 'tarn-jetty', x: JETTY_SHORE_X + zmin, z: JETTY_Z, yaw: JETTY_YAW, y: deckTop - topLocal };
}

function bothyPiece(): Piece {
  const p: Piece = { id: 'tarn-bothy', x: BOTHY.x, z: BOTHY.z, yaw: BOTHY.yaw, solid: true };
  const b = pieceBox({ ...p, y: 0 });
  let y = heightAt(BOTHY.x, BOTHY.z);
  if (b) {
    y = Infinity;
    for (const cx of [b.minX, b.maxX]) for (const cz of [b.minZ, b.maxZ]) y = Math.min(y, heightAt(cx, cz));
  }
  return { ...p, y };
}

/** Where the loose scatter goes (rocks, tufts, heather), deterministic. Kept off the water, the path and the set pieces. */
function scatterPieces(fixed: readonly Piece[]): Piece[] {
  const rnd = seeded(31005);
  const ids = ['garden-rock', 'ice-rock', 'stone-chunk', 'grass-tuft', 'grass-tuft', 'fern-clump', 'wildflower-patch', 'round-bush'];
  const out: Piece[] = [];
  const keep = fixed.map((f) => ({ x: f.x, z: f.z }));
  for (let tries = 0; tries < 900 && out.length < 44; tries++) {
    const x = 925 + rnd() * 190, z = -1665 + rnd() * 125;
    const w = waterAt(x, z);
    if (w && w.depth > 0.3) continue;
    if (roadDist(x, z) < 3.5) continue;
    if (keep.some((k) => Math.hypot(k.x - x, k.z - z) < 4)) continue;
    const id = ids[Math.floor(rnd() * ids.length)];
    const isRock = id === 'garden-rock' || id === 'ice-rock' || id === 'stone-chunk';
    out.push({ id, x, z, yaw: rnd() * Math.PI * 2, scale: isRock ? 0.6 + rnd() * 0.9 : 0.8 + rnd() * 0.6 });
    keep.push({ x, z });
  }
  return out;
}

/** The whole plan as pieces (pure: no scene). */
export function planHighTarn(): Piece[] {
  const surface = tarnSurface();
  const deckY = surface + 0.4;
  const jetty = jettyPiece();
  const farX = JETTY_SHORE_X - 7;
  const bothy = bothyPiece();
  const cairnY = heightAt(CAIRN.x, CAIRN.z);

  const set: Piece[] = [
    bothy,
    jetty,
    { id: 'hamlet-stone-cairn', x: CAIRN.x, z: CAIRN.z, yaw: 0.4, solid: true },
    { id: 'rules-board', x: BOARD.x, z: BOARD.z, yaw: 0, solid: true },
    { id: 'milestone', x: MILESTONE.x, z: MILESTONE.z, yaw: 0, solid: true },
    // Vignette 1: the Cold Swim. Everything folded neatly at the end of the jetty.
    { id: 'caddie-towel', x: farX + 0.2, z: JETTY_Z + 0.4, yaw: 0.2, y: deckY },
    { id: 'court-boots', x: farX + 0.1, z: JETTY_Z - 0.4, yaw: -0.3, y: deckY },
    { id: 'pointy-hat', x: farX + 0.9, z: JETTY_Z - 0.1, yaw: 0.1, y: deckY, scale: 0.8 },
    // Vignette 2: the Bothy Guestbook, by the door (west face).
    { id: 'lectern', x: BOTHY.x - 3.0, z: BOTHY.z - 1.6, yaw: Math.PI / 2, solid: true },
    ...[0, 1, 2, 3, 4].map((i): Piece => ({
      id: 'stone-chunk', x: BOTHY.x - 3.4 + (i % 3) * 0.35, z: BOTHY.z + 1.2 + Math.floor(i / 3) * 0.4, yaw: i * 1.3, scale: 0.4,
    })),
    // Vignette 3: the Optimist's Picnic, tied down, half of it blown against the bothy wall.
    { id: 'hamlet-picnic-table', x: BOTHY.x - 4.6, z: BOTHY.z + 4.2, yaw: 0.3, solid: true },
    { id: 'beach-umbrella', x: BOTHY.x - 4.6, z: BOTHY.z + 4.2, yaw: 0, scale: 0.9 },
    { id: 'round-rug', x: BOTHY.x - 2.8, z: BOTHY.z + 4.6, yaw: 0.5, scale: 0.6, lift: 0.03 },
    { id: 'pl-bread-basket', x: BOTHY.x - 2.3, z: BOTHY.z + 2.4, yaw: 1.1, scale: 0.8 },
    { id: 'speedway-tea-towel', x: BOTHY.x - 2.2, z: BOTHY.z + 2.8, yaw: 2.2 },
    { id: 'honeydew-flask', x: BOTHY.x - 2.5, z: BOTHY.z + 3.1, yaw: 0.9 },
  ];
  void cairnY;
  return [...set, ...scatterPieces(set)];
}

/** Builds the High Tarn. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildHighTarn(scene: THREE.Scene, boxes: Box[]): void {
  const plan = planHighTarn();
  placePieces(scene, boxes, plan, 'high-tarn');

  // The jetty deck is walkable like the coast pier.
  const jb = pieceBox(jettyPiece());
  if (jb && !rooftopById('high-tarn-jetty')) {
    addRooftop({
      id: 'high-tarn-jetty', name: 'the High Tarn jetty',
      minX: jb.minX, maxX: jb.maxX, minZ: jb.minZ, maxZ: jb.maxZ, y: tarnSurface() + 0.4, solid: false, parapet: false,
    });
  }

  // Text plates (separate meshes), mounted just in front of their boards.
  const boardTop = prefabBounds('rules-board');
  const bz = BOARD.z + (boardTop.isEmpty() ? 0.1 : boardTop.max.z) + 0.04;
  const by = heightAt(BOARD.x, BOARD.z) + (boardTop.isEmpty() ? 1.4 : boardTop.max.y * 0.62);
  scene.add(textPlate('THE HIGH TARN\nAltitude: high.\nTemperature: no.\nSwimming at your own regret.', BOARD.x, by, bz, 0, { w: 1.1, h: 0.7 }));
  const mb = prefabBounds('milestone');
  const mz = MILESTONE.z + (mb.isEmpty() ? 0.2 : mb.max.z) + 0.04;
  scene.add(textPlate('HIGH TARN 1/4', MILESTONE.x, heightAt(MILESTONE.x, MILESTONE.z) + (mb.isEmpty() ? 0.6 : mb.max.y * 0.6), mz, 0, { w: 0.5, h: 0.2 }));
  const lb = prefabBounds('lectern');
  scene.add(textPlate('Visitors: 3. Sheep: 41.', BOTHY.x - 3.0, heightAt(BOTHY.x - 3.0, BOTHY.z - 1.6) + (lb.isEmpty() ? 1.1 : lb.max.y + 0.03), BOTHY.z - 1.6, Math.PI / 2, { w: 0.3, h: 0.12 }));

  // The single bubble ring where the swimmer went under.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.5, 24),
    flatLayer(new THREE.MeshBasicMaterial({ color: 0xcfe9f2, transparent: true, opacity: 0.7, side: THREE.DoubleSide }), LAYER.marking),
  );
  ring.name = 'high-tarn-bubble-ring';
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(JETTY_SHORE_X - 9.5, tarnSurface() + 0.02, JETTY_Z);
  scene.add(ring);
}

/** The people at the High Tarn (ambient gnomes with a speech bubble). living/runtime.ts shows them. */
export function highTarnPeople(): AmbientGnomeDef[] {
  return [{
    id: 'tarn-warden',
    name: 'Fell Warden Brisk',
    x: BOTHY.x - 3.6,
    z: BOTHY.z - 0.2,
    yaw: -Math.PI / 2,
    idle: 'look-around',
    look: { hat: 0x8a4b2d, shirt: 0x5b6b4e, pants: 0x3a3a44, skin: 0xe0b48a, boots: 0x2a2018, beard: 0xa8a8a8, glasses: false },
    bubble: 'I came up here for the quiet. Then the diver started singing.',
  }];
}
