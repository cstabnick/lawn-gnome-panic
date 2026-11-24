// The Side-Valve Lock-Up's marking in the world (docs/roadmaps/gta-skyway-traffic-gps.md): a painted bay on the forecourt
// where you drive in to store a vehicle (LOCKUP.sites[0]), and a sign built from prefabs.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import { registerCull } from '../cull';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { LOCKUP } from './config';

const BAY_W = 8;
const BAY_D = 6;
const SIGN_HEIGHT = 2.5;
const SIGN_PREFAB = 'signpost';
const SIGN_FALLBACK = 'wooden-wall-sign';

/** The painted bay: white outline, yellow hatched corners, "LOCK-UP" in block letters. Canvas aspect matches 8 x 6 m. */
function paintBay(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const g = c.getContext('2d');
  if (!g) throw new Error('lockup marking: no 2D canvas context');
  g.clearRect(0, 0, 512, 384);

  const inset = 12;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 22;
  g.strokeRect(inset, inset, 512 - 2 * inset, 384 - 2 * inset);

  // Hatched corner boxes, just inside the outline.
  const x0 = 23;
  const x1 = 489 - 70;
  const y0 = 23;
  const y1 = 361 - 70;
  for (const [cx, cy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]] as const) {
    g.save();
    g.beginPath();
    g.rect(cx, cy, 70, 70);
    g.clip();
    g.strokeStyle = '#f2c200';
    g.lineWidth = 14;
    for (let k = -70; k <= 140; k += 28) {
      g.beginPath();
      g.moveTo(cx + k, cy);
      g.lineTo(cx + k + 70, cy + 70);
      g.stroke();
    }
    g.restore();
  }

  g.fillStyle = '#ffffff';
  g.font = 'bold 84px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('LOCK-UP', 256, 192);

  const tex = new THREE.CanvasTexture(c);
  // The plane lies flat with its top edge toward -z (the road); turn the image so the words read from the road side.
  tex.center.set(0.5, 0.5);
  tex.rotation = Math.PI;
  return tex;
}

/** The board on top of the sign post: dark green, "SIDE-VALVE LOCK-UP" in white, on its -z (road-facing) face. */
function paintBoard(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const g = c.getContext('2d');
  if (!g) throw new Error('lockup marking: no 2D canvas context');
  g.fillStyle = '#1f5f3a';
  g.fillRect(0, 0, 512, 160);
  g.strokeStyle = '#f2c200';
  g.lineWidth = 10;
  g.strokeRect(8, 8, 496, 144);
  g.fillStyle = '#ffffff';
  g.font = 'bold 40px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('SIDE-VALVE LOCK-UP', 256, 84);
  return new THREE.CanvasTexture(c);
}

/** Build the Lock-Up's painted bay and sign into the scene; returns the sign's colliders (app adds them to world.boxes). */
export function buildLockupMarking(scene: THREE.Scene): Box[] {
  if (typeof document === 'undefined') return [];
  const site = LOCKUP.sites[0];
  const group = new THREE.Group();
  group.name = 'lockup-marking';

  // Painted bay, flat on the ground.
  const bayMat = flatLayer(new THREE.MeshBasicMaterial({ map: paintBay(), transparent: true }), LAYER.marking);
  const bay = new THREE.Mesh(new THREE.PlaneGeometry(BAY_W, BAY_D).rotateX(-Math.PI / 2), bayMat);
  bay.name = 'lockup-bay';
  bay.position.set(site.x, heightAt(site.x, site.z) + 0.03, site.z);
  group.add(bay);

  // Sign: a post (the signpost prefab, scaled to about 2.5 m) with a board on its top.
  const sx = site.x + 5;
  const sz = site.z + 4.5;
  const gy = heightAt(sx, sz);
  const postId = getPrefab(SIGN_PREFAB) ? SIGN_PREFAB : SIGN_FALLBACK;
  const post = buildPrefab(postId);
  post.updateMatrixWorld(true);
  const tall = new THREE.Box3().setFromObject(post).getSize(new THREE.Vector3()).y;
  post.scale.multiplyScalar(tall > 0 ? SIGN_HEIGHT / tall : 1);
  post.position.set(sx, gy, sz);
  post.name = 'lockup-sign-post';
  group.add(post);

  const boardTex = paintBoard();
  const plain = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
  const faced = new THREE.MeshStandardMaterial({ map: boardTex });
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z.
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.06), [plain, plain, plain, plain, plain, faced]);
  board.name = 'lockup-sign-board';
  board.position.set(sx, gy + 2.35, sz);
  group.add(board);

  scene.add(group);
  registerCull(group, 'prop');

  const half = 0.2;
  return [{ minX: sx - half, maxX: sx + half, minZ: sz - half, maxZ: sz + half, h: gy + SIGN_HEIGHT }];
}
