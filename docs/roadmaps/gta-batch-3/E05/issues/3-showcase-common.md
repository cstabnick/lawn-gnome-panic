(Pasted into each showcase issue 3A-3D.)

## Environment
Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a89501009f27d94ba` (a git worktree; stay in it).
Game: `games/gnome-theft-auto` (three.js). Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
Keep LF line endings. Do not commit. Other workers are writing the kit (`src/interiors/kit.ts`) and the runtime at the
same time: code only against the `InteriorKit` interface in `src/interiors/types.ts` (read it first); the kit may still
be a stub that draws nothing while you work, that is expected. You own exactly one file.

Rules that apply:
- Every object (furniture, prop, item) is a prefab from `@lawn/prefabs`, placed with `kit.put(id, x, z, yaw, opts)`.
  Before using an id, confirm it exists: `grep -rn "id: '<id>'" packages/prefabs/src/catalog`. `kit.block` is only for
  architecture (a counter top, a dais, a plinth); `kit.sign` for text.
- Local coordinates: origin = room centre on the floor, +x east, +z south; the room spans x `-w/2..w/2`, z `-d/2..d/2`.
  yaw 0 faces +z (south), `Math.PI / 2` faces +x (east), `Math.PI` faces -z (north), `-Math.PI / 2` faces -x (west).
  A wall sign/window on the north wall (z = -d/2) faces yaw 0, on the south wall yaw `Math.PI`, west wall `Math.PI / 2`, east wall `-Math.PI / 2`;
  put it 0.05 m in front of the wall (e.g. north wall: z = -d/2 + 0.05).
- Keep 1.2 m of clear floor from the door to the room centre and round the spawn (the player is 0.4 m wide, the
  camera follows behind). Leave a 1 m walkway; solid things must not overlap each other (no shared faces either).
- Things on a counter or table: `opts.y` = the top height, `solid: false`. Rugs, papers, posters: `solid: false`.
- Environmental storytelling is acceptance criteria: at least 3 readable vignettes (props arranged to tell a small story
  without text), signage with jokes that fit the place's lore, at least one resident doing something specific to the
  place (`kit.npc` with a `line`), and ambience (`ambience` in the def). Keep the game's dry, satirical tone (gnomes,
  Acorns are money, "Tall Ones" are humans, the Hat Watch are police). Use only names given here (no new named people).
- Toast lines from a spot: `window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }))` (the runtime shows it).

## Done when (all showcase issues)
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- Every prefab id you used exists (paste the grep results in your report).
- `npx vitest run src/interiors` has no failure caused by your file (other workers' tests may still be in progress).
