Epic: E07 step 1 · Issue 03 quest marker height (L48)
Depends on: none

Read `docs/roadmaps/gta-batch-3/E07/_env.md` first (environment, registry API, rules).

## Goal
Quest beams are much lower by default (about a third of today's height), with an option "Quest markers: Low / Tall"
under Map and markers that brings back today's 90 m giver beams and 40 m objective beams. Changing it updates beams
already in the world, live.

## Read first
- `games/gnome-theft-auto/src/viewPrefs.ts`: per-browser pref pattern.
- `games/gnome-theft-auto/src/quests/quests.ts` ~line 482-488: giver `beam` = `new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 90, 12, 1, true), ...)`,
  `beam.position.set(g.x, heightAt(g.x, g.z) + 45, g.z)`. (The star at +4, the badge at +2.7 and the ground ring stay.)
- `games/gnome-theft-auto/src/quests/objectivesAction.ts` ~line 27-35 `makeBeacon`: `CylinderGeometry(0.6, 0.6, 40, ...)`,
  `m.position.set(x, heightAt(x, z) + 20, z)`.
- `games/gnome-theft-auto/src/quests/objectivesCity.ts` ~line 66-75 and `objectivesTessie.ts` ~line 68-76: the same
  40 m beacon shape (read each; the ground height expression may differ).

## Change
- New `games/gnome-theft-auto/src/questMarkerPrefs.ts`:
  ```ts
  export type MarkerHeight = 'low' | 'tall';
  export const MARKER_SCALE: Record<MarkerHeight, number> = { low: 0.35, tall: 1 };
  export function getMarkerHeightPref(): MarkerHeight;          // default 'low', key 'gta.markerHeight'
  export function setMarkerHeightPref(h: MarkerHeight): void;   // writes, fires window event 'gta:marker-height', re-applies tracked beams
  /** The beam length for a beam whose full ("tall") length is `full` metres. */
  export function getMarkerHeight(full = 90): number;           // full * MARKER_SCALE[pref]
  /** Sizes `beam` (built with a cylinder of height `full`) to the current setting, standing on `groundY`, and keeps it
   *  updated when the setting changes (forgotten once the mesh has no parent after a change). */
  export function trackBeam(beam: THREE.Object3D, groundY: number, full: number): void;
  ```
  `trackBeam` sets `beam.scale.y = MARKER_SCALE[pref]` and `beam.position.y = groundY + getMarkerHeight(full) / 2`, and
  keeps `{beam, groundY, full}` in a Set that `setMarkerHeightPref` walks (drop entries whose `beam.parent === null`).
  Import three as `import type * as THREE from 'three'` (types only). At import time register a row with
  `registerOption`: section `'map'`, id `'marker-height'`, label `'Quest markers'`, kind `'cycle'`, values
  `[{ id: 'low', label: 'Low' }, { id: 'tall', label: 'Tall' }]`, desc `'How tall the beams over quest givers and
  objectives stand. Tall shows them from across town.'`, watch `'gta:marker-height'`. Guard storage/window for node.
- New `games/gnome-theft-auto/src/questMarkerPrefs.test.ts`: default low, `getMarkerHeight(90)` = 31.5 low / 90 tall,
  `trackBeam` on a plain `{ scale: { y: 1 }, position: { y: 0 }, parent: {} }` object updates scale and position on a
  setting change, and the row is registered (`getOption('marker-height')`).
- The four quest files: after each beam / beacon is created and positioned, call `trackBeam(mesh, groundY, 90)` (giver
  beam) or `trackBeam(mesh, groundY, 40)` (objective beacons), where `groundY` is the same ground height expression the
  code used. Keep the geometry as it is (the scale does the work). Nothing else changes.

## Contract
`getMarkerHeight(full?)`, `getMarkerHeightPref`, `setMarkerHeightPref`, `trackBeam`, event `'gta:marker-height'`, key
`gta.markerHeight`.

## Done when
- From games/gnome-theft-auto: `npx tsc --noEmit -p .` and `npx vitest run src/questMarkerPrefs.test.ts src/quests` pass
  (quest tests may be slow; if one times out under load, rerun that file alone).
- `git diff --stat`: one or two added lines per quest file.

## Out of scope
`src/options.ts`, `src/optionsRegistry.ts`, the star / badge / ring markers, every other file.
