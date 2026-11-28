// Long Spoon Pier (E11 issue 2A, split out of boardwalk.ts by FX11): the spur, handle and bowl (walkable rooftops and
// planks), their posts, rails and Marram's hut. A giant Tall-One spoon laid out to sea from the boardwalk's east end.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { COAST } from './config';
import { Bins, PIER_THICK, bedHeight, deckSlabs, place, railLine, shadowed, signAt, solid } from './deckKit';

/** The spur, handle and bowl (walkable rooftops + planks), their posts, rails and Marram's hut. */
export function buildPier(scene: THREE.Scene, boxes: Box[], boardwalkTop: number): void {
  const bins = new Bins();
  const P = COAST.pier;
  const Y = P.deckY;
  const base = Y - PIER_THICK;
  const sp = P.spur, ha = P.handle, bo = P.bowl;
  const ground = heightAt(COAST.boardwalk.rect.maxX - 1, (sp.minZ + sp.maxZ) / 2);

  // Rooftops: box-less walkable decks. Guarded so a second build (tests) does not throw on duplicate ids.
  for (const [id, name, r] of [
    ['long-spoon-spur', 'Long Spoon spur', sp], ['long-spoon-handle', 'Long Spoon handle', ha], ['long-spoon-bowl', 'Long Spoon bowl', bo],
  ] as const) {
    if (!rooftopById(id)) addRooftop({ id, name, minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, y: Y, solid: false, parapet: false });
  }

  // Ramp: 3 steps at x 210..216 from the boardwalk deck up to the spur.
  const rampX0 = sp.minX, rampX1 = sp.minX + 6;
  for (let i = 0; i < 3; i++) {
    const top = boardwalkTop + ((Y - boardwalkTop) * (i + 1)) / 3;
    bins.box('step', rampX0 + i * 2, rampX0 + (i + 1) * 2, boardwalkTop - 0.2, top, sp.minZ, sp.maxZ);
  }

  // Spur planks (x 216..304, z 1120..1130), alternating tones every 1.2 m, on a dark skirt down to the ground.
  deckSlabs(bins, rampX1, ha.minX - 0.03, Y, sp.minZ, sp.maxZ, 'pierWood', 'x', PIER_THICK);
  for (let x = rampX1; x < sp.maxX - 1e-6; x += 12) {
    const x1 = Math.min(sp.maxX, x + 12);
    const low = Math.min(heightAt(x, sp.minZ), heightAt(x1, sp.minZ), heightAt(x, sp.maxZ), heightAt(x1, sp.maxZ), ground) - 0.4;
    bins.box('skirt', x + 0.3, x1 - 0.3, low, base + 0.05, sp.minZ + 0.3, sp.maxZ - 0.3);
  }

  // Handle planks (z 1130..1238, tucked 2 m under the bowl), then the raised steel spine down its middle.
  const hz0 = sp.maxZ, hz1 = bo.minZ + 2;
  deckSlabs(bins, sp.minZ, hz1, Y, ha.minX, ha.maxX, 'pierWoodZ', 'z', PIER_THICK);
  const cxh = (ha.minX + ha.maxX) / 2;
  bins.box('steel', cxh - 0.6, cxh + 0.6, Y - 0.05, Y + 0.035, hz0 + 1, bo.minZ - 0.6);

  // The bowl: a flattened oval, polished silver-grey, 2 cm above the handle's top plane so they never share a plane.
  const bcx = (bo.minX + bo.maxX) / 2, bcz = (bo.minZ + bo.maxZ) / 2;
  const rx = (bo.maxX - bo.minX) / 2, rz = (bo.maxZ - bo.minZ) / 2;
  const oval = new THREE.CylinderGeometry(1, 1, PIER_THICK, 48).scale(rx, 1, rz).translate(bcx, Y + 0.07 - PIER_THICK / 2, bcz);
  bins.add('silver', oval, bcx);

  // Pier posts (scale 3, a 7.5 m post; stacked where the sea bed is deeper), every 12 m both sides and round the bowl.
  const postSpots: [number, number][] = [];
  for (let z = hz0 + 6; z < bo.minZ - 4; z += 12) postSpots.push([ha.minX, z], [ha.maxX, z]);
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 + Math.PI / 6;
    postSpots.push([bcx + (rx - 1.2) * Math.cos(a), bcz + (rz - 1.2) * Math.sin(a)]);
  }
  for (const [x, z] of postSpots) {
    let y = bedHeight(x, z) - 0.3;
    for (let n = 0; n < 3 && y + 7.4 < base + 0.05; n++, y += 7) {
      const post = place(scene, 'pier-post', x, z, 0, 3);
      if (post) post.position.y = y;
    }
  }

  // Rails: spur north and south, handle west and east, and the bowl ring with a gap at the handle mouth and the gangplank.
  const h = 1.1, top = Y + h;
  const e = 0.45;
  railLine(bins, boxes, rampX1, sp.minZ + e, ha.maxX - e, sp.minZ + e, Y, h, top);
  railLine(bins, boxes, rampX1, sp.maxZ - e, ha.minX + e, sp.maxZ - e, Y, h, top);
  railLine(bins, boxes, ha.minX + e, sp.maxZ, ha.minX + e, bo.minZ + 0.6, Y, h, top);
  railLine(bins, boxes, ha.maxX - e, sp.minZ + e, ha.maxX - e, bo.minZ + 0.6, Y, h, top);
  const SEG = 36;
  for (let k = 0; k < SEG; k++) {
    const a0 = (k / SEG) * Math.PI * 2, a1 = ((k + 1) / SEG) * Math.PI * 2;
    const p0: [number, number] = [bcx + (rx - e) * Math.cos(a0), bcz + (rz - e) * Math.sin(a0)];
    const p1: [number, number] = [bcx + (rx - e) * Math.cos(a1), bcz + (rz - e) * Math.sin(a1)];
    const mx = (p0[0] + p1[0]) / 2;
    if (mx > ha.minX && mx < ha.maxX) continue; // handle mouth (north) and gangplank gap (south)
    railLine(bins, boxes, p0[0], p0[1], p1[0], p1[1], Y, h, top);
  }

  // Marram's hut (west side of the bowl, door facing the deck) and her sign.
  const m = P.marramHut;
  if (getPrefab('beach-hut')) {
    const hut = buildPrefab('beach-hut', { lights: false, scale: 2.2 });
    hut.rotation.y = m.yaw ?? 0;
    hut.position.set(m.x, Y + 0.07, m.z);
    scene.add(shadowed(hut));
    solid(boxes, hut);
  }
  signAt(scene, "MARRAM'S\nNo refunds, many opinions", m.x + 3, Y + 0.07, m.z + 5.5, m.yaw ?? 0, { w: 2.8, h: 0.9, post: 0.9 });

  bins.flush(scene);
}
