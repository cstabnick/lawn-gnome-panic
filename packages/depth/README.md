# @lawn/depth

Keeps three.js surfaces from z-fighting (flickering through each other where they overlap in the same plane). The why and the rules: [docs/rendering.md](../../docs/rendering.md).

## Draw layers for flat things

```ts
import { LAYER, flatLayer } from '@lawn/depth';

const road = new THREE.Mesh(roadGeo, flatLayer(new THREE.MeshStandardMaterial({ map }), LAYER.road));
const ring = new THREE.Mesh(ringGeo, flatLayer(new THREE.MeshBasicMaterial({ color, transparent: true }), 'marker'));
```

`flatLayer(material, layer)` sets `polygonOffset` to one depth step per layer and returns the material. A higher layer wins over a lower one at any distance, with no lift needed. `LAYER`: `ground` 0, `tint` 1, `area` 2, `road` 3, `edge` 4, `marking` 5, `decal` 6, `marker` 7. The material is changed in place, so give each layer its own.

## Audit a scene

```ts
import { auditCoplanar } from '@lawn/depth';
const { findings } = auditCoplanar(scene, { near: camera.near, far: camera.far, fovDeg: camera.fov });
```

Each finding is a pair of meshes with overlapping parallel faces that will flicker inside the camera's range: where (`atA`, `atB`), how far apart (`gap`), the offset difference in depth steps, and the distance where it starts (`fightsBeyond`, 0 = always). `npm run zfight -- <url>` (`tools/zfight.mjs`) runs it against a live game in a headless browser.

`auditCoplanar` must stay self-contained (no imports, no module-level helpers): the tool sends its source text into the page. A test checks this.

Users: Gnome Theft Auto (ground, roads, pads, markers), Gnomes of Gnomomia (doormats, decks).
