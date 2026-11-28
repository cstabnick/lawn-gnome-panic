// The Anthill Observatory and the mound (E13 issue A15a): the dome and its forecourt, Dean's Leap's signs and run-up,
// the ants' three doors with their story, vignettes on the mound, Professor Betony Sextant outside the dome, and the
// sounds of ants and the whirring dome. Stays off the run-up corridor and the landing area (OBSERVATORY in types.ts).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { getPrefab } from '@lawn/prefabs';
import { registerCull } from '../cull';
import { gnomeState, makeGnome } from '../gnomes';
import { homeOf, registerHome } from '../homes/data';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import type { JobsDeps } from '../jobs/types';
import { playAt } from '../sound/bus';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { setTelescopeClock } from './observatoryInterior';
import { OBSERVATORY, type RootwellPart } from './types';

const { dome, door, summit } = OBSERVATORY;
const PLATE_BG = 0xf2e8c8;
const ANT_RED = 0x8a3b2a;

/** How far a prefab reaches along its own front (+z), metres at scale s (1 m while it is not in the catalogue). */
function front(id: string, s = 1): number {
  return getPrefab(id) ? prefabBox(id).max.z * s : 1;
}

/** A plate on a piece's front face, `lateral` metres to its right, `y` above the ground at the piece. */
function plateOn(p: HomePiece, text: string, y: number, w: number, h: number, lateral = 0): THREE.Mesh {
  const d = front(p.prefab, p.scale ?? 1) + 0.05;
  const sn = Math.sin(p.yaw), cs = Math.cos(p.yaw);
  const x = p.x + sn * d + cs * lateral, z = p.z + cs * d - sn * lateral;
  return textPlate(text, x, heightAt(p.x, p.z) + y, z, p.yaw, { w, h, bg: PLATE_BG });
}

/** A flat decal strip along a polyline, following the ground. */
function strip(pts: [number, number][], width: number, color: number, name: string): THREE.Mesh {
  const pos: number[] = [];
  const idx: number[] = [];
  pts.forEach(([x, z], i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * width / 2, nz = (dx / l) * width / 2;
    for (const sgn of [-1, 1]) {
      const px = x + nx * sgn, pz = z + nz * sgn;
      pos.push(px, heightAt(px, pz) + 0.04, pz);
    }
    if (i > 0) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }), LAYER.decal);
  const mesh = new THREE.Mesh(g, m);
  mesh.name = name;
  return mesh;
}

/** A flat rectangle lying on the ground, tipped to the slope along its facing. */
function mat(x: number, z: number, yaw: number, w: number, d: number, color: number, name: string): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }), LAYER.decal),
  );
  const sn = Math.sin(yaw), cs = Math.cos(yaw);
  const rise = heightAt(x + sn * d / 2, z + cs * d / 2) - heightAt(x - sn * d / 2, z - cs * d / 2);
  m.rotation.order = 'YXZ';
  m.rotation.set(-Math.PI / 2 - Math.atan2(rise, d), yaw, 0);
  m.position.set(x, heightAt(x, z) + 0.05, z);
  m.name = name;
  return m;
}

/** A thin dark string pegged out in a straight line between two ground points, 0.3 m up. */
function stringLine(x0: number, z0: number, x1: number, z1: number): THREE.Mesh {
  const y0 = heightAt(x0, z0) + 0.3, y1 = heightAt(x1, z1) + 0.3;
  const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, len), new THREE.MeshLambertMaterial({ color: 0x1c1c1c }));
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.rotation.order = 'YXZ';
  m.rotation.y = Math.atan2(x1 - x0, z1 - z0);
  m.rotation.x = -Math.atan2(y1 - y0, Math.hypot(x1 - x0, z1 - z0));
  m.name = 'survey-string';
  return m;
}

/** The dome's walls as colliders: four sides, the west one split to leave the door open. */
function domeWalls(): Box[] {
  const r = dome.r - 0.5, t = 1.5;
  const top = Math.max(heightAt(dome.x, dome.z), heightAt(door.x, door.z)) + 7;
  const x0 = dome.x - r, x1 = dome.x + r, z0 = dome.z - r, z1 = dome.z + r;
  return [
    { minX: x0, maxX: x1, minZ: z0, maxZ: z0 + t, h: top },
    { minX: x0, maxX: x1, minZ: z1 - t, maxZ: z1, h: top },
    { minX: x1 - t, maxX: x1, minZ: z0, maxZ: z1, h: top },
    { minX: x0, maxX: x0 + t, minZ: z0, maxZ: dome.z - 2, h: top },
    { minX: x0, maxX: x0 + t, minZ: dome.z + 2, maxZ: z1, h: top },
  ];
}

/** Ants walking up to a door (yaw faces out): `n` in a line, one line in (carrying) and one out. */
function antLines(pieces: HomePiece[], d: { x: number; z: number; yaw: number }, n: number): void {
  const sn = Math.sin(d.yaw), cs = Math.cos(d.yaw);
  for (const [side, inward] of [[-0.7, true], [0.7, false]] as const) {
    for (let i = 0; i < n; i++) {
      const out = 1.6 + i * 1.1 + (i % 3) * 0.15;
      const lat = side + Math.sin(i * 1.7 + (inward ? 0 : 2)) * 0.25;
      pieces.push({
        prefab: 'rootwell-ant', x: d.x + sn * out + cs * lat, z: d.z + cs * out - sn * lat,
        yaw: inward ? d.yaw + Math.PI + Math.sin(i) * 0.15 : d.yaw + Math.sin(i) * 0.15, solid: false,
      });
    }
  }
}

/** The dome, the summit and mound dressing, the ants' doors, Dean's Leap signs. */
export function buildObservatory(scene: THREE.Scene, boxes: Box[]): void {
  const story = new THREE.Group();
  story.name = 'anthill-story';
  const pieces: HomePiece[] = [];
  const add = (p: HomePiece): HomePiece => { pieces.push(p); return p; };

  // The dome: its own walls (the prefab's square box would close the door), so the prefab itself is not solid.
  add({ prefab: 'anthill-observatory', x: dome.x, z: dome.z, yaw: -Math.PI / 2, solid: false });
  boxes.push(...domeWalls());

  // The forecourt: benches on the south-east rim, a lookout telescope on the west rim, lamps, the road-end sign.
  add({ prefab: 'park-bench', x: 1267, z: 172, yaw: 0.8, solid: false });
  add({ prefab: 'park-bench', x: 1259, z: 180, yaw: 0.4, solid: false });
  add({ prefab: 'gsr-telescope-stand', x: 1222, z: 152, yaw: -2.76, solid: false });
  for (const [x, z] of [[1250, 146], [1270, 148], [1271, 164], [1248, 172]]) {
    add({ prefab: 'garden-lamp-post', x, z, yaw: 0, solid: false });
  }
  const entry = add({ prefab: 'signpost', x: 1231, z: 184, yaw: 0.2, solid: false });
  story.add(plateOn(entry, 'THE ANTHILL OBSERVATORY\nPLEASE WIPE YOUR FEET\n(THE ANTS LIVE BELOW)', 1.5, 1.3, 0.55));

  // Dean's Leap: the sign at the run-up start, cones lining its edges, the post beside the lip.
  const leap = add({ prefab: 'signpost', x: 1245, z: 184, yaw: 0, solid: false });
  story.add(plateOn(leap, "DEAN'S LEAP\nNOT A SHORTCUT", 1.5, 1.0, 0.45));
  for (let z = 140; z <= 178; z += 8) {
    for (const x of [1233, 1243]) add({ prefab: 'site-cone', x, z, yaw: 0, solid: false });
  }
  const lip = add({ prefab: 'signpost', x: 1246, z: 120, yaw: 0, solid: false });
  story.add(plateOn(lip, 'THIS WAY DOWN', 1.4, 0.8, 0.3));

  // The ants' doors, stood into the slope, with their stories.
  const [north, east, south] = OBSERVATORY.antDoors;
  for (const d of OBSERVATORY.antDoors) {
    add({ prefab: 'ant-door', x: d.x, z: d.z, yaw: d.yaw, y: -0.4 });
    antLines(pieces, d, 10);
  }
  // North (the main door, shut): an invoice nailed to a post, unpaid notices on the ground.
  {
    const sn = Math.sin(north.yaw), cs = Math.cos(north.yaw);
    const post = add({ prefab: 'signpost', x: north.x + cs * 2.2 + sn * 0.6, z: north.z - sn * 2.2 + cs * 0.6, yaw: north.yaw, solid: false });
    story.add(plateOn(post, 'SUGAR RENT\nOVERDUE\n(AGAIN)', 1.4, 0.8, 0.5));
    for (let i = 0; i < 6; i++) {
      add({
        prefab: 'essay-page', x: north.x + sn * (1.0 + (i % 3) * 0.35) + cs * (i - 2.5) * 0.28,
        z: north.z + cs * (1.0 + (i % 3) * 0.35) - sn * (i - 2.5) * 0.28, yaw: i * 1.1, solid: false,
      });
    }
  }
  // East: an empty sugar crate, upside down.
  {
    const sn = Math.sin(east.yaw), cs = Math.cos(east.yaw);
    add({
      prefab: 'sugar-cube-crate', x: east.x + sn * 1.3 + cs * 1.2, z: east.z + cs * 1.3 - sn * 1.2,
      yaw: east.yaw + 0.3, solid: false, y: 0.3,
    });
  }
  // South: a doormat and a sack waiting to be returned.
  {
    const sn = Math.sin(south.yaw), cs = Math.cos(south.yaw);
    story.add(mat(south.x + sn * 1.6, south.z + cs * 1.6, south.yaw, 1.6, 0.9, ANT_RED, 'ant-doormat'));
    const sack = add({ prefab: 'sugar-sack', x: south.x + sn * 2.2 + cs * 1.6, z: south.z + cs * 2.2 - sn * 1.6, yaw: south.yaw + 0.4, solid: false });
    story.add(plateOn(sack, 'RETURN TO SENDER', 0.5, 0.45, 0.16));
  }

  // Vignette 1: a landing that went wrong, east of the landing area.
  story.add(strip([[1266, 98], [1268, 90], [1272, 82], [1281, 76]], 0.22, 0x1d1d1d, 'skid-a'));
  story.add(strip([[1267.2, 99], [1269.5, 91], [1273.8, 83], [1282.3, 77.2]], 0.22, 0x1d1d1d, 'skid-b'));
  const landing = add({ prefab: 'signpost', x: 1269, z: 74, yaw: 0, solid: false });
  story.add(plateOn(landing, 'LANDING: OPTIONAL', 1.4, 0.8, 0.3));

  // Vignette 2: Sextant's night kit on the summit's south side: a deck chair, a mug, star charts under stones.
  add({ prefab: 'bench', x: 1226, z: 172, yaw: Math.PI, solid: false });
  add({ prefab: 'cocoa-mug', x: 1228.2, z: 172.4, yaw: 0.5, solid: false });
  for (let i = 0; i < 3; i++) {
    add({ prefab: 'essay-page', x: 1224.5 + i * 0.7, z: 169.4 + (i % 2) * 0.3, yaw: 0.2 + i * 0.5, solid: false });
    add({ prefab: 'garden-rock', x: 1224.5 + i * 0.7 + 0.2, z: 169.4 + (i % 2) * 0.3, yaw: i, scale: 0.12, solid: false });
  }

  // Vignette 3: the survey the HOA took: a post, a board, a string pegged out dead straight.
  const survey = add({ prefab: 'signpost', x: 1224, z: 135, yaw: Math.PI, solid: false });
  add({ prefab: 'chalk-equation-board', x: 1226.5, z: 137, yaw: Math.PI, solid: false });
  story.add(plateOn(survey, 'LEVEL LINE:\nNEARLY', 1.0, 0.7, 0.3));
  story.add(stringLine(1224, 135, 1214.5, 131.5));

  boxes.push(...buildPieces(scene, pieces, 'anthill'));
  scene.add(story);

  // Sextant lives in the observatory.
  const home = homeOf('betony');
  if (home) registerHome({ ...home, door: [door.x, door.z, door.yaw] });
}

/** Professor Sextant, the ants, sounds. */
export function installObservatory(deps: JobsDeps): RootwellPart {
  setTelescopeClock(() => deps.timeLabel());
  const sextant = makeGnome(deps.scene, {
    hat: 0x2b3f7a, shirt: 0x3b4a6b, pants: 0x2f2f3a, skin: 0xe0ac69, boots: 0x222222, beard: 0xd8d8d8, hair: null,
    freckles: false, dress: false, glasses: true, bowlCut: null,
  });
  sextant.object.name = 'anthill-sextant';
  const sx = door.x - 3.5, sz = door.z + 3.5;
  sextant.object.position.set(sx, heightAt(sx, sz), sz);
  registerCull(sextant.object, 'gnome', { moves: true });
  const home = Math.atan2(-1, -0.4); // towards the sky over the campus, north-west
  let antIn = 5, whirrIn = 12;
  return {
    update(dt, t) {
      const p = deps.player;
      if (Math.hypot(p.x - summit.x, p.z - summit.z) < 250) {
        const dx = p.x - sx, dz = p.z - sz;
        const close = Math.hypot(dx, dz) < 6;
        const yaw = close ? Math.atan2(dx, dz) : home;
        sextant.object.rotation.y = yaw;
        sextant.update(gnomeState(sx, heightAt(sx, sz), sz, yaw, 0), dt);
        // Every 8 s she points at the sky for a moment (arms animate in update(), so pose after it).
        if (!close && t % 8 < 1.6) sextant.arms.right.rotation.x = -2.6 + Math.sin(t * 6) * 0.1;
      }
      antIn -= dt;
      if (antIn <= 0) {
        antIn = 5 + Math.random() * 4;
        for (const d of OBSERVATORY.antDoors) {
          if (Math.hypot(p.x - d.x, p.z - d.z) < 25) { playAt('ant-skitter', d, { bus: 'ambience' }); break; }
        }
      }
      whirrIn -= dt;
      if (whirrIn <= 0) {
        whirrIn = 20 + Math.random() * 10;
        if (Math.hypot(p.x - dome.x, p.z - dome.z) < 45) playAt('telescope-whirr', dome, { bus: 'ambience' });
      }
    },
  };
}
