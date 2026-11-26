// World changes W02, W18, W05 (E18): the Even-Estates hoardings, the show-homes, the Double Pot tops out.
// E16 (src/country/estates.ts) already builds the hoardings, gates, crane and identical show-homes on every site and
// they are always on, so W02 only adds signs and gate workers, W18 adds a neat lawn per show-home, and W05 dresses the
// Double Pot and the Patio Gate. Rules: ../registry.ts. No crane is a separate named object on the Double Pot: skipped.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { createGnomeModel, type GnomeLook } from '@lawn/gnome';
import { coastSign } from '../../coast/sign';
import { EVEN_ESTATES, type EstateSite } from '../../country/types';
import { MEGA_BLOCK } from '../../city/megaBlock';
import { registerWorldChange, type WorldChangeCtx } from '../registry';

const BEIGE = 0xd9c8a5;
const PALE_BLUE = 0x9cc3e0;
const CREAM = 0xfaf3e0;
const INK = 0x2b2116;

const BASE: GnomeLook = {
  hat: 0xd93636, shirt: 0x3b6ea5, pants: 0x2c3e50, skin: 0xf1c27d, boots: 0x222222, beard: 0xdddddd,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

/** A static ambient gnome standing at (x, z) turned to yaw (0 = facing +z). */
function standGnome(root: THREE.Group, ctx: WorldChangeCtx, x: number, z: number, yaw: number, look: Partial<GnomeLook>): THREE.Group {
  const m = createGnomeModel({ ...BASE, ...look });
  m.object.position.set(x, ctx.groundY(x, z), z);
  m.object.rotation.y = yaw;
  m.object.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  root.add(m.object);
  return m.object;
}

/** A sign placed at (x, z) on the ground (raised y0), turned to yaw. */
function placeSign(root: THREE.Group, ctx: WorldChangeCtx, text: string, x: number, z: number, yaw: number, y0: number, opts: Parameters<typeof coastSign>[1]): THREE.Group {
  const s = coastSign(text, opts);
  s.position.set(x, ctx.groundY(x, z) + y0, z);
  s.rotation.y = yaw;
  root.add(s);
  return s;
}

/** The way out of a site through its gate (unit, world) and the lateral axis E16's own sign uses ("+along"). */
function gateFrame(s: EstateSite): { ox: number; oz: number; lx: number; lz: number } {
  const alongX = Math.abs(s.gate.z - s.z) > Math.abs(s.gate.x - s.x); // gate on a z side: sides run along world x
  const ox = alongX ? 0 : Math.sign(s.gate.x - s.x), oz = alongX ? Math.sign(s.gate.z - s.z) : 0;
  return { ox, oz, lx: alongX ? 1 : 0, lz: alongX ? 0 : 1 };
}

// W02: the Levelright hoardings carry the Even-Estates slogan; a worker with a clipboard stands at each gate.
registerWorldChange('W02', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W02';
  const workers: THREE.Group[] = [];
  for (const s of EVEN_ESTATES) {
    const f = gateFrame(s);
    const g = s.gate;
    // Slogan board 5 m outside the gate, 4 m to the side that E16's own gate sign (COMING SOON) does not use.
    const sx = g.x + f.ox * 5 - f.lx * 4, sz = g.z + f.oz * 5 - f.lz * 4;
    placeSign(root, ctx, 'THORNE EVEN-ESTATES:\nA HEIGHT FOR EVERYONE', sx, sz, Math.atan2(f.ox, f.oz), 0,
      { w: 3, h: 1.4, bg: PALE_BLUE, fg: CREAM, post: 1.2 });
    // The gate worker: just outside, 3.4 m along the gate line from the gap's centre (the 8 m gap and gate lane stay clear).
    const wx = g.x + f.ox * 1.5 + f.lx * 3.4, wz = g.z + f.oz * 1.5 + f.lz * 3.4;
    const yaw = Math.atan2(f.ox, f.oz);
    workers.push(standGnome(root, ctx, wx, wz, yaw, { hat: 0xf2d33a, shirt: 0xe8731c, pants: BEIGE, beard: null }));
    // The clipboard: a small board held in front of the worker.
    placeSign(root, ctx, 'ALL PLOTS\nSAME', wx + f.ox * 0.45, wz + f.oz * 0.45, yaw, 0.55, { w: 0.34, h: 0.42, bg: CREAM, fg: INK });
  }
  return {
    root,
    update(_dt, t) { workers.forEach((w, i) => { w.rotation.z = Math.sin(t * 1.6 + i) * 0.02; }); },
  };
});

// W18: three identical show-homes stand behind the boards (E16 builds them); each gets a neat lawn and the sign says so.
registerWorldChange('W18', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W18';
  const lawnMat = flatLayer(new THREE.MeshLambertMaterial({ color: 0x6fae48 }), LAYER.decal);
  for (const s of EVEN_ESTATES) {
    for (const h of s.homes) {
      // A 6 x 4 m lawn in front of the door (the door faces along the home's yaw), 3.6..7.6 m out.
      const c = Math.cos(h.yaw), sn = Math.sin(h.yaw);
      const lx = h.x + sn * 5.6, lz = h.z + c * 5.6;
      const lawn = new THREE.Group();
      lawn.position.set(lx, ctx.groundY(lx, lz) + 0.03, lz);
      lawn.rotation.y = h.yaw;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), lawnMat);
      m.rotation.x = -Math.PI / 2;
      lawn.add(m);
      root.add(lawn);
    }
    const mid = s.homes[Math.floor(s.homes.length / 2)];
    const c = Math.cos(mid.yaw), sn = Math.sin(mid.yaw);
    placeSign(root, ctx, 'SHOW-HOMES\nSEE ONE, SEE THEM ALL', mid.x + sn * 8.4, mid.z + c * 8.4, mid.yaw, 0,
      { w: 2.2, h: 0.9, bg: BEIGE, fg: INK, post: 0.6 });
  }
  return { root };
});

// W05: the Double Pot tops out (banner down its south face, lit sales-floor windows) and a valet at the Patio Gate.
registerWorldChange('W05', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W05';
  const { west, east } = MEGA_BLOCK;
  const faceZ = west.maxZ + 0.35; // south face (z = -69), proud of the wall so it never shares its plane
  // The long vertical banner down the west half's face, y 4..20 (the tower is at least 12 m, usually 24+).
  const bw = 3, bh = 16;
  const bx = (west.minX + west.maxX) / 2;
  placeSign(root, ctx, 'EVEN\nIS\nBETTER', bx, faceZ, 0, 4, { w: bw, h: bh, bg: BEIGE, fg: INK });
  // Lit windows: rows of emissive panes across the sales floor (both halves' south faces, y 4..10), lit at night.
  const paneMat = new THREE.MeshStandardMaterial({ color: 0x3b3a30, emissive: 0xffe8a8, emissiveIntensity: 0, roughness: 0.4 });
  const paneGeo = new THREE.PlaneGeometry(1.4, 1.6);
  for (const half of [west, east]) {
    const cx = (half.minX + half.maxX) / 2;
    for (let col = -3; col <= 3; col++) {
      const x = cx + col * 5;
      if (half === west && Math.abs(x - bx) < bw / 2 + 1.2) continue; // behind the banner
      for (let row = 0; row < 3; row++) {
        const p = new THREE.Mesh(paneGeo, paneMat);
        p.position.set(x, ctx.groundY(x, faceZ) + 4.4 + row * 2.4, faceZ + 0.02);
        root.add(p);
      }
    }
  }
  // The valet at the Patio Gate (stage centre (150,-127); the z = -120 road is 10 m wide): on the pavement 6 m east of the gap.
  const vx = 156, vz = -126;
  standGnome(root, ctx, vx, vz, 0, { hat: BEIGE, shirt: BEIGE, pants: 0x5a3e2b, beard: null });
  placeSign(root, ctx, 'THORNE\nRESIDENTS', vx + 1.1, vz, 0, 0, { w: 1.1, h: 0.6, bg: CREAM, fg: INK, post: 0.7 });
  return {
    root,
    update() { paneMat.emissiveIntensity = 0.9 * ctx.night(); },
  };
});
