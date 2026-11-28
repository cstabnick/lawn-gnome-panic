// World changes W11, W15 (E18): the tube hut board, the Queen's flag, Carburettor pennants; coalition colours. Props only, no colliders.
// W11: Last Tube hut (150,1150) on the beach (src/coast/config.ts lastTube), the Bathtub Queen's mast (300,1268, deck -3),
//      Speedway start (727,-357) and Rutbottom start (1124,-543). W15: Fort Sandpit gate (374,34, gap 10 m, wall 3 m)
//      and the Pebblewick water tower (720,176, 16 m).
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

const CARB = 0xff7a1a;
const CAPS = [0xd93636, 0x2f64c9, 0x2f8f4e, 0xe0b030, 0x8a4fc9, 0xe8e0cc];

registerWorldChange('W11', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W11';
  const put = placer(root, ctx);

  // Driftwood's hut already stands at (150,1150): the board and a stack of tubes go beside it, off the rack at z 1172.
  put(coastSign('TUBES:\nTHEY FLOAT', { w: 3.2, h: 1.3, bg: 0xf2ead8, fg: 0x1d4f8f, post: 1.2 }), 140, 1152, 0);
  const stack = [CARB, 0xe0b030, 0x2fa8a0];
  stack.forEach((c, i) => put(buildPrefab('tow-tube', { tint: c }), 136.5, 1152, 0.4 * i, 0.4 * i));
  put(buildPrefab('tow-tube', { tint: 0x2f64c9 }), 134.5, 1153.5, 0);

  // The crew's colours at the Bathtub Queen's masthead (ship at (300,1268), deck y -3, mast about 30 m).
  put(buildPrefab('team-banner', { tint: 0xc43a2a, scale: 0.6 }), 301.6, 1268, 0, -3 + 28);

  // Carburettor pennants: the Speedway start and the Rutbottom Dirt Bowl start, a pair each, trackside.
  for (const [x, z] of [[718, -372], [738, -372], [1118, -562], [1130, -562]] as const) {
    put(buildPrefab('team-banner', { tint: CARB, scale: 0.7 }), x, z, 0);
  }
  put(buildPrefab('bunting-span', { tint: CARB, trim: 0x1d1d1d }), 728, -380, Math.PI / 2);

  return { root };
});

registerWorldChange('W15', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W15';
  const put = placer(root, ctx);

  // Patchwork over the gate arch: a row of small flags in each cap colour along the wall top (wall 3 m, gap x 369..379).
  CAPS.forEach((c, i) => {
    put(buildPrefab('team-banner', { tint: c, scale: 0.35 }), 366.5 + i * 3, 34, 0, 3);
  });
  put(buildPrefab('bunting-span', { tint: 0xe0b030, trim: 0xf2ead8 }), 374, 34, 0, 3.4);

  // Two friendly Spade Guard stand-ins by the gate, off the road and 3 m+ clear of the stage marks.
  const guards: THREE.Object3D[] = [];
  for (const [x, hat, flagTint] of [[361, 0x2f8f4e, 0xd93636], [387, 0xe0b030, 0x2f64c9]] as const) {
    const g = createGnomeModel({ ...GNORMAN_LOOK, hat, shirt: 0x3d5a2a }).object;
    put(g, x, 38, Math.PI);
    const flag = buildPrefab('team-banner', { tint: flagTint, scale: 0.2 });
    flag.position.set(0.4, 0.9, 0.1);
    g.add(flag);
    guards.push(g);
  }

  // A small coalition pennant on the Pebblewick water tower (720,176, tank top about 16 m).
  put(buildPrefab('team-banner', { tint: 0xe0b030, scale: 0.4 }), 720, 176, 0, 16);

  const base = guards.map((g) => g.position.y);
  return {
    root,
    update(_dt, t) {
      guards.forEach((g, i) => { g.position.y = base[i] + Math.abs(Math.sin(t * 2 + i * 1.7)) * 0.08; });
    },
  };
});
