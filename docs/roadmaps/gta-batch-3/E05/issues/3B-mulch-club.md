Epic: E05-2 Interiors and rooftops (showcase interiors run in the same wave)
Depends on: none (codes against the InteriorKit interface)
Also read and follow: `docs/roadmaps/gta-batch-3/E05/issues/3-showcase-common.md` (environment, rules, done-when).

## Goal
The Mulch Club lobby is a furnished walk-in room through the members' side door:
`games/gnome-theft-auto/src/interiors/showcase/mulchClub.ts`.

## Read first
- `games/gnome-theft-auto/src/interiors/types.ts` (InteriorKit, InteriorDef incl. `ambience`).
- `games/gnome-theft-auto/src/interiors/showcase/mulchClub.ts` (the stub: keep id, name, prompt, door, exit, size, theme).
- `docs/lore/entries/apocrypha/the-mulch-club.md`, `docs/lore/entries/apocrypha/don-compost.md`.

## Change
`mulchClub.ts`: keep the def's fields; add `ambience: 'silent'` (members' rules: no talking); write `build(kit)`.
Room 14 x 12 x 4.2 (x -7..7, z -6..6), door on the south wall `kit.door(0, 5.8, Math.PI)` (keep). Layout:
- `kit.room()`; a long runner `put('rug', 0, 1.5, 0, { solid: false, size: 6, tint: 0x7b1a24 })`.
- Two velvet booths: west booth centred (-4.6, -1.5): `table` at (-4.6, -1.5) size 1.4, `armchair` at (-4.6, -2.6) yaw 0
  and (-4.6, -0.4) yaw `Math.PI`, all tint 0x6a1b2a where the prefab takes tint; a `candelabra` on the table (y = table top, solid false).
  East booth mirrored at (4.6, -1.5).
- Vignette 1, the card game abandoned the moment somebody spoke: on the east booth table (solid false, y = top):
  `card-fan` and `chip-stack-tower`, one armchair turned away at yaw 2.2 (its sitter left in a hurry), a `cigar-box`
  open on the table, and a sign on the east wall at (6.95, 2.0, -1.5) yaw
  `-Math.PI / 2`: "HOUSE RULE: A HAND ENDS\nWHEN SOMEBODY SPEAKS." (w 1.6, h 0.6, bg 0x1a0a0c, fg 0xc9a227).
- Vignette 2, the wanted posters slid across the felt: `billiard-table` at (0, -3.4) yaw 0 (green felt), three
  `wanted-poster` on it (y = top, solid false) at (-0.6, -3.5) yaw 0.3, (0.1, -3.2) yaw -0.2, (0.7, -3.6) yaw 0.1.
- Vignette 3, the cloakroom and the wet-hat bin: `wardrobe` at (-6.4, 3.8) yaw `Math.PI / 2` as the cloakroom; beside
  it a `barrel` at (-6.3, 2.4) and a sign above it on the west wall (-6.95, 1.8, 2.4) yaw `Math.PI / 2`:
  "CONFISCATED: WET HATS" (w 1.2, h 0.4); the brass plaque on the west wall (-6.95, 1.6, 4.2) yaw `Math.PI / 2`:
  "NO SIRENS.\nNO WET HATS.\nNO TALKING." (w 1.0, h 0.7, bg 0xc9a227, fg 0x2a1810).
- The back-room door (north wall, it does not open): a dais `kit.block(3, 0.3, 1.2, 0, -5.3, { color: 0x2a1810 })`,
  a sign on the north wall (0, 2.6, -5.95) yaw 0: "MEMBERS BEYOND THIS POINT:\nNOBODY" (w 2.2, h 0.6, bg 0x1a0a0c, fg 0xc9a227);
  spot `{ id: 'back-room', x: 0, z: -4.2, prompt: 'Knock on the back-room door', run }`: say (name 'Bodyguard')
  '...' the first time, then '(He points at the plaque.)', then '(He points at the plaque harder.)'.
- Residents: the bodyguard standing by the back-room door, `kit.npc({ id: 'guard', name: 'Bodyguard', x: 1.6, z: -4.6, yaw: 0, look: { hat: 0x1b1b1b, shirt: 0x263238, beard: 0x5d4037 }, line: '(He says nothing, very firmly.)' })`;
  the hat-check gnome at the cloakroom, `kit.npc({ id: 'hatcheck', name: 'Hat-check gnome', x: -5.2, z: 4.4, yaw: -Math.PI / 2, look: { hat: 0x4a1218, shirt: 0xc9a227 }, line: 'Your hat is dry. You may keep it. This time.' })`.
- `grandfather-clock` at (6.4, 4.2) yaw `-Math.PI / 2`; a `painting` on the north wall at (-4.2, 2.4, -5.9) yaw 0
  (solid false; use `opts.y` 1.8 if the prefab stands on the floor, otherwise leave it at floor level by a wall).
- No windows (the curtains are always drawn).

## Contract
Interior id `mulch-club-lobby` (exported `MULCH_LOBBY_INTERIOR`), door (-30, -17.5). Do not change them.

## Out of scope
Every other file. The front-door quest giver (quests/defs.ts) is not touched.
