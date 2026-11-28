Epic: FX11 A (coast fixes, parallel) · Issue A5: coast signs print both faces with the shared plate painter (D58, G3#19 sign half)
Depends on: none · Agent: Haiku · Dev port 5525

(The Environment section the lead gave you applies.)

## Goal
`coastSign()` (every painted sign on the coast) uses the shared plate painter from FX01 (`textPlate` in `src/homes/pieces.ts`: words wrap to the plate, legible minimum glyph size) instead of its own canvas code, and a free-standing sign (one on a post) prints its text on BOTH faces, so no sign shows a blank grey back to the beach (decision D58: "Free-standing boards print both faces. The back face may carry a second joke.").

## Read first
- `games/gnome-theft-auto/src/coast/sign.ts` (the whole file, 85 lines: `coastSign(text, opts)` builds a board box, two posts, and a text plane on the +z face).
- `games/gnome-theft-auto/src/homes/pieces.ts` lines 95-250: `textPlate(text, x, y, z, yaw, { w, h, bg, fg, back?, backing? })` returns a `THREE.Mesh` (a plane with a polygon-offset material, front facing +z after `yaw`); `back: true` adds the reverse face 0.02 m behind it, a string prints a different text there.

## Change: `src/coast/sign.ts` (only this file, plus a new `src/coast/sign.test.ts`)
- Add to `CoastSignOpts`: `back?: string | boolean` with this doc comment: "Print the back face too: true repeats the front, a string is a second joke, false leaves the plain board. Default: true when the sign stands on a post (post > 0), false for a sign fixed to something (post 0)."
- Delete the private `textTexture` function and the `face` plane. Instead build the front plate with `textPlate(text, 0, post + h / 2, 0.04 + 0.01, 0, { w, h, bg, fg })` (the board box is 0.08 deep, centred on z 0, so its front face is at z 0.04; the plate must stand at least 0.01 in front of it) and add it to the group.
- When the back is wanted, build a second plate with `textPlate(backText, 0, post + h / 2, -0.05, Math.PI, { w, h, bg, fg })` (backText = the string, or `text` when `back === true`) and add it. Do not use textPlate's own `back` option (it puts the reverse 0.02 behind the front plate, which would be inside the board box).
- Keep everything else: the exported name and signature `coastSign(text: string, opts: CoastSignOpts = {}): THREE.Group`, the group name `'coast-sign'`, the board box and its cached materials, the posts, defaults (w 3, h 1, bg 0xf2ead8, fg 0x1f3a5f, post 0), the origin convention (origin on the ground under the board centre, text on +z).
- Update the file's top comment to say it prints both faces (D58) and uses `textPlate`.
- `src/coast/sign.test.ts` (new): without a DOM (vitest's node env), `coastSign('A\nB', { post: 1 })` has two plate meshes (children whose `name` is `'home-plate'`), one facing +z (rotation.y 0) in front of the board (position.z > 0.04) and one facing -z (rotation.y PI) behind it (position.z < -0.04); `coastSign('A', { post: 0 })` has one; `coastSign('A', { post: 1, back: false })` has one; `coastSign('A', { post: 0, back: 'B' })` has two.

## Contract
`coastSign(text, opts)` keeps its signature; `CoastSignOpts` gains `back?: string | boolean`. Many other coast modules call it while you work; their calls must keep compiling.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast/sign.test.ts src/coast/boardwalk.test.ts src/coast/life.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in `src/coast/sign.ts`.
- Look at it: dev server on port 5525, `node tools/gta-shots.mjs http://localhost:5525/ <dir> front:20,1150,0 back:20,1170,3.14159 ent:-6,1094,3.14159`. ("THE SALTWATER" sign at (20, 1160) faces north; the shot from the sea side must now show text, not a blank board.)

## Out of scope
Every other file (the callers are other workers' files).
