// Long Spoon Pier (E11 issue 2A, split out of boardwalk.ts by FX11): the spur, handle and bowl (walkable rooftops and
// planks), their posts, rails and Marram's hut. A giant Tall-One spoon laid out to sea from the boardwalk's east end:
// a polished silver handle with a raised rim, its rounded end coming up out of the sand, and a dished bowl with a lip.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { undersideMat } from '../undersides';
import { COAST } from './config';
import { Bins, MATS, PIER_THICK, bedHeight, deckSlabs, place, placeAt, railLine, shadowed, signAt, solid } from './deckKit';
import { lightPool, nightGlowMat } from './nightLights';
import { coastSign } from './sign';

// Pier-only materials (added at import time). The extruded pieces (non-indexed geometry) get their own key, which shares
// the silver material, because a bin must not mix indexed and non-indexed geometry.
MATS.spoonRail = new THREE.MeshStandardMaterial({ color: 0xdde5ea, roughness: 0.35, metalness: 0.5 });
// Without an environment map the shared 0.7-metal silver renders near-black under the sun; the spoon gets its own brighter one.
MATS.spoonSilver = new THREE.MeshStandardMaterial({ color: 0xdbe3e8, roughness: 0.28, metalness: 0.3 });
MATS.silverX = MATS.spoonSilver;
MATS.pierUnder = undersideMat(0x9aa6ad, { roughness: 0.6, metalness: 0.3 });
MATS.pierSkirt = undersideMat(0x5a4330);
MATS.pierPlankUnder = undersideMat(0x6e5236);

/** A thin extruded ring segment of an ellipse (radii rx, rz, `width` m wide, from angle a0 to a1), lying flat, y 0..height. */
function ellipseArc(cx: number, cz: number, rx: number, rz: number, width: number, a0: number, a1: number, height: number): THREE.BufferGeometry {
  const n = Math.max(2, Math.ceil((a1 - a0) / 0.06));
  const s = new THREE.Shape();
  // The shape's y is minus the world z (rotateX(-PI/2) maps y to -z), so build with -z.
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const x = cx + rx * Math.cos(a), y = -(cz + rz * Math.sin(a));
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  for (let i = n; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / n;
    s.lineTo(cx + (rx - width) * Math.cos(a), -(cz + (rz - width) * Math.sin(a)));
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: height - 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0.05, 0);
  return g;
}

/** A flat ellipse ring (or a full ellipse when inner is 0) lying in the xz plane, facing up. */
function flatEllipse(cx: number, cz: number, rx: number, rz: number, inner: number, y: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.absellipse(cx, -cz, rx, rz, 0, Math.PI * 2, false, 0);
  if (inner > 0) {
    const h = new THREE.Path();
    h.absellipse(cx, -cz, Math.max(0.1, rx - inner), Math.max(0.1, rz - inner), 0, Math.PI * 2, true, 0);
    s.holes.push(h);
  }
  const g = new THREE.ShapeGeometry(s, 48);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/** The spoon handle's end north of the spur: a beveled plate widening to a rounded end, sloping down into the sand. */
function handleEnd(Y: number, z0: number, cx: number, halfW: number): THREE.BufferGeometry {
  const len = 13, endW = halfW + 0.8, rz = 6;
  const s = new THREE.Shape();
  s.moveTo(cx - halfW, -z0);
  s.lineTo(cx - endW, -(z0 - len + rz));
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI - (Math.PI * i) / 24;
    s.lineTo(cx + endW * Math.cos(a), -(z0 - len + rz - rz * Math.sin(a)));
  }
  s.lineTo(cx + halfW, -z0);
  const depth = 0.25, bt = 0.06;
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.08, bevelSegments: 2, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const lift = Y - 0.02 - (depth + bt);
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    pos.setY(i, pos.getY(i) + lift - 0.8 * Math.min(1, Math.max(0, (z0 - z) / len)));
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

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

  // Spur planks (x 216..296, z 1120..1130): the only planks left. A lit underside layer 2 cm in from the slab's edges, and
  // a skirt down to the ground, so the pier is not a black lid at night.
  const spurEnd = ha.minX - 0.03;
  deckSlabs(bins, rampX1, spurEnd, Y, sp.minZ, sp.maxZ, 'pierWood', 'x', PIER_THICK);
  bins.box('pierPlankUnder', rampX1 + 0.02, spurEnd - 0.02, base - 0.03, base + 0.02, sp.minZ + 0.02, sp.maxZ - 0.02);
  for (let x = rampX1; x < spurEnd - 1e-6; x += 12) {
    const x1 = Math.min(spurEnd, x + 12);
    const low = Math.min(heightAt(x, sp.minZ), heightAt(x1, sp.minZ), heightAt(x, sp.maxZ), heightAt(x1, sp.maxZ), ground) - 0.4;
    bins.box('pierSkirt', x + 0.3, x1 - 0.3, low, base + 0.05, sp.minZ + 0.3, sp.maxZ - 0.3);
  }

  // The handle (z 1120..1238, tucked 2 m under the bowl): a polished silver plate (top exactly at Y) on a lit body, with a
  // raised rounded rim along both long edges, outside the walking strip (x 296.45..303.55).
  const cxh = (ha.minX + ha.maxX) / 2;
  const hz0 = sp.minZ, hz1 = bo.minZ + 2;
  const plateT = 0.1;
  bins.box('spoonSilver', ha.minX + 0.35, ha.maxX - 0.35, Y - plateT, Y, hz0, hz1);
  bins.box('pierUnder', ha.minX + 0.3, ha.maxX - 0.3, base, Y - plateT + 0.02, hz0 + 0.05, hz1 - 0.05);
  const rimR = 0.17, rimZ1 = bo.minZ + 0.4;
  for (const rx0 of [ha.minX + rimR, ha.maxX - rimR]) {
    const rim = new THREE.CylinderGeometry(rimR, rimR, rimZ1 - hz0, 12).rotateX(Math.PI / 2).translate(rx0, Y + 0.08, (hz0 + rimZ1) / 2);
    bins.add('spoonSilver', rim, rx0);
  }
  // Rim end caps where the handle meets the spur's north edge.
  for (const rx0 of [ha.minX + rimR, ha.maxX - rimR]) bins.add('spoonSilver', new THREE.SphereGeometry(rimR, 12, 8).translate(rx0, Y + 0.08, hz0), rx0);

  // The handle's end, north of the spur: rounded, sloping into the sand, half-buried. Decorative; one collider for the
  // part that stands more than half a metre off the ground.
  const endLen = 13;
  bins.add('silverX', handleEnd(Y, hz0, cxh, (ha.maxX - ha.minX) / 2), cxh);
  boxes.push({ minX: ha.minX - 0.4, maxX: ha.maxX + 0.4, minZ: hz0 - 3.5, maxZ: hz0 - 0.05, h: Y - 0.02 });
  void endLen;

  // The bowl: a flattened oval, polished silver, its top 7 cm above the handle's top plane so they never share a plane.
  const bcx = (bo.minX + bo.maxX) / 2, bcz = (bo.minZ + bo.maxZ) / 2;
  const rx = (bo.maxX - bo.minX) / 2, rz = (bo.maxZ - bo.minZ) / 2;
  const bowlTop = Y + 0.07;
  const disc = new THREE.CylinderGeometry(1, 1, 0.06, 48).scale(rx, 1, rz).translate(bcx, bowlTop - 0.03, bcz);
  bins.add('spoonSilver', disc, bcx);
  const body = new THREE.CylinderGeometry(1, 1, PIER_THICK - 0.04, 48).scale(rx - 0.15, 1, rz - 0.15).translate(bcx, bowlTop - 0.05 - (PIER_THICK - 0.04) / 2, bcz);
  bins.add('pierUnder', body, bcx);
  // The lip: a raised silver ring round the edge, left open at the handle's mouth and at the gangplank.
  const gapHalf = (ha.maxX - ha.minX) / 2 + 0.3;
  const lipY = bowlTop - 0.05;
  const ang = (i: number): number => (i * Math.PI) / 90;
  let runStart = -1;
  for (let i = 0; i <= 180; i++) {
    const am = ang(i) + Math.PI / 180;
    const open = i < 180 && Math.abs(bcx + rx * Math.cos(am) - cxh) > gapHalf + 0.2;
    if (open && runStart < 0) runStart = i;
    if (!open && runStart >= 0) {
      const g = ellipseArc(bcx, bcz, rx, rz, 0.4, ang(runStart), ang(i), 0.4);
      g.translate(0, lipY, 0);
      bins.add('silverX', g, bcx);
      runStart = -1;
    }
  }
  // The dish: a darker inner band and a pale highlight, flat decals just above the bowl's top.
  const dish = new THREE.Mesh(flatEllipse(bcx, bcz, rx - 0.6, rz - 0.6, 2.4, bowlTop + 0.015), flatLayer(new THREE.MeshStandardMaterial({ color: 0x8796a1, roughness: 0.3, metalness: 0.7 }), LAYER.decal));
  dish.name = 'spoon-dish';
  dish.receiveShadow = true;
  scene.add(dish);
  const shine = new THREE.Mesh(flatEllipse(bcx + 3.2, bcz - 3.3, 3.2, 1.1, 0, bowlTop + 0.02), flatLayer(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false }), LAYER.marker));
  shine.rotation.y = 0.5;
  shine.name = 'spoon-shine';
  scene.add(shine);

  // Pier posts (scale 3, a 7.5 m post; stacked where the sea bed is deeper), every 12 m both sides and round the bowl.
  const postSpots: [number, number][] = [];
  for (let z = sp.maxZ + 6; z < bo.minZ - 4; z += 12) postSpots.push([ha.minX, z], [ha.maxX, z]);
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

  // Rails: the spur's two sides in wood white, the handle and the bowl ring in silver-white to read as one spoon.
  const h = 1.1, top = Y + h;
  const e = 0.45;
  railLine(bins, boxes, rampX1, sp.minZ + e, ha.minX, sp.minZ + e, Y, h, top);
  railLine(bins, boxes, ha.minX, sp.minZ + e, ha.maxX - e, sp.minZ + e, Y, h, top, 'spoonRail');
  railLine(bins, boxes, rampX1, sp.maxZ - e, ha.minX + e, sp.maxZ - e, Y, h, top);
  railLine(bins, boxes, ha.minX + e, sp.maxZ, ha.minX + e, bo.minZ + 0.6, Y, h, top, 'spoonRail');
  railLine(bins, boxes, ha.maxX - e, sp.minZ + e, ha.maxX - e, bo.minZ + 0.6, Y, h, top, 'spoonRail');
  const SEG = 36;
  for (let k = 0; k < SEG; k++) {
    const a0 = (k / SEG) * Math.PI * 2, a1 = ((k + 1) / SEG) * Math.PI * 2;
    const p0: [number, number] = [bcx + (rx - e) * Math.cos(a0), bcz + (rz - e) * Math.sin(a0)];
    const p1: [number, number] = [bcx + (rx - e) * Math.cos(a1), bcz + (rz - e) * Math.sin(a1)];
    const mx = (p0[0] + p1[0]) / 2;
    if (mx > ha.minX && mx < ha.maxX) continue; // handle mouth (north) and gangplank gap (south)
    railLine(bins, boxes, p0[0], p0[1], p1[0], p1[1], Y, h, top, 'spoonRail');
  }

  // Notices: the lore's pier rules, one on the handle by the spur and one on the bowl.
  signAt(scene, 'FISHING FROM THE HANDLE ONLY.\nTHE BOWL IS NOT AVAILABLE.', 302.3, Y, sp.maxZ + 4, 0, { w: 2.2, h: 0.9, post: 0.7 });
  signAt(scene, 'PLEASE DO NOT STIR', bcx + 6.5, bowlTop, bcz - 1, Math.PI / 2 + 0.3, { w: 2.0, h: 0.6, post: 0.6 });

  // Captain Bilge's chalk board of tour times at the head of the handle, facing the beach end.
  if (getPrefab('chalk-tour-board')) {
    const board = placeAt(scene, 'chalk-tour-board', 302.5, Y, 1166, Math.PI, 2);
    if (board) {
      const plate = coastSign('PIRATE TOURS\nNoon. Also noon.\nMidnight is cargo.\nNot a tour.', { w: 0.95, h: 0.8, bg: 0x2b2b2b, fg: 0xf2f2e8, post: 0, back: false });
      plate.position.set(302.5, Y + 0.55, 1166 - 0.3);
      plate.rotation.y = Math.PI;
      scene.add(plate);
    }
  }

  // Marram's hut (west side of the bowl, door facing the deck) and her sign.
  const m = P.marramHut;
  const yaw = m.yaw ?? 0;
  if (getPrefab('beach-hut')) {
    const hut = buildPrefab('beach-hut', { lights: false, scale: 2.2 });
    hut.rotation.y = yaw;
    hut.position.set(m.x, bowlTop, m.z);
    scene.add(shadowed(hut));
    solid(boxes, hut);
    // A lit window on the wall that faces the handle (the hut's local +x side), 3 cm proud of the wall, and a pool of
    // light on the bowl in front of the door: lit at dusk (G3#12).
    const half = 0.7 * 2.2;
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.6), nightGlowMat(0xffc46b, 2));
    win.position.set(m.x + (half + 0.03) * Math.cos(yaw), bowlTop + 1.3, m.z - (half + 0.03) * Math.sin(yaw));
    win.rotation.y = yaw;
    win.name = 'marram-window';
    scene.add(win);
    const pool = lightPool(m.x + 3.2 * Math.sin(yaw), bowlTop, m.z + 3.2 * Math.cos(yaw), 2.4);
    scene.add(pool);
  }
  signAt(scene, "MARRAM'S\nNo refunds, many opinions", m.x + 3, bowlTop, m.z + 5.5, yaw, { w: 2.8, h: 0.9, post: 0.9 });

  bins.flush(scene);
}
