// World change W07 (E20, row 34 Forty-Seven Wrenches): Side-Valve party bunting. Turns on when the party quest is done, off
// again when W08 (seized) hides it (rules: ../registry.ts). Side-Valve block centre (-150, 90); the bay door (a quest walk-in,
// stage 'side-valve-bay') is at (-150, 72) and the shopfront wall is at about z = 77. The same props stand in the party
// scenes (cutscene/scenes/story/m34-forty-seven-wrenches.ts): keep the spots in step. Props are >= 3 m from the stage
// marks, and the two bunting spans keep their poles off the approach (x = -150) and the exit (x = -146) paths. No colliders.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { coastSign } from '../../coast/sign';
import { registerWorldChange, type WorldChangeCtx } from '../registry';

/** The bunting span prefab is 15.2 m between its poles. */
const SPAN_W = 15.2;

function put(ctx: WorldChangeCtx, root: THREE.Group, g: THREE.Object3D, x: number, z: number, yaw = 0, s = 1, dy = 0): THREE.Object3D {
  g.position.set(x, ctx.groundY(x, z) + dy, z);
  g.rotation.y = yaw;
  g.scale.setScalar(s);
  root.add(g);
  return g;
}

registerWorldChange('W07', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W07';

  // Two bunting spans: along the bay front (poles at x -155 and -145) and across the apron (poles at x -157 and -143.5).
  put(ctx, root, buildPrefab('bunting-span'), -150, 75.6, 0, 10 / SPAN_W);
  put(ctx, root, buildPrefab('bunting-span'), -150.25, 64.4, 0, 13.5 / SPAN_W);

  // The poster on the bay front (board facing the apron, south): the Green is rezoned, with thanks for the wrenches.
  const poster = coastSign('THE GREEN IS REZONED.\nFORTY-SEVEN WRENCHES, THANK YOU.', { w: 4.6, h: 1.1, bg: 0xf2ead8, fg: 0x2f6a2a });
  put(ctx, root, poster, -150, 76.7, Math.PI, 1, 2.6);

  // A table at the east end with two pie tins, and a sandwich board, as in the party scene.
  put(ctx, root, buildPrefab('table'), -140, 76);
  put(ctx, root, buildPrefab('pie-tin'), -140.3, 76, 0.4, 1, 0.78);
  put(ctx, root, buildPrefab('pie-tin'), -139.6, 76.2, -0.6, 1, 0.78);
  put(ctx, root, buildPrefab('sandwich-board'), -137.5, 75, Math.PI, 1);

  return { root };
});
