Epic: FX12 · Issue C: Pail Pond reads as a pail, and the ice has a village on it
Depends on: none
Model: Sonnet (dressing, taste)
Port: 5524

(Paste of `_env.md` goes here when launched.)

## Goal
G4#12: the ice disc (r 62, centred (-640, -1060)) is a vast empty plain, the "galvanized rim" is a dark grey 0.35 m
kerb that looks like concrete, and the handle cannot be seen from the shore. After this issue: the rim is a bright
light-zinc band about 1.0-1.3 m tall with vertical ribbing and a rolled lip, so from the band road (z ~-958) the pond
reads as a giant pail sunk in the snow; the handle arc is big enough to clear the horizon from the road; the three
shanties cluster into a small village near Theo's, joined by a sled path of footprints, with a few marker flags and a
gnome or two on stools.

## Read first
- `src/winter/pond.ts` (all: `buildPailPond`, the rim segments ~line 89-107, the handle ~109-113, the shanties
  `SHANTY`/`blue`/`green` ~115-140, Theo, the signs, paw prints, `pawPrint` decal helper, the returned `update`).
- `src/winter/pond.test.ts` (colliders, the pond centre and the shanty front clear, 3 m round every pond bear).
- `src/winter/types.ts`: `PAIL_POND`, `SHANTY`, `ICE`, `SNOWCAP_BEARS` (read only; the bears stay where they are).
- `src/winter/hill.ts` for `makeGnome(parent, look)` + `gnomeState` (how Gentian is made) if you add seated gnomes.
- `packages/prefabs/src/catalog/gta-winter-lodge.ts` `pail-handle` (the handle prefab; you may only scale/place it,
  another worker edits this catalog file).

## Change
- `src/winter/pond.ts` (you own it):
  - Rim: light zinc (about 0xc9d1d6, metalness ~0.6, roughness ~0.35), 1.0-1.3 m above the snow on the outside,
    vertical ribs every ~2 m (thin boxes or a ribbed texture), a rolled lip (a torus or round bar along the top,
    `THREE.TorusGeometry` per segment or one big torus following the ground is fine). Keep it segment-built so it
    follows the ground. It is the pail itself (a landmark-scale terrain piece), so it stays a mesh in the game, not a
    prefab. The player must still get onto the ice: leave 3 crossings (one facing the band road on the south side,
    one by Theo's shanty, one towards the lodge to the east) with a short snow ramp or wooden steps (prefab
    `stairs`/`step` if one exists in `@lawn/prefabs` — grep `id: '` in `packages/prefabs/src/catalog/`; otherwise a
    gap in the rim with the rim ends rolled). The rim has no colliders unless the crossings stay open.
  - Handle: scale the `pail-handle` up (try `size` 22-28) and raise it so the arc stands clear of the far rim from the
    road at (-640, -955) looking north. It is not solid.
  - The village: move the blue and green shanties to within ~10-15 m of Theo's (`SHANTY` (-612, -1040) stays put: the
    quest and the fishing prompt use it), add a footprint path (the existing `pawPrint`-style flat decal with
    `flatLayer`, boot prints this time) linking them and running to the south crossing, 3-4 marker flags (prefab
    `slalom-flag` tinted orange, or `capture-flagpole` scaled) around the village, and one or two seated gnomes on
    stools (`stool` / `camp-stool` prefabs) jigging by a drilled hole decal. Keep 3 m clear round every bear in
    `SNOWCAP_BEARS` and the area right in front of Theo's door (pond.test).
- `src/winter/pond.test.ts`: keep it passing; add checks that the shanties are within 20 m of `SHANTY` and the rim's
  top is ≥ 1 m above the ground at a few rim points.

## Contract
`buildPailPond(scene): PailPondScenery` keeps its signature and returned fields (runtime.ts uses them).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files; `cd games/gnome-theft-auto && npx vitest
  run src/winter/pond.test.ts src/winter/iceFishing.test.ts` passes.
- Shots on port 5524 at 960x600 and `--size 390x844`: `pond` (-712,-1050,1.9), `fromRoad` (-640,-955,3.14),
  `pondMid` (-640,-1000,3.14), `shanty` (-600,-1020,3.14). Compare with the editor's `pond.png`, `pondMid.png`,
  `shanty.png`, `phonePond.png`: from the road it is clearly a pail of ice in snow, with life on it.
- `npm run zfight -- "http://localhost:5524/?at=-640,-1000,3.14"` reports nothing in your meshes (say so if it times out).

## Out of scope
The bears (another worker: `src/critters/snowcap.ts`), the terrain paint, types.ts, the prefab catalog.
