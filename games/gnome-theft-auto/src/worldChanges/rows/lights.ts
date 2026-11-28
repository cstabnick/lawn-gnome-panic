// World changes W10, W12 (E18): the lights are steady (Capwood board, lodge lights, Gnomecino neon; the pinwheels already
// spin by themselves, so nothing is added at Pinwheel Ridge); the observatory dome is open (notice) and the Rootwell
// quad holds a protest. Rules: ../registry.ts.
import * as THREE from 'three';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { coastSign } from '../../coast/sign';
import { OBSERVATORY, CAMPUS } from '../../campus/types';
import { GNOMECINO } from '../../config';
import { anchorOf } from '../../sites';
import { registerWorldChange, type WorldChangeCtx } from '../registry';

/** Place a prefab (scaled) at a ground point, yaw in radians. */
function put(root: THREE.Group, ctx: WorldChangeCtx, id: string, x: number, z: number, yaw: number, scale = 1, lift = 0): THREE.Group {
  const o = buildPrefab(id);
  o.scale.setScalar(scale);
  o.position.set(x, ctx.groundY(x, z) + lift, z);
  o.rotation.y = yaw;
  root.add(o);
  return o;
}

/** Glowing materials of a prefab, with their full-strength intensity, so night can drive them. */
function glowers(o: THREE.Object3D, out: { m: THREE.MeshStandardMaterial; base: number }[]): void {
  const seen = new Set<THREE.Material>();
  o.traverse((c) => {
    const mesh = c as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const s = m as THREE.MeshStandardMaterial;
      if (seen.has(s) || !s.emissive || s.emissive.getHex() === 0 || s.emissiveIntensity <= 0) continue;
      seen.add(s);
      const mat = s.clone();
      mesh.material = mat;
      out.push({ m: mat, base: s.emissiveIntensity });
    }
  });
}

registerWorldChange('W10', (ctx) => {
  const root = new THREE.Group();
  const lit: { m: THREE.MeshStandardMaterial; base: number }[] = [];

  // Capwood Run start: a chalked board beside the start line (site rally-route start anchor), 5 m off to the side.
  const start = anchorOf('rally-route', 'start');
  const board = coastSign('WINNER: LULU', { w: 2.4, h: 1.1, bg: 0x2b3a30, fg: 0xf4f1e4, post: 1.0 });
  board.position.set(start.x + 7, ctx.groundY(start.x + 7, start.z), start.z + 2);
  board.rotation.y = start.yaw ?? 0;
  root.add(board);

  // Woolly Sock Lodge (-449,-1020, door +x, porch spots at x -437): a bunting span of lights on the north side, and
  // fairy lights along the west eave. All glow with the night.
  const bun = put(root, ctx, 'bunting-span', -449, -1036, 0);
  glowers(bun, lit);
  for (const z of [-1028, -1020, -1012]) glowers(put(root, ctx, 'glaze-extra-fairylights', -462, z, Math.PI / 2, 5, 1.5), lit);

  // The Gnomecino strip: neon over the south face of the block (z = block edge + 0.4), facing the z = 0 road.
  const faceZ = GNOMECINO.z + GNOMECINO.footprint / 2 + 0.4;
  for (const dx of [-9, 0, 9]) glowers(put(root, ctx, 'neon-sign', GNOMECINO.x + dx, faceZ, 0, 2, 4.5), lit);

  const apply = (): void => {
    const k = 0.35 + 0.65 * ctx.night();
    for (const g of lit) g.m.emissiveIntensity = g.base * k * 1.4;
  };
  apply();
  return { root, update: apply };
});

registerWorldChange('W12', (ctx) => {
  const root = new THREE.Group();
  const D = OBSERVATORY.door;

  // The shutter is baked into the observatory mesh (no named shutter object), so a notice goes by the door instead,
  // 3 m beside it and 5 m clear of the Dean's Leap run-up corridor (x 1234..1242).
  const nx = D.x - 1.5;
  const nz = D.z + 5;
  const notice = coastSign('OPEN TO THE SKY.\nEMPTY.', { w: 2.2, h: 1.1, bg: 0x1f2a44, fg: 0xf4f1e4, post: 1.0 });
  notice.position.set(nx, ctx.groundY(nx, nz), nz);
  notice.rotation.y = D.yaw;
  root.add(notice);

  // The protest: ten students on the Rootwell quad, in an arc facing the quad centre, each with a board on a pole.
  const slogans = ['THE LINE WAS NEVER LEVEL', 'KEEP OUR STARS'];
  const hats = [0xc43c3c, 0x3c6bc4, 0xe0b030, 0x3ca06b, 0x8a4cc4];
  const students: { obj: THREE.Object3D; y: number; phase: number }[] = [];
  const c = CAMPUS.quadCentre;
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * 0.9 + (i / 9) * Math.PI * 1.1;
    const x = c.x + Math.cos(a) * 15;
    const z = c.z + Math.sin(a) * 15;
    const face = Math.atan2(c.x - x, c.z - z); // face the quad centre
    const g = createGnomeModel({ ...GNORMAN_LOOK, hat: hats[i % hats.length], shirt: hats[(i + 2) % hats.length] });
    const y = ctx.groundY(x, z);
    g.object.position.set(x, y, z);
    g.object.rotation.y = face;
    root.add(g.object);
    students.push({ obj: g.object, y, phase: i * 0.7 });
    const sign = coastSign(slogans[i % 2], { w: 1.5, h: 0.9, bg: 0xf1e9cf, fg: 0x7a1d1d, post: 1.2 });
    sign.position.set(x + Math.cos(face) * 0.9, y, z - Math.sin(face) * 0.9);
    sign.rotation.y = face;
    root.add(sign);
  }
  return {
    root,
    update: (_dt, t) => {
      for (const s of students) s.obj.position.y = s.y + Math.max(0, Math.sin(t * 3 + s.phase)) * 0.06;
    },
  };
});
