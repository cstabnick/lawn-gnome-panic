// World change W19 (E22): Cam's epilogue line, set by row 62's choice (m62-cams-cell: 'A' freed, 'B' left for the Watch)
// and shown after the finale. Freed: Turncoat Cam sweeps a path on Founders' Green, a little pile of leaves in front of
// him and his own bench behind. Left: his broom leans on that bench alone, a single leaf on the seat. Props only, no
// colliders. Founders' Green is the park block x -55..-5, z 5..55 (W03's crowd and bandstand stand at its west and south
// edges); this sits in its north-east corner, off the paths.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { registerWorldChange } from '../registry';

/** Cam's colours (cutscene/cast.ts 'turncoat cam'). */
const CAM = { hat: 0xf4f4f8, shirt: 0xc9b99b };
const BENCH = { x: -11, z: 14, yaw: Math.PI };

registerWorldChange('W19', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W19';
  const put = (o: THREE.Object3D, x: number, z: number, yaw = 0, y = 0): THREE.Object3D => {
    o.position.set(x, ctx.groundY(x, z) + y, z);
    o.rotation.y = yaw;
    root.add(o);
    return o;
  };

  put(buildPrefab('park-bench'), BENCH.x, BENCH.z, BENCH.yaw);
  const freed = (ctx.choiceOf?.('m62-cams-cell') ?? 'A') === 'A';
  if (!freed) {
    // Gone: the broom against the bench, a leaf on the seat. Nobody sweeps.
    const broom = put(buildPrefab('broom'), BENCH.x + 0.9, BENCH.z + 0.35, 0.2);
    broom.rotation.z = 0.32;
    put(buildPrefab('gutter-leaf-pile', { scale: 0.25 }), BENCH.x - 0.3, BENCH.z, 0, 0.45);
    return { root };
  }

  // Freed: Cam two metres in front of the bench, broom in hand, a swept stripe behind him and a leaf pile ahead.
  const cam = createGnomeModel({ ...GNORMAN_LOOK, ...CAM }).object;
  put(cam, BENCH.x - 2, BENCH.z + 3, -Math.PI / 2);
  const broom = buildPrefab('broom');
  broom.position.set(0.35, 0.25, 0.25);
  broom.rotation.z = -0.5;
  cam.add(broom);
  put(buildPrefab('gutter-leaf-pile', { scale: 0.6 }), BENCH.x - 4.2, BENCH.z + 3, 0);
  const baseY = cam.position.y;
  return {
    root,
    // A slow sweep: the broom swings, Cam bobs with it.
    update(_dt, t) {
      broom.rotation.z = -0.5 + Math.sin(t * 2.4) * 0.35;
      cam.position.y = baseY + Math.abs(Math.sin(t * 2.4)) * 0.03;
    },
  };
});
