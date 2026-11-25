# E17 common rules (every issue)

## Environment

- Working directory: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a623c03875f0149ee` (a git
  worktree on branch `epic/E17-societies`). Run every command from there. Use absolute paths.
- Shell: Git Bash. If `node`/`npm`/`npx` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, `git stash`, `git checkout` or `git reset`.
- Line endings: keep whatever a file already has (most files are LF; a few, e.g. `saveIO.ts`, `cloudSave.ts`, prefab
  `catalog/index.ts`, `packages/achievements/src/catalog.ts`, may be CRLF). New files are LF. Never rewrite a whole
  file just to change line endings. Prefer the Edit/Write tools over shell heredocs, `sed -i` or python rewrites.
- About 10 other workers are editing OTHER files of the same game at the same time. Edit only the files your issue
  names. If `npx tsc` reports an error in a file you do not own, ignore it (another worker is mid-edit) unless your
  change caused it.
- Do not start a dev server or a browser. Do not run `vite build` or `npm run build`.
- `src/layout.golden.test.ts` may fail while this epic runs (the lead regenerates it at the end). Never regenerate it.

## The game

`games/gnome-theft-auto` (three.js + TypeScript). World coordinates: metres, +x east, +z south (north is -z).
`yaw` is three.js `rotation.y`: 0 faces +z (south), `Math.PI` faces north, `Math.PI / 2` faces +x (east), `-Math.PI / 2`
faces west. A facing vector is `(sin yaw, cos yaw)`. The world builds once at start, and also in tests under node (no
DOM: never touch `document`/`window` at import time; guard with `typeof document !== 'undefined'`).

This epic adds three hidden communities. All places, ids, names and numbers are in
`games/gnome-theft-auto/src/societies/config.ts` (READ IT; never edit it, it is the lead's):

- **The Underspan** (`UNDERSPAN`, `WORKSHOP_ROOM`): radical, brilliant, slightly unhinged inventors living in the
  shade beside the Skyway's Unfinished Span, led by Hogweed Sprocket. They refuse permits on principle ("A rule is only
  a prototype nobody tested"), build anything for scrap, and keep getting HOA citations for "unauthorised verticality".
  Local 404 (the union that poured the Span) are their estranged cousins.
- **Wader's Rest** (`WADERS_REST`, `TENT_ROOM`): the Flock of the One Leg, a harmless, funny camp of a dozen gnomes who
  stand on one leg before the Standing Lady (a giant pink plastic lawn flamingo) and keep absurd, gentle rules: one leg
  at every sermon; no sitting on Tuesdays; pink is for the Lady only (so the camp's washing is grey); nobody turns
  their back on her to eat; a gnome who wobbles has "had a thought" and owes the Flock a cup of reed tea. Leader Mother
  Saxifrage Wader (slow, sing-song, ends lines with "so it is stood"). They are NOT the Evil Shadow Gnome Cultist of the
  Cursed House: no menace, no real-world religion, no violence. Funny first, a little ominous only in a prophecy
  ("the Even Cut, on the longest day").
- **Loamdeep** (`LOAMDEEP`, `BURROW_DOOR`, `MOLEMAN_BURROW`): the Burrowfolk, small, gentle, formal moles (velvet grey,
  pink noses, no hats) in tidy lamp-lit halls under the Burrow Door. Gnomes call them root-eaters and the Tall Ones blame
  them for every lump in a lawn; both are wrong (they eat grubs; the grubs eat the roots). They say "if it pleases you"
  and mean it. Cute, innocent, misunderstood. Six halls: the Mother's Hall (Old Mother Tumblesoil), Rootway Hall
  (roots stored and sorted), Lamplight Hall (lamp-oil and the keepers), Postern Hall (the post), Hearth Hall (grubs,
  bread and supper), Under-Chorus Hall (the humming floor where DJ Moleman's cable comes up). DJ Moleman is one of
  them by birth (a mole in no costume; the only hat in Loamdeep is the one on his antenna; host of 108.0 Subsoil Radio;
  says "seat" instead of "kick drum"); he lives apart in his own burrow and the family wishes he would visit.

Useful helpers (confirmed):
- `import { buildPrefab, getPrefab } from '@lawn/prefabs'`: `getPrefab(id)` is undefined for a missing id;
  `buildPrefab(id, { lights: false, scale?, tint?, trim? })` returns a `THREE.Group` (front faces +z, feet at y 0).
  New E17 prefabs are being made by other workers right now: ALWAYS guard with `getPrefab(id)` and skip a missing one
  (so your code works before and after they land).
- `import { buildStaticCells } from '../../cull'`: `buildStaticCells(placements, { name: 'my-batch' })` merges many
  static prefabs into culled batches and returns a `THREE.Group` to `scene.add`. A placement is
  `{ id, x, y, z, yaw?, scale?, tint?, trim? }` (y absolute). Unknown prefab ids are skipped. Use it for scenery (dozens
  of props); `buildPrefab` + `scene.add` only for a handful of special or animated pieces.
- `import { heightAt } from '../../terrain'`: ground height at (x, z).
- Colliders: `Box` from `../../types` is `{ minX, maxX, minZ, maxZ, h }` (axis-aligned, `h` = absolute top height).
  Push one per solid thing into the `boxes` array your builder receives. From a placed object:
  `const b = new THREE.Box3().setFromObject(obj); boxes.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, h: b.max.y })`.
  Small things you can walk through (grass, reeds, flowers, posters) get no collider.
- Text signs: `import { textPlate } from '../../homes/pieces'`: `textPlate(text, x, y, z, yaw, { w, h, bg, fg })` returns a
  vertical text plane (canvas texture; a plain plane in tests). `\n` for two lines. Mount it at least 0.03 m in front of
  the board it sits on. `prefabBox(id)` (same module) returns a prefab's `THREE.Box3` at scale 1.
- Ambient people: `import { createAmbientGnomes, type AmbientGnomeDef } from '../../ambientGnomes'`:
  `createAmbientGnomes(scene, defs)` returns `{ update(dt, px, pz) }` (call it every frame with the player position).
  A def is `{ id, name, x, z, yaw, look: Partial<GnomeLook>, bubble: string, idle?: AnimId }`. `look` fields: `hat, shirt,
  pants, skin, boots, beard` (0xRRGGBB, beard may be null), `glasses: boolean`. Idle ids: 'look-around', 'stretch',
  'yawn', 'scratch-head', 'tap-foot', 'hands-on-hips', 'cross-arms', 'sit-ground', 'sleep', 'lean-back', 'think',
  'fish', 'dig', 'sweep', 'saw', 'rake', 'water', 'read', and (added by another E17 worker) 'one-leg'. The bubble pops
  up when the player walks near.
- Sound: `import { playAt } from '../../sound/bus'`: `playAt(id, { x, z }, { volume? })` plays a world one-shot (ids in
  `src/sound/ids.ts`; E17 adds 'weld-crackle', 'pedal-whirr', 'reed-rustle', 'flock-hum', 'soil-crumble',
  'lamp-whoomp', 'mole-squeak', 'burrow-drip'; `playAt` returns false and does nothing for an unknown id, so use them).
- Interiors (E05): `import { defineInterior, currentInterior, onInteriorChange, enterInterior, interiorToWorld, refreshInterior, currentInteriorGroup } from '../../interiors'`.
  Read `games/gnome-theft-auto/src/interiors/types.ts` lines 1-110 for `InteriorDef` and `InteriorKit`. Key kit calls
  (local coordinates, origin at the room centre on the floor): `kit.room({ theme })` first; `kit.door(x, z, yaw)` (the
  way out, yaw faces INTO the room); `kit.put(prefabId, x, z, yaw, { solid?, size?, by?, y?, tint? })`;
  `kit.block(w, h, d, x, z, { y?, color?, solid?, emissive? })` (architecture only; set the returned mesh's
  `visible = false` for an invisible collider); `kit.sign(text, x, y, z, yaw, { w, h, bg, fg })`;
  `kit.spot({ id, x, z, prompt, run })`; `kit.npc({ id, x, z, yaw, name, look, line, sit })`;
  `kit.stairsTo(x, z, '<interior id>' | { x, y, z, yaw }, prompt)`; `kit.spawn(x, z, yaw)`; `kit.group` (a THREE.Group:
  add your own meshes, in local coordinates). The room is rebuilt on every entry and disposed on leaving. A spot's
  `run` may toast with `window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }))`.
- The societies save: `import { loadSocietySave, updateSocietySave } from '../save'` (`societies/save.ts`, done):
  `loadSocietySave()` returns `SocietySave` (see config.ts), `updateSocietySave((s) => { s.updraftRides++; })` writes it.

## Repo rules that apply

- No z-fighting: anything flat on the ground or on another surface (a mat, a decal, a path, a floor patch) is lifted at
  least 0.02 m AND uses a draw layer: `import { LAYER, flatLayer } from '@lawn/depth'`; `flatLayer(material, LAYER.marking)`.
  Two boxes that touch must not share a face (leave a 0.02 m gap or overlap them).
- New objects come from `@lawn/prefabs`. Never hand-build a one-off mesh for an item, prop or piece of furniture in the
  game. Plain geometry is fine only for architecture and ground features (a path strip, a floor patch, earth walls).
- Lore: names come from `SOCIETY_CAST` in config.ts. Tone: warm, dry-funny, satirical about the HOA and gnome
  bureaucracy, never mean. Keep the charm.
- Mobile: every action works with the touch action button (it shows the first word of any E prompt) or an on-screen
  button of at least 44 x 44 px. Any full-screen UI fits a 390 x 844 portrait phone and a landscape phone, respects
  `env(safe-area-inset-*)`, and has a visible close/quit button. No hover-only UI.
- Performance: phones must stay smooth. Prefer `buildStaticCells`; no per-frame allocation; no new lights.

## Checks

- `cd games/gnome-theft-auto && npx tsc --noEmit -p .`: no errors in your files.
- Your issue's own vitest command (a test file you own, run alone with `npx vitest run <file>`).
