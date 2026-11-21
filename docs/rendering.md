# Rendering: keeping surfaces from z-fighting

Read this before laying anything flat on the ground or on another surface in a three.js game (roads, pads, rugs, doormats, water, markers, decals), or before building a model out of boxes that touch.

## What goes wrong

When two surfaces overlap in (nearly) the same plane, the depth buffer cannot tell which is in front. The GPU picks either one, per pixel and per frame, so they flicker through each other in stripes or speckles. That is **z-fighting**. It shows up as:

- two ground layers at the same height swapping (a road and a pad, a field and a biome tint);
- a box's face flush with another box's face: a bar through a post of the same depth, a trim whose top is level with the wall top, a column flush with a roof;
- something lifted 5 mm above the ground that looks fine up close and flickers 100 m away.

The last one is why a small lift is not a fix. Depth precision falls with the square of the distance. With the usual camera (`near` 0.1, 24-bit depth) one depth step is about 0.25 mm at 20 m, 2 mm at 60 m and 5 cm at 300 m. A 5 mm lift holds to about 90 m and fails beyond. Rule of thumb: a gap of `g` metres holds out to about `sqrt(g × near × 16 700 000)` metres.

## The rules

1. **Flat on flat: use a draw layer.** Anything lying flat on the ground, or on another flat thing, takes a layer from `@lawn/depth`:

   ```ts
   import { LAYER, flatLayer } from '@lawn/depth';
   const pad = new THREE.Mesh(geo, flatLayer(new THREE.MeshStandardMaterial({ color }), LAYER.area));
   ```

   `flatLayer` sets a polygon offset of one depth step per layer. Unlike a lift, that holds at every distance. The ladder, low to high: `ground` 0, `tint` 1 (biome wedges, fields), `area` 2 (plazas, pads, aprons, ponds), `road` 3, `edge` 4 (sidewalks), `marking` 5 (lines, painted rings), `decal` 6 (stains, mats), `marker` 7 (quest rings, telegraphs). Something that sits on a layer goes one layer up (`LAYER.area + 1` is fine).

2. **One material per layer.** `flatLayer` changes the material in place. A material shared with something on another layer moves that too. Games that cache one material per colour should cache per colour and layer (see `lambert()` in Gnomomia's `dressing.ts`).

3. **Lifts follow the layers.** You may still lift a layer a little (for shadows or shading), but never lift a lower layer above a higher one. A pad lifted 2.5 cm sits above a road lifted 2 cm. If the road has the higher layer, the two disagree: the pad wins up close, the road wins far off, and in between they flicker.

4. **Low solids on layered ground get a layer too.** A layer pulls its surface a few depth steps toward the camera, and that pull is several cm at range. So a box only 3 cm tall (a canal bed, a flat pad) standing on a tinted ground can sink into it far off. Give it a layer above the ground's, or make it taller.

5. **Boxes that touch must not share a face.** When one part passes through or rests against another, make it clearly thinner, or stand it clearly proud: a few cm, not 1 cm. Bars 0.18 deep through 0.3 posts, not 0.3 through 0.3. A trim's top 3 cm over the wall's, not flush. Column tops 15 cm over the roof.

6. **Markers too.** Transparent ground rings (`depthWrite: false`) still depth-test against the ground. Put them on `LAYER.marker`, or a road with a higher offset buries them at range.

Last resort, for overlaps that are hidden on purpose: `mesh.userData.zfightOk = true` makes the audit skip a mesh. Say why in a comment.

## Check a scene: `npm run zfight`

```sh
npm run dev -w games/<name>                                     # terminal 1
npm run zfight -- "http://localhost:<port>/?<params to skip menus>"   # terminal 2
```

`tools/zfight.mjs` loads the page in headless Chrome or Edge and hooks three.js's renderer, with no game changes. It takes the biggest scene drawn with a perspective camera, and finds every pair of visible faces that are parallel, overlap and are no more than 5 cm apart. From the camera's near and far planes it works out the distance where each pair starts to flicker. It reports the ones that flicker before the fog ends (or the far plane), and only if they are at least 4 px on screen there. Exit code 1 when anything is found, `ZFIGHT OK` when not.

```
  flickers beyond ~92 m (gap 0.005 m, offset 0 steps, 0.79 m)
    A Mesh < Scene #3a3d42  @ 361.54, 0.06, -11.54
    B Mesh < Scene #f2c230  @ 360.19, 0.06, -10.86
```

Each pair gives the two meshes (names up the tree, then the material colour; grep the colour to find the code), a world position on each, the gap, and the offset difference in depth steps. `gets buried` means a layer on the surface behind outweighs the gap, so beyond that distance the surface in front disappears. `copies` counts the same pair repeated (one per sign, house, ...).

- Only what is built at that moment is checked. Games that stream chunks or build zones on demand need one run per place: use the game's URL params (Gnomomia: `?zone=<id>&offline=1`, a house is `?zone=<zone>/h<n>`; Gnome Theft Auto: `?offline`).
- Options: `--wait <ms>` (default 8000) before scanning, `--min-px <n>` (default 4), `--all` to include pairs of the same colour and texture (they flicker invisibly), `--json`.
- Moving things are checked where they are at that instant. Two traffic mowers driving through each other show up as a pair: that is a collision issue, not a rendering one.
- In code or a test: `auditCoplanar(scene, { near, far })` from `@lawn/depth` returns the same findings.

Run it after adding scenery to a 3D game. It reads the whole scene, so it also finds what an existing prefab or another module brought in.

## Other levers, and why they are not the default

- **Raising the camera's `near`** sharpens depth everywhere (0.1 to 0.3 is 3x). It helps, but the camera then clips into walls it gets close to. Fine for cameras that never get close to anything.
- **`logarithmicDepthBuffer: true`** on the renderer fixes precision at any range. But it writes depth from the fragment shader: that disables early depth testing (costly on phones), and polygon offset stops working, so the layer ladder breaks. Not used here.
- **`renderOrder` with `depthWrite: false`** for decals works for transparent overlays. But the decal then shows through anything in front that also skips depth writes, and it does nothing for opaque pairs.
