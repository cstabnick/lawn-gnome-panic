// World changes W03, W04 (E18): Founders' Green opens; Granny's barn is open again. Props only, no colliders.
// W03: downtown park block Gnorwin Statue Park (-30,30), block x -55..-5, z 5..55 (Drainpipe Court is x -110..-70, 16..44).
// W04: Granny's yard (stage 'granny-barn', centre (-45,335)) and the Route South welcome arch (0,225).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { coastSign } from '../../coast/sign';
import { registerWorldChange, type WorldChangeCtx } from '../registry';

type Put = (o: THREE.Object3D, x: number, z: number, yaw?: number, y?: number) => THREE.Object3D;

function placer(root: THREE.Group, ctx: WorldChangeCtx): Put {
  return (o, x, z, yaw = 0, y = 0) => {
    o.position.set(x, ctx.groundY(x, z) + y, z);
    o.rotation.y = yaw;
    root.add(o);
    return o;
  };
}

function gnome(hat: number, shirt: number): THREE.Object3D {
  return createGnomeModel({ ...GNORMAN_LOOK, hat, shirt }).object;
}

registerWorldChange('W03', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W03';
  const put = placer(root, ctx);

  // The cut ribbon: two red-cloth stakes at the park's south entrance (z 53), a gap between them.
  put(buildPrefab('dayg-story-quarantine-tape', { scale: 1.3 }), -34, 53, 0);
  put(buildPrefab('dayg-story-quarantine-tape', { scale: 1.3 }), -26, 53, Math.PI);

  // About eight gnomes with flags, in two loose rows behind the ribbon, facing it.
  const crowd: THREE.Object3D[] = [];
  const hats = [0xd93636, 0x2f64c9, 0x2f8f4e, 0xe0b030];
  for (let i = 0; i < 8; i++) {
    const x = -43 + (i % 4) * 5.2 + (i >= 4 ? 2.4 : 0);
    const z = i < 4 ? 49 : 46;
    const g = put(gnome(hats[i % 4], hats[(i + 1) % 4]), x, z, Math.PI);
    const flag = buildPrefab('pl-tour-flag', { scale: 0.45 });
    flag.position.set(0.35, 0, 0.15);
    g.add(flag);
    crowd.push(g);
  }

  // The bandstand and its brass trio, on the east side of the block.
  put(buildPrefab('bandstand'), -13, 20, Math.PI);
  for (const dx of [-1.2, 0, 1.2]) crowd.push(put(gnome(0xe0b030, 0x8a1c1c), -13 + dx, 20, 0, 0.8));

  // Green banner over the two repaved streets: x=-60 at z=52, and z=0 at x=-30 (poles stay off the 10 m roads).
  put(buildPrefab('bunting-span', { tint: 0x2f8f4e, trim: 0xf2ead8 }), -60, 52, 0);
  put(buildPrefab('bunting-span', { tint: 0x2f8f4e, trim: 0xf2ead8 }), -30, 0, Math.PI / 2);
  put(coastSign("FOUNDERS' GREEN: OPEN", { w: 6, h: 1.1, bg: 0x2f8f4e, fg: 0xf2ead8 }), -60, 52, 0, 3.2);

  // Idle bob so the crowd is not a waxwork.
  const base = crowd.map((c) => c.position.y);
  return {
    root,
    update(_dt, t) {
      crowd.forEach((c, i) => { c.position.y = base[i] + Math.max(0, Math.sin(t * 2 + i)) * 0.04; });
    },
  };
});

registerWorldChange('W04', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W04';
  const put = placer(root, ctx);

  // Torn foreclosure notices: bare stakes along the lane, a paper scrap on each.
  for (const [x, z, yaw] of [[-18, 318, 0.4], [-14, 346, -0.3], [-30, 356, 0.1], [-6, 330, 0.8]] as const) {
    put(buildPrefab('dayg-story-quarantine-tape', { scale: 0.8, tint: 0x6b4a2f }), x, z, yaw);
    put(buildPrefab('wanted-poster', { scale: 0.35 }), x + 0.15, z, yaw, 0.55);
  }

  // Fresh red tin roof: two corrugated panels leaned into an A over the north end of the yard.
  const red = new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.6, metalness: 0.3 });
  for (const s of [-1, 1]) {
    const panel = buildPrefab('corrugated-fence', { scale: 1.5 });
    panel.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = red; });
    const holder = new THREE.Group();
    panel.rotation.x = s * 0.9;
    panel.position.set(0, 2.2, s * 1.2);
    holder.add(panel);
    put(holder, -50, 306, 0);
  }

  // Hand-painted board on the gate.
  put(coastSign("GNERTRUDE'S: OPEN", { w: 2.4, h: 0.9, bg: 0xf2ead8, fg: 0x8a1c1c, post: 1.1 }), -22, 322, Math.PI / 2);

  // Fence-Post Frank's new sign, beside the Route South welcome arch (0,225).
  put(coastSign('PIE, 3 MILES', { w: 2.2, h: 0.8, bg: 0xe0b030, fg: 0x5a2a12, post: 1.2 }), 13, 222, Math.PI);

  return { root };
});
